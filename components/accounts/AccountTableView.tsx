import React from 'react';
import { Account, TransactionType, isCreditCard, getCreditCardAvailableAmount, getCreditCardUsageRate, getAccountType, AccountType } from '../../types';
import { formatCurrency } from '../../utils/format';

interface AccountWithStats extends Account {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

interface AccountTableViewProps {
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

export const AccountTableView: React.FC<AccountTableViewProps> = ({ accounts, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">계좌</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">유형</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">주요정보</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">수입/대출</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">지출/상환</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">활동</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">액션</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {accounts.map((account, index) => (
              <tr 
                key={account.id}
                className={`hover:bg-slate-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                }`}
              >
                {/* 계좌명 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{getAccountIcon(account)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-medium ${
                          isCreditCard(account) ? 'text-orange-600' :
                          getAccountType(account) === AccountType.LIABILITY ? 'text-red-600' :
                          'text-indigo-600'
                        }`}>
                          {account.name}
                        </div>
                        {account.id === '00000000-0000-0000-0000-000000000001' && (
                          <span className="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                            기본
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{account.propensity}</div>
                    </div>
                  </div>
                </td>

                {/* 유형 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    getAccountType(account) === AccountType.DEBIT ? 'bg-blue-100 text-blue-800' :
                    getAccountType(account) === AccountType.CREDIT ? 'bg-orange-100 text-orange-800' :
                    getAccountType(account) === AccountType.LIABILITY ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getAccountTypeLabel(account)}
                  </span>
                </td>

                {/* 주요 정보 (잔액/사용액/대출잔액) */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {isCreditCard(account) ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-orange-600">
                        {formatCurrency(Math.max(0, account.balance))}
                      </div>
                      {account.creditLimit && account.creditLimit > 0 && (
                        <div className="text-xs text-slate-500">
                          / {formatCurrency(account.creditLimit)}
                        </div>
                      )}
                    </div>
                  ) : getAccountType(account) === AccountType.LIABILITY ? (
                    <div className="text-sm font-medium text-red-600">
                      {formatCurrency(Math.max(0, account.balance))}
                    </div>
                  ) : (
                    <div className={`text-sm font-medium ${
                      account.balance >= 0 ? 'text-slate-800' : 'text-red-600'
                    }`}>
                      {formatCurrency(account.balance)}
                    </div>
                  )}
                </td>

                {/* 수입/대출 */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm ${
                    getAccountType(account) === AccountType.LIABILITY ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {getAccountType(account) === AccountType.LIABILITY ? 
                      formatCurrency(account.totalExpenses) : 
                      formatCurrency(account.totalIncome)
                    }
                  </div>
                </td>

                {/* 지출/상환 */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm ${
                    getAccountType(account) === AccountType.LIABILITY ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {getAccountType(account) === AccountType.LIABILITY ? 
                      formatCurrency(account.totalIncome) : 
                      formatCurrency(account.totalExpenses)
                    }
                  </div>
                </td>

                {/* 활동/사용률 */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {isCreditCard(account) && account.creditLimit && account.creditLimit > 0 ? (
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
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
                        <span className="text-xs text-slate-600 font-medium w-10">
                          {getCreditCardUsageRate(account).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      <div className="text-xs">{account.transactionCount}건</div>
                    </div>
                  )}
                </td>

                {/* 액션 버튼 */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(account)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="수정"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {account.id !== '00000000-0000-0000-0000-000000000001' && (
                      <button 
                        onClick={() => onDelete(account.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 빈 상태 */}
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">계좌 없음</h3>
          <p className="mt-1 text-sm text-slate-500">조건에 맞는 계좌가 없습니다.</p>
        </div>
      )}
    </div>
  );
};