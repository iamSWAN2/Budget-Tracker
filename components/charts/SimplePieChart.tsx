import React from 'react';
import { formatCurrency } from '../../utils/format';

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  data: PieData[];
  title?: string;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, title }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        <div className="text-center">
          <p className="text-sm">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      )}
      
      {/* CSS로 만든 간단한 도넛 차트 */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-conic from-slate-200 via-slate-100 to-slate-200">
            {/* 중앙 원 */}
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-slate-500">총 지출</div>
                <div className="text-sm font-bold text-slate-800">
                  {formatCurrency(total, { compact: true })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
        {data.slice(0, 6).map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 truncate max-w-20">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-800 font-medium">{percentage}%</span>
                <div className="text-slate-500">{formatCurrency(item.value, { compact: true })}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};