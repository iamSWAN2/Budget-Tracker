import React from 'react';
import { Account, Category, Transaction, getCategoryPath } from '../../types';
import { TransactionItem } from './TransactionItem';

type Props = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onUpdate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteDirect: (id: string) => void;
  className?: string;
};

export const TransactionsList: React.FC<Props> = ({
  transactions,
  accounts,
  categories,
  onUpdate,
  onDelete,
  onDeleteDirect,
  className = 'space-y-2'
}) => {
  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';

  return (
    <div className={className}>
      {transactions.map((transaction, index) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          accountName={getAccountName(transaction.accountId)}
          categoryLabel={getCategoryPath(transaction.category, categories)}
          onDelete={onDelete}
          onDeleteDirect={onDeleteDirect}
          onUpdate={onUpdate}
          accounts={accounts}
          categories={categories}
          index={index}
        />
      ))}
    </div>
  );
};

export default TransactionsList;

