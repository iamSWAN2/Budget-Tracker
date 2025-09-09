import React, { useMemo } from 'react';
import { Installment } from '../../types';
import { getPeriodRange, ViewMode, isWithinRange, WeekStart } from '../../utils/dateRange';
import { formatCurrency } from '../../utils/format';

type Props = {
  installments: Installment[];
  viewMode: ViewMode;
  currentMonth: number;
  currentYear: number;
  weekStart?: WeekStart;
};

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // 말일 보정
  if (d.getDate() < day) d.setDate(0);
  return d;
};

export const InstallmentsWidget: React.FC<Props> = ({ installments, viewMode, currentMonth, currentYear, weekStart = 'mon' }) => {
  const { start, end } = getPeriodRange(viewMode, currentMonth, currentYear, weekStart);

  const due = useMemo(() => {
    const result: { id: string; description: string; paymentDate: Date; monthlyPayment: number; remainingMonths: number; accountId: string }[] = [];

    for (const inst of installments) {
      const s = new Date(inst.startDate);
      for (let k = 0; k < inst.totalMonths; k++) {
        const payDate = addMonths(s, k);
        if (isWithinRange(payDate, start, end)) {
          result.push({
            id: `${inst.id}-${k}`,
            description: inst.description,
            paymentDate: payDate,
            monthlyPayment: inst.monthlyPayment,
            remainingMonths: inst.remainingMonths,
            accountId: inst.accountId,
          });
          break; // 해당 기간엔 한 번만 포함
        }
        if (payDate > end) break; // 더 진행할 필요 없음
      }
    }

    return result.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  }, [installments, start, end]);

  const total = useMemo(() => due.reduce((sum, i) => sum + (i.monthlyPayment || 0), 0), [due]);

  const periodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return `${currentYear}년 ${currentMonth + 1}월`;
    }
    const m = start.getMonth() + 1;
    const s = start.getDate();
    const e = end.getDate();
    return `${m}월 ${s}–${e}일`;
  }, [viewMode, start, end, currentMonth, currentYear]);

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-xs font-medium text-slate-600">{viewMode === 'week' ? '이번 주 할부 납부' : '이번 달 할부 납부'}</h3>
          <span className="text-[11px] text-slate-500">{periodLabel}</span>
        </div>
        <div className="text-xs text-slate-500">{due.length}건</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-sm md:text-lg font-bold text-indigo-600">{formatCurrency(total)}</div>
      </div>

      <div className="mt-3 space-y-2 max-h-40 overflow-auto">
        {due.length > 0 ? (
          due.map(item => (
            <button
              key={item.id}
              className="w-full flex items-center justify-between text-left text-xs border rounded-md px-2 py-1.5 hover:bg-slate-50"
              onClick={() => {
                // 거래 탭으로 드릴스루: 동일 기간 필터 전달
                window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'transactions', filter: { start: start.toISOString(), end: end.toISOString(), q: item.description, accountId: item.accountId } } }));
              }}
            >
              <div className="truncate pr-2 text-slate-700">{item.description}</div>
              <div className="flex items-center gap-2 flex-shrink-0 text-slate-600">
                <span className="font-medium text-slate-800">{formatCurrency(item.monthlyPayment)}</span>
                <span className="text-[11px]">잔여 {item.remainingMonths}개월</span>
              </div>
            </button>
          ))
        ) : (
          <div className="text-xs text-slate-400">해당 기간에 납부할 할부가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default InstallmentsWidget;
