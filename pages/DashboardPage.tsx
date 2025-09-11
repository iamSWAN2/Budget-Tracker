import React, { useMemo, useState, Suspense } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { TransactionType, Transaction } from '../types';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { AddTransactionFormInline } from '../components/forms/AddTransactionFormInline';
import { formatCurrency } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { TransactionsList } from '../components/transactions/TransactionsList';
import { InstallmentsWidget } from '../components/dashboard/InstallmentsWidget';
import { RecurringWidget } from '../components/dashboard/RecurringWidget';
import { OutliersWidget } from '../components/dashboard/OutliersWidget';
import { CreditCardBillWidget } from '../components/dashboard/CreditCardBillWidget';
// 간단한 CSS 차트 컴포넌트들로 교체
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import { SimplePieChart } from '../components/charts/SimplePieChart';
import { MonthlyTrendDisplay } from '../components/charts/MonthlyTrendDisplay';
import { Calendar } from '../components/calendar/Calendar';
const AIAssist = React.lazy(() => import('../components/AIAssist'));
import { FloatingActionMenu } from '../components/ui/FloatingActionMenu';
import { AIIcon } from '../components/icons/Icons';

// 개요 탭 컴포넌트
const OverviewTab: React.FC<{
  data: UseDataReturn;
  monthlyIncomeTotal: number;
  monthlyExpenseTotal: number;
  monthlyBalance: number;
  recentTransactions: Transaction[];
  transactions: Transaction[];
  accounts: any[];
  categories: any[];
  currentMonth: number;
  currentYear: number;
  selectedRange: { start: Date; end: Date } | null;
  visibleDate: Date;
  onVisibleDateChange: (d: Date) => void;
  onSelectedRangeChange: (r: { start: Date; end: Date } | null) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  handleDelete: (id: string) => void;
  t: (key: string) => string;
}> = ({
  data,
  monthlyIncomeTotal,
  monthlyExpenseTotal,
  monthlyBalance,
  recentTransactions,
  transactions,
  accounts,
  categories,
  currentMonth,
  currentYear,
  selectedRange,
  visibleDate,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  handleDelete,
  t,
  onVisibleDateChange,
  onSelectedRangeChange
}) => {
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const accountNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach(a => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const filteredTransactions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentTransactions;
    return recentTransactions.filter(t => {
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const acc = (accountNameMap.get(t.accountId) || '').toLowerCase();
      return desc.includes(q) || cat.includes(q) || acc.includes(q);
    });
  }, [recentTransactions, query, accountNameMap]);

  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const apply = (matches: boolean) => setIsDesktop(matches);
    apply(mql.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', listener);
    else if (mql.addListener) mql.addListener(listener);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', listener);
      else if (mql.removeListener) mql.removeListener(listener);
    };
  }, []);

  const monthStart = React.useMemo(() => new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1), [visibleDate]);
  const monthEnd = React.useMemo(() => new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 0), [visibleDate]);
  const period = selectedRange ?? { start: monthStart, end: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999) };

  return (
    <div className="flex-1 flex flex-col space-y-4 md:space-y-6 min-h-0">
      {/* 재정 개요 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
          <h3 className="text-sm md:text-xs font-medium text-slate-600 mb-2 md:mb-1">{t('summary.income')}</h3>
          <p className="text-base md:text-lg font-bold text-green-600 truncate">{formatCurrency(monthlyIncomeTotal)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
          <h3 className="text-sm md:text-xs font-medium text-slate-600 mb-2 md:mb-1">{t('summary.expense')}</h3>
          <p className="text-base md:text-lg font-bold text-red-600 truncate">{formatCurrency(monthlyExpenseTotal)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
          <h3 className="text-sm md:text-xs font-medium text-slate-600 mb-2 md:mb-1">{t('summary.balance')}</h3>
          <p className={`text-base md:text-lg font-bold ${monthlyBalance >= 0 ? 'text-slate-800' : 'text-red-600'} truncate`}>
            {formatCurrency(monthlyBalance)}
          </p>
        </div>

        <CreditCardBillWidget
          transactions={transactions}
          accounts={accounts}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* 캘린더 (거래 추가 카드 대체) */}
        <div className="lg:col-span-2">
          <Calendar
            visibleDate={visibleDate}
            onVisibleDateChange={onVisibleDateChange}
            selectedRange={selectedRange}
            onSelectedRangeChange={onSelectedRangeChange}
            onAddClick={() => {
              const evt = new CustomEvent('dashboard:add-transaction');
              window.dispatchEvent(evt);
            }}
            extraActions={
              <Suspense fallback={<span className="text-xs text-slate-400">AI…</span>}>
                <AIAssist data={data} />
              </Suspense>
            }
          />
        </div>

        {/* 거래 내역 */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-3 flex flex-col min-h-0 lg:min-h-0">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">{t('nav.transactions')}</h3>
            <input
              type="text"
              placeholder={t('placeholder.search')}
              aria-label={t('aria.searchTransactions')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md w-48"
            />
          </div>
          
          <div className="space-y-2 flex-1 min-h-0 overflow-visible lg:overflow-y-auto lg:max-h-[50vh] touch-pan-y">
            {filteredTransactions.length > 0 ? (
              <TransactionsList
                transactions={filteredTransactions}
                accounts={accounts}
                categories={categories}
                onUpdate={updateTransaction}
                onDelete={handleDelete}
                onDeleteDirect={deleteTransaction}
              />
            ) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-medium">{t('empty.noTransactions')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('empty.addFirst')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 분석 탭 컴포넌트 (CSS 기반 차트로 재구현)
const AnalyticsTab: React.FC<{
  transactions: Transaction[];
  accounts: any[];
  categories: any[];
  currentMonth: number;
  currentYear: number;
}> = ({ transactions, accounts, categories, currentMonth, currentYear }) => {
  
  // 월별 트렌드 데이터 (최근 6개월)
  const monthlyTrendData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === month && tDate.getFullYear() === year;
      });
      
      const income = monthTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        month: `${year.toString().slice(2)}년 ${month + 1}월`,
        income,
        expense,
        balance: income - expense
      });
    }
    
    return data;
  }, [transactions]);

  // 카테고리별 지출 분포 데이터
  const categoryExpenseData = React.useMemo(() => {
    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === TransactionType.EXPENSE &&
             tDate.getMonth() === currentMonth &&
             tDate.getFullYear() === currentYear;
    });

    const categoryTotals = currentMonthTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308'];
    
    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, currentMonth, currentYear]);

  // 계좌별 잔액 데이터
  const accountBalanceData = React.useMemo(() => {
    return accounts.map(account => ({
      name: account.name,
      value: account.balance || 0,
      color: account.propensity === 'CREDIT_CARD' ? '#ef4444' : 
             account.propensity === 'SAVINGS' ? '#10b981' : '#3b82f6'
    })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [accounts]);

  return (
    <div className="flex-1 flex flex-col space-y-6 min-h-0 overflow-y-auto">
      {/* 월별 트렌드 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📈 최근 6개월 트렌드</h3>
        <MonthlyTrendDisplay data={monthlyTrendData} />
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리 분포 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">🍩 이번 달 지출 분포</h3>
          <SimplePieChart data={categoryExpenseData} />
        </div>

        {/* 계좌별 잔액 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">💰 계좌별 잔액</h3>
          <SimpleBarChart data={accountBalanceData} />
        </div>
      </div>
    </div>
  );
};

// 위젯 탭 컴포넌트
const WidgetsTab: React.FC<{
  data: UseDataReturn;
  transactions: Transaction[];
  periodStart: Date;
  periodEnd: Date;
  currentMonth: number;
  currentYear: number;
}> = ({ data, transactions, periodStart, periodEnd, currentMonth, currentYear }) => {
  return (
    <div className="flex-1 flex flex-col space-y-4 md:space-y-6 min-h-0">
      {/* 위젯 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
        {/* 할부 위젯 */}
        <InstallmentsWidget
          installments={data.installments}
          periodStart={periodStart}
          periodEnd={periodEnd}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />

        {/* 반복 결제 위젯 */}
        <RecurringWidget
          transactions={transactions}
          periodStart={periodStart}
          periodEnd={periodEnd}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />

        {/* 이상치 위젯 - 전체 너비 */}
        <div className="md:col-span-2">
          <OutliersWidget
            transactions={transactions}
            periodStart={periodStart}
            periodEnd={periodEnd}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </div>
      </div>
    </div>
  );
};

type DashboardTab = 'overview' | 'analytics' | 'widgets';

export const DashboardPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { accounts, transactions, categories, addTransaction, updateTransaction, deleteTransaction } = data;
  const { t } = useI18n();
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [visibleDate, setVisibleDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // Calendar add button (desktop) → open add modal
  React.useEffect(() => {
    const handler = () => {
      setEditingTransaction(null);
      setIsEditModalOpen(true);
    };
    window.addEventListener('dashboard:add-transaction', handler as EventListener);
    return () => window.removeEventListener('dashboard:add-transaction', handler as EventListener);
  }, []);

  // Debug transactionType changes
  React.useEffect(() => {
    console.log('TransactionType changed to:', transactionType);
  }, [transactionType]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Inline form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    accountId: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    installmentMonths: 1,
    isInterestFree: false
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  // AI modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Responsive: form collapsed on mobile, open on desktop
  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const apply = (matches: boolean) => setIsDesktop(matches);
    apply(mql.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', listener);
    else if (mql.addListener) mql.addListener(listener as any);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', listener);
      else if (mql.removeListener) mql.removeListener(listener as any);
    };
  }, []);

  const monthStart = React.useMemo(() => new Date(currentYear, currentMonth, 1), [currentYear, currentMonth]);
  const monthEnd = React.useMemo(() => new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999), [currentYear, currentMonth]);
  const selectedStart = selectedRange ? selectedRange.start : monthStart;
  const selectedEnd = selectedRange ? selectedRange.end : monthEnd;
  const isInSelectedPeriod = (iso: string) => {
    const d = new Date(iso);
    return d >= selectedStart && d <= selectedEnd;
  };

  const monthlyIncomeTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.INCOME && isInSelectedPeriod(t.date))
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions, currentMonth, currentYear, selectedStart, selectedEnd]);

  const monthlyExpenseTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && isInSelectedPeriod(t.date))
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions, currentMonth, currentYear, selectedStart, selectedEnd]);

  const monthlyBalance = useMemo(() => monthlyIncomeTotal - monthlyExpenseTotal, [monthlyIncomeTotal, monthlyExpenseTotal]);

  // 지출 분포 위젯은 카드 결제 예상 위젯으로 대체됨

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => isInSelectedPeriod(t.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMonth, currentYear, selectedStart, selectedEnd]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.accountId || !formData.category) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const newTransaction = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: transactionType,
      accountId: formData.accountId,
      category: formData.category,
      date: formData.date,
      installmentMonths: formData.installmentMonths,
      isInterestFree: formData.isInterestFree
    };

    addTransaction(newTransaction);
    
    // Reset form
    setFormData({
      description: '',
      amount: '',
      accountId: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      installmentMonths: 1,
      isInterestFree: false
    });
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 거래를 삭제하시겠습니까?')) {
      deleteTransaction(id);
    }
  };

  const handleEditSave = (transaction: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in transaction) {
      updateTransaction(transaction);
    } else {
      addTransaction(transaction);
    }
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';
  const getCategoryPath = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName);
    if (!cat) return categoryName;
    const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  };

  // 탭 정의
  const dashboardTabs = [
    { id: 'overview' as DashboardTab, name: '개요', icon: '📊' },
    { id: 'analytics' as DashboardTab, name: '분석', icon: '📈' },
    { id: 'widgets' as DashboardTab, name: '위젯', icon: '⚡' }
  ];

  // month navigation is handled within Calendar
  
  return (
    <div className="h-full flex flex-col">
      {/* Sub Navigation only */}
      <div className="mb-2 flex flex-col flex-shrink-0 gap-3">
        {/* Dashboard Sub Navigation */}
        <div className="flex justify-center">
          <div className="relative inline-flex rounded-2xl bg-slate-100 p-1 overflow-hidden" role="tablist" aria-label={t('aria.dashboardTabs')}>
            {/* 슬라이딩 인디케이터 */}
            <div 
              className="absolute top-1 bottom-1 bg-indigo-600 rounded-xl shadow-sm transition-all duration-300 ease-out"
              style={{
                width: 'calc(33.333% - 2px)',
                left: '2px',
                transform: `translateX(${
                  activeTab === 'overview' ? '0%' :
                  activeTab === 'analytics' ? '100%' :
                  '200%'
                })`
              }}
            />
            
            {/* 탭 버튼들 */}
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap text-center ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                style={{ minWidth: '100px' }}
              >
                <span className="text-base mr-2">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* 탭별 콘텐츠 렌더링 */}
        {activeTab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            <OverviewTab 
              data={data}
              monthlyIncomeTotal={monthlyIncomeTotal}
              monthlyExpenseTotal={monthlyExpenseTotal}
              monthlyBalance={monthlyBalance}
              recentTransactions={recentTransactions}
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              currentMonth={currentMonth}
              currentYear={currentYear}
              selectedRange={selectedStart && selectedEnd ? { start: selectedStart, end: selectedEnd } : null}
              visibleDate={visibleDate}
              onVisibleDateChange={(d) => {
                setVisibleDate(d);
                setCurrentMonth(d.getMonth());
                setCurrentYear(d.getFullYear());
                // 선택이 없을 때는 월 변경에 맞춰 자동 월 범위 적용
                if (!selectedRange) {
                  // no-op, 월 범위는 파생값으로 계산됨
                }
              }}
              onSelectedRangeChange={(r) => {
                setSelectedRange(r);
              }}
              addTransaction={addTransaction}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
              handleDelete={handleDelete}
              t={t}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div role="tabpanel" id="panel-analytics" aria-labelledby="tab-analytics">
            <AnalyticsTab 
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          </div>
        )}

        {activeTab === 'widgets' && (
          <div role="tabpanel" id="panel-widgets" aria-labelledby="tab-widgets">
            <WidgetsTab 
              data={data}
              transactions={transactions}
              periodStart={selectedStart}
              periodEnd={selectedEnd}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          </div>
        )}
      </div>

      {/* Floating draggable toggle for form (mobile only) */}
      {!isDesktop && !isEditModalOpen && (
        <FloatingFormToggle 
          data={data}
          onOpen={() => {
            setEditingTransaction(null);
            setIsEditModalOpen(true);
          }} 
          onOpenAI={() => setIsAIModalOpen(true)}
        />
      )}

      {/* Edit Transaction Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }} 
        title={editingTransaction ? '거래 수정' : '거래 추가'}
      >
        {editingTransaction ? (
          <TransactionForm
            transaction={editingTransaction}
            accounts={accounts}
            categories={categories}
            onSave={handleEditSave}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingTransaction(null);
            }}
          />
        ) : (
          <AddTransactionFormInline
            accounts={accounts}
            categories={categories}
            onAdd={(tx) => { addTransaction(tx); setIsEditModalOpen(false); }}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </Modal>

      {/* AI Modal */}
      <Modal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        title="AI 거래 분석"
      >
        <React.Suspense fallback={<div className="text-center py-8">AI 로딩 중...</div>}>
          <AIAssist data={data} />
        </React.Suspense>
      </Modal>
    </div>
  );
};

