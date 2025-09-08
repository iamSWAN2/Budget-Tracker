
import React, { useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Transaction, TransactionType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import AIAssist from '../components/AIAssist';
import { formatCurrency, formatDateDisplay } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';
import { useUISettings } from '../ui/UISettingsProvider';

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
    
    return (
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">{t('nav.transactions')}</h3>
                <div className="flex items-center space-x-2">
                  <AIAssist data={data} />
                  <button 
                    onClick={handleAdd} 
                    disabled={accounts.length === 0}
                    className={`flex items-center px-3 py-1.5 rounded-md ${
                      accounts.length === 0 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                      <PlusIcon />
                      <span className="ml-2">{t('form.addTransaction')}</span>
                  </button>
                </div>
            </div>
            
            {accounts.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">거래를 추가하려면 먼저 계좌를 생성해주세요.</p>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className={`group flex items-center justify-between ${rowY} px-3 hover:bg-slate-50 transition-colors`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Type Icon */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          transaction.type === TransactionType.INCOME 
                            ? 'bg-green-100 text-green-700' 
                            : transaction.type === TransactionType.EXPENSE
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-200 text-slate-700'
                        }`}>
                          {transaction.type === TransactionType.INCOME ? '+' : transaction.type === TransactionType.EXPENSE ? '-' : '⇄'}
                        </div>
                        
                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 text-sm truncate">{transaction.description}</p>
                            {/* 할부 관련 뱃지들을 별도 그룹으로 분리 */}
                            {transaction.installmentMonths && transaction.installmentMonths > 1 && (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[11px] font-medium whitespace-nowrap">
                                  {transaction.installmentMonths}개월
                                </span>
                                {transaction.isInterestFree && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[11px] font-medium whitespace-nowrap">
                                    무이자
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                            {formatDateDisplay(transaction.date)} • {transaction.category} • {getAccountName(transaction.accountId)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Amount and Actions */}
                      <div className="text-right flex items-center gap-3">
                        {/* Amount */}
                        <div className="text-right tabular-nums">
                          {transaction.type !== TransactionType.TRANSFER && transaction.installmentMonths && transaction.installmentMonths > 1 ? (
                            <div>
                              <p className={`font-semibold ${
                                transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                              } text-base md:text-lg`}>
                                {formatCurrency(transaction.amount / transaction.installmentMonths)}
                                <span className="text-[11px] text-slate-500 ml-1">/월</span>
                              </p>
                              <p className={`text-[11px] font-medium ${
                                transaction.type === TransactionType.INCOME ? 'text-green-500' : 'text-red-500'
                              }`}>
                                총 {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          ) : (
                            <p className={`font-semibold ${
                              transaction.type === TransactionType.INCOME ? 'text-green-600' : transaction.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-slate-700'
                            } text-base md:text-lg`}>
                              {formatCurrency(transaction.amount)}
                            </p>
                          )}
                        </div>
                        
                        {/* Actions - hover only for compactness */}
                        <div className="hidden group-hover:flex transition-opacity">
                          <div className="flex flex-col">
                            <button 
                              onClick={() => handleEdit(transaction)}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(transaction.id)}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
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
