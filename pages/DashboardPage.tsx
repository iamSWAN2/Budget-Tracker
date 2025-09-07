
import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { UseDataReturn } from '../hooks/useData';
import { Account, Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CATEGORY_COLORS } from '../constants';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import AIAssist from '../components/AIAssist';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const TransactionForm: React.FC<{
    transaction: Partial<Transaction> | null;
    accounts: Account[];
    onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
    onClose: () => void;
}> = ({ transaction, accounts, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        date: transaction?.date || new Date().toISOString().split('T')[0],
        description: transaction?.description || '',
        amount: transaction?.amount || 0,
        type: transaction?.type || TransactionType.EXPENSE,
        category: transaction?.category || '',
        accountId: transaction?.accountId || (accounts[0]?.id || ''),
        installmentMonths: transaction?.installmentMonths || 1,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (transaction && 'id' in transaction) {
            onSave({ ...formData, id: transaction.id });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Amount</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        {Object.values(TransactionType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Account</label>
                    <select name="accountId" value={formData.accountId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
             {formData.type === TransactionType.EXPENSE && (
                <div>
                    <label className="block text-sm font-medium text-slate-700">Installment Months (1 for no installment)</label>
                    <input type="number" name="installmentMonths" min="1" step="1" value={formData.installmentMonths} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
            )}
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Save Transaction</button>
            </div>
        </form>
    );
};

export const DashboardPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalAssets = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const monthlyExpenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === new Date().getMonth());
    const categoryTotals = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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
    if (window.confirm('Are you sure you want to delete this transaction?')) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3">
        <Card title="Financial Overview">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <h4 className="text-sm text-slate-500">Total Assets</h4>
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalAssets)}</p>
            </div>
            <div>
              <h4 className="text-sm text-slate-500">This Month's Income</h4>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(transactions.filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === new Date().getMonth()).reduce((sum, t) => sum + t.amount, 0))}</p>
            </div>
            <div>
              <h4 className="text-sm text-slate-500">This Month's Expenses</h4>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === new Date().getMonth()).reduce((sum, t) => sum + t.amount, 0))}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Transaction History" className="lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <div className="flex items-center space-x-2">
            <AIAssist data={data} />
            <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow">
              <PlusIcon />
              <span className="ml-2">Add Transaction</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Amount</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Account</th>
                <th scope="col" className="px-4 py-3">Actions</th>
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
      </Card>
      
      <Card title="Asset Distribution">
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={accounts} dataKey="balance" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {accounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Monthly Expense by Category" className="lg:col-span-2">
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyExpenseData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
                <Bar dataKey="value" fill="#3b82f6" barSize={20}>
                  {monthlyExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Weekly Spending" className="lg:col-span-2">
         <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={weeklyExpenseData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}/>
                    <Bar dataKey="expense" fill="#ef4444" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}>
        <TransactionForm
          transaction={editingTransaction}
          accounts={accounts}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

    </div>
  );
};
