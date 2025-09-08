import React, { useMemo, useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { TransactionType, Transaction } from '../types';
import AIAssist from '../components/AIAssist';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { formatCurrency, formatDateDisplay, formatMonthKo } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';

export const DashboardPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { accounts, transactions, categories, addTransaction, updateTransaction, deleteTransaction } = data;
  const { t } = useI18n();
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
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
    <>
      {/* Month Navigation */}
      <div className="flex items-center justify-center mb-6">
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

      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">{t('summary.income')}</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncomeTotal)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">{t('summary.expense')}</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenseTotal)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">{t('summary.balance')}</h3>
            <p className={`text-2xl font-bold ${monthlyBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              {formatCurrency(monthlyBalance)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">{t('summary.breakdown')}</h3>
            <div className="space-y-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Add New Transaction - Compact */}
          <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">{t('form.addTransaction')}</h3>
              <AIAssist data={data} />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.type')}</label>
                <div className="inline-flex rounded-md overflow-hidden border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setTransactionType(TransactionType.INCOME)}
                    className={`px-3 py-1.5 text-xs ${
                      transactionType === TransactionType.INCOME
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t('form.income')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType(TransactionType.EXPENSE)}
                    className={`px-3 py-1.5 text-xs border-l ${
                      transactionType === TransactionType.EXPENSE
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t('form.expense')}
                  </button>
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

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.amount')}</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="0"
                  step="1"
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
                    <option value="">현금</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
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
                    {(() => {
                      const typeFiltered = categories.filter(c => c.type === transactionType && c.isActive);
                      const parents = typeFiltered.filter(c => !c.parentId);
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
                      }, [] as JSX.Element[]);
                      return byParent.length > 0 ? byParent : [<option key="loading" value="" disabled>카테고리 로딩 중...</option>];
                    })()}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('form.date')}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Installment Fields - Only for Expense */}
              {transactionType === TransactionType.EXPENSE && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">할부 개월</label>
                    <input
                      type="number"
                      name="installmentMonths"
                      min="1"
                      step="1"
                      value={formData.installmentMonths}
                      onChange={handleFormChange}
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  {formData.installmentMonths > 1 && (
                    <>
                      <div className="flex items-center">
                        <input 
                          id="dashboard-interest-free"
                          type="checkbox" 
                          name="isInterestFree" 
                          checked={formData.isInterestFree}
                          onChange={handleFormChange} 
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <label htmlFor="dashboard-interest-free" className="ml-2 block text-sm text-slate-700">
                          무이자 할부
                        </label>
                      </div>
                      
                      {/* Quick Installment Info */}
                      <div className="bg-slate-50 p-3 rounded-md text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">월 납부금:</span>
                          <span className="font-bold text-indigo-600">
                            {formData.amount
                              ? formatCurrency(parseFloat(formData.amount) / Math.max(1, formData.installmentMonths))
                              : formatCurrency(0)}
                          </span>
                        </div>
                        {!formData.isInterestFree && formData.amount && (
                          <div className="text-xs text-red-600 mt-1">
                            수수료: {formData.installmentMonths <= 5 ? '16.5' : '19.5'}% 연리
                          </div>
                        )}
                      </div>
                    </>
                  )}
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
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-3 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{t('nav.transactions')}</h3>
              <input
                type="text"
                placeholder={t('placeholder.search')}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md w-64"
              />
            </div>
            
            <div className="space-y-2 flex-1 overflow-y-auto" style={{maxHeight: 'calc(100vh - 520px)'}}>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="group relative bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors min-h-[80px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Type Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          transaction.type === TransactionType.INCOME 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === TransactionType.INCOME ? '+' : '-'}
                        </div>
                        
                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="font-semibold text-slate-900 text-base truncate">{transaction.description}</p>
                            {/* 할부 관련 뱃지들을 별도 그룹으로 분리 */}
                            {transaction.installmentMonths && transaction.installmentMonths > 1 && (
                              <div className="flex items-center space-x-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium whitespace-nowrap">
                                  {transaction.installmentMonths}개월
                                </span>
                                {transaction.isInterestFree && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium whitespace-nowrap">
                                    무이자
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {/* 정보 뱃지들을 2줄로 배치하여 가독성 향상 */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full font-medium">
                              {formatDateDisplay(transaction.date)}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {transaction.category}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                              {getAccountName(transaction.accountId)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Amount and Actions */}
                      <div className="text-right flex items-center space-x-3">
                        {/* Amount */}
                        <div className="text-right">
                          {transaction.installmentMonths && transaction.installmentMonths > 1 ? (
                            <div>
                              <p className={`font-bold text-xl ${
                                transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(transaction.amount / transaction.installmentMonths)}
                                <span className="text-xs text-slate-500 ml-1">/월</span>
                              </p>
                              <p className={`text-sm font-medium ${
                                transaction.type === TransactionType.INCOME ? 'text-green-500' : 'text-red-500'
                              }`}>
                                총 {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          ) : (
                            <p className={`font-bold text-xl ${
                              transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(transaction.amount)}
                            </p>
                          )}
                        </div>
                        
                        {/* Actions - Always visible but subtle */}
                        <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col space-y-1">
                            <button 
                              onClick={() => handleEdit(transaction)}
                              className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(transaction.id)}
                              className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                              title="삭제"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">No transactions yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Add a transaction to get started!</p>
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
    </>
  );
};
