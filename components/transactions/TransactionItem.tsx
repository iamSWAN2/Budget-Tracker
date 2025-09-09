import React from 'react';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDateDisplay } from '../../utils/format';
import { DropdownMenu, MenuIcons } from '../ui/DropdownMenu';
import { IncomeSketch, ExpenseSketch, TransferSketch } from '../icons/Icons';

interface TransactionItemProps {
  transaction: Transaction;
  accountName: string;
  categoryLabel: string;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
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

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, accountName, categoryLabel, onEdit, onDelete }) => {
  const isInstallment = !!transaction.installmentMonths && transaction.installmentMonths > 1;
  const isIncome = transaction.type === TransactionType.INCOME;

  return (
    <div className="group relative bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors">
      <div className="flex items-start gap-4">
        {/* Far Left: Type Symbol */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 ring-1 ring-slate-200`}>
          {transaction.type === TransactionType.INCOME ? (
            <IncomeSketch />
          ) : transaction.type === TransactionType.EXPENSE ? (
            <ExpenseSketch />
          ) : (
            <TransferSketch />
          )}
        </div>

        {/* Middle: Title and Meta */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-base truncate mb-1">{transaction.description}</h4>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">📅 {formatDateDisplay(transaction.date)}</span>
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">🏷️ {categoryLabel}</span>
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">🏦 {accountName}</span>
          </div>
        </div>

        {/* Right: Amount with installment info integrated */}
        <div className="text-right min-w-[9rem]">
          {isInstallment ? (
            <div className="space-y-1">
              <p className={`font-extrabold text-xl leading-none ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(transaction.amount / (transaction.installmentMonths || 1))}
                <span className="text-sm text-slate-500 font-medium ml-1">/월</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">
                총액 {formatCurrency(transaction.amount)} · {transaction.installmentMonths}개월{transaction.isInterestFree ? ' · 무이자' : ''}
              </p>
            </div>
          ) : (
            <p className={`font-extrabold text-xl ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(transaction.amount)}</p>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          items={[
            { label: '수정', icon: MenuIcons.Edit, onClick: () => onEdit(transaction) },
            { label: '삭제', icon: MenuIcons.Delete, onClick: () => onDelete(transaction.id), variant: 'danger' }
          ]}
        />
      </div>
    </div>
  );
};

export default TransactionItem;
