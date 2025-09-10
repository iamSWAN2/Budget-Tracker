import { supabase } from './supabase';
import { Account, Transaction, Category, TransactionType, AccountPropensity } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from '../constants';

// Convert database row to Account type
const mapDbAccount = (row: any): Account => ({
  id: row.id,
  name: row.name,
  balance: parseFloat(row.balance),
  propensity: row.propensity as AccountPropensity,
  paymentDay: row.payment_day
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
  installmentMonths: row.installment_months,
  isInterestFree: row.is_interest_free
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
  
  // Initialize default accounts first
  await initializeDefaultAccounts();
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching accounts:', error);
    throw new Error(`Failed to fetch accounts: ${error.message}`);
  }

  const dbAccounts = data?.map(mapDbAccount) || [];
  
  // Check if default cash account exists
  const hasCashAccount = dbAccounts.some(account => account.id === '00000000-0000-0000-0000-000000000001');
  
  if (!hasCashAccount) {
    console.log("Cash account not found, adding default cash account");
    // Force add the default cash account
    const defaultCashAccount = DEFAULT_ACCOUNTS[0]; // Cash account
    return [defaultCashAccount, ...dbAccounts];
  }
  
  return dbAccounts;
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
    installment_months: transaction.installmentMonths || null,
    is_interest_free: transaction.isInterestFree || false
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
    installment_months: transaction.installmentMonths || null,
    is_interest_free: transaction.isInterestFree || false
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
    propensity: account.propensity,
    payment_day: account.paymentDay || null
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
    propensity: account.propensity,
    payment_day: account.paymentDay || null
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
  
  // Check if this is a default account
  const isDefaultAccount = DEFAULT_ACCOUNTS.some(account => account.id === id);
  if (isDefaultAccount) {
    throw new Error('기본 계좌는 삭제할 수 없습니다');
  }
  
  // Delete all transactions for this account first (to satisfy FK constraints)
  const { error: deleteTransactionsError } = await supabase
    .from('transactions')
    .delete()
    .eq('account_id', id);

  if (deleteTransactionsError) {
    console.error('Error deleting transactions for account:', deleteTransactionsError);
    throw new Error(`Failed to delete account transactions: ${deleteTransactionsError.message}`);
  }

  // Then delete the account itself
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting account:', error);
    throw new Error(`Failed to delete account: ${error.message}`);
  }
  
  // Cleanup cached initial balance
  accountInitialBalances.delete(id);
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

// -----------------------------
// Selective Clear (New Feature)
// -----------------------------

export type ClearTransactionsFilter = {
  accountId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  type?: TransactionType;
};

export type ClearAccountsOption = boolean | {
  ids?: string[];            // 지정된 계좌만 삭제
  includeDefault?: boolean;  // 기본 계좌 포함 여부(기본 false)
};

export type ClearDataOptions = {
  transactions?: boolean | ClearTransactionsFilter;
  accounts?: ClearAccountsOption;
  categories?: false | 'custom' | 'all';
  reassignCategoryTo?: string; // 카테고리 삭제 전 재할당 대상(기본 'Uncategorized')
};

export const clearTransactions = async (filter?: ClearTransactionsFilter): Promise<void> => {
  // 1) 삭제 대상 거래들의 계좌 ID 수집 (삭제 전)
  let selectQuery = supabase.from('transactions').select('account_id');
  if (filter?.accountId) selectQuery = selectQuery.eq('account_id', filter.accountId);
  if (filter?.from) selectQuery = selectQuery.gte('date', filter.from);
  if (filter?.to) selectQuery = selectQuery.lte('date', filter.to);
  if (filter?.type) selectQuery = selectQuery.eq('type', filter.type);

  const { data: rows, error: selectError } = await selectQuery;
  if (selectError) {
    console.error('Error collecting affected accounts for transaction clear:', selectError);
    throw new Error(`Failed to prepare transaction clear: ${selectError.message}`);
  }
  const affectedAccountIds = Array.from(new Set((rows || []).map((r: any) => r.account_id).filter(Boolean)));

  // 2) 거래 삭제
  let deleteQuery = supabase.from('transactions').delete();
  if (filter?.accountId) deleteQuery = deleteQuery.eq('account_id', filter.accountId);
  if (filter?.from) deleteQuery = deleteQuery.gte('date', filter.from);
  if (filter?.to) deleteQuery = deleteQuery.lte('date', filter.to);
  if (filter?.type) deleteQuery = deleteQuery.eq('type', filter.type);

  const { error: deleteError } = await deleteQuery;
  if (deleteError) {
    console.error('Error clearing transactions:', deleteError);
    throw new Error(`Failed to clear transactions: ${deleteError.message}`);
  }

  // 3) 삭제된 계좌들의 잔액 재계산
  // 특정 계좌 지정이 있으면 그 계좌만, 아니면 수집된 계좌들만 업데이트
  const targetIds = filter?.accountId ? [filter.accountId] : affectedAccountIds;
  for (const accountId of targetIds) {
    try {
      await updateAccountBalance(accountId);
    } catch (e) {
      console.warn('Failed to update account balance after transaction clear:', accountId, e);
    }
  }
};

export const bulkDeleteAccounts = async (option: ClearAccountsOption): Promise<void> => {
  if (!option) return;

  const includeDefault = typeof option === 'object' ? !!option.includeDefault : false;
  let targetIds: string[] = [];

  if (option === true) {
    const { data, error } = await supabase.from('accounts').select('id');
    if (error) {
      console.error('Error fetching accounts for bulk delete:', error);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
    const defaultIds = DEFAULT_ACCOUNTS.map(a => a.id);
    targetIds = (data || []).map((r: any) => r.id).filter((id: string) => includeDefault || !defaultIds.includes(id));
  } else if (Array.isArray(option.ids) && option.ids.length > 0) {
    const defaultIds = DEFAULT_ACCOUNTS.map(a => a.id);
    targetIds = option.ids.filter(id => includeDefault || !defaultIds.includes(id));
  }

  if (targetIds.length === 0) return;

  // 1) 해당 계좌들의 거래 삭제
  {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('account_id', targetIds);
    if (error) {
      console.error('Error deleting transactions for accounts:', error);
      throw new Error(`Failed to delete related transactions: ${error.message}`);
    }
  }

  // 2) 계좌 삭제
  {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .in('id', targetIds);
    if (error) {
      console.error('Error deleting accounts:', error);
      throw new Error(`Failed to delete accounts: ${error.message}`);
    }
  }

  // 3) 초기 잔액 캐시 정리
  targetIds.forEach(id => accountInitialBalances.delete(id));
};

export const deleteCategories = async (mode: 'custom' | 'all', reassignTo?: string): Promise<void> => {
  const fallback = reassignTo || 'Uncategorized';

  if (mode === 'all') {
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ category: fallback })
      .gt('created_at', '1970-01-01');
    if (updateError) {
      console.error('Error reassigning categories (all):', updateError);
      throw new Error(`Failed to reassign categories: ${updateError.message}`);
    }

    const { error: delError } = await supabase
      .from('categories')
      .delete()
      .gt('created_at', '1970-01-01');
    if (delError) {
      console.error('Error deleting all categories:', delError);
      throw new Error(`Failed to delete categories: ${delError.message}`);
    }
  } else {
    // 커스텀 카테고리 이름 목록 조회
    const { data: customCats } = await supabase
      .from('categories')
      .select('name')
      .eq('is_default', false);
    const customNames = (customCats || []).map((c: any) => c.name);

    if (customNames.length > 0) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ category: fallback })
        .in('category', customNames);
      if (updateError) {
        console.error('Error reassigning categories (custom):', updateError);
        throw new Error(`Failed to reassign custom categories: ${updateError.message}`);
      }
    }

    const { error: delError } = await supabase
      .from('categories')
      .delete()
      .eq('is_default', false);
    if (delError) {
      console.error('Error deleting custom categories:', delError);
      throw new Error(`Failed to delete custom categories: ${delError.message}`);
    }
  }
};

export const clearData = async (options: ClearDataOptions): Promise<void> => {
  const { transactions, accounts, categories, reassignCategoryTo } = options;

  if (transactions) {
    if (typeof transactions === 'object') await clearTransactions(transactions);
    else await clearTransactions();
  }
  if (accounts) {
    await bulkDeleteAccounts(accounts);
  }
  if (categories) {
    if (categories === 'all' || categories === 'custom') {
      await deleteCategories(categories, reassignCategoryTo);
    }
  }
};

// Category management functions
export const getCategories = async (): Promise<Category[]> => {
  console.log("Supabase: Fetching categories");
  
  // FORCE REINITIALIZE - Update existing categories with latest constants
  console.log("Force updating categories from constants...");
  await initializeDefaultCategories(); // This will upsert the latest data
  return DEFAULT_CATEGORIES;
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

export const initializeDefaultAccounts = async (): Promise<void> => {
  console.log("Supabase: Initializing default accounts");
  
  const dbAccounts = DEFAULT_ACCOUNTS.map(account => ({
    id: account.id,
    name: account.name,
    balance: account.balance,
    propensity: account.propensity,
    payment_day: account.paymentDay || null
  }));

  const { error } = await supabase
    .from('accounts')
    .upsert(dbAccounts, { onConflict: 'id' });

  if (error) {
    console.error('Error initializing default accounts:', error);
    // Don't throw here as we can fall back to allowing manual account creation
  }
  
  // Store initial balances for default accounts
  DEFAULT_ACCOUNTS.forEach(account => {
    accountInitialBalances.set(account.id, account.balance);
  });
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
  
  console.log('DEFAULT_CATEGORIES TRANSFER items:', DEFAULT_CATEGORIES.filter(c => c.type === 'TRANSFER'));
  console.log('DB Categories TRANSFER items:', dbCategories.filter(c => c.type === 'TRANSFER'));
  
  // Delete removed categories from database
  const categoriesToDelete = ['cat-savings', 'cat-monthly']; // 급여, 월세 (EXPENSE에서 제거)
  for (const categoryId of categoriesToDelete) {
    await supabase.from('categories').delete().eq('id', categoryId);
    console.log('Deleted category:', categoryId);
  }

  const { error } = await supabase
    .from('categories')
    .upsert(dbCategories, { onConflict: 'id' });

  if (error) {
    console.error('Error initializing categories:', error);
    // Don't throw here as we can fall back to in-memory defaults
  }
};

// Data management functions
export const clearAllData = async (): Promise<void> => {
  console.log("Supabase: Clearing all data (alias)");
  await clearData({
    transactions: true,
    accounts: true,
    categories: 'custom',
  });
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
      propensity: account.propensity,
      payment_day: account.paymentDay || null
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
      installment_months: transaction.installmentMonths || null,
      is_interest_free: transaction.isInterestFree || false
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