// Floating draggable menu button (mobile only)
const FloatingFormToggle: React.FC<{ onOpen: () => void; onOpenAI: () => void; data: UseDataReturn }> = ({ onOpen, onOpenAI, data }) => {
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const dragging = React.useRef(false);
  const moved = React.useRef(false);
  const offset = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const start = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    // initial position near bottom-right
    const init = () => setPos({ x: (window.innerWidth - 72), y: (window.innerHeight - 140) });
    init();
    window.addEventListener('resize', init);
    return () => window.removeEventListener('resize', init);
  }, []);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const nx = e.clientX - offset.current.x;
      const ny = e.clientY - offset.current.y;
      const maxX = window.innerWidth - 56 - 8;
      const maxY = window.innerHeight - 56 - 8;
      setPos({ x: Math.min(Math.max(8, nx), maxX), y: Math.min(Math.max(8, ny), maxY) });
      // 이동 임계값 초과 시 클릭 무시 플래그
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true;
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  // 메뉴 심볼 아이콘
  const menuIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
    </svg>
  );

  return (
    <div 
      className="fixed lg:hidden z-50"
      style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
      onPointerDown={onPointerDown}
    >
      <FloatingActionMenu 
        triggerIcon={menuIcon}
        position="left"
        className="w-14 h-14 rounded-full shadow-lg border border-slate-400 bg-white hover:bg-slate-50 transition-all duration-200"
      >
        <>
          {/* 거래 추가 버튼 */}
          <button
            onClick={(ev) => {
              // 드래그 직후 클릭 방지
              if (dragging.current || moved.current) {
                ev.preventDefault();
                ev.stopPropagation();
                moved.current = false;
                return;
              }
              onOpen();
            }}
            aria-label="거래 추가"
            className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 focus:bg-indigo-700 text-white flex items-center justify-center shadow-lg border-2 border-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
          
          {/* AI 어시스트 버튼 */}
          <button
            onClick={() => onOpenAI()}
            aria-label="AI 거래 분석"
            className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 focus:bg-purple-700 text-white flex items-center justify-center shadow-lg border-2 border-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <AIIcon />
          </button>
        </>
      </FloatingActionMenu>
    </div>
  );
};
