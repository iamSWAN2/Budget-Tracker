
import { useState, useEffect, useCallback } from 'react';
import { Account, Transaction, Category, Installment, AITransaction, TransactionType, AccountType, getAccountType, isCardPayment } from '../types';
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
  clearData as apiClearData,
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

  // 신용카드 사용액 계산 함수 (부채 관점)
  const calculateCreditCardUsage = useCallback((transactions: Transaction[]): number => {
    return transactions.reduce((usage, transaction) => {
      if (transaction.type === TransactionType.EXPENSE) {
        // 일반 지출은 사용액 증가
        return usage + transaction.amount;
      } else if (transaction.type === TransactionType.INCOME) {
        // 수입은 사용액 감소
        return usage - transaction.amount;
      } else if (transaction.type === TransactionType.TRANSFER && isCardPayment(transaction)) {
        // 카드 대금 결제 (TRANSFER 유형)는 사용액에서 차감
        return usage - transaction.amount;
      }
      return usage;
    }, 0);
  }, []);

  // 클라이언트 사이드 잔액 계산 함수 (계좌 유형별 로직 분리)
  const calculateAccountBalances = useCallback((accountsList: Account[], transactionsList: Transaction[]) => {
    return accountsList.map(account => {
      const accountTransactions = transactionsList.filter(t => t.accountId === account.id);
      const accountType = getAccountType(account);
      
      let balance: number;
      
      if (accountType === AccountType.CREDIT) {
        // 신용카드: 사용액 계산 (양수 = 빚)
        // 해당 신용카드 계좌의 거래 + 전체 거래에서 카드 대금 찾아 차감
        const creditCardUsage = calculateCreditCardUsage(accountTransactions);
        
        // 전체 거래에서 카드 대금 결제 찾기 (다른 계좌에서 결제된 경우 대비)
        const allCardPayments = transactionsList.filter(t => 
          t.accountId !== account.id && // 다른 계좌에서
          isCardPayment(t, categories) && // 카드 대금이며
          t.type === TransactionType.TRANSFER // TRANSFER 유형
        );
        
        // 카드 대금 총액 차감
        const totalCardPayments = allCardPayments.reduce((sum, t) => sum + t.amount, 0);
        balance = creditCardUsage - totalCardPayments;
      } else if (accountType === AccountType.LIABILITY) {
        // 부채 계좌: 대출 잔액 계산 (양수 = 빚)
        balance = accountTransactions.reduce((acc, transaction) => {
          return transaction.type === TransactionType.EXPENSE 
            ? acc + transaction.amount  // 대출 증가
            : acc - transaction.amount; // 대출 상환
        }, account.initialBalance || 0);
      } else {
        // 일반 계좌: 기존 로직 (DEBIT, CASH)
        balance = accountTransactions.reduce((acc, transaction) => {
          return transaction.type === TransactionType.INCOME 
            ? acc + transaction.amount 
            : acc - transaction.amount;
        }, account.initialBalance || 0);
      }
      
      return { ...account, balance };
    });
  }, [calculateCreditCardUsage]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fetchedAccounts, fetchedTransactions, fetchedCategories] = await Promise.all([
        getAccounts(), 
        getTransactions(), 
        getCategories()
      ]);
      
      // 클라이언트에서 잔액 계산
      const accountsWithBalance = calculateAccountBalances(fetchedAccounts, fetchedTransactions);
      
      setAccounts(accountsWithBalance);
      setTransactions(fetchedTransactions);
      setCategories(fetchedCategories);
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [calculateAccountBalances]);

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
      const updatedTransactions = [newTransaction, ...transactions];
      
      // 트랜잭션과 계좌 잔액 동시 업데이트
      setTransactions(updatedTransactions);
      setAccounts(prev => calculateAccountBalances(prev, updatedTransactions));
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
          type: t.type === 'INCOME' ? TransactionType.INCOME : 
                t.type === 'EXPENSE' ? TransactionType.EXPENSE : TransactionType.TRANSFER,
          category: getCategoryIdByName(t.category || 'Uncategorized', categories), // 카테고리 이름을 UUID로 변환
          accountId,
          ...(t.installmentMonths && t.installmentMonths > 1 && { installmentMonths: t.installmentMonths }),
          ...(t.installmentMonths && t.installmentMonths > 1 && t.isInterestFree !== undefined && { isInterestFree: t.isInterestFree }),
      }));

      const addedTransactions = [];
      for (const trans of transactionsToAdd) {
        const addedTransaction = await apiAddTransaction(trans);
        addedTransactions.push(addedTransaction);
      }
      
      const updatedTransactions = [...addedTransactions, ...transactions];
      setTransactions(updatedTransactions);
      setAccounts(prev => calculateAccountBalances(prev, updatedTransactions));
    } catch (err) {
      setError('Failed to add transactions from AI analysis.');
      console.error(err);
    }
  };

  const addMultipleFullTransactions = async (fullTransactions: Transaction[]) => {
    try {
      const addedTransactions = [];
      for (const transaction of fullTransactions) {
        const addedTransaction = await apiAddTransaction(transaction);
        addedTransactions.push(addedTransaction);
      }
      
      const updatedTransactions = [...addedTransactions, ...transactions];
      setTransactions(updatedTransactions);
      setAccounts(prev => calculateAccountBalances(prev, updatedTransactions));
    } catch (err) {
      setError('Failed to add full transactions from CSV.');
      console.error(err);
    }
  };

  const addMultipleTransactionsWithAccounts = async (newTransactions: AITransaction[]) => {
    try {
      // 거래에서 고유한 계좌명 추출
      const uniqueAccountNames = [...new Set(newTransactions
        .map(t => t.account)
        .filter(account => account && account.trim() !== '')
      )];

      // 계좌명 기반 계좌 유형 추론 함수
      const inferAccountPropensity = (accountName: string): import('../types').AccountPropensity => {
        const name = accountName.toLowerCase();
        if (name.includes('카드') || name.includes('card')) {
          return import('../types').AccountPropensity.CREDIT_CARD;
        } else if (name.includes('예금') || name.includes('적금') || name.includes('savings')) {
          return import('../types').AccountPropensity.SAVINGS;
        } else if (name.includes('투자') || name.includes('증권') || name.includes('investment')) {
          return import('../types').AccountPropensity.INVESTMENT;
        } else if (name.includes('현금') || name.includes('cash')) {
          return import('../types').AccountPropensity.CASH;
        } else if (name.includes('대출') || name.includes('loan')) {
          return import('../types').AccountPropensity.LOAN;
        } else {
          return import('../types').AccountPropensity.CHECKING; // 기본값
        }
      };

      // 계좌 매칭 및 생성 맵
      const accountMap = new Map<string, string>(); // accountName -> accountId

      for (const accountName of uniqueAccountNames) {
        // 기존 계좌와 매칭 시도
        const existingAccount = accounts.find(acc => 
          acc.name.toLowerCase().includes(accountName.toLowerCase()) ||
          accountName.toLowerCase().includes(acc.name.toLowerCase())
        );

        if (existingAccount) {
          accountMap.set(accountName, existingAccount.id);
        } else {
          // 새 계좌 생성
          const accountPropensity = inferAccountPropensity(accountName);
          const newAccount = await apiAddAccount({
            name: accountName,
            balance: 0,
            initialBalance: 0,
            propensity: accountPropensity,
            ...(accountPropensity === import('../types').AccountPropensity.CREDIT_CARD && { paymentDay: 25 })
          });
          
          // 로컬 상태 업데이트
          setAccounts(prev => [...prev, newAccount]);
          accountMap.set(accountName, newAccount.id);
        }
      }

      // 거래별로 적절한 계좌 ID 할당하여 거래 추가
      const addedTransactions = [];
      for (const transaction of newTransactions) {
        let accountId: string;
        
        if (transaction.account && accountMap.has(transaction.account)) {
          accountId = accountMap.get(transaction.account)!;
        } else {
          // 계좌 정보가 없는 경우 기본 계좌 사용
          accountId = accounts.length > 0 ? accounts[0].id : '';
          if (!accountId) {
            throw new Error('기본 계좌가 없습니다. 먼저 계좌를 생성해주세요.');
          }
        }

        const transactionToAdd = {
          ...transaction,
          date: transaction.date,
          amount: transaction.amount,
          description: transaction.description,
          type: transaction.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
          category: transaction.category || 'Uncategorized',
          accountId,
          ...(transaction.installmentMonths && transaction.installmentMonths > 1 && { 
            installmentMonths: transaction.installmentMonths 
          }),
          ...(transaction.installmentMonths && transaction.installmentMonths > 1 && 
              transaction.isInterestFree !== undefined && { 
            isInterestFree: transaction.isInterestFree 
          }),
        };

        const addedTransaction = await apiAddTransaction(transactionToAdd);
        addedTransactions.push(addedTransaction);
      }

      // 로컬 상태 업데이트
      const updatedTransactions = [...addedTransactions, ...transactions];
      setTransactions(updatedTransactions);
      setAccounts(prev => calculateAccountBalances(prev, updatedTransactions));
    } catch (err) {
      setError('Failed to add transactions with account processing.');
      console.error(err);
    }
  };


  const updateTransaction = async (transaction: Transaction) => {
    try {
      const updatedTransaction = await apiUpdateTransaction(transaction);
      const updatedTransactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
      
      setTransactions(updatedTransactions);
      setAccounts(prev => calculateAccountBalances(prev, updatedTransactions));
    } catch (err) {
      setError('Failed to update transaction.');
      console.error(err);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await apiDeleteTransaction(id);
      const updatedTransactions = transactions.filter(t => t.id !== id);
      
      setTransactions(updatedTransactions);
      setAccounts(prev => calculateAccountBalances(prev, updatedTransactions));
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
          // 삭제된 계좌의 트랜잭션도 제거
          const updatedTransactions = transactions.filter(t => t.accountId !== id);
          setTransactions(updatedTransactions);
      } catch (err) {
          // 예상되는 비즈니스 로직 에러는 정보 레벨로 처리
          if (err instanceof Error && (
              err.message.includes('거래 내역이 있는 계좌') || 
              err.message.includes('기본 계좌는 삭제할 수 없습니다')
          )) {
              console.info('Account deletion prevented:', err.message);
          } else {
              // 예상치 못한 에러만 에러 레벨로 처리
              setError('Failed to delete account.');
              console.error('Unexpected error during account deletion:', err);
          }
          // 에러를 다시 throw해서 UI에서 처리할 수 있도록 함
          throw err;
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

  const clearData = async (options: import('../services/supabaseService').ClearDataOptions) => {
    try {
      await apiClearData(options);
      
      // 선택적으로 로컬 상태 업데이트
      if (options.clearTransactions) {
        setTransactions([]);
        setAccounts(prev => calculateAccountBalances(prev, []));
      }
      if (options.clearAccounts) {
        setAccounts([]);
        setTransactions([]);
      }
      if (options.clearCategories) {
        setCategories([]);
      }
    } catch (err) {
      setError('Failed to clear selected data.');
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
    addMultipleTransactionsWithAccounts,
    addMultipleFullTransactions,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    clearAllData,
    clearData,
    exportData,
    importData,
  };
};

export type UseDataReturn = ReturnType<typeof useData>;
