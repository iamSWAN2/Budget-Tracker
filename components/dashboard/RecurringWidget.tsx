import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { getPeriodRange, ViewMode, isWithinRange } from '../../utils/dateRange';
import { formatCurrency } from '../../utils/format';

type Props = {
  transactions: Transaction[];
  viewMode: ViewMode;
  currentMonth: number;
  currentYear: number;
};

// 간단 휴리스틱: 최근 90일 내 같은 설명으로 2회 이상 발생하면 반복 결제로 간주
const isRecent = (d: Date, days: number) => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return d >= from && d <= now;
};

export const RecurringWidget: React.FC<Props> = ({ transactions, viewMode, currentMonth, currentYear }) => {
  const { start, end } = getPeriodRange(viewMode, currentMonth, currentYear);

  const { recurringInPeriod, total } = useMemo(() => {
    const recentGroups = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const d = new Date(t.date);
      if (!isRecent(d, 90)) continue;
      const key = (t.description || '').trim().toLowerCase();
      if (!key) continue;
      const arr = recentGroups.get(key) || [];
      arr.push(t);
      recentGroups.set(key, arr);
    }

    const recurringKeys = Array.from(recentGroups.entries())
      .filter(([, arr]) => arr.length >= 2)
      .map(([k]) => k);

    // 선택 기간 내 발생한 항목만 표시
    const periodItems: Transaction[] = transactions.filter(t => {
      const key = (t.description || '').trim().toLowerCase();
      if (!recurringKeys.includes(key)) return false;
      const d = new Date(t.date);
      return isWithinRange(d, start, end);
    });

    const sum = periodItems.reduce((s, t) => s + (t.amount || 0), 0);
    return { recurringInPeriod: periodItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), total: sum };
  }, [transactions, start, end]);

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-600">{viewMode === 'week' ? '이번 주 반복 결제' : '이번 달 반복 결제'}</h3>
        <div className="text-xs text-slate-500">{recurringInPeriod.length}건</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-sm md:text-lg font-bold text-slate-800">{formatCurrency(total)}</div>
      </div>

      <div className="mt-3 space-y-2 max-h-40 overflow-auto">
        {recurringInPeriod.length > 0 ? (
          recurringInPeriod.map(item => (
            <button
              key={item.id}
              className="w-full flex items-center justify-between text-left text-xs border rounded-md px-2 py-1.5 hover:bg-slate-50"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'transactions' } }));
              }}
            >
              <div className="truncate pr-2 text-slate-700">{item.description}</div>
              <div className={`flex items-center gap-2 flex-shrink-0 ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="text-xs text-slate-400">해당 기간에 반복 결제가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default RecurringWidget;

