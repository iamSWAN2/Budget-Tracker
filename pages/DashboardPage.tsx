import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { UseDataReturn } from '../hooks/useData';
import { Account, Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CATEGORY_COLORS } from '../constants';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import AIAssist from '../components/AIAssist';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const DashboardPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { accounts, transactions, categories, addTransaction, updateTransaction, deleteTransaction } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalAssets = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
  const monthlyIncomeTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === new Date().getMonth())
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions]);
  const monthlyExpenseTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === new Date().getMonth())
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions]);

  const assetDistributionData = useMemo(() => {
    const positiveAccounts = accounts.filter(a => a.balance > 0);
    const data: { name: string; value: number }[] = positiveAccounts
      .map(acc => ({ name: acc.name, value: Number(acc.balance) || 0 }));
    return data.sort((a, b) => Number(b.value) - Number(a.value));
  }, [accounts]);

  const monthlyExpenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === new Date().getMonth());
    const categoryTotals = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as { [key: string]: number });

    const entries = Object.entries(categoryTotals) as [string, number][];
    const data: { name: string; value: number }[] = entries
      .map(([name, value]) => ({ name, value: Number(value) || 0 }));
    return data.sort((a, b) => Number(b.value) - Number(a.value));
  }, [transactions]);
  
  const weeklyExpenseData = useMemo(() => {
    const today = new Date();
    const last7Days = new Array(7).fill(0).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return d;
    });

    const dailyTotals = last7Days.map(date => {
        const dayStr = date.toISOString().split('T')[0];
        const total = transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.date === dayStr)
            .reduce((sum, t) => sum + t.amount, 0);
        return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            expense: total
        };
    }).reverse();

    return dailyTotals;
  }, [transactions]);

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 거래를 삭제하시겠습니까?')) {
      deleteTransaction(id);
    }
  };
  
  const handleSave = (transaction: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in transaction) {
      updateTransaction(transaction);
    } else {
      addTransaction(transaction);
    }
  };

  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';
  
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Summary Strip: unified background with subtle section colors */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <h4 className="text-sm font-medium text-slate-600 mb-1">총 자산</h4>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{formatCurrency(totalAssets)}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <h4 className="text-sm font-medium text-green-700 mb-1">이번 달 수입</h4>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{formatCurrency(monthlyIncomeTotal)}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <h4 className="text-sm font-medium text-red-700 mb-1">이번 달 지출</h4>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{formatCurrency(monthlyExpenseTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <Card title="거래 내역" className="lg:col-span-2 lg:col-start-1 lg:row-start-2 xl:col-span-2 xl:col-start-1 xl:row-start-2">
          <div className="flex justify-between items-center mb-4">
                  <div></div>
                  <div className="flex items-center space-x-2">
                    <AIAssist data={data} />
                    <button onClick={handleAdd} className="flex items-center px-4 py-3 sm:py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow text-sm sm:text-base font-medium">
                      <PlusIcon />
                      <span className="ml-2">거래 추가</span>
                    </button>
                  </div>
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto max-h-80">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-4 py-3">설명</th>
                      <th scope="col" className="px-4 py-3">날짜</th>
                      <th scope="col" className="px-4 py-3">금액</th>
                      <th scope="col" className="px-4 py-3">카테고리</th>
                      <th scope="col" className="px-4 py-3">계좌</th>
                      <th scope="col" className="px-4 py-3">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t: Transaction) => (
                      <tr key={t.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{t.description}</td>
                        <td className="px-4 py-3">{t.date}</td>
                        <td className={`px-4 py-3 font-semibold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'}
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-3">{t.category}</td>
                        <td className="px-4 py-3">{getAccountName(t.accountId)}</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button onClick={() => handleEdit(t)} className="text-primary-600 hover:text-primary-800"><EditIcon /></button>
                            <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden max-h-80 overflow-y-auto space-y-3">
                {transactions.map((t: Transaction) => (
                  <div key={t.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{t.description}</h4>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(t)} 
                          className="text-primary-600 hover:text-primary-800 p-1"
                        >
                          <EditIcon />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)} 
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">날짜:</span>
                        <span className="ml-1 font-medium">{t.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">카테고리:</span>
                        <span className="ml-1 font-medium">{t.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">계좌:</span>
                        <span className="ml-1 font-medium">{getAccountName(t.accountId)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500">금액:</span>
                        <span className={`font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'}
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </Card>

        {/* Charts */}
        <Card title="Weekly Expense Trend" className="xl:col-span-2">
          <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyExpenseData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="expense" fill="#ef4444" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
        </Card>

        {/* Asset Distribution to the right of Transaction History */}
        <Card title="Asset Distribution" className="lg:col-span-1 lg:col-start-3 lg:row-start-2 xl:col-span-1 xl:col-start-3 xl:row-start-2 h-auto lg:h-80 xl:h-80 self-start overflow-hidden">
          <div className="h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#3b82f6"
                  dataKey="value"
                >
                  {assetDistributionData.map((entry, index) => (
                    <Cell key={`asset-cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card title="Monthly Expense by Category" className="xl:col-span-2">
          <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie 
                          data={monthlyExpenseData} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80} 
                          fill="#8884d8" 
                          dataKey="value"
                      >
                          {monthlyExpenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
              </ResponsiveContainer>
          </div>
        </Card>

      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? '거래 수정' : '거래 추가'}>
        <TransactionForm
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};
