
import React, { useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Transaction, TransactionType } from '../types';
import { PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { AddTransactionFormInline } from '../components/forms/AddTransactionFormInline';
import { EditTransactionFormInline } from '../components/forms/EditTransactionFormInline';
import { AddTransactionFormInline } from '../components/forms/AddTransactionFormInline';
import AIAssist from '../components/AIAssist';
import { formatDateDisplay } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';
import { useUISettings } from '../ui/UISettingsProvider';
import { TransactionItem } from '../components/transactions/TransactionItem';

export const TransactionsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
    const { transactions, accounts, categories, addTransaction, updateTransaction, deleteTransaction } = data;
    const { t } = useI18n();
    const { density } = useUISettings();
    const rowY = density === 'compact' ? 'py-1.5' : 'py-2.5';
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
    const getCategoryPath = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);
        if (!cat) return categoryName;
        const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
        return parent ? `${parent.name} > ${cat.name}` : cat.name;
    };
    
    return (
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col mx-auto w-full max-w-3xl lg:max-w-4xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">{t('nav.transactions')}</h3>
                <div className="flex items-center space-x-2">
                  <AIAssist data={data} />
                  <button 
                    onClick={handleAdd} 
                    disabled={accounts.length === 0}
                    className={`flex items-center justify-center px-2.5 py-1.5 rounded-md ${
                      accounts.length === 0 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    aria-label={t('form.addTransaction')}
                    title={t('form.addTransaction')}
                  >
                      <PlusIcon />
                  </button>
                </div>
            </div>
            
            {accounts.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">거래를 추가하려면 먼저 계좌를 생성해주세요.</p>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-2">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      accountName={getAccountName(transaction.accountId)}
                      categoryLabel={getCategoryPath(transaction.category)}
                      onDelete={handleDelete}
                      onUpdate={updateTransaction}
                      accounts={accounts}
                      categories={categories}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium text-lg">거래 내역이 없습니다</p>
                    <p className="text-slate-400 mt-2">첫 번째 거래를 추가해보세요!</p>
                  </div>
                )}
              </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? '거래 수정' : '거래 추가'}>
                {editingTransaction ? (
                  <EditTransactionFormInline
                    transaction={editingTransaction}
                    accounts={accounts}
                    categories={categories}
                    onSave={(tx) => { updateTransaction(tx); setIsModalOpen(false); }}
                    onClose={() => setIsModalOpen(false)}
                  />
                ) : (
                  <AddTransactionFormInline
                    accounts={accounts}
                    categories={categories}
                    onAdd={(tx) => { addTransaction(tx); setIsModalOpen(false); }}
                  />
                )}
            </Modal>
        </div>
    );
};
