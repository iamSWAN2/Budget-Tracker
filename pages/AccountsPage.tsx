
import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { UseDataReturn } from '../hooks/useData';
import { Account, AccountPropensity, TransactionType } from '../types';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';

// 계좌 유형별 분류 함수
const getAccountCategory = (propensity: AccountPropensity): string => {
    switch (propensity) {
        case AccountPropensity.CHECKING:
        case AccountPropensity.SAVINGS:
        case AccountPropensity.INVESTMENT:
        case AccountPropensity.LOAN:
            return '계좌';
        case AccountPropensity.CASH:
        case AccountPropensity.CREDIT_CARD:
            return '결제수단';
        default:
            return '기타';
    }
};

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
                <input id="account-name" type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="account-propensity" className="block text-sm font-medium text-slate-700">계좌 유형</label>
                <select id="account-propensity" name="propensity" value={formData.propensity} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <optgroup label="계좌">
                        <option value={AccountPropensity.CHECKING}>{AccountPropensity.CHECKING}</option>
                        <option value={AccountPropensity.SAVINGS}>{AccountPropensity.SAVINGS}</option>
                        <option value={AccountPropensity.INVESTMENT}>{AccountPropensity.INVESTMENT}</option>
                        <option value={AccountPropensity.LOAN}>{AccountPropensity.LOAN}</option>
                    </optgroup>
                    <optgroup label="결제수단">
                        <option value={AccountPropensity.CASH}>{AccountPropensity.CASH}</option>
                        <option value={AccountPropensity.CREDIT_CARD}>{AccountPropensity.CREDIT_CARD}</option>
                    </optgroup>
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
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <Button type="button" onClick={onClose} variant="secondary" size="sm">취소</Button>
                <Button type="submit" variant="primary" size="sm">계좌 저장</Button>
            </div>
        </form>
    );
};

export const AccountsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
    const { accounts, transactions, addAccount, updateAccount, deleteAccount } = data;
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const accountsWithStats = useMemo(() => {
        const accountsWithData = accounts.map(account => {
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

        // 기본 계좌를 맨 앞으로 정렬
        return accountsWithData.sort((a, b) => {
            const isADefault = a.id === '00000000-0000-0000-0000-000000000001';
            const isBDefault = b.id === '00000000-0000-0000-0000-000000000001';
            
            if (isADefault && !isBDefault) return -1;
            if (!isADefault && isBDefault) return 1;
            return 0; // 기본 계좌가 아닌 경우 원래 순서 유지
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

    const handleDelete = async (id: string) => {
        // 해당 계좌의 거래 내역 개수 확인
        const accountTransactions = transactions.filter(t => t.accountId === id);
        const transactionCount = accountTransactions.length;
        
        let confirmMessage = '이 계좌를 삭제하시겠습니까?';
        if (transactionCount > 0) {
            confirmMessage += `\n\n⚠️ 이 계좌에는 ${transactionCount}개의 거래 내역이 있습니다.\n거래 내역이 있는 계좌는 삭제할 수 없습니다.`;
        }
        
        if (window.confirm(confirmMessage)) {
            try {
                await deleteAccount(id);
                // 성공 시 메시지는 필요없음 (자동으로 목록에서 제거됨)
            } catch (error) {
                alert(`❌ ${error instanceof Error ? error.message : '계좌 삭제에 실패했습니다.'}`);
            }
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
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-indigo-600">{account.name}</h3>
                                    {account.id === '00000000-0000-0000-0000-000000000001' && (
                                        <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                                            기본
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                                        {account.propensity}
                                    </span>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                                        getAccountCategory(account.propensity) === '계좌' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                                        {getAccountCategory(account.propensity)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">{t('summary.income')}:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(account.totalIncome)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">{t('summary.expense')}:</span>
                                <span className="font-semibold text-red-600">{formatCurrency(account.totalExpenses)}</span>
                            </div>
                            
                            <div className="border-t pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700">{t('summary.balance')}:</span>
                                    <span className={`text-lg font-bold ${account.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                        {formatCurrency(account.balance)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEdit(account)}
                                    className="flex-1 bg-indigo-50 text-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-100 text-sm font-medium"
                                >
                                    수정
                                </button>
                                {/* 기본 계좌가 아닌 경우에만 삭제 버튼 표시 */}
                                {account.id !== '00000000-0000-0000-0000-000000000001' && (
                                    <button 
                                        onClick={() => handleDelete(account.id)}
                                        className="flex-1 bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 text-sm font-medium"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
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
