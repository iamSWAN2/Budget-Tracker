import React from 'react';
import { Account, Category, Transaction } from '../../types';
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
  const getCategoryPath = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName);
    if (!cat) return categoryName;
    const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  };

  return (
    <div className={className}>
      {transactions.map((transaction, index) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          accountName={getAccountName(transaction.accountId)}
          categoryLabel={getCategoryPath(transaction.category)}
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

