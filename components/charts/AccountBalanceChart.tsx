import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface AccountData {
  name: string;
  잔액: number;
  색상: string;
}

interface AccountBalanceChartProps {
  data: AccountData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-medium text-slate-800 mb-1">{label}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          잔액: <span className="font-medium">{formatCurrency(payload[0].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomBar = (props: any) => {
  const { fill, ...rest } = props;
  return <Bar {...rest} fill={props.payload?.색상 || fill} />;
};

export const AccountBalanceChart: React.FC<AccountBalanceChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-sm">계좌 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        layout="horizontal"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          type="number" 
          stroke="#64748b"
          fontSize={12}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => formatCurrency(value, { compact: true })}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          stroke="#64748b"
          fontSize={12}
          tick={{ fontSize: 11 }}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="잔액" 
          radius={[0, 4, 4, 0]}
          shape={CustomBar}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};