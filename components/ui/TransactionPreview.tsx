import React from 'react';
import { AITransaction } from '../../types';
import { formatCurrency } from '../../utils/format';

interface TransactionPreviewProps {
  transactions: AITransaction[];
  maxHeight?: string;
  showSummary?: boolean;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({ 
  transactions, 
  maxHeight = "max-h-64",
  showSummary = true 
}) => {
  const incomeCount = transactions.filter(t => t.type === 'INCOME').length;
  const expenseCount = transactions.filter(t => t.type === 'EXPENSE').length;
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  if (transactions.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center bg-slate-50">
        <div className="text-slate-400 text-4xl mb-2">📄</div>
        <p className="text-slate-500">분석된 거래 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-50 border rounded-md p-3 text-center">
            <div className="font-semibold text-slate-700">총 거래</div>
            <div className="text-lg font-bold text-slate-900">{transactions.length}건</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
            <div className="font-semibold text-green-700">수입</div>
            <div className="text-lg font-bold text-green-800">
              {incomeCount}건 · {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
            <div className="font-semibold text-red-700">지출</div>
            <div className="text-lg font-bold text-red-800">
              {expenseCount}건 · {formatCurrency(totalExpense)}
            </div>
          </div>
        </div>
      )}
      
      <div className={`${maxHeight} overflow-y-auto border rounded-md bg-slate-50 relative`}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr className="text-left text-slate-600">
              <th className="p-3 bg-slate-100 font-semibold">날짜</th>
              <th className="p-3 bg-slate-100 font-semibold">설명</th>
              <th className="p-3 bg-slate-100 font-semibold text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr 
                key={index} 
                className={`border-t hover:bg-white transition-colors ${
                  index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                <td className="p-3 text-slate-700 font-mono text-xs">
                  {transaction.date}
                </td>
                <td className="p-3 text-slate-900">
                  <div className="max-w-48 truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <span 
                    className={`font-semibold ${
                      transaction.type === 'INCOME' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};