import React from 'react';
import { Account, TransactionType, isCreditCard, getCreditCardAvailableAmount, getCreditCardUsageRate } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useI18n } from '../../i18n/I18nProvider';

interface AccountWithStats extends Account {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

interface AccountCardViewProps {
  accounts: AccountWithStats[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const getAccountCategory = (propensity: string): string => {
  switch (propensity) {
    case 'Checking':
    case 'Savings':
    case 'Investment':
    case 'Loan':
      return '계좌';
    case 'Cash':
    case 'Credit Card':
      return '결제수단';
    default:
      return '기타';
  }
};

export const AccountCardView: React.FC<AccountCardViewProps> = ({ accounts, onEdit, onDelete, onAdd }) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {accounts.map(account => (
        <div key={account.id} className={`bg-white rounded-lg shadow-lg p-6 ${
          isCreditCard(account) 
            ? 'border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50' 
            : 'border border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-semibold ${
                  isCreditCard(account) ? 'text-orange-600' : 'text-indigo-600'
                }`}>{account.name}</h3>
                {account.id === '00000000-0000-0000-0000-000000000001' && (
                  <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                    기본
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                  {account.propensity}
                </span>
                <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                  getAccountCategory(account.propensity) === '계좌' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {getAccountCategory(account.propensity)}
                </span>
              </div>
            </div>
          </div>
          
          {isCreditCard(account) ? (
            // 신용카드 전용 표시
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">사용액:</span>
                <span className="font-semibold text-orange-600">{formatCurrency(Math.max(0, account.balance))}</span>
              </div>
              
              {account.creditLimit && account.creditLimit > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">한도:</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(account.creditLimit)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">사용가능:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(getCreditCardAvailableAmount(account))}</span>
                  </div>
                  
                  {/* 사용률 진행바 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">사용률</span>
                      <span className="text-xs text-slate-600">{getCreditCardUsageRate(account).toFixed(1)}%</span>
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
                      ></div>
                    </div>
                  </div>
                </>
              )}
              
              {account.paymentDay && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">결제일:</span>
                  <span className="text-sm text-slate-700">{account.paymentDay}일</span>
                </div>
              )}
            </div>
          ) : (
            // 일반 계좌 표시 (기존 로직)
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{t('summary.income')}:</span>
                <span className="font-semibold text-green-600">{formatCurrency(account.totalIncome)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{t('summary.expense')}:</span>
                <span className="font-semibold text-red-600">{formatCurrency(account.totalExpenses)}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">{t('summary.balance')}:</span>
                  <span className={`text-lg font-bold ${account.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex gap-2">
              <button 
                onClick={() => onEdit(account)}
                className="flex-1 bg-indigo-50 text-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-100 text-sm font-medium"
              >
                수정
              </button>
              {/* 기본 계좌가 아닌 경우에만 삭제 버튼 표시 */}
              {account.id !== '00000000-0000-0000-0000-000000000001' && (
                <button 
                  onClick={() => onDelete(account.id)}
                  className="flex-1 bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 text-sm font-medium"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Add New Account Card */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-dashed border-slate-400 p-6 flex items-center justify-center hover:border-slate-500 transition-colors">
        <button 
          onClick={onAdd}
          className="text-center text-slate-500 hover:text-indigo-600"
        >
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="font-medium">Add New Account</p>
          <p className="text-xs text-slate-400 mt-1">Create a new account to track</p>
        </button>
      </div>
    </div>
  );
};