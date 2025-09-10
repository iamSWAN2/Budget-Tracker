import React, { useMemo } from 'react';
import { Account, AccountPropensity, Transaction, TransactionType } from '../../types';
import { formatCurrency } from '../../utils/format';

type Props = {
  transactions: Transaction[];
  accounts: Account[];
  currentMonth: number;
  currentYear: number;
};

export const CreditCardBillWidget: React.FC<Props> = ({ transactions, accounts, currentMonth, currentYear }) => {
  const { total, byAccount } = useMemo(() => {
    const cardAccounts = accounts.filter(a => a.propensity === AccountPropensity.CREDIT_CARD);
    const cardIds = new Set(cardAccounts.map(a => a.id));
    const monthTx = transactions.filter(t =>
      t.type === TransactionType.EXPENSE &&
      cardIds.has(t.accountId) &&
      new Date(t.date).getMonth() === currentMonth &&
      new Date(t.date).getFullYear() === currentYear
    );

    const totalAmt = monthTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const byAcc = monthTx.reduce((acc, t) => {
      acc[t.accountId] = (acc[t.accountId] || 0) + (t.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return { total: totalAmt, byAccount: byAcc };
  }, [transactions, accounts, currentMonth, currentYear]);

  const entries = Object.entries(byAccount)
    .map(([accountId, amount]) => ({
      accountName: accounts.find(a => a.id === accountId)?.name || accountId,
      amount
    }))
    .sort((a, b) => (b.amount - a.amount));

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      <h3 className="text-sm md:text-xs font-medium text-slate-600 mb-2 md:mb-1">이번 달 카드 결제 예상</h3>
      <p className="text-base md:text-lg font-bold truncate" style={{ color: '#FF5733' }}>
        {formatCurrency(total)}
      </p>
      {entries.length > 0 && (
        <div className="mt-2 space-y-1">
          {entries.slice(0, 4).map((e, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs md:text-xs text-slate-600">
              <span className="truncate pr-2">{e.accountName}</span>
              <span className="font-medium text-slate-800">{formatCurrency(e.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreditCardBillWidget;

