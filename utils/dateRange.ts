export type ViewMode = 'month' | 'week';
export type WeekStart = 'mon' | 'sun';

const startOfWeek = (base: Date, weekStart: WeekStart): Date => {
  const date = new Date(base);
  const day = date.getDay(); // 0 Sun ... 6 Sat
  const offset = weekStart === 'mon' ? (day === 0 ? 6 : day - 1) : day; // mon=0..6, sun=0..6
  date.setDate(date.getDate() - offset);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getPeriodRange = (
  mode: ViewMode,
  currentMonth: number,
  currentYear: number,
  weekStart: WeekStart = 'mon'
) => {
  if (mode === 'month') {
    const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  // week: 현재 주(설정된 시작 요일)
  const now = new Date();
  const start = startOfWeek(now, weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const isWithinRange = (d: Date, start: Date, end: Date) => d >= start && d <= end;
