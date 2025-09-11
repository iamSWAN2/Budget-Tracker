import React from 'react';
import { AITransaction } from '../../types';
import { formatCurrency } from '../../utils/format';

interface TransactionPreviewProps {
  transactions: AITransaction[];
  maxHeight?: string;
  showSummary?: boolean;
  showExtendedFields?: boolean;
  extendedData?: {
    type?: string;
    category?: string;
    account?: string;
    reference?: string;
    installmentMonths?: number;
    isInterestFree?: boolean;
  }[];
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({ 
  transactions, 
  maxHeight = "max-h-64",
  showSummary = true,
  showExtendedFields = false,
  extendedData = []
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
            <div className="font-semibold text-slate-700 mb-1">총 거래</div>
            <div className="text-base font-bold text-slate-900 mb-1">{transactions.length}건</div>
            <div className="text-xs text-slate-500">전체</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
            <div className="font-semibold text-green-700 mb-1">수입</div>
            <div className="text-base font-bold text-green-800 mb-1">{incomeCount}건</div>
            <div className="text-xs text-green-600">{formatCurrency(totalIncome)}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
            <div className="font-semibold text-red-700 mb-1">지출</div>
            <div className="text-base font-bold text-red-800 mb-1">{expenseCount}건</div>
            <div className="text-xs text-red-600">{formatCurrency(totalExpense)}</div>
          </div>
        </div>
      )}
      
      <div className={`${maxHeight} overflow-auto border rounded-md bg-slate-50 relative`}>
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr className="text-left text-slate-600">
              <th className="p-3 bg-slate-100 font-semibold whitespace-nowrap min-w-[100px]">날짜</th>
              <th className="p-3 bg-slate-100 font-semibold whitespace-nowrap min-w-[150px]">설명</th>
              <th className="p-3 bg-slate-100 font-semibold text-right whitespace-nowrap min-w-[100px]">금액</th>
              {showExtendedFields && (
                <>
                  <th className="p-3 bg-slate-100 font-semibold whitespace-nowrap min-w-[80px]">유형</th>
                  <th className="p-3 bg-slate-100 font-semibold whitespace-nowrap min-w-[100px]">카테고리</th>
                  <th className="p-3 bg-slate-100 font-semibold whitespace-nowrap min-w-[120px]">계좌</th>
                  <th className="p-3 bg-slate-100 font-semibold whitespace-nowrap min-w-[80px]">할부</th>
                  <th className="p-3 bg-slate-100 font-semibold whitespace-nowrap min-w-[100px]">무이자</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => {
              const extended = extendedData[index];
              return (
                <tr 
                  key={index} 
                  className={`border-t hover:bg-white transition-colors ${
                    index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                  }`}
                >
                  <td className="p-3 text-slate-700 font-mono text-xs whitespace-nowrap">
                    {transaction.date}
                  </td>
                  <td className="p-3 text-slate-900">
                    <div className="max-w-48 truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
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
                  {showExtendedFields && (
                    <>
                      <td className="p-3 text-slate-600 text-xs">
                        <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                          transaction.type === 'INCOME' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'INCOME' ? '수입' : '지출'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs whitespace-nowrap">
                        {extended?.category || '미분류'}
                      </td>
                      <td className="p-3 text-slate-600 text-xs whitespace-nowrap">
                        {extended?.account || '미지정'}
                      </td>
                      <td className="p-3 text-slate-600 text-xs text-center">
                        {extended?.installmentMonths && extended.installmentMonths > 1 ? 
                          `${extended.installmentMonths}개월` : '일시불'
                        }
                      </td>
                      <td className="p-3 text-slate-600 text-xs text-center">
                        {extended?.installmentMonths && extended.installmentMonths > 1 ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            extended?.isInterestFree 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {extended?.isInterestFree ? '무이자' : '일반'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};