import React from 'react';
import { formatCurrency } from '../../utils/format';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyTrendDisplayProps {
  data: MonthlyData[];
}

export const MonthlyTrendDisplay: React.FC<MonthlyTrendDisplayProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        <div className="text-center">
          <p className="text-sm">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expense))
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>수입</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>지출</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-indigo-500 rounded"></div>
          <span>순익</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
        {data.slice(-6).map((item, index) => (
          <div key={index} className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="text-xs font-medium text-slate-700 text-center">
              {item.month}
            </div>
            
            {/* 수입 바 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">수입</span>
                <span className="font-medium">{formatCurrency(item.income, { compact: true })}</span>
              </div>
              <div className="w-full bg-slate-200 rounded h-2">
                <div
                  className="h-2 bg-green-500 rounded transition-all duration-300"
                  style={{ width: `${(item.income / maxValue) * 100}%` }}
                />
              </div>
            </div>

            {/* 지출 바 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-red-600">지출</span>
                <span className="font-medium">{formatCurrency(item.expense, { compact: true })}</span>
              </div>
              <div className="w-full bg-slate-200 rounded h-2">
                <div
                  className="h-2 bg-red-500 rounded transition-all duration-300"
                  style={{ width: `${(item.expense / maxValue) * 100}%` }}
                />
              </div>
            </div>

            {/* 순익 */}
            <div className="text-xs text-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">순익: </span>
              <span className={`font-medium ${item.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                {formatCurrency(item.balance, { compact: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};