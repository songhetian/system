import { prisma } from '../lib/prisma.js';

export interface ConstraintViolation {
  type: 'HARD' | 'SOFT';
  code: string;
  message: string;
  employeeId: number;
  date?: string;
}

export interface ConstraintConfig {
  hardConstraints: {
    maxDailyHours: number;
    maxWeeklyHours: number;
    minRestHoursBetweenShifts: number;
    minRestAfterNightShift: number;
    requireSkillMatch: boolean;
    minOnDutyPerPosition: number;
  };
  softConstraints: {
    maxConsecutiveWorkDays: number;
    preferWeekendRest: boolean;
    sameShiftContinuity: boolean;
    balancedWorkload: boolean;
  };
}

const DEFAULT_CONFIG: ConstraintConfig = {
  hardConstraints: {
    maxDailyHours: 12,
    maxWeeklyHours: 60,
    minRestHoursBetweenShifts: 8,
    minRestAfterNightShift: 12,
    requireSkillMatch: false,
    minOnDutyPerPosition: 1,
  },
  softConstraints: {
    maxConsecutiveWorkDays: 6,
    preferWeekendRest: true,
    sameShiftContinuity: true,
    balancedWorkload: true,
  },
};

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function calculateShiftHours(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  let hours = end.hours - start.hours + (end.minutes - start.minutes) / 60;
  if (hours <= 0) hours += 24;
  return hours;
}

