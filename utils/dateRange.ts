export type ViewMode = 'month' | 'week';

export const getPeriodRange = (
  mode: ViewMode,
  currentMonth: number,
  currentYear: number
) => {
  if (mode === 'month') {
    const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  // week: 현재 주(월요일 시작)
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 월0~일6
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const isWithinRange = (d: Date, start: Date, end: Date) => d >= start && d <= end;

