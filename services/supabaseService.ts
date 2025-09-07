import { supabase } from './supabase';
import { Account, Transaction, TransactionType, AccountPropensity } from '../types';

// Convert database row to Account type
const mapDbAccount = (row: any): Account => ({
  id: row.id,
  name: row.name,
  balance: parseFloat(row.balance),
  propensity: row.propensity as AccountPropensity
});

// Convert database row to Transaction type
const mapDbTransaction = (row: any): Transaction => ({
  id: row.id,
  date: row.date,
  description: row.description,
  amount: parseFloat(row.amount),
  type: row.type as TransactionType,
  category: row.category,
  accountId: row.account_id,
  installmentMonths: row.installment_months
});

export const getAccounts = async (): Promise<Account[]> => {
  console.log("Supabase: Fetching accounts");
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching accounts:', error);
    throw new Error(`Failed to fetch accounts: ${error.message}`);
  }

  return data?.map(mapDbAccount) || [];
};

export const getTransactions = async (): Promise<Transaction[]> => {
  console.log("Supabase: Fetching transactions");
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data?.map(mapDbTransaction) || [];
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  console.log("Supabase: Adding transaction", transaction);
  
  const dbTransaction = {
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    account_id: transaction.accountId,
    installment_months: transaction.installmentMonths || null
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([dbTransaction])
    .select()
    .single();

  if (error) {
    console.error('Error adding transaction:', error);
    throw new Error(`Failed to add transaction: ${error.message}`);
  }

  return mapDbTransaction(data);
};

export const updateTransaction = async (transaction: Transaction): Promise<Transaction> => {
  console.log("Supabase: Updating transaction", transaction);
  
  const dbTransaction = {
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    account_id: transaction.accountId,
    installment_months: transaction.installmentMonths || null
  };

  const { data, error } = await supabase
    .from('transactions')
    .update(dbTransaction)
    .eq('id', transaction.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return mapDbTransaction(data);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  console.log("Supabase: Deleting transaction", id);
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
};

export const addAccount = async (account: Omit<Account, 'id'>): Promise<Account> => {
  console.log("Supabase: Adding account", account);
  
  const dbAccount = {
    name: account.name,
    balance: account.balance,
    propensity: account.propensity
  };

  const { data, error } = await supabase
    .from('accounts')
    .insert([dbAccount])
    .select()
    .single();

  if (error) {
    console.error('Error adding account:', error);
    throw new Error(`Failed to add account: ${error.message}`);
  }

  return mapDbAccount(data);
};

export const updateAccount = async (account: Account): Promise<Account> => {
  console.log("Supabase: Updating account", account);
  
  const dbAccount = {
    name: account.name,
    balance: account.balance,
    propensity: account.propensity
  };

  const { data, error } = await supabase
    .from('accounts')
    .update(dbAccount)
    .eq('id', account.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating account:', error);
    throw new Error(`Failed to update account: ${error.message}`);
  }

  return mapDbAccount(data);
};

export const deleteAccount = async (id: string): Promise<void> => {
  console.log("Supabase: Deleting account", id);
  
  // First check if there are transactions associated with this account
  const { data: transactions, error: transactionError } = await supabase
    .from('transactions')
    .select('id')
    .eq('account_id', id)
    .limit(1);

  if (transactionError) {
    console.error('Error checking transactions:', transactionError);
    throw new Error(`Failed to check account transactions: ${transactionError.message}`);
  }

  if (transactions && transactions.length > 0) {
    throw new Error('Cannot delete account with existing transactions');
  }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting account:', error);
    throw new Error(`Failed to delete account: ${error.message}`);
  }
};

// Utility function to calculate account balance based on transactions
export const calculateAccountBalance = async (accountId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('account_id', accountId);

  if (error) {
    console.error('Error calculating balance:', error);
    return 0;
  }

  const balance = data.reduce((sum: number, transaction: any) => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return sum + parseFloat(transaction.amount);
      case TransactionType.EXPENSE:
        return sum - parseFloat(transaction.amount);
      case TransactionType.TRANSFER:
        // For transfers, this would need more complex logic
        // For now, treating as expense
        return sum - parseFloat(transaction.amount);
      default:
        return sum;
    }
  }, 0);

  return balance;
};

// Function to update account balance
export const updateAccountBalance = async (accountId: string): Promise<void> => {
  const balance = await calculateAccountBalance(accountId);
  
  const { error } = await supabase
    .from('accounts')
    .update({ balance })
    .eq('id', accountId);

  if (error) {
    console.error('Error updating account balance:', error);
    throw new Error(`Failed to update account balance: ${error.message}`);
  }
};