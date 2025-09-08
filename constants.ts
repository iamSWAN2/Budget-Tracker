
import { Account, Transaction, Category, AccountPropensity, TransactionType } from './types';

export const MOCK_ACCOUNTS: Account[] = [];

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const CATEGORY_COLORS = ['#3b82f6', '#ef4444', '#adf7deff', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1'];

export const DEFAULT_CATEGORIES: Category[] = [
  // 필수지출 카테고리
  { id: 'cat-essential', name: '필수지출', type: TransactionType.EXPENSE, color: '#ef4444', isDefault: true, isActive: true },
  { id: 'cat-housing', name: '주거비 (월세, 관리비)', type: TransactionType.EXPENSE, color: '#3b82f6', parentId: 'cat-essential', isDefault: true, isActive: true },
  { id: 'cat-utilities', name: '통신비 (휴대폰, 인터넷)', type: TransactionType.EXPENSE, color: '#10b981', parentId: 'cat-essential', isDefault: true, isActive: true },
  { id: 'cat-food', name: '식비', type: TransactionType.EXPENSE, color: '#f97316', parentId: 'cat-essential', isDefault: true, isActive: true },
  { id: 'cat-transport', name: '교통비', type: TransactionType.EXPENSE, color: '#8b5cf6', parentId: 'cat-essential', isDefault: true, isActive: true },
  { id: 'cat-insurance', name: '보험료', type: TransactionType.EXPENSE, color: '#ec4899', parentId: 'cat-essential', isDefault: true, isActive: true },
  { id: 'cat-medical', name: '의료비', type: TransactionType.EXPENSE, color: '#f59e0b', parentId: 'cat-essential', isDefault: true, isActive: true },
  { id: 'cat-living', name: '생활용품', type: TransactionType.EXPENSE, color: '#6366f1', parentId: 'cat-essential', isDefault: true, isActive: true },
  { id: 'cat-tax', name: '세금', type: TransactionType.EXPENSE, color: '#64748b', parentId: 'cat-essential', isDefault: true, isActive: true },

  // 선택지출 카테고리
  { id: 'cat-optional', name: '선택지출', type: TransactionType.EXPENSE, color: '#10b981', isDefault: true, isActive: true },
  { id: 'cat-dining', name: '외식', type: TransactionType.EXPENSE, color: '#f97316', parentId: 'cat-optional', isDefault: true, isActive: true },
  { id: 'cat-date-party', name: '데이트/모임', type: TransactionType.EXPENSE, color: '#ec4899', parentId: 'cat-optional', isDefault: true, isActive: true },
  { id: 'cat-culture', name: '문화 (영화, 취미)', type: TransactionType.EXPENSE, color: '#8b5cf6', parentId: 'cat-optional', isDefault: true, isActive: true },
  { id: 'cat-travel', name: '여행', type: TransactionType.EXPENSE, color: '#06b6d4', parentId: 'cat-optional', isDefault: true, isActive: true },
  { id: 'cat-education', name: '교육/자기계발', type: TransactionType.EXPENSE, color: '#3b82f6', parentId: 'cat-optional', isDefault: true, isActive: true },
  { id: 'cat-it', name: 'IT/카메라', type: TransactionType.EXPENSE, color: '#6366f1', parentId: 'cat-optional', isDefault: true, isActive: true },
  { id: 'cat-clothing', name: '의류/쇼핑', type: TransactionType.EXPENSE, color: '#f59e0b', parentId: 'cat-optional', isDefault: true, isActive: true },
  { id: 'cat-delivery', name: '구독 서비스', type: TransactionType.EXPENSE, color: '#64748b', parentId: 'cat-optional', isDefault: true, isActive: true },

  // 대인관계비
  { id: 'cat-relationship', name: '대인관계비', type: TransactionType.EXPENSE, color: '#ec4899', isDefault: true, isActive: true },
  { id: 'cat-gift', name: '선물, 경조사비', type: TransactionType.EXPENSE, color: '#f59e0b', parentId: 'cat-relationship', isDefault: true, isActive: true },
  { id: 'cat-real-estate', name: '부모님 용돈', type: TransactionType.EXPENSE, color: '#64748b', parentId: 'cat-relationship', isDefault: true, isActive: true },
  { id: 'cat-family-friend', name: '친구/지인 모임', type: TransactionType.EXPENSE, color: '#8b5cf6', parentId: 'cat-relationship', isDefault: true, isActive: true },

  // 금융/투자
  { id: 'cat-finance', name: '금융/투자', type: TransactionType.EXPENSE, color: '#6366f1', isDefault: true, isActive: true },
  { id: 'cat-savings', name: '급여', type: TransactionType.EXPENSE, color: '#10b981', parentId: 'cat-finance', isDefault: true, isActive: true },
  { id: 'cat-monthly', name: '월세', type: TransactionType.EXPENSE, color: '#3b82f6', parentId: 'cat-finance', isDefault: true, isActive: true },
  { id: 'cat-deposit', name: '적금', type: TransactionType.EXPENSE, color: '#06b6d4', parentId: 'cat-finance', isDefault: true, isActive: true },
  { id: 'cat-bank-deposit', name: '예금', type: TransactionType.EXPENSE, color: '#64748b', parentId: 'cat-finance', isDefault: true, isActive: true },
  { id: 'cat-investment', name: '투자금', type: TransactionType.EXPENSE, color: '#ef4444', parentId: 'cat-finance', isDefault: true, isActive: true },
  { id: 'cat-pension', name: '연금', type: TransactionType.EXPENSE, color: '#8b5cf6', parentId: 'cat-finance', isDefault: true, isActive: true },
  { id: 'cat-interest', name: '이자', type: TransactionType.EXPENSE, color: '#f59e0b', parentId: 'cat-finance', isDefault: true, isActive: true },

  // 기타
  { id: 'cat-others', name: '기타', type: TransactionType.EXPENSE, color: '#64748b', isDefault: true, isActive: true },
  { id: 'cat-previous', name: '이체 입금', type: TransactionType.EXPENSE, color: '#10b981', parentId: 'cat-others', isDefault: true, isActive: true },
  { id: 'cat-withdraw', name: '이체 출금', type: TransactionType.EXPENSE, color: '#ef4444', parentId: 'cat-others', isDefault: true, isActive: true },
  { id: 'cat-present', name: '현금', type: TransactionType.EXPENSE, color: '#f59e0b', parentId: 'cat-others', isDefault: true, isActive: true },
  { id: 'cat-card-fee', name: '카드 취소', type: TransactionType.EXPENSE, color: '#6366f1', parentId: 'cat-others', isDefault: true, isActive: true },
  { id: 'cat-card-loan', name: '카드 대금', type: TransactionType.EXPENSE, color: '#8b5cf6', parentId: 'cat-others', isDefault: true, isActive: true },
  { id: 'cat-special', name: '특수 지출', type: TransactionType.EXPENSE, color: '#ec4899', parentId: 'cat-others', isDefault: true, isActive: true },

  // 수입 카테고리
  { id: 'cat-income', name: '수입', type: TransactionType.INCOME, color: '#10b981', isDefault: true, isActive: true },
  { id: 'cat-salary', name: '급여', type: TransactionType.INCOME, color: '#3b82f6', parentId: 'cat-income', isDefault: true, isActive: true },
  { id: 'cat-bonus', name: '보너스', type: TransactionType.INCOME, color: '#06b6d4', parentId: 'cat-income', isDefault: true, isActive: true },
  { id: 'cat-allowance', name: '용돈', type: TransactionType.INCOME, color: '#f59e0b', parentId: 'cat-income', isDefault: true, isActive: true },
  { id: 'cat-investment-income', name: '투자수익', type: TransactionType.INCOME, color: '#8b5cf6', parentId: 'cat-income', isDefault: true, isActive: true },
  { id: 'cat-side-job', name: '부업', type: TransactionType.INCOME, color: '#ec4899', parentId: 'cat-income', isDefault: true, isActive: true },
  { id: 'cat-other-income', name: '기타수입', type: TransactionType.INCOME, color: '#64748b', parentId: 'cat-income', isDefault: true, isActive: true },
];
