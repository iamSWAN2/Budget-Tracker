
import { Account, Transaction, Category, AccountPropensity, TransactionType } from './types';

export const MOCK_ACCOUNTS: Account[] = [];

export const DEFAULT_ACCOUNTS: Account[] = [
  { 
    id: '00000000-0000-0000-0000-000000000001', // UUID 형식의 기본 현금 계좌 ID
    name: '현금', 
    balance: 0, // 초기 금액 0원으로 변경
    initialBalance: 0, // 초기 잔액
    propensity: AccountPropensity.CASH 
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const CATEGORY_COLORS = ['#3b82f6', '#ef4444', '#adf7deff', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1'];

// 기본 카테고리는 이제 Supabase에서 UUID로 관리됩니다
export const DEFAULT_CATEGORIES: Category[] = [];
