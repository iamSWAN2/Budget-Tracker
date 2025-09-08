import React, { useState } from 'react';
import { Transaction, TransactionType, Account, Category } from '../../types';

interface TransactionFormProps {
    transaction: Partial<Transaction> | null;
    accounts: Account[];
    categories: Category[];
    onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
    onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
    transaction, 
    accounts, 
    categories, 
    onSave, 
    onClose 
}) => {
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
        
        if (isNumber) {
            // 빈 값이거나 NaN인 경우 0으로 설정
            const numValue = value === '' ? 0 : parseFloat(value);
            setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                <label htmlFor="transaction-description" className="block text-sm font-medium text-slate-700">설명</label>
                <input 
                    id="transaction-description" 
                    type="text" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    autoComplete="off" 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="transaction-amount" className="block text-sm font-medium text-slate-700">금액</label>
                    <input 
                        id="transaction-amount" 
                        type="number" 
                        name="amount" 
                        value={formData.amount} 
                        onChange={handleChange} 
                        required 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                    />
                </div>
                <div>
                    <label htmlFor="transaction-date" className="block text-sm font-medium text-slate-700">날짜</label>
                    <input 
                        id="transaction-date" 
                        type="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        required 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="transaction-type" className="block text-sm font-medium text-slate-700">타입</label>
                    <select 
                        id="transaction-type" 
                        name="type" 
                        value={formData.type} 
                        onChange={handleChange} 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                        {Object.values(TransactionType).map(type => (
                            <option key={type} value={type}>
                                {type === 'INCOME' ? '수입' : type === 'EXPENSE' ? '지출' : type}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="transaction-account" className="block text-sm font-medium text-slate-700">계좌</label>
                    <select 
                        id="transaction-account" 
                        name="accountId" 
                        value={formData.accountId} 
                        onChange={handleChange} 
                        required 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="transaction-category" className="block text-sm font-medium text-slate-700">카테고리</label>
                <select 
                    id="transaction-category" 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange} 
                    required 
                    autocomplete="off" 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                    <option value="">카테고리를 선택하세요</option>
                    {(() => {
                        const filteredCategories = categories.filter(cat => cat.type === formData.type && cat.isActive);
                        
                        return filteredCategories.reduce((acc, cat) => {
                            if (!cat.parentId) {
                                // 대분류 카테고리
                                const subCategories = categories.filter(subCat => subCat.parentId === cat.id && subCat.isActive);
                                
                                acc.push(
                                    <optgroup key={cat.id} label={cat.name}>
                                        {subCategories.map(subCat => (
                                            <option key={subCat.id} value={subCat.name}>
                                                {subCat.name}
                                            </option>
                                        ))}
                                        {/* 대분류 자체도 선택 가능하도록 */}
                                        <option key={`${cat.id}-self`} value={cat.name}>
                                            📁 {cat.name} (전체)
                                        </option>
                                    </optgroup>
                                );
                            }
                            return acc;
                        }, [] as JSX.Element[]);
                    })()}
                    {categories.length === 0 && <option value="" disabled>카테고리 로딩 중...</option>}
                </select>
            </div>
             {formData.type === TransactionType.EXPENSE && (
                <div>
                    <label htmlFor="transaction-installments" className="block text-sm font-medium text-slate-700">할부 개월 (1: 일시불)</label>
                    <input 
                        id="transaction-installments" 
                        type="number" 
                        name="installmentMonths" 
                        min="1" 
                        step="1" 
                        value={formData.installmentMonths} 
                        onChange={handleChange} 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                    />
                </div>
            )}
            <div className="flex justify-end pt-4 space-x-2">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
                >
                    취소
                </button>
                <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                    저장
                </button>
            </div>
        </form>
    );
};
