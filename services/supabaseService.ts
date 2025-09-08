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

  // Update account balance after adding transaction
  await updateAccountBalance(transaction.accountId);

  return mapDbTransaction(data);
};

export const updateTransaction = async (transaction: Transaction): Promise<Transaction> => {
  console.log("Supabase: Updating transaction", transaction);
  
  // Get the old transaction to check if account changed
  const { data: oldTransaction } = await supabase
    .from('transactions')
    .select('account_id')
    .eq('id', transaction.id)
    .single();
  
  const oldAccountId = oldTransaction?.account_id;
  
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

  // Update balance for the new account
  await updateAccountBalance(transaction.accountId);
  
  // If account changed, also update the old account balance
  if (oldAccountId && oldAccountId !== transaction.accountId) {
    await updateAccountBalance(oldAccountId);
  }

  return mapDbTransaction(data);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  console.log("Supabase: Deleting transaction", id);
  
  // Get the transaction to find which account to update
  const { data: transactionToDelete } = await supabase
    .from('transactions')
    .select('account_id')
    .eq('id', id)
    .single();
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }

  // Update account balance after deleting transaction
  if (transactionToDelete?.account_id) {
    await updateAccountBalance(transactionToDelete.account_id);
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

  const newAccount = mapDbAccount(data);
  
  // Store the initial balance for this account
  accountInitialBalances.set(newAccount.id, newAccount.balance);

  return newAccount;
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

// Add a special flag to track if this is initial balance calculation
let accountInitialBalances = new Map<string, number>();

// Utility function to get account's original initial balance
export const getAccountInitialBalance = async (accountId: string): Promise<number> => {
  if (accountInitialBalances.has(accountId)) {
    return accountInitialBalances.get(accountId)!;
  }
  
  // Get the account creation data
  const { data: accountData, error } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (error) {
    console.error('Error getting initial balance:', error);
    return 0;
  }

  const initialBalance = parseFloat(accountData.balance) || 0;
  accountInitialBalances.set(accountId, initialBalance);
  return initialBalance;
};

// Utility function to recalculate account balance from initial + transactions
export const recalculateAccountBalance = async (accountId: string): Promise<number> => {
  // Get the account's initial balance (set when account was created)
  const initialBalance = await getAccountInitialBalance(accountId);
  
  // Get all transactions for this account
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('account_id', accountId);

  if (transactionsError) {
    console.error('Error calculating balance:', transactionsError);
    return initialBalance;
  }

  // Calculate transaction total
  const transactionTotal = transactions.reduce((sum: number, transaction: any) => {
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

  return initialBalance + transactionTotal;
};

// Function to update account balance
export const updateAccountBalance = async (accountId: string): Promise<void> => {
  const balance = await recalculateAccountBalance(accountId);
  
  const { error } = await supabase
    .from('accounts')
    .update({ balance })
    .eq('id', accountId);

  if (error) {
    console.error('Error updating account balance:', error);
    throw new Error(`Failed to update account balance: ${error.message}`);
  }
};