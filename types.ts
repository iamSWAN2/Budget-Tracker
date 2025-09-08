
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum AccountPropensity {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  CREDIT_CARD = 'Credit Card',
  INVESTMENT = 'Investment',
  CASH = 'Cash',
  LOAN = 'Loan',
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  propensity: AccountPropensity;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  accountId: string;
  installmentMonths?: number;
}

export interface Installment {
  id: string;
  transactionId: string;
  description: string;
  totalAmount: number;
  monthlyPayment: number;
  startDate: string;
  totalMonths: number;
  remainingMonths: number;
  accountId: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  parentId?: string;
  isDefault: boolean;
  isActive: boolean;
}

export type Page = 'dashboard' | 'accounts' | 'transactions' | 'installments' | 'settings';

export interface AITransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
}