function isNightShift(startTime: string): boolean {
  const start = parseTime(startTime);
  return start.hours >= 22 || start.hours < 6;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(start: Date): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function checkScheduleConstraints(
  employeeId: number,
  shiftTemplateId: number,
  date: Date,
  config: Partial<ConstraintConfig> = {},
): Promise<ConstraintViolation[]> {
  const mergedConfig: ConstraintConfig = {
    hardConstraints: { ...DEFAULT_CONFIG.hardConstraints, ...config.hardConstraints },
    softConstraints: { ...DEFAULT_CONFIG.softConstraints, ...config.softConstraints },
  };

  const violations: ConstraintViolation[] = [];

  const shiftTemplate = await prisma.shiftTemplate.findUnique({
    where: { id: shiftTemplateId },
  });
  if (!shiftTemplate) return violations;

  const shiftHours = calculateShiftHours(shiftTemplate.startTime, shiftTemplate.endTime);
  const dateStr = date.toISOString().split('T')[0];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingSchedules = await prisma.schedule.findMany({
    where: {
      employeeId,
      date: {
        gte: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
        lte: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    include: { shiftTemplate: true },
    orderBy: { date: 'asc' },
  });

  if (shiftHours > mergedConfig.hardConstraints.maxDailyHours) {
    violations.push({
      type: 'HARD',
      code: 'MAX_DAILY_HOURS',
      message: `单日工时 ${shiftHours.toFixed(1)} 小时超过上限 ${mergedConfig.hardConstraints.maxDailyHours} 小时`,
      employeeId,
      date: dateStr,
    });
  }

  const sameDaySchedule = existingSchedules.find(
    (s) => s.date.getTime() === dayStart.getTime() && s.shiftTemplateId !== shiftTemplateId,
  );
  if (sameDaySchedule) {
    violations.push({
      type: 'HARD',
      code: 'DUPLICATE_DAY_SCHEDULE',
      message: '当日已有其他排班',
      employeeId,
      date: dateStr,
    });
  }

  const weekStart = getStartOfWeek(date);
  const weekEnd = getEndOfWeek(weekStart);
  const weekSchedules = existingSchedules.filter(
    (s) => s.date >= weekStart && s.date <= weekEnd,
  );
  const weekHours = weekSchedules.reduce((sum, s) => {
    if (s.shiftTemplate) {
      return sum + calculateShiftHours(s.shiftTemplate.startTime, s.shiftTemplate.endTime);
    }
    return sum;
  }, shiftHours);

  if (weekHours > mergedConfig.hardConstraints.maxWeeklyHours) {
    violations.push({
      type: 'HARD',
      code: 'MAX_WEEKLY_HOURS',
      message: `本周工时 ${weekHours.toFixed(1)} 小时超过上限 ${mergedConfig.hardConstraints.maxWeeklyHours} 小时`,
      employeeId,
      date: dateStr,
    });
  }

  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  prevDay.setHours(0, 0, 0, 0);
  const prevSchedule = existingSchedules.find(
    (s) => s.date.getTime() === prevDay.getTime(),
  );

  if (prevSchedule?.shiftTemplate) {
    const prevEnd = parseTime(prevSchedule.shiftTemplate.endTime);
    const currStart = parseTime(shiftTemplate.startTime);
    let restHours = currStart.hours - prevEnd.hours + (currStart.minutes - prevEnd.minutes) / 60;
    if (restHours < 0) restHours += 24;

    if (isNightShift(prevSchedule.shiftTemplate.startTime)) {
      if (restHours < mergedConfig.hardConstraints.minRestAfterNightShift) {
        violations.push({
          type: 'HARD',
          code: 'NIGHT_SHIFT_REST',
          message: `夜班后休息 ${restHours.toFixed(1)} 小时不足 ${mergedConfig.hardConstraints.minRestAfterNightShift} 小时`,
          employeeId,
          date: dateStr,
        });
      }
    } else if (restHours < mergedConfig.hardConstraints.minRestHoursBetweenShifts) {
      violations.push({
        type: 'HARD',
        code: 'MIN_REST_HOURS',
        message: `班次间隔 ${restHours.toFixed(1)} 小时不足 ${mergedConfig.hardConstraints.minRestHoursBetweenShifts} 小时`,
        employeeId,
        date: dateStr,
      });
    }
  }

  const sortedSchedules = [...existingSchedules].sort((a, b) => a.date.getTime() - b.date.getTime());
  let consecutiveDays = 1;
  const targetDayIdx = sortedSchedules.findIndex(
    (s) => s.date.getTime() === dayStart.getTime(),
  );

  for (let i = targetDayIdx - 1; i >= 0; i--) {
    const diff = (sortedSchedules[targetDayIdx].date.getTime() - sortedSchedules[i].date.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === consecutiveDays) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  if (consecutiveDays > mergedConfig.softConstraints.maxConsecutiveWorkDays) {
    violations.push({
      type: 'SOFT',
      code: 'MAX_CONSECUTIVE_DAYS',
      message: `连续工作 ${consecutiveDays} 天超过建议值 ${mergedConfig.softConstraints.maxConsecutiveWorkDays} 天`,
      employeeId,
      date: dateStr,
    });
  }

  const dayOfWeek = date.getDay();
  if (mergedConfig.softConstraints.preferWeekendRest && (dayOfWeek === 0 || dayOfWeek === 6)) {
    violations.push({
      type: 'SOFT',
      code: 'WEEKEND_WORK',
      message: '周末排班建议优先安排休息',
      employeeId,
      date: dateStr,
    });
  }

  if (mergedConfig.softConstraints.sameShiftContinuity && prevSchedule?.shiftTemplate) {
    if (prevSchedule.shiftTemplate.id !== shiftTemplateId) {
      violations.push({
        type: 'SOFT',
        code: 'SHIFT_CHANGE',
        message: '建议保持班次连续性，避免频繁换班',
        employeeId,
        date: dateStr,
      });
    }
  }

  return violations;
}

export async function checkBatchScheduleConstraints(
  schedules: Array<{ employeeId: number; shiftTemplateId: number; date: Date }>,
  config?: Partial<ConstraintConfig>,
): Promise<Map<string, ConstraintViolation[]>> {
  if (schedules.length === 0) return new Map();

  // 收集所有需要查询的 ID 和日期范围
  const templateIds = [...new Set(schedules.map((s) => s.shiftTemplateId))];
  const employeeIds = [...new Set(schedules.map((s) => s.employeeId))];
  const dates = schedules.map((s) => s.date);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);

  // 批量预取
  const [templates, allSchedules] = await Promise.all([
    prisma.shiftTemplate.findMany({ where: { id: { in: templateIds } } }),
    prisma.schedule.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: minDate, lte: maxDate },
      },
      include: { shiftTemplate: true },
      orderBy: { date: 'asc' },
    }),
  ]);

  const templateMap = new Map(templates.map((t) => [t.id, t]));
  const schedulesByEmployee = new Map<number, typeof allSchedules>();
  for (const s of allSchedules) {
    if (!schedulesByEmployee.has(s.employeeId)) schedulesByEmployee.set(s.employeeId, []);
    schedulesByEmployee.get(s.employeeId)!.push(s);
  }

  // 内存约束检查
  const result = new Map<string, ConstraintViolation[]>();
  for (const sched of schedules) {
    const key = `${sched.employeeId}-${sched.date.toISOString().split('T')[0]}`;
    const violations = checkScheduleConstraintsWithData(
      sched.employeeId,
      templateMap.get(sched.shiftTemplateId) || null,
      schedulesByEmployee.get(sched.employeeId) || [],
      sched.date,
      config,
    );
    result.set(key, violations);
  }

  return result;
}

