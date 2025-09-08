
import React, { useState, useMemo } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Account, AccountPropensity, TransactionType } from '../types';
import { Modal } from '../components/ui/Modal';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const AccountForm: React.FC<{
    account: Partial<Account> | null;
    onSave: (account: Omit<Account, 'id'> | Account) => void;
    onClose: () => void;
}> = ({ account, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: account?.name || '',
        propensity: account?.propensity || AccountPropensity.CHECKING,
        balance: account?.balance || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'balance' ? parseFloat(value) || 0 : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (account && 'id' in account) {
            onSave({ ...account, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="account-name" className="block text-sm font-medium text-slate-700">계좌명</label>
                <input id="account-name" type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="account-propensity" className="block text-sm font-medium text-slate-700">계좌 유형</label>
                <select id="account-propensity" name="propensity" value={formData.propensity} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    {Object.values(AccountPropensity).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="account-balance" className="block text-sm font-medium text-slate-700">초기 잔액</label>
                <input 
                    id="account-balance"
                    type="number" 
                    name="balance" 
                    value={formData.balance} 
                    onChange={handleChange} 
                    step="0.01" 
                    placeholder="0.00" 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">계좌 저장</button>
            </div>
        </form>
    );
};

export const AccountsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
    const { accounts, transactions, addAccount, updateAccount, deleteAccount } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const accountsWithStats = useMemo(() => {
        return accounts.map(account => {
            const accountTransactions = transactions.filter(t => t.accountId === account.id);
            const totalIncome = accountTransactions
                .filter(t => t.type === TransactionType.INCOME)
                .reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = accountTransactions
                .filter(t => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                ...account,
                totalIncome,
                totalExpenses,
                transactionCount: accountTransactions.length
            };
        });
    }, [accounts, transactions]);

    const handleAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('이 계좌를 삭제하시겠습니까? 관련된 모든 거래 내역도 함께 삭제됩니다.')) {
            deleteAccount(id);
        }
    };
    
    const handleSave = (account: Omit<Account, 'id'> | Account) => {
        if ('id' in account) {
            updateAccount(account);
        } else {
            addAccount(account);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8">
            {/* Accounts Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {accountsWithStats.map(account => (
                    <div key={account.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-indigo-600">{account.name}</h3>
                                <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                                    {account.propensity}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Total Income:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(account.totalIncome)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Total Expenses:</span>
                                <span className="font-semibold text-red-600">{formatCurrency(account.totalExpenses)}</span>
                            </div>
                            
                            <div className="border-t pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700">Balance:</span>
                                    <span className={`text-lg font-bold ${account.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                        {formatCurrency(account.balance)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                            <button 
                                onClick={() => handleEdit(account)}
                                className="w-full bg-indigo-50 text-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-100 text-sm font-medium"
                            >
                                Import Transactions
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Add New Account Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <button 
                        onClick={handleAdd}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAccount ? '계좌 수정' : '계좌 추가'}>
                <AccountForm
                    account={editingAccount}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};
