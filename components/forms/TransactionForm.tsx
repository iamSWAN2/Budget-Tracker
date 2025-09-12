import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Transaction, TransactionType, Account, Category } from '../../types';
import { modalFormStyles } from '../ui/FormStyles';

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
        date: (() => {
            if (transaction?.date) {
                try {
                    const date = new Date(transaction.date);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().slice(0, 16);
                    }
                } catch {}
                if (transaction.date.length === 10) {
                    return `${transaction.date}T12:00`;
                }
                return transaction.date.slice(0, 16);
            }
            return new Date().toISOString().slice(0, 16);
        })(),
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
        } else if (name === 'date' && type === 'datetime-local') {
            // datetime-local 값을 ISO datetime으로 변환
            const isoDateTime = value ? `${value}:00.000Z` : '';
            setFormData(prev => ({ ...prev, [name]: isoDateTime }));
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
        <form onSubmit={handleSubmit} className={modalFormStyles.section}>
            <div>
                <label htmlFor="transaction-description" className={modalFormStyles.label}>설명</label>
                <input 
                    id="transaction-description" 
                    type="text" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    autoComplete="off" 
                    className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900" 
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="transaction-amount" className={modalFormStyles.label}>금액</label>
                    <input 
                        id="transaction-amount" 
                        type="number" 
                        name="amount" 
                        value={formData.amount} 
                        onChange={handleChange} 
                        required 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900" 
                    />
                </div>
                <div>
                    <label htmlFor="transaction-date" className={modalFormStyles.label}>날짜와 시간</label>
                    <input 
                        id="transaction-date" 
                        type="datetime-local" 
                        name="date" 
                        value={(() => {
                            try {
                                const date = new Date(formData.date);
                                if (!isNaN(date.getTime())) {
                                    return date.toISOString().slice(0, 16);
                                }
                            } catch {}
                            if (formData.date.length === 10) {
                                return `${formData.date}T12:00`;
                            }
                            return formData.date.slice(0, 16);
                        })()} 
                        onChange={handleChange} 
                        required 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900" 
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="transaction-type" className={modalFormStyles.label}>타입</label>
                    <select 
                        id="transaction-type" 
                        name="type" 
                        value={formData.type} 
                        onChange={handleChange} 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900"
                    >
                        {Object.values(TransactionType).map(type => (
                            <option key={type} value={type}>
                                {type === 'INCOME' ? '수입' : type === 'EXPENSE' ? '지출' : '기타'}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="transaction-account" className={modalFormStyles.label}>계좌</label>
                    <select 
                        id="transaction-account" 
                        name="accountId" 
                        value={formData.accountId} 
                        onChange={handleChange} 
                        required 
                        autoComplete="off" 
                        className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900"
                    >
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="transaction-category" className={modalFormStyles.label}>카테고리</label>
                <select 
                    id="transaction-category" 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange} 
                    required 
                    autoComplete="off" 
                    className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900"
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
                        }, [] as React.ReactElement[]);
                    })()}
                    {categories.length === 0 && <option value="" disabled>카테고리 로딩 중...</option>}
                </select>
            </div>
             {formData.type === TransactionType.EXPENSE && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="transaction-installments" className={modalFormStyles.label}>할부 개월 (1: 일시불)</label>
                        <input 
                            id="transaction-installments" 
                            type="number" 
                            name="installmentMonths" 
                            min="1" 
                            step="1" 
                            value={formData.installmentMonths} 
                            onChange={handleChange} 
                            autoComplete="off" 
                            className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900" 
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
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
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
            <div className={modalFormStyles.actions}>
                <Button type="button" onClick={onClose} variant="secondary" size="sm">취소</Button>
                <Button type="submit" variant="primary" size="sm">저장</Button>
            </div>
        </form>
    );
};
