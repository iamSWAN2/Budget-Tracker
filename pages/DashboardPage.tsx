import React, { useMemo, useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { TransactionType, Transaction } from '../types';
import AIAssist from '../components/AIAssist';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { formatCurrency, formatDateDisplay, formatMonthKo } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';
import { DropdownMenu, MenuIcons } from '../components/ui/DropdownMenu';

export const DashboardPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { accounts, transactions, categories, addTransaction, updateTransaction, deleteTransaction } = data;
  const { t } = useI18n();
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  // Debug transactionType changes
  React.useEffect(() => {
    console.log('TransactionType changed to:', transactionType);
  }, [transactionType]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Inline form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    accountId: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    installmentMonths: 1,
    isInterestFree: false
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const monthlyIncomeTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.INCOME && 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions, currentMonth, currentYear]);

  const monthlyExpenseTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions, currentMonth, currentYear]);

  const monthlyBalance = useMemo(() => monthlyIncomeTotal - monthlyExpenseTotal, [monthlyIncomeTotal, monthlyExpenseTotal]);

  const monthlyExpenseByCategory = useMemo(() => {
    try {
      const expenses = transactions.filter(t =>
        t.type === TransactionType.EXPENSE &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
      );

      const categoryTotals = expenses.reduce((acc, curr) => {
        const key = curr.category || '기타';
        const amount = Number(curr.amount) || 0;
        acc[key] = (acc[key] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

      const items: { category: string; amount: number }[] = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount: Number(amount) || 0 }));

      items.sort((a, b) => (b?.amount ?? 0) - (a?.amount ?? 0));
      return items.slice(0, 5);
    } catch {
      return [] as { category: string; amount: number }[];
    }
  }, [transactions, currentMonth, currentYear]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions, currentMonth, currentYear]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.accountId || !formData.category) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const newTransaction = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: transactionType,
      accountId: formData.accountId,
      category: formData.category,
      date: formData.date,
      installmentMonths: formData.installmentMonths,
      isInterestFree: formData.isInterestFree
    };

    addTransaction(newTransaction);
    
    // Reset form
    setFormData({
      description: '',
      amount: '',
      accountId: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      installmentMonths: 1,
      isInterestFree: false
    });
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 거래를 삭제하시겠습니까?')) {
      deleteTransaction(id);
    }
  };

  const handleEditSave = (transaction: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in transaction) {
      updateTransaction(transaction);
    } else {
      addTransaction(transaction);
    }
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';

  const formatMonth = (month: number, year: number) => formatMonthKo(month, year);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Month Navigation */}
      <div className="flex items-center justify-center mb-4 flex-shrink-0">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
        >
          ← {t('month.prev')}
        </button>
        <h2 className="mx-6 text-xl font-semibold text-slate-800">
          {formatMonth(currentMonth, currentYear)}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
        >
          {t('month.next')} →
        </button>
      </div>

      <div className="flex-1 flex flex-col space-y-6 min-h-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.income')}</h3>
            <p className="text-lg font-bold text-green-600">{formatCurrency(monthlyIncomeTotal)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.expense')}</h3>
            <p className="text-lg font-bold text-red-600">{formatCurrency(monthlyExpenseTotal)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.balance')}</h3>
            <p className={`text-lg font-bold ${monthlyBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              {formatCurrency(monthlyBalance)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.breakdown')}</h3>
            <div className="space-y-1">
              {monthlyExpenseByCategory.length > 0 ? (
                monthlyExpenseByCategory.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs text-slate-600">
                    {item.category}: {formatCurrency(item.amount)}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No expenses to display.</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid - Optimized Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          {/* Add New Transaction - Compact */}
          <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">{t('form.addTransaction')}</h3>
              <AIAssist data={data} />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Row 1: Type (left) + Date (right) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.type')}</label>
                  <div className="inline-flex rounded-md overflow-hidden border border-slate-300">
                    <button type="button" onClick={() => setTransactionType(TransactionType.INCOME)} className={`px-3 py-1.5 text-xs ${transactionType === TransactionType.INCOME ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`}>{t('form.income')}</button>
                    <button type="button" onClick={() => setTransactionType(TransactionType.EXPENSE)} className={`px-3 py-1.5 text-xs border-l ${transactionType === TransactionType.EXPENSE ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`}>{t('form.expense')}</button>
                    <button type="button" onClick={() => setTransactionType(TransactionType.TRANSFER)} className={`px-3 py-1.5 text-xs border-l ${transactionType === TransactionType.TRANSFER ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`}>기타</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.date')}</label>
                  <input type="date" name="date" value={formData.date} onChange={handleFormChange} className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.description')}</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder={t('form.description')}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Account & Category Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.account')}</label>
                  <select
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleFormChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="" disabled>계좌를 선택하세요</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.propensity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.category')}</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="" disabled>카테고리 선택</option>
                    {(() => {
                      const typeFiltered = categories.filter(c => c.type === transactionType && c.isActive);
                      console.log('Transaction Type:', transactionType, 'Filtered Categories:', typeFiltered);
                      const parents = typeFiltered.filter(c => !c.parentId);
                      console.log('Parent Categories:', parents);
                      
                      if (parents.length === 0) {
                        return [<option key="no-categories" value="" disabled>해당 유형의 카테고리가 없습니다</option>];
                      }
                      
                      const byParent = parents.reduce((acc, parent) => {
                        const children = typeFiltered.filter(sc => sc.parentId === parent.id);
                        acc.push(
                          <optgroup key={parent.id} label={parent.name}>
                            {children.map(sc => (
                              <option key={sc.id} value={sc.name}>{sc.name}</option>
                            ))}
                            <option key={`${parent.id}-self`} value={parent.name}>📁 {parent.name} (전체)</option>
                          </optgroup>
                        );
                        return acc;
                      }, [] as React.ReactElement[]);
                      return byParent;
                    })()}
                  </select>
                </div>
              </div>

              {/* Row 3: Amount (left) + Installments + Interest Free (right when expense) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.amount')}</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleFormChange} placeholder="0" step="1" className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                
                {/* Installment Months + Interest Free Checkbox in same row - Only for Expense */}
                {transactionType === TransactionType.EXPENSE && (() => {
                  // 선택된 계좌의 정보 찾기
                  const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
                  const isCreditCard = selectedAccount?.propensity === 'Credit Card';
                  const isInstallmentAvailable = isCreditCard;
                  
                  return (
                    <div className="flex items-end gap-3">
                      <div className={formData.installmentMonths > 1 && isInstallmentAvailable ? "flex-shrink-0 w-20" : "flex-1"}>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          할부 개월
                          {!isInstallmentAvailable && formData.accountId && (
                            <span className="text-xs text-slate-400 ml-1">(신용카드만)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          name="installmentMonths"
                          min="1"
                          step="1"
                          value={isInstallmentAvailable ? formData.installmentMonths : 1}
                          onChange={handleFormChange}
                          disabled={!isInstallmentAvailable}
                          className={`w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                            !isInstallmentAvailable ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      {/* Interest Free Checkbox - Only when installments > 1 and credit card */}
                      {formData.installmentMonths > 1 && isInstallmentAvailable && (
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-700 mb-1">무이자 할부</label>
                          <div className="flex items-center h-[34px]">
                            <input 
                              id="dashboard-interest-free"
                              type="checkbox" 
                              name="isInterestFree" 
                              checked={formData.isInterestFree}
                              onChange={handleFormChange} 
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Installment Info Row - Only when expense with installments > 1 and credit card */}
              {transactionType === TransactionType.EXPENSE && formData.installmentMonths > 1 && (() => {
                const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
                const isCreditCard = selectedAccount?.propensity === 'Credit Card';
                return isCreditCard;
              })() && (
                <div className="bg-slate-50 p-3 rounded-md space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">할부 정보</h4>
                  {(() => {
                    const amountValue = parseFloat(formData.amount) || 0;
                    const feeRate = formData.installmentMonths <= 5 ? 0.025 : 0.035; // 2.5% or 3.5%
                    const feeAmount = formData.isInterestFree ? 0 : amountValue * feeRate;
                    const totalWithFee = amountValue + feeAmount;
                    const monthlyPayment = totalWithFee / formData.installmentMonths;
                    
                    return (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">원금:</span>
                          <span className="font-medium">{formatCurrency(amountValue)}</span>
                        </div>
                        {!formData.isInterestFree && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">수수료 ({formData.installmentMonths <= 5 ? '2.5' : '3.5'}%):</span>
                            <span className="font-medium text-red-600">{formatCurrency(feeAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-slate-600">총 금액:</span>
                          <span className="font-semibold">{formatCurrency(totalWithFee)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-slate-700 font-medium">월 납부금:</span>
                          <span className="font-bold text-indigo-600">{formatCurrency(monthlyPayment)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}


              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 font-medium text-sm"
                >
                  {t('form.addTransaction')}
                </button>
              </div>
            </form>
          </div>

          {/* Transaction History - Expanded */}
          <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-3 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-800">{t('nav.transactions')}</h3>
              <input
                type="text"
                placeholder={t('placeholder.search')}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md w-48"
              />
            </div>
            
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="group relative bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors">
                    {/* 자연스러운 좌→우 흐름 레이아웃 */}
                    <div className="flex items-center space-x-4">
                      {/* Type Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                        transaction.type === TransactionType.INCOME 
                          ? 'bg-green-100 text-green-700 ring-2 ring-green-200' 
                          : 'bg-red-100 text-red-700 ring-2 ring-red-200'
                      }`}>
                        {transaction.type === TransactionType.INCOME ? '+' : '-'}
                      </div>
                      
                      {/* Main Transaction Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-bold text-slate-900 text-base truncate">{transaction.description}</h4>
                          {/* 할부 뱃지를 제목 옆으로 */}
                          {transaction.installmentMonths && transaction.installmentMonths > 1 && (
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                                {transaction.installmentMonths}개월
                              </span>
                              {transaction.isInterestFree && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                  무이자
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* 부가 정보 뱃지들 - 더 컴팩트하게 */}
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-xs font-medium">
                            📅 {formatDateDisplay(transaction.date)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            🏷️ {transaction.category}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                            🏦 {getAccountName(transaction.accountId)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Amount - 더 강조된 스타일 */}
                      <div className="text-right min-w-0">
                        {transaction.installmentMonths && transaction.installmentMonths > 1 ? (
                          <div className="space-y-1">
                            <p className={`font-extrabold text-xl leading-none ${
                              transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(transaction.amount / transaction.installmentMonths)}
                              <span className="text-sm text-slate-500 font-medium ml-1">/월</span>
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              총액 {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        ) : (
                          <p className={`font-extrabold text-xl ${
                            transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </p>
                        )}
                      </div>
                      
                      {/* 컴팩트 액션 메뉴 */}
                      <DropdownMenu
                        items={[
                          {
                            label: '수정',
                            icon: MenuIcons.Edit,
                            onClick: () => handleEdit(transaction)
                          },
                          {
                            label: '삭제',
                            icon: MenuIcons.Delete,
                            onClick: () => handleDelete(transaction.id),
                            variant: 'danger'
                          }
                        ]}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">No transactions yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Add a transaction to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }} 
        title={editingTransaction ? '거래 수정' : '거래 추가'}
      >
        <TransactionForm
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onSave={handleEditSave}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
};
