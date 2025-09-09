
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
import { DropdownMenu, MenuIcons } from '../components/ui/DropdownMenu';

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
            
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="group relative bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors">
                    {/* 자연스러운 좌→우 흐름 레이아웃 */}
                    <div className="flex items-center space-x-4">
                      {/* Type Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                        transaction.type === TransactionType.INCOME 
                          ? 'bg-green-100 text-green-700 ring-2 ring-green-200' 
                          : transaction.type === TransactionType.EXPENSE
                            ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
                            : 'bg-slate-200 text-slate-700 ring-2 ring-slate-300'
                      }`}>
                        {transaction.type === TransactionType.INCOME ? '+' : transaction.type === TransactionType.EXPENSE ? '-' : '⇄'}
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
                            transaction.type === TransactionType.INCOME 
                              ? 'text-green-600' 
                              : transaction.type === TransactionType.EXPENSE 
                                ? 'text-red-600' 
                                : 'text-slate-700'
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
