
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  OPENING = 'OPENING',
}

export enum AccountPropensity {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  CREDIT_CARD = 'Credit Card',
  INVESTMENT = 'Investment',
  CASH = 'Cash',
  LOAN = 'Loan',
}

// 새로운 계좌 유형 enum (신용카드 구분을 위함)
export enum AccountType {
  DEBIT = 'DEBIT',     // 일반 예금/적금 계좌
  CREDIT = 'CREDIT',   // 신용카드
  CASH = 'CASH',       // 현금
  LIABILITY = 'LIABILITY' // 부채 (대출)
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  initialBalance: number; // 초기 잔액 (오프닝 밸런스)
  propensity: AccountPropensity;
  paymentDay?: number; // 신용카드 결제일 (1-31, Credit Card일 때만 사용)
  
  // 새로운 타입 시스템 필드들
  type?: AccountType; // 새로운 계좌 유형 (선택적 - 기존 호환성 유지)
  creditLimit?: number; // 신용카드 한도 (신용카드일 때만 사용)
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
  isInterestFree?: boolean; // 무이자 할부 여부
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

// 유틸리티 함수: propensity에서 AccountType으로 매핑
export const getAccountTypeFromPropensity = (propensity: AccountPropensity): AccountType => {
  switch (propensity) {
    case AccountPropensity.CASH:
      return AccountType.CASH;
    case AccountPropensity.CREDIT_CARD:
      return AccountType.CREDIT;
    case AccountPropensity.LOAN:
      return AccountType.LIABILITY;
    case AccountPropensity.CHECKING:
    case AccountPropensity.SAVINGS:
    case AccountPropensity.INVESTMENT:
    default:
      return AccountType.DEBIT;
  }
};

// 계좌의 실제 타입을 가져오는 함수 (type 필드가 있으면 우선, 없으면 propensity에서 추론)
export const getAccountType = (account: Account): AccountType => {
  return account.type || getAccountTypeFromPropensity(account.propensity);
};

// 신용카드 관련 유틸리티 함수들
export const getCreditCardAvailableAmount = (account: Account): number => {
  if (getAccountType(account) !== AccountType.CREDIT || !account.creditLimit) {
    return 0;
  }
  const usedAmount = Math.max(0, account.balance); // balance가 사용액 (양수)
  return Math.max(0, account.creditLimit - usedAmount);
};

export const getCreditCardUsageRate = (account: Account): number => {
  if (getAccountType(account) !== AccountType.CREDIT || !account.creditLimit) {
    return 0;
  }
  const usedAmount = Math.max(0, account.balance); // balance가 사용액 (양수)
  return account.creditLimit > 0 ? (usedAmount / account.creditLimit) * 100 : 0;
};

export const isCreditCard = (account: Account): boolean => {
  return getAccountType(account) === AccountType.CREDIT;
};

// 카테고리 이름으로 ID 찾기 함수
export const findCategoryByName = (name: string, categories: Category[]): Category | null => {
  return categories.find(cat => cat.name === name) || null;
};

// 카드 대금 결제 거래인지 확인하는 함수 (이름 기반)
export const isCardPayment = (transaction: Transaction, categories: Category[]): boolean => {
  // 직접 카테고리 이름 매칭
  if (transaction.category === '카드 대금') {
    return true;
  }
  
  // UUID인 경우 카테고리 목록에서 검색
  const category = categories.find(cat => cat.id === transaction.category);
  if (category && category.name === '카드 대금') {
    return true;
  }
  
  // 설명에서 검색
  if (transaction.description?.includes('카드 대금')) {
    return true;
  }
  
  return false;
};

// 카테고리 이름을 ID로 변환하는 함수
export const getCategoryIdByName = (name: string, categories: Category[]): string => {
  // 빈 이름이거나 'Uncategorized'인 경우 기타 카테고리 반환
  if (!name || name === 'Uncategorized') {
    const otherCategory = categories.find(cat => cat.name === '기타');
    return otherCategory?.id || name;
  }
  
  const category = findCategoryByName(name, categories);
  if (category) {
    return category.id;
  }
  
  // 매칭되지 않은 경우 기타 카테고리로 분류
  const otherCategory = categories.find(cat => cat.name === '기타');
  return otherCategory?.id || name;
};

export interface AITransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category?: string;
  account?: string;
  reference?: string;
  installmentMonths?: number;
  isInterestFree?: boolean;
}