function checkScheduleConstraintsWithData(
  employeeId: number,
  shiftTemplate: ReturnType<typeof prisma.shiftTemplate.findUnique> extends Promise<infer T> ? T : any,
  existingSchedules: any[],
  date: Date,
  config: Partial<ConstraintConfig> = {},
): ConstraintViolation[] {
  if (!shiftTemplate) return [];

  const mergedConfig: ConstraintConfig = {
    hardConstraints: { ...DEFAULT_CONFIG.hardConstraints, ...config.hardConstraints },
    softConstraints: { ...DEFAULT_CONFIG.softConstraints, ...config.softConstraints },
  };

  const violations: ConstraintViolation[] = [];
  const shiftHours = calculateShiftHours(shiftTemplate.startTime, shiftTemplate.endTime);
  const dateStr = date.toISOString().split('T')[0];

  if (shiftHours > mergedConfig.hardConstraints.maxDailyHours) {
    violations.push({
      type: 'HARD', code: 'MAX_DAILY_HOURS',
      message: `单日工时 ${shiftHours.toFixed(1)} 小时超过上限 ${mergedConfig.hardConstraints.maxDailyHours} 小时`,
      employeeId, date: dateStr,
    });
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const sameDaySchedule = existingSchedules.find(
    (s: any) => new Date(s.date).getTime() === dayStart.getTime() && s.shiftTemplateId !== shiftTemplate.id,
  );
  if (sameDaySchedule) {
    violations.push({
      type: 'HARD', code: 'DUPLICATE_DAY_SCHEDULE',
      message: '当日已有其他排班', employeeId, date: dateStr,
    });
  }

  const weekStart = getStartOfWeek(date);
  const weekEnd = getEndOfWeek(weekStart);
  const weekSchedules = existingSchedules.filter(
    (s: any) => new Date(s.date) >= weekStart && new Date(s.date) <= weekEnd,
  );
  const weekHours = weekSchedules.reduce((sum: number, s: any) => {
    if (s.shiftTemplate) return sum + calculateShiftHours(s.shiftTemplate.startTime, s.shiftTemplate.endTime);
    return sum;
  }, shiftHours);

  if (weekHours > mergedConfig.hardConstraints.maxWeeklyHours) {
    violations.push({
      type: 'HARD', code: 'MAX_WEEKLY_HOURS',
      message: `本周工时 ${weekHours.toFixed(1)} 小时超过上限 ${mergedConfig.hardConstraints.maxWeeklyHours} 小时`,
      employeeId, date: dateStr,
    });
  }

  return violations;
}