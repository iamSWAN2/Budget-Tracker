import React from 'react';

type DateRange = { start: Date; end: Date } | null;

interface CalendarProps {
  visibleDate: Date; // 기준 월(아무 날짜여도 해당 월로 정규화)
  onVisibleDateChange: (d: Date) => void;
  selectedRange: DateRange;
  onSelectedRangeChange: (range: DateRange) => void;
  onAddClick?: () => void; // 데스크톱에서만 노출
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isBetweenInclusive = (d: Date, a: Date, b: Date) => d >= a && d <= b;

export const Calendar: React.FC<CalendarProps> = ({ visibleDate, onVisibleDateChange, selectedRange, onSelectedRangeChange, onAddClick }) => {
  const monthStart = startOfMonth(visibleDate);
  const monthEnd = endOfMonth(visibleDate);
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);

  const [dragging, setDragging] = React.useState<null | { start: Date; end: Date }>(null);

  const daysInMonth = monthEnd.getDate();
  const firstWeekday = monthStart.getDay(); // 0=Sun

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(visibleDate.getFullYear(), visibleDate.getMonth(), d));
  }

  const label = `${visibleDate.getFullYear()}년 ${visibleDate.getMonth() + 1}월`;

  const handlePrev = () => {
    const d = new Date(visibleDate);
    d.setMonth(d.getMonth() - 1);
    onVisibleDateChange(d);
    // 월을 바꾸면 기본값(월 전체)로 복귀
    onSelectedRangeChange(null);
  };
  const handleNext = () => {
    const d = new Date(visibleDate);
    d.setMonth(d.getMonth() + 1);
    onVisibleDateChange(d);
    onSelectedRangeChange(null);
  };

  const beginDrag = (date: Date) => {
    setDragging({ start: date, end: date });
    onSelectedRangeChange({ start: date, end: date });
  };
  const extendDrag = (date: Date) => {
    setDragging(prev => {
      if (!prev) return prev;
      const start = prev.start < date ? prev.start : date;
      const end = prev.start < date ? date : prev.start;
      onSelectedRangeChange({ start, end });
      return { start: prev.start, end: date };
    });
  };
  const endDrag = () => setDragging(null);

  React.useEffect(() => {
    const up = () => setDragging(null);
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  const activeRange = () => {
    if (dragging) {
      const a = dragging.start < dragging.end ? dragging.start : dragging.end;
      const b = dragging.start < dragging.end ? dragging.end : dragging.start;
      return { start: a, end: b };
    }
    if (selectedRange) return selectedRange;
    return null;
  };
  const inSelected = (d: Date) => {
    const r = activeRange();
    if (!r) return false;
    return isBetweenInclusive(d, r.start, r.end);
  };
  const isStart = (d: Date) => {
    const r = activeRange();
    return !!r && sameDay(d, r.start);
  };
  const isEnd = (d: Date) => {
    const r = activeRange();
    return !!r && sameDay(d, r.end);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={handlePrev} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition" aria-label="이전 달">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-base sm:text-lg font-semibold text-slate-800 tracking-tight" aria-live="polite">{label}</div>
          <button onClick={handleNext} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition" aria-label="다음 달">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-500 shadow-sm"
            title="거래 추가"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            추가
          </button>
        )}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-1">
        {['일','월','화','수','목','금','토'].map((w, i) => (
          <div key={w} className={`text-center py-1 ${i===0 ? 'text-rose-500' : i===6 ? 'text-blue-500' : ''}`}>{w}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="달력">
        {days.map((d, idx) => (
          <div key={idx} role="gridcell" className="aspect-square">
            {d ? (
              <button
                onPointerDown={() => beginDrag(d)}
                onPointerEnter={() => dragging && extendDrag(d)}
                onClick={() => onSelectedRangeChange({ start: d, end: d })}
                className={`w-full h-full rounded-md text-sm relative transition
                  ${isStart(d) || isEnd(d) ? 'bg-indigo-600 text-white' : inSelected(d) ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}
                  ${sameDay(d, cur) ? 'ring-1 ring-indigo-400' : ''}
                `}
                aria-current={sameDay(d, cur) ? 'date' : undefined}
                aria-pressed={inSelected(d)}
                style={{ touchAction: 'none' }}
              >
                <span className={`absolute top-1 left-1 ${isStart(d) || isEnd(d) ? 'text-white' : 'text-slate-700'}`}>{d.getDate()}</span>
              </button>
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>

      {/* Footer helpers */}
      <div className="mt-2 flex items-center justify-between">
        <button className="text-[11px] text-slate-500 hover:text-slate-700" onClick={() => onSelectedRangeChange(null)}>이 달 전체</button>
        {selectedRange ? (
          <div className="text-[11px] text-slate-500">
            {`${selectedRange.start.getMonth()+1}/${selectedRange.start.getDate()} – ${selectedRange.end.getMonth()+1}/${selectedRange.end.getDate()}`}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">선택 없음</div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
