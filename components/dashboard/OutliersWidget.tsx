import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { getPeriodRange, ViewMode, isWithinRange } from '../../utils/dateRange';
import { formatCurrency } from '../../utils/format';

type Props = {
  transactions: Transaction[];
  viewMode: ViewMode;
  currentMonth: number;
  currentYear: number;
  factor?: number; // threshold multiplier, default 2x
};

export const OutliersWidget: React.FC<Props> = ({ transactions, viewMode, currentMonth, currentYear, factor = 2 }) => {
  const { start, end } = getPeriodRange(viewMode, currentMonth, currentYear);

  const { outliers, total } = useMemo(() => {
    // Baseline: last 90 days average by category (expenses only)
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 90);
    from.setHours(0, 0, 0, 0);

    const baselineMap = new Map<string, { sum: number; cnt: number }>();
    for (const t of transactions) {
      if (t.type !== TransactionType.EXPENSE) continue;
      const d = new Date(t.date);
      if (d < from || d > now) continue;
      const key = (t.category || '기타');
      const cur = baselineMap.get(key) || { sum: 0, cnt: 0 };
      cur.sum += t.amount || 0;
      cur.cnt += 1;
      baselineMap.set(key, cur);
    }
    const baselineAvg = new Map<string, number>();
    baselineMap.forEach((v, k) => { if (v.cnt > 0) baselineAvg.set(k, v.sum / v.cnt); });

    // In selected period, pick expenses exceeding factor * baseline
    const candidates = transactions.filter(t => t.type === TransactionType.EXPENSE && isWithinRange(new Date(t.date), start, end));
    const flagged = candidates.filter(t => {
      const avg = baselineAvg.get(t.category) || 0;
      return avg > 0 && t.amount >= factor * avg;
    }).sort((a, b) => b.amount - a.amount);

    const sum = flagged.reduce((s, t) => s + t.amount, 0);
    return { outliers: flagged, total: sum };
  }, [transactions, start, end, factor]);

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-600">{viewMode === 'week' ? '이번 주 이상치' : '이번 달 이상치'}</h3>
        <div className="text-xs text-slate-500">{outliers.length}건</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-sm md:text-lg font-bold text-rose-600">{formatCurrency(total)}</div>
      </div>
      <div className="mt-3 space-y-2 max-h-40 overflow-auto">
        {outliers.length > 0 ? (
          outliers.map(tx => (
            <button
              key={tx.id}
              className="w-full flex items-center justify-between text-left text-xs border rounded-md px-2 py-1.5 hover:bg-rose-50/50"
              title={tx.category}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'transactions', filter: { q: tx.description, start: start.toISOString(), end: end.toISOString() } } }));
              }}
            >
              <div className="truncate pr-2 text-slate-700">{tx.description}</div>
              <div className="flex items-center gap-2 flex-shrink-0 text-rose-600">
                <span className="font-medium">{formatCurrency(tx.amount)}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="text-xs text-slate-400">해당 기간에 이상치가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default OutliersWidget;
