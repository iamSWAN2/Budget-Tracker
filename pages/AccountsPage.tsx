
import React, { useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Account, AccountPropensity } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';

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
                <label className="block text-sm font-medium text-slate-700">Account Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Account Propensity</label>
                <select name="propensity" value={formData.propensity} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    {Object.values(AccountPropensity).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Initial Balance</label>
                <input 
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
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Save Account</button>
            </div>
        </form>
    );
};

export const AccountsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
    const { accounts, addAccount, updateAccount, deleteAccount } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const handleAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this account? This will also delete all associated transactions.')) {
            deleteAccount(id);
        }
    };
    
    const handleSave = (account: Omit<Account, 'id'> | Account) => {
        if ('id' in account) {
            updateAccount(account);
        } else {
            addAccount(account);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-6">
                <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow">
                    <PlusIcon />
                    <span className="ml-2">Add Account</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => (
                    <Card key={acc.id} title={acc.name} titleAction={
                        <div className="flex space-x-3">
                            <button onClick={() => handleEdit(acc)} className="text-slate-500 hover:text-primary-600"><EditIcon /></button>
                            <button onClick={() => handleDelete(acc.id)} className="text-slate-500 hover:text-red-600"><DeleteIcon /></button>
                        </div>
                    }>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-full">{acc.propensity}</p>
                            <p className={`text-3xl font-bold mt-4 ${acc.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                {formatCurrency(acc.balance)}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAccount ? 'Edit Account' : 'Add Account'}>
                <AccountForm
                    account={editingAccount}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};
