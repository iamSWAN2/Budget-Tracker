import React from 'react';
import { Account, TransactionType, isCreditCard, getCreditCardAvailableAmount, getCreditCardUsageRate, getAccountType, AccountType } from '../../types';
import { formatCurrency } from '../../utils/format';

interface AccountWithStats extends Account {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

interface AccountListViewProps {
  accounts: AccountWithStats[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

const getAccountIcon = (account: Account): string => {
  const accountType = getAccountType(account);
  switch (accountType) {
    case AccountType.CASH:
      return '💰';
    case AccountType.CREDIT:
      return '💳';
    case AccountType.LIABILITY:
      return '📋';
    case AccountType.DEBIT:
    default:
      return '🏦';
  }
};

const getAccountTypeLabel = (account: Account): string => {
  const accountType = getAccountType(account);
  switch (accountType) {
    case AccountType.CASH:
      return '현금';
    case AccountType.CREDIT:
      return '신용카드';
    case AccountType.LIABILITY:
      return '대출';
    case AccountType.DEBIT:
    default:
      return '계좌';
  }
};

export const AccountListView: React.FC<AccountListViewProps> = ({ accounts, onEdit, onDelete }) => {
  return (
    <div className="space-y-3">
      {accounts.map(account => (
        <div 
          key={account.id} 
          className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
            isCreditCard(account) 
              ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50' 
              : getAccountType(account) === AccountType.LIABILITY
                ? 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50'
                : 'border-slate-200'
          }`}
        >
          {/* 헤더 영역 */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getAccountIcon(account)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-base ${
                      isCreditCard(account) ? 'text-orange-600' :
                      getAccountType(account) === AccountType.LIABILITY ? 'text-red-600' :
                      'text-indigo-600'
                    }`}>
                      {account.name}
                    </h3>
                    {account.id === '00000000-0000-0000-0000-000000000001' && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        기본
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{account.propensity}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className={`text-xs font-medium ${
                      getAccountType(account) === AccountType.DEBIT ? 'text-blue-600' :
                      getAccountType(account) === AccountType.CREDIT ? 'text-orange-600' :
                      getAccountType(account) === AccountType.LIABILITY ? 'text-red-600' :
                      'text-green-600'
                    }`}>
                      {getAccountTypeLabel(account)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 액션 메뉴 */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onEdit(account)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="수정"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {account.id !== '00000000-0000-0000-0000-000000000001' && (
                  <button 
                    onClick={() => onDelete(account.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 잔액/정보 영역 */}
          <div className="px-4 pb-4">
            {isCreditCard(account) ? (
              // 신용카드 정보
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">사용액</div>
                    <div className="font-semibold text-orange-600 text-sm">
                      {formatCurrency(Math.max(0, account.balance))}
                    </div>
                  </div>
                  {account.creditLimit && account.creditLimit > 0 && (
                    <>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">한도</div>
                        <div className="font-semibold text-slate-700 text-sm">
                          {formatCurrency(account.creditLimit)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">사용가능</div>
                        <div className="font-semibold text-green-600 text-sm">
                          {formatCurrency(getCreditCardAvailableAmount(account))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {account.creditLimit && account.creditLimit > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">사용률</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {getCreditCardUsageRate(account).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          getCreditCardUsageRate(account) > 80 
                            ? 'bg-red-500' 
                            : getCreditCardUsageRate(account) > 60 
                              ? 'bg-orange-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, getCreditCardUsageRate(account))}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {account.paymentDay && (
                  <div className="text-center">
                    <span className="text-xs text-slate-500">결제일: </span>
                    <span className="text-xs text-slate-700 font-medium">{account.paymentDay}일</span>
                  </div>
                )}
              </div>
            ) : getAccountType(account) === AccountType.LIABILITY ? (
              // 대출 계좌 정보
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">대출잔액</div>
                  <div className="font-bold text-red-600 text-lg">
                    {formatCurrency(Math.max(0, account.balance))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">대출</div>
                    <div className="font-semibold text-red-600">
                      {formatCurrency(account.totalExpenses)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">상환</div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(account.totalIncome)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 일반 계좌 정보
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">현재 잔액</div>
                  <div className={`font-bold text-lg ${
                    account.balance >= 0 ? 'text-slate-800' : 'text-red-600'
                  }`}>
                    {formatCurrency(account.balance)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">수입</div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(account.totalIncome)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">지출</div>
                    <div className="font-semibold text-red-600">
                      {formatCurrency(account.totalExpenses)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};