
import React, { useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Transaction, TransactionType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import AIAssist from '../components/AIAssist';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const TransactionsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
    const { transactions, accounts, categories, addTransaction, updateTransaction, deleteTransaction } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">거래 내역</h3>
                <div className="flex items-center space-x-2">
                  <AIAssist data={data} />
                  <button 
                    onClick={handleAdd} 
                    disabled={accounts.length === 0}
                    className={`flex items-center px-4 py-2 rounded-md shadow ${
                      accounts.length === 0 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                      <PlusIcon />
                      <span className="ml-2">거래 추가</span>
                  </button>
                </div>
            </div>
            
            {accounts.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">거래를 추가하려면 먼저 계좌를 생성해주세요.</p>
              </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">날짜</th>
                            <th scope="col" className="px-6 py-3">설명</th>
                            <th scope="col" className="px-6 py-3">금액</th>
                            <th scope="col" className="px-6 py-3">카테고리</th>
                            <th scope="col" className="px-6 py-3">계좌</th>
                            <th scope="col" className="px-6 py-3">작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                    {t.date}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <span className="font-medium text-slate-900">{t.description}</span>
                                    {t.installmentMonths && t.installmentMonths > 1 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold">
                                        할부 {t.installmentMonths}개월
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className={`px-6 py-4 font-semibold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : '-'}
                                    {formatCurrency(t.amount)}
                                </td>
                                <td className="px-6 py-4">{t.category}</td>
                                <td className="px-6 py-4">{getAccountName(t.accountId)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex space-x-3">
                                        <button onClick={() => handleEdit(t)} className="text-primary-600 hover:text-primary-800"><EditIcon /></button>
                                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </div>
    );
};
