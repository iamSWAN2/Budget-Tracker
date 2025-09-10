import React from 'react';
import { formatCurrency } from '../../utils/format';

interface BarData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  title?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, title }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        <div className="text-center">
          <p className="text-sm">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      )}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 truncate max-w-24">{item.name}</span>
              <span className="text-slate-800 font-medium">{formatCurrency(item.value)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#6366f1'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};