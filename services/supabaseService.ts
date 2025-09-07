
import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS } from '../constants';
import { Account, Transaction, TransactionType } from '../types';

// This is a mock database. In a real application, you would use the Supabase client.
let accounts: Account[] = JSON.parse(JSON.stringify(MOCK_ACCOUNTS));
let transactions: Transaction[] = JSON.parse(JSON.stringify(MOCK_TRANSACTIONS));

// Reset function to restore initial data
export const resetData = (): void => {
  accounts = JSON.parse(JSON.stringify(MOCK_ACCOUNTS));
  transactions = JSON.parse(JSON.stringify(MOCK_TRANSACTIONS));
  recalculateAllBalances();
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const recalculateAccountBalance = (accountId: string): void => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const newBalance = transactions.reduce((balance, t) => {
        if (t.accountId !== accountId) return balance;
        if (t.type === TransactionType.INCOME) return balance + t.amount;
        if (t.type === TransactionType.EXPENSE) return balance - t.amount;
        // Assuming transfer out for simplicity
        if (t.type === TransactionType.TRANSFER) return balance - t.amount;
        return balance;
    }, 0); // Start from 0 and rebuild; adjust if initial balance is a separate concept.

    // This mock assumes balance is fully derived. A real system might have an initial balance.
    // For now, let's find an initial state and adjust from there.
    const originalAccount = MOCK_ACCOUNTS.find(a => a.id === accountId);
    let startingBalance = originalAccount ? originalAccount.balance : 0;

    const originalTransactions = MOCK_TRANSACTIONS.filter(t => t.accountId === accountId);
    
    originalTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME) startingBalance -= t.amount;
      if (t.type === TransactionType.EXPENSE) startingBalance += t.amount;
      if (t.type === TransactionType.TRANSFER) startingBalance += t.amount;
    });

    const finalBalance = transactions
      .filter(t => t.accountId === accountId)
      .reduce((bal, t) => {
          if (t.type === TransactionType.INCOME) return bal + t.amount;
          if (t.type === TransactionType.EXPENSE) return bal - t.amount;
          if (t.type === TransactionType.TRANSFER) return bal - t.amount; // Simplified
          return bal;
      }, startingBalance);


    account.balance = finalBalance;
};

const recalculateAllBalances = () => {
    accounts.forEach(acc => recalculateAccountBalance(acc.id));
}

// Initialize balances on load
recalculateAllBalances();


export const getAccounts = async (): Promise<Account[]> => {
  await delay(500);
  console.log("Supabase Mock: Fetching accounts");
  return JSON.parse(JSON.stringify(accounts));
};

export const getTransactions = async (): Promise<Transaction[]> => {
  await delay(500);
  console.log("Supabase Mock: Fetching transactions");
  return JSON.parse(JSON.stringify(transactions)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  await delay(300);
  console.log("Supabase Mock: Adding transaction", transaction);
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn${Date.now()}`,
  };
  transactions.push(newTransaction);
  recalculateAccountBalance(transaction.accountId);
  return JSON.parse(JSON.stringify(newTransaction));
};

export const updateTransaction = async (transaction: Transaction): Promise<Transaction> => {
    await delay(300);
    console.log("Supabase Mock: Updating transaction", transaction);
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index === -1) throw new Error("Transaction not found");
    const oldTransaction = transactions[index];
    transactions[index] = transaction;
    recalculateAccountBalance(oldTransaction.accountId);
    if (oldTransaction.accountId !== transaction.accountId) {
        recalculateAccountBalance(transaction.accountId);
    }
    return JSON.parse(JSON.stringify(transaction));
};

export const deleteTransaction = async (id: string): Promise<void> => {
    await delay(300);
    console.log("Supabase Mock: Deleting transaction", id);
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Transaction not found");
    const deletedTransaction = transactions[index];
    transactions.splice(index, 1);
    recalculateAccountBalance(deletedTransaction.accountId);
};

export const addAccount = async (account: Omit<Account, 'id'>): Promise<Account> => {
    await delay(300);
    console.log("Supabase Mock: Adding account", account);
    const newAccount: Account = {
        ...account,
        id: `acc${Date.now()}`,
    };
    accounts.push(newAccount);
    return JSON.parse(JSON.stringify(newAccount));
};

export const updateAccount = async (account: Account): Promise<Account> => {
    await delay(300);
    console.log("Supabase Mock: Updating account", account);
    const index = accounts.findIndex(a => a.id === account.id);
    if (index === -1) throw new Error("Account not found");
    accounts[index] = account;
    return JSON.parse(JSON.stringify(account));
};

export const deleteAccount = async (id: string): Promise<void> => {
    await delay(300);
    console.log("Supabase Mock: Deleting account", id);
    // You might want to check if there are transactions associated with this account first.
    // For this mock, we'll just delete it.
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
        accounts.splice(index, 1);
        transactions = transactions.filter(t => t.accountId !== id);
    } else {
        throw new Error("Account not found");
    }
};
