
import React, { useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Transaction, TransactionType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import AIAssist from '../components/AIAssist';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(value));

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
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
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
            
            <div className="space-y-2 flex-1 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
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
                              {transaction.date}
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
