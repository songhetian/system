/*
 * 修改点：
 * 1. 修复 useScheduleList 参数，补全 page/pageSize
 * 2. 硬编码色值 → Arco CSS token / Tag 预设色
 * 3. 内联 style → CSS module
 * 4. 裸 style 标签 → CSS module
 * 5. className 字符串 → styles 对象
 */
import { useState, useMemo } from 'react';
import {
  Button,
  Tag,
  Space,
  Typography,
} from '@arco-design/web-react';
import {
  IconLeft,
  IconRight,
} from '@arco-design/web-react/icon';
import { useScheduleList, useShiftTemplateList } from '../hooks/useSchedule';
import type { Schedule, ShiftTemplate } from '@shop/shared';
import styles from './ScheduleCalendar.module.css';

const { Title } = Typography;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function ScheduleCalendar() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const { data: shiftTemplates = [] } = useShiftTemplateList();

  const shiftTemplateMap = useMemo(() => {
    const map: Record<number, ShiftTemplate> = {};
    (shiftTemplates as ShiftTemplate[]).forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [shiftTemplates]);

  const monthStart = formatDate(currentYear, currentMonth, 1);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const monthEnd = formatDate(currentYear, currentMonth, daysInMonth);

  const { data: schedules = [], isLoading } = useScheduleList({
    page: 1,
    pageSize: 100,
    startDate: monthStart,
    endDate: monthEnd,
  });

  const scheduleByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    (schedules as Schedule[]).forEach((s) => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(s);
    });
    return map;
  }, [schedules]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const renderCalendarDays = () => {
    const days = [];
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const totalDays = daysInMonth;
    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className={`${styles.calendarDay} ${styles.empty}`}>
          &nbsp;
        </div>
      );
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = formatDate(currentYear, currentMonth, day);
      const daySchedules = scheduleByDate[dateStr] || [];
      const isToday = dateStr === todayStr;

      days.push(
        <div
          key={day}
          className={`${styles.calendarDay} ${isToday ? styles.today : ''}`}
        >
          <div className={styles.calendarDayHeader}>
            <span className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`}>
              {day}
            </span>
          </div>
          <div className={styles.calendarDayContent}>
            {daySchedules.slice(0, 3).map((s) => {
              const t = shiftTemplateMap[s.shiftTemplateId];
              return (
                <Tag
                  key={s.id}
                  color={t?.color || 'gray'}
                  size="small"
                  className={styles.scheduleTag}
                >
                  {t?.name || '未知班次'}
                </Tag>
              );
            })}
            {daySchedules.length > 3 && (
              <Tag size="small" className={styles.scheduleTag}>
                +{daySchedules.length - 3}
              </Tag>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className={styles.scheduleCalendar}>
      <div className={styles.calendarHeader}>
        <Space>
          <Button icon={<IconLeft />} onClick={prevMonth} />
          <Title heading={5} className={styles.monthTitle}>
            {currentYear}年{currentMonth + 1}月
          </Title>
          <Button icon={<IconRight />} onClick={nextMonth} />
          <Button type="outline" onClick={goToToday}>今天</Button>
        </Space>
      </div>

      <div className={styles.calendarWeekdays}>
        {weekDays.map((day) => (
          <div key={day} className={styles.calendarWeekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={`${styles.calendarGrid} ${isLoading ? styles.loading : ''}`}>
        {renderCalendarDays()}
      </div>
    </div>
  );
}

export default ScheduleCalendar;
