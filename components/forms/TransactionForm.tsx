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
        amount: transaction?.amount ? transaction.amount.toString() : '',
        type: transaction?.type || TransactionType.EXPENSE,
        category: transaction?.category || '',
        accountId: transaction?.accountId || (accounts[0]?.id || ''),
        installmentMonths: transaction?.installmentMonths || 1,
        isInterestFree: transaction?.isInterestFree || false,
    });

    // 할부 수수료 계산 함수 (실제 할부 수수료 방식으로 수정)
    const calculateInstallmentInterest = (amount: number, months: number, isInterestFree: boolean) => {
        if (isInterestFree || months === 1) return 0;
        
        // 실제 할부 수수료는 원금에 대한 일정 비율
        const feeRate = months <= 5 ? 0.025 : 0.035; // 2-5개월: 2.5%, 6개월 이상: 3.5%
        const totalFee = amount * feeRate;
        return totalFee;
    };

    const amountValue = parseFloat(formData.amount) || 0;
    const interestAmount = calculateInstallmentInterest(amountValue, formData.installmentMonths, formData.isInterestFree);
    const totalWithInterest = amountValue + interestAmount;
    const monthlyPayment = formData.installmentMonths > 1 ? totalWithInterest / formData.installmentMonths : amountValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            amount: parseFloat(formData.amount) || 0
        };
        
        if (transaction && 'id' in transaction) {
            onSave({ ...submitData, id: transaction.id });
        } else {
            onSave(submitData);
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
                <div className="space-y-4">
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
                    
                    {formData.installmentMonths > 1 && (
                        <>
                            <div className="flex items-center">
                                <input 
                                    id="transaction-interest-free"
                                    type="checkbox" 
                                    name="isInterestFree" 
                                    checked={formData.isInterestFree}
                                    onChange={handleChange} 
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                                />
                                <label htmlFor="transaction-interest-free" className="ml-2 block text-sm text-slate-700">
                                    무이자 할부
                                </label>
                            </div>
                            
                            {/* 할부 정보 표시 */}
                            <div className="bg-slate-50 p-4 rounded-md space-y-2">
                                <h4 className="font-medium text-slate-700">할부 정보</h4>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">원금:</span>
                                        <span className="font-medium">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amountValue)}</span>
                                    </div>
                                    {!formData.isInterestFree && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">수수료 ({formData.installmentMonths <= 5 ? '2.5' : '3.5'}%):</span>
                                                <span className="font-medium text-red-600">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(interestAmount)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1">
                                                <span className="text-slate-600">총 금액:</span>
                                                <span className="font-semibold">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(totalWithInterest)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between border-t pt-1">
                                        <span className="text-slate-700 font-medium">월 납부금:</span>
                                        <span className="font-bold text-lg text-indigo-600">{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(monthlyPayment)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
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
