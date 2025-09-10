import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface MonthlyTrendData {
  month: string;
  수입: number;
  지출: number;
  순익: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-medium text-slate-800 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="month" 
          stroke="#64748b"
          fontSize={12}
          tick={{ fontSize: 11 }}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => formatCurrency(value, { compact: true })}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Line 
          type="monotone" 
          dataKey="수입" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
        />
        <Line 
          type="monotone" 
          dataKey="지출" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
        />
        <Line 
          type="monotone" 
          dataKey="순익" 
          stroke="#6366f1" 
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};