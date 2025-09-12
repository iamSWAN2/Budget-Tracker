import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Account, Category, Transaction, TransactionType } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';
import { formatCurrency } from '../../utils/format';
import { inlineFormStyles } from '../ui/FormStyles';

type Props = {
  accounts: Account[];
  categories: Category[];
  defaultType?: TransactionType;
  onAdd: (tx: Omit<Transaction, 'id'>) => void;
  onClose?: () => void;
};

export const AddTransactionFormInline: React.FC<Props> = ({ accounts, categories, defaultType = TransactionType.EXPENSE, onAdd, onClose }) => {
  const { t } = useI18n();
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultType);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    accountId: accounts[0]?.id || '',
    category: '',
    date: new Date().toISOString().slice(0, 16),
    installmentMonths: 1,
    isInterestFree: false
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.description || !formData.amount || !formData.accountId || !formData.category) return;
    const tx: Omit<Transaction, 'id'> = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: transactionType,
      accountId: formData.accountId,
      category: formData.category,
      date: formData.date,
      installmentMonths: formData.installmentMonths,
      isInterestFree: formData.isInterestFree,
    };
    onAdd(tx);
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className={inlineFormStyles.section}>
      {/* Row 1: Type + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={inlineFormStyles.label}>{t('form.type')}</label>
          <div className="inline-flex rounded-md overflow-hidden border border-slate-400">
            <button type="button" onClick={() => setTransactionType(TransactionType.INCOME)} className={`px-3 py-1.5 text-xs ${transactionType === TransactionType.INCOME ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-400'}`}>{t('form.income')}</button>
            <button type="button" onClick={() => setTransactionType(TransactionType.EXPENSE)} className={`px-3 py-1.5 text-xs border-l ${transactionType === TransactionType.EXPENSE ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-400'}`}>{t('form.expense')}</button>
            <button type="button" onClick={() => setTransactionType(TransactionType.TRANSFER)} className={`px-3 py-1.5 text-xs border-l ${transactionType === TransactionType.TRANSFER ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-400'}`}>기타</button>
          </div>
        </div>
        <div>
          <label className={inlineFormStyles.label}>{t('form.date')}</label>
          <input 
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
            onChange={handleFormChange} 
            className={inlineFormStyles.input} 
            required 
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={inlineFormStyles.label}>{t('form.description')}</label>
        <input type="text" name="description" value={formData.description} onChange={handleFormChange} placeholder={t('form.description')} className={inlineFormStyles.input} required />
      </div>

      {/* Account & Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={inlineFormStyles.label}>{t('form.account')}</label>
          <select name="accountId" value={formData.accountId} onChange={handleFormChange} className={inlineFormStyles.select} required>
            <option value="" disabled>계좌를 선택하세요</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name} ({account.propensity})</option>
            ))}
          </select>
        </div>
        <div>
          <label className={inlineFormStyles.label}>{t('form.category')}</label>
          <select name="category" value={formData.category} onChange={handleFormChange} className={inlineFormStyles.select} required>
            <option value="" disabled>카테고리 선택</option>
            {(() => {
              const typeFiltered = categories.filter(c => c.type === transactionType && c.isActive);
              const parents = typeFiltered.filter(c => !c.parentId);
              if (parents.length === 0) return [<option key="no-categories" value="" disabled>해당 유형의 카테고리가 없습니다</option>];
              const byParent = parents.reduce((acc: React.ReactElement[], parent) => {
                const children = typeFiltered.filter(sc => sc.parentId === parent.id);
                acc.push(
                  <optgroup key={parent.id} label={parent.name}>
                    {children.map(sc => (
                      <option key={sc.id} value={sc.name}>{sc.name}</option>
                    ))}
                    <option key={`${parent.id}-self`} value={parent.name}>📁 {parent.name} (전체)</option>
                  </optgroup>
                );
                return acc;
              }, []);
              return byParent;
            })()}
          </select>
        </div>
      </div>

      {/* Row 3: Amount + Installment controls (only when EXPENSE and credit card) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={inlineFormStyles.label}>{t('form.amount')}</label>
          <input type="number" name="amount" value={formData.amount} onChange={handleFormChange} placeholder="0" step="1" className={inlineFormStyles.input} required />
        </div>
        {transactionType === TransactionType.EXPENSE && (() => {
          const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
          const isCreditCard = selectedAccount?.propensity === 'Credit Card';
          const isInstallmentAvailable = isCreditCard;
          return (
            <div className="flex items-end gap-3">
              <div className={formData.installmentMonths > 1 && isInstallmentAvailable ? 'flex-shrink-0 w-20' : 'flex-1'}>
                <label className={inlineFormStyles.label}>
                  할부 개월
                  {!isInstallmentAvailable && formData.accountId && (
                    <span className="text-xs text-slate-400 ml-1">(신용카드만)</span>
                  )}
                </label>
                <input type="number" name="installmentMonths" min={1} step={1} value={isInstallmentAvailable ? formData.installmentMonths : 1} onChange={handleFormChange} disabled={!isInstallmentAvailable} className={`${inlineFormStyles.input} ${!isInstallmentAvailable ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`} />
              </div>
              {isInstallmentAvailable && formData.installmentMonths > 1 && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isInterestFree" name="isInterestFree" checked={formData.isInterestFree} onChange={handleFormChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded" />
                  <label htmlFor="isInterestFree" className="text-xs text-slate-700">무이자</label>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Installment summary */}
      {transactionType === TransactionType.EXPENSE && formData.installmentMonths > 1 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 rounded-md space-y-2">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">할부 정보</h4>
          {(() => {
            const amountValue = parseFloat(formData.amount) || 0;
            const feeRate = formData.installmentMonths <= 5 ? 0.025 : 0.035;
            const feeAmount = formData.isInterestFree ? 0 : amountValue * feeRate;
            const totalWithFee = amountValue + feeAmount;
            const monthlyPayment = totalWithFee / formData.installmentMonths;
            return (
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span className="text-slate-600">원금:</span><span className="font-medium">{formatCurrency(amountValue)}</span></div>
                {!formData.isInterestFree && (<div className="flex justify-between"><span className="text-slate-600">수수료 ({formData.installmentMonths <= 5 ? '2.5' : '3.5'}%):</span><span className="font-medium text-red-600">{formatCurrency(feeAmount)}</span></div>)}
                <div className="flex justify-between border-t pt-1"><span className="text-slate-600">총 금액:</span><span className="font-semibold">{formatCurrency(totalWithFee)}</span></div>
                <div className="flex justify-between border-t pt-1"><span className="text-slate-700 font-medium">월 납부금:</span><span className="font-bold text-indigo-600">{formatCurrency(monthlyPayment)}</span></div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Submit */}
      <div className="pt-2 flex justify-end">
        <Button type="submit" variant="primary" size="sm">
          {t('form.addTransaction')}
        </Button>
      </div>
    </form>
  );
};

export default AddTransactionFormInline;
