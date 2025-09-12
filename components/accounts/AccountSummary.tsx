import React from 'react';
import { Account, getAccountType, AccountType, isCreditCard, getCreditCardUsageRate } from '../../types';
import { formatCurrency } from '../../utils/format';

interface AccountWithStats extends Account {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

interface AccountSummaryProps {
  accounts: AccountWithStats[];
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SummaryData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  creditUtilization: number;
  accountsByType: {
    debit: number;
    credit: number;
    cash: number;
    liability: number;
  };
}

export const AccountSummary: React.FC<AccountSummaryProps> = ({ 
  accounts, 
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const summaryData: SummaryData = React.useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalCreditUsed = 0;
    let totalCreditLimit = 0;
    
    const accountsByType = {
      debit: 0,
      credit: 0,
      cash: 0,
      liability: 0,
    };

    accounts.forEach(account => {
      const accountType = getAccountType(account);
      
      switch (accountType) {
        case AccountType.DEBIT:
        case AccountType.CASH:
          totalAssets += Math.max(0, account.balance);
          accountsByType[accountType === AccountType.DEBIT ? 'debit' : 'cash']++;
          break;
        case AccountType.CREDIT:
          totalLiabilities += Math.max(0, account.balance); // 신용카드 사용액
          if (account.creditLimit && account.creditLimit > 0) {
            totalCreditUsed += Math.max(0, account.balance);
            totalCreditLimit += account.creditLimit;
          }
          accountsByType.credit++;
          break;
        case AccountType.LIABILITY:
          totalLiabilities += Math.max(0, account.balance); // 대출 잔액
          accountsByType.liability++;
          break;
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      creditUtilization: totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0,
      accountsByType,
    };
  }, [accounts]);

  const SummaryContent = () => (
    <div className="space-y-4">
      {/* 주요 지표 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <div className="text-sm text-green-600 font-medium">총 자산</div>
          <div className="text-xl font-bold text-green-700 mt-1">
            {formatCurrency(summaryData.totalAssets)}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-100">
          <div className="text-sm text-red-600 font-medium">총 부채</div>
          <div className="text-xl font-bold text-red-700 mt-1">
            {formatCurrency(summaryData.totalLiabilities)}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          summaryData.netWorth >= 0 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' 
            : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-100'
        }`}>
          <div className={`text-sm font-medium ${
            summaryData.netWorth >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            순자산
          </div>
          <div className={`text-xl font-bold mt-1 ${
            summaryData.netWorth >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            {formatCurrency(summaryData.netWorth)}
          </div>
        </div>
      </div>

      {/* 계좌 유형별 요약 & 신용카드 사용률 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 계좌 유형별 분포 */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-slate-700 mb-3">계좌 유형별 분포</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2">
                <span>🏦</span> 예금/적금/투자
              </span>
              <span className="font-medium">{summaryData.accountsByType.debit}개</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2">
                <span>💳</span> 신용카드
              </span>
              <span className="font-medium">{summaryData.accountsByType.credit}개</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2">
                <span>💰</span> 현금
              </span>
              <span className="font-medium">{summaryData.accountsByType.cash}개</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2">
                <span>📋</span> 대출
              </span>
              <span className="font-medium">{summaryData.accountsByType.liability}개</span>
            </div>
          </div>
        </div>

        {/* 신용카드 사용률 */}
        {summaryData.accountsByType.credit > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-orange-700 mb-3">전체 신용카드 사용률</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">평균 사용률</span>
                <span className="font-semibold text-orange-700">
                  {summaryData.creditUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    summaryData.creditUtilization > 80 
                      ? 'bg-red-500' 
                      : summaryData.creditUtilization > 60 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, summaryData.creditUtilization)}%` }}
                />
              </div>
              <div className="text-xs text-orange-600">
                {summaryData.creditUtilization > 80 
                  ? '⚠️ 높은 사용률 - 신용점수에 영향을 줄 수 있습니다' 
                  : summaryData.creditUtilization > 60 
                    ? '⚡ 보통 사용률 - 관리가 필요합니다'
                    : '✅ 건전한 사용률 - 잘 관리되고 있습니다'
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isCollapsible) {
    return (
      <div className="bg-white rounded-lg border border-slate-200">
        <button
          onClick={onToggleCollapse}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-slate-800">자산 요약</h3>
          <svg 
            className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
              isCollapsed ? 'transform rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <SummaryContent />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">자산 요약</h3>
      <SummaryContent />
    </div>
  );
};