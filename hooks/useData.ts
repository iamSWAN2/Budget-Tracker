
import { useState, useEffect, useCallback } from 'react';
import { Account, Transaction, Category, Installment, AITransaction, TransactionType } from '../types';
import { 
  getAccounts, 
  getTransactions, 
  getCategories,
  addTransaction as apiAddTransaction, 
  updateTransaction as apiUpdateTransaction, 
  deleteTransaction as apiDeleteTransaction, 
  addAccount as apiAddAccount, 
  updateAccount as apiUpdateAccount, 
  deleteAccount as apiDeleteAccount,
  addCategory as apiAddCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  clearAllData as apiClearAllData,
  exportData as apiExportData,
  importData as apiImportData
} from '../services/supabaseService';

export const useData = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fetchedAccounts, fetchedTransactions, fetchedCategories] = await Promise.all([
        getAccounts(), 
        getTransactions(), 
        getCategories()
      ]);
      setAccounts(fetchedAccounts);
      setTransactions(fetchedTransactions);
      setCategories(fetchedCategories);
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const activeInstallments = transactions
      .filter(t => t.installmentMonths && t.installmentMonths > 1)
      .map(t => {
        const startDate = new Date(t.date);
        const today = new Date();
        const monthsPassed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
        
        const remainingMonths = t.installmentMonths! - monthsPassed;

        if (remainingMonths <= 0) return null;

        return {
          id: `inst-${t.id}`,
          transactionId: t.id,
          description: t.description,
          totalAmount: t.amount,
          monthlyPayment: t.amount / t.installmentMonths!,
          startDate: t.date,
          totalMonths: t.installmentMonths!,
          remainingMonths: remainingMonths,
          accountId: t.accountId,
        };
      })
      .filter((inst): inst is Installment => inst !== null);
    
    setInstallments(activeInstallments);
  }, [transactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await apiAddTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      // Refetch all data to ensure balances are correct
      await fetchData();
    } catch (err) {
      setError('Failed to add transaction.');
      console.error(err);
    }
  };

  const addMultipleTransactions = async (newTransactions: AITransaction[], accountId: string) => {
    try {
      const transactionsToAdd = newTransactions.map(t => ({
          ...t,
          date: t.date,
          amount: t.amount,
          description: t.description,
          type: t.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
          category: 'Uncategorized', // Default category for AI-added transactions
          accountId,
      }));

      for (const trans of transactionsToAdd) {
        await apiAddTransaction(trans);
      }
      // Refetch all data to get updated state
      await fetchData();
    } catch (err) {
      setError('Failed to add transactions from AI analysis.');
      console.error(err);
    }
  };


  const updateTransaction = async (transaction: Transaction) => {
    try {
      const updatedTransaction = await apiUpdateTransaction(transaction);
      setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
      await fetchData();
    } catch (err) {
      setError('Failed to update transaction.');
      console.error(err);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await apiDeleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      await fetchData();
    } catch (err) {
      setError('Failed to delete transaction.');
      console.error(err);
    }
  };
  
  const addAccount = async (account: Omit<Account, 'id'>) => {
    try {
        const newAccount = await apiAddAccount(account);
        setAccounts(prev => [...prev, newAccount]);
    } catch (err) {
        setError('Failed to add account.');
        console.error(err);
    }
  };

  const updateAccount = async (account: Account) => {
      try {
          const updatedAccount = await apiUpdateAccount(account);
          setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
      } catch (err) {
          setError('Failed to update account.');
          console.error(err);
      }
  };

  const deleteAccount = async (id: string) => {
      try {
          await apiDeleteAccount(id);
          setAccounts(prev => prev.filter(a => a.id !== id));
          await fetchData();
      } catch (err) {
          setError('Failed to delete account.');
          console.error(err);
      }
  };

  // Category management functions
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await apiAddCategory(category);
      setCategories(prev => [...prev, newCategory]);
    } catch (err) {
      setError('Failed to add category.');
      console.error(err);
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      const updatedCategory = await apiUpdateCategory(category);
      setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    } catch (err) {
      setError('Failed to update category.');
      console.error(err);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await apiDeleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError('Failed to delete category.');
      console.error(err);
    }
  };

  // Data management functions
  const clearAllData = async () => {
    try {
      await apiClearAllData();
      setAccounts([]);
      setTransactions([]);
      setInstallments([]);
      await fetchData(); // Refetch to get default categories
    } catch (err) {
      setError('Failed to clear data.');
      console.error(err);
    }
  };

  const exportData = async () => {
    try {
      const data = await apiExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data.');
      console.error(err);
    }
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await apiImportData(data);
      await fetchData(); // Refetch all data
    } catch (err) {
      setError('Failed to import data.');
      console.error(err);
    }
  };

  return {
    accounts,
    transactions,
    categories,
    installments,
    isLoading,
    error,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    clearAllData,
    exportData,
    importData,
  };
};

export type UseDataReturn = ReturnType<typeof useData>;
