import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Account, Category, Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDateDisplay } from '../../utils/format';
import { IncomeSketch, ExpenseSketch, TransferSketch, DeleteIcon } from '../icons/Icons';

interface TransactionItemProps {
  transaction: Transaction;
  accountName: string;
  categoryLabel: string;
  onDelete: (id: string) => void;
  onDeleteDirect?: (id: string) => void; // 확인 없이 즉시 삭제용(모바일 롱프레스)
  onUpdate: (t: Transaction) => void;
  accounts: Account[];
  categories: Category[];
}

// Use directional symbols to represent type explicitly
// INCOME: ↑, EXPENSE: ↓, TRANSFER: ⇄
const typeSymbol = (type: TransactionType) =>
  type === TransactionType.INCOME ? '↑' : type === TransactionType.EXPENSE ? '↓' : '⇄';

const typeCircleClasses = (type: TransactionType) =>
  type === TransactionType.INCOME
    ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
    : type === TransactionType.EXPENSE
    ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
    : 'bg-slate-200 text-slate-700 ring-2 ring-slate-300';

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, accountName, categoryLabel, onDelete, onDeleteDirect, onUpdate, accounts, categories }) => {
  const isInstallment = !!transaction.installmentMonths && transaction.installmentMonths > 1;
  const isIncome = transaction.type === TransactionType.INCOME;
  const [editing, setEditing] = useState<null |
    'description' | 'amount' | 'date' | 'account' | 'category' | 'type' | 'installment'>(null);
  const [draft, setDraft] = useState<Transaction>(transaction);
  const [monthsEditing, setMonthsEditing] = useState(false);

  useEffect(() => {
    setDraft(transaction);
  }, [transaction]);

  useEffect(() => {
    // 편집 모드 전환 시 개월 입력 편집 상태 초기화
    if (editing !== 'installment') setMonthsEditing(false);
  }, [editing]);

  const handleCommit = (partial: Partial<Transaction>) => {
    const updated: Transaction = { ...draft, ...partial } as Transaction;
    setDraft(updated);
    onUpdate(updated);
    setEditing(null);
  };

  const handleCancel = () => {
    setDraft(transaction);
    setEditing(null);
  };

  // 모바일 롱프레스 삭제
  const pressTimer = useRef<number | null>(null);
  const startPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      // 모바일: 이 컴포넌트 내부에서 1회만 확인 후 즉시 삭제 (부모 확인 중복 방지)
      if (window.confirm('이 거래를 삭제하시겠습니까?')) {
        if (onDeleteDirect) onDeleteDirect(transaction.id);
        else onDelete(transaction.id);
      }
      pressTimer.current = null;
    }, 600);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // 카테고리 옵션: 타입과 일치하는 것만
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === draft.type);
  }, [categories, draft.type]);

  return (
    <div
      className="group relative bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors"
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      <div className="flex items-start gap-4">
        {/* Far Left: Type Symbol */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 ring-1 ring-slate-200`}>
          {editing === 'type' ? (
            <select
              autoFocus
              value={draft.type}
              onBlur={() => setEditing(null)}
              onChange={(e) => handleCommit({ type: e.target.value as TransactionType })}
              className="text-xs border border-slate-300 rounded-md px-1 py-0.5 bg-white"
            >
              <option value={TransactionType.INCOME}>수입</option>
              <option value={TransactionType.EXPENSE}>지출</option>
              <option value={TransactionType.TRANSFER}>이체</option>
            </select>
          ) : (
            <button className="w-full h-full flex items-center justify-center" onClick={() => setEditing('type')}>
              {transaction.type === TransactionType.INCOME ? (
                <IncomeSketch />
              ) : transaction.type === TransactionType.EXPENSE ? (
                <ExpenseSketch />
              ) : (
                <TransferSketch />
              )}
            </button>
          )}
        </div>

        {/* Middle: Title and Meta */}
        <div className="flex-1 min-w-0">
          {/* Description inline edit */}
          {editing === 'description' ? (
            <input
              autoFocus
              type="text"
              value={draft.description}
              onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
              onBlur={() => handleCommit({ description: draft.description })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommit({ description: draft.description });
                if (e.key === 'Escape') handleCancel();
              }}
              className="font-semibold text-slate-900 text-base truncate mb-1 bg-white border border-slate-300 rounded px-2 py-1 w-full"
            />
          ) : (
            <h4
              className="font-semibold text-slate-900 text-base truncate mb-1 cursor-text"
              onClick={() => setEditing('description')}
              title="클릭하여 설명 수정"
            >
              {draft.description}
            </h4>
          )}

          <div className="flex items-center gap-2 text-[12px] text-slate-600 flex-wrap">
            {/* Date */}
            {editing === 'date' ? (
              <input
                autoFocus
                type="date"
                value={draft.date}
                onChange={(e) => setDraft(prev => ({ ...prev, date: e.target.value }))}
                onBlur={() => handleCommit({ date: draft.date })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommit({ date: draft.date });
                  if (e.key === 'Escape') handleCancel();
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded"
              />
            ) : (
              <button className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md" onClick={() => setEditing('date')}>📅 {formatDateDisplay(draft.date)}</button>
            )}

            {/* Category */}
            {editing === 'category' ? (
              <select
                autoFocus
                value={draft.category}
                onBlur={() => setEditing(null)}
                onChange={(e) => handleCommit({ category: e.target.value })}
                className="px-2 py-1 bg-white border border-slate-300 rounded"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            ) : (
              <button className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md" onClick={() => setEditing('category')}>🏷️ {draft.category}</button>
            )}

            {/* Account */}
            {editing === 'account' ? (
              <select
                autoFocus
                value={draft.accountId}
                onBlur={() => setEditing(null)}
                onChange={(e) => handleCommit({ accountId: e.target.value })}
                className="px-2 py-1 bg-white border border-slate-300 rounded"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            ) : (
              <button className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md" onClick={() => setEditing('account')}>🏦 {accountName}</button>
            )}
          </div>
        </div>

        {/* Right: Amount with installment info integrated */}
        <div className="text-right min-w-[10rem]">
          {isInstallment || editing === 'installment' ? (
            <div className="space-y-1">
              {editing === 'amount' ? (
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) => setDraft(prev => ({ ...prev, amount: parseFloat(e.target.value || '0') }))}
                  onBlur={() => handleCommit({ amount: draft.amount })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommit({ amount: draft.amount });
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="w-28 text-right font-extrabold text-xl border border-slate-300 rounded px-2 py-1"
                />
              ) : (
                <button className={`font-extrabold text-xl leading-none ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`} onClick={() => setEditing('amount')}>
                  {formatCurrency(draft.amount / (draft.installmentMonths || 1))}
                  <span className="text-sm text-slate-500 font-medium ml-1">{(draft.installmentMonths || 1) > 1 ? '/월' : ''}</span>
                </button>
              )}
              {/* installment editor */}
              {editing === 'installment' || (draft.installmentMonths && draft.installmentMonths > 1) ? (
                <div className="text-xs text-slate-600 flex items-center justify-end gap-2">
                  <span className="whitespace-nowrap">총액</span>
                  <span className="font-medium">{formatCurrency(draft.amount)}</span>
                  <span className="text-slate-400">·</span>
                  {monthsEditing ? (
                    <div className="relative inline-block">
                      <input
                        autoFocus
                        type="number"
                        min={1}
                        max={36}
                        step={1}
                        value={draft.installmentMonths || 1}
                        onChange={(e) => setDraft(prev => ({ ...prev, installmentMonths: Math.max(1, Math.min(36, parseInt(e.target.value || '1', 10))) }))}
                        onBlur={() => handleCommit({ installmentMonths: draft.installmentMonths || 1 })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommit({ installmentMonths: draft.installmentMonths || 1 });
                          if (e.key === 'Escape') handleCancel();
                        }}
                        className="w-20 text-right border border-slate-300 rounded px-2 py-0.5 pr-8 bg-white"
                        title="할부 개월"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">개월</span>
                    </div>
                  ) : (
                    <button
                      className="font-medium text-slate-800 hover:underline"
                      title="할부 개월 수정"
                      onClick={() => setMonthsEditing(true)}
                    >
                      {(draft.installmentMonths || 1)}개월
                    </button>
                  )}
                  {(draft.installmentMonths || 1) > 1 && (
                    <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!draft.isInterestFree}
                        onChange={(e) => handleCommit({ isInterestFree: e.target.checked })}
                      />
                      무이자
                    </label>
                  )}
                </div>
              ) : (
                <button className="text-xs text-slate-500 font-medium" onClick={() => setEditing('installment')}>
                  총액 {formatCurrency(draft.amount)} · {(draft.installmentMonths || 1)}개월{draft.isInterestFree ? ' · 무이자' : ''}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {editing === 'amount' ? (
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) => setDraft(prev => ({ ...prev, amount: parseFloat(e.target.value || '0') }))}
                  onBlur={() => handleCommit({ amount: draft.amount })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommit({ amount: draft.amount });
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="w-28 text-right font-extrabold text-xl border border-slate-300 rounded px-2 py-1"
                />
              ) : (
                <button className={`font-extrabold text-xl ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`} onClick={() => setEditing('amount')}>
                  {formatCurrency(draft.amount)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions: 데스크톱에서만 삭제 버튼 상시 노출 */}
        <div className="hidden lg:flex items-center justify-center self-center">
          <button
            className="group ml-2 p-1.5 rounded-md bg-slate-100 text-slate-600 hover:text-slate-800 hover:font-bold transition-colors"
            onClick={() => onDelete(transaction.id)}
            aria-label="삭제"
            title="삭제"
          >
            <DeleteIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
