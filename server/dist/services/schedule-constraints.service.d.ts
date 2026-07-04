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
export declare function checkScheduleConstraints(employeeId: number, shiftTemplateId: number, date: Date, config?: Partial<ConstraintConfig>): Promise<ConstraintViolation[]>;
export declare function checkBatchScheduleConstraints(schedules: Array<{
    employeeId: number;
    shiftTemplateId: number;
    date: Date;
}>, config?: Partial<ConstraintConfig>): Promise<Map<string, ConstraintViolation[]>>;
//# sourceMappingURL=schedule-constraints.service.d.ts.map