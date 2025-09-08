import { supabase } from './supabase';
import { Account, Transaction, Category, TransactionType, AccountPropensity } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

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

// Convert database row to Category type
const mapDbCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  type: row.type as TransactionType,
  icon: row.icon,
  color: row.color,
  parentId: row.parent_id,
  isDefault: row.is_default,
  isActive: row.is_active
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

// Category management functions
export const getCategories = async (): Promise<Category[]> => {
  console.log("Supabase: Fetching categories");
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    // Return default categories if DB query fails
    return DEFAULT_CATEGORIES;
  }

  const categories = data?.map(mapDbCategory) || [];
  
  // If no categories exist, initialize with defaults
  if (categories.length === 0) {
    await initializeDefaultCategories();
    return DEFAULT_CATEGORIES;
  }
  
  return categories;
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  console.log("Supabase: Adding category", category);
  
  const dbCategory = {
    name: category.name,
    type: category.type,
    icon: category.icon || null,
    color: category.color || null,
    parent_id: category.parentId || null,
    is_default: category.isDefault,
    is_active: category.isActive
  };

  const { data, error } = await supabase
    .from('categories')
    .insert([dbCategory])
    .select()
    .single();

  if (error) {
    console.error('Error adding category:', error);
    throw new Error(`Failed to add category: ${error.message}`);
  }

  return mapDbCategory(data);
};

export const updateCategory = async (category: Category): Promise<Category> => {
  console.log("Supabase: Updating category", category);
  
  const dbCategory = {
    name: category.name,
    type: category.type,
    icon: category.icon || null,
    color: category.color || null,
    parent_id: category.parentId || null,
    is_default: category.isDefault,
    is_active: category.isActive
  };

  const { data, error } = await supabase
    .from('categories')
    .update(dbCategory)
    .eq('id', category.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw new Error(`Failed to update category: ${error.message}`);
  }

  return mapDbCategory(data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  console.log("Supabase: Deleting category", id);
  
  // First check if there are transactions using this category
  const { data: transactions, error: transactionError } = await supabase
    .from('transactions')
    .select('id')
    .eq('category', id)
    .limit(1);

  if (transactionError) {
    console.error('Error checking transactions:', transactionError);
    throw new Error(`Failed to check category transactions: ${transactionError.message}`);
  }

  if (transactions && transactions.length > 0) {
    throw new Error('Cannot delete category with existing transactions');
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw new Error(`Failed to delete category: ${error.message}`);
  }
};

export const initializeDefaultCategories = async (): Promise<void> => {
  console.log("Supabase: Initializing default categories");
  
  const dbCategories = DEFAULT_CATEGORIES.map(category => ({
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon || null,
    color: category.color || null,
    parent_id: category.parentId || null,
    is_default: category.isDefault,
    is_active: category.isActive
  }));

  const { error } = await supabase
    .from('categories')
    .insert(dbCategories);

  if (error) {
    console.error('Error initializing categories:', error);
    // Don't throw here as we can fall back to in-memory defaults
  }
};

// Data management functions
export const clearAllData = async (): Promise<void> => {
  console.log("Supabase: Clearing all data");
  
  // Delete transactions first (due to foreign key constraints)
  const { error: transactionError } = await supabase
    .from('transactions')
    .delete()
    .gt('created_at', '1970-01-01'); // 모든 데이터 삭제 (1970년 이후 모든 데이터)

  if (transactionError) {
    console.error('Error clearing transactions:', transactionError);
    throw new Error(`Failed to clear transactions: ${transactionError.message}`);
  }
  
  // Delete accounts
  const { error: accountError } = await supabase
    .from('accounts')
    .delete()
    .gt('created_at', '1970-01-01'); // 모든 데이터 삭제

  if (accountError) {
    console.error('Error clearing accounts:', accountError);
    throw new Error(`Failed to clear accounts: ${accountError.message}`);
  }
  
  // Delete non-default categories only
  const { error: categoryError } = await supabase
    .from('categories')
    .delete()
    .eq('is_default', false); // 기본 카테고리가 아닌 것만 삭제

  if (categoryError) {
    console.error('Error clearing custom categories:', categoryError);
    // Don't throw here, we can continue
  }
  
  // Clear initial balances cache
  accountInitialBalances.clear();
};

export const exportData = async (): Promise<{ accounts: Account[], transactions: Transaction[], categories: Category[] }> => {
  console.log("Supabase: Exporting all data");
  
  const [accounts, transactions, categories] = await Promise.all([
    getAccounts(),
    getTransactions(),
    getCategories()
  ]);
  
  return { accounts, transactions, categories };
};

export const importData = async (data: { accounts: Account[], transactions: Transaction[], categories: Category[] }): Promise<void> => {
  console.log("Supabase: Importing data");
  
  // Clear existing data first
  await clearAllData();
  
  // Import categories first
  if (data.categories && data.categories.length > 0) {
    const dbCategories = data.categories.map(category => ({
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon || null,
      color: category.color || null,
      parent_id: category.parentId || null,
      is_default: category.isDefault,
      is_active: category.isActive
    }));

    const { error: categoryError } = await supabase
      .from('categories')
      .insert(dbCategories);

    if (categoryError) {
      console.error('Error importing categories:', categoryError);
      // Continue with default categories
    }
  }
  
  // Import accounts
  if (data.accounts && data.accounts.length > 0) {
    const dbAccounts = data.accounts.map(account => ({
      id: account.id,
      name: account.name,
      balance: account.balance,
      propensity: account.propensity
    }));

    const { error: accountError } = await supabase
      .from('accounts')
      .insert(dbAccounts);

    if (accountError) {
      console.error('Error importing accounts:', accountError);
      throw new Error(`Failed to import accounts: ${accountError.message}`);
    }
    
    // Store initial balances
    data.accounts.forEach(account => {
      accountInitialBalances.set(account.id, account.balance);
    });
  }
  
  // Import transactions
  if (data.transactions && data.transactions.length > 0) {
    const dbTransactions = data.transactions.map(transaction => ({
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account_id: transaction.accountId,
      installment_months: transaction.installmentMonths || null
    }));

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(dbTransactions);

    if (transactionError) {
      console.error('Error importing transactions:', transactionError);
      throw new Error(`Failed to import transactions: ${transactionError.message}`);
    }
  }
};