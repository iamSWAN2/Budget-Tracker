import React, { useMemo, useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { TransactionType, Transaction } from '../types';
import AIAssist from '../components/AIAssist';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { AddTransactionFormInline } from '../components/forms/AddTransactionFormInline';
import { formatCurrency, formatDateDisplay, formatMonthKo } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { TransactionsList } from '../components/transactions/TransactionsList';
import { PlusIcon } from '../components/icons/Icons';

export const DashboardPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { accounts, transactions, categories, addTransaction, updateTransaction, deleteTransaction } = data;
  const { t } = useI18n();
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  
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
  const [isDesktop, setIsDesktop] = useState(false);

  // Responsive: form collapsed on mobile, open on desktop
  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const apply = (matches: boolean) => {
      setIsDesktop(matches);
      // 데스크톱은 인라인 폼, 모바일은 모달로 처리
    };
    apply(mql.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', listener);
    // Fallback for older browsers
    // @ts-ignore
    else if (mql.addListener) mql.addListener(listener);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', listener);
      // @ts-ignore
      else if (mql.removeListener) mql.removeListener(listener);
    };
  }, []);

  const monthlyIncomeTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.INCOME && 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions, currentMonth, currentYear]);

  const monthlyExpenseTotal = useMemo(() => (
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0)
  ), [transactions, currentMonth, currentYear]);

  const monthlyBalance = useMemo(() => monthlyIncomeTotal - monthlyExpenseTotal, [monthlyIncomeTotal, monthlyExpenseTotal]);

  const monthlyExpenseByCategory = useMemo(() => {
    try {
      const expenses = transactions.filter(t =>
        t.type === TransactionType.EXPENSE &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
      );

      const categoryTotals = expenses.reduce((acc, curr) => {
        const key = curr.category || '기타';
        const amount = Number(curr.amount) || 0;
        acc[key] = (acc[key] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

      const items: { category: string; amount: number }[] = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount: Number(amount) || 0 }));

      items.sort((a, b) => (b?.amount ?? 0) - (a?.amount ?? 0));
      return items.slice(0, 5);
    } catch {
      return [] as { category: string; amount: number }[];
    }
  }, [transactions, currentMonth, currentYear]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      ;
  }, [transactions, currentMonth, currentYear]);

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

  const formatMonth = (month: number, year: number) => formatMonthKo(month, year);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Month Navigation */}
      <div className="flex items-center justify-center mb-4 flex-shrink-0">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
        >
          ← {t('month.prev')}
        </button>
        <h2 className="mx-6 text-xl font-semibold text-slate-800">
          {formatMonth(currentMonth, currentYear)}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
        >
          {t('month.next')} →
        </button>
      </div>

      <div className="flex-1 flex flex-col space-y-4 md:space-y-6 min-h-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-2 md:p-4">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.income')}</h3>
            <p className="text-sm md:text-lg font-bold text-green-600 truncate">{formatCurrency(monthlyIncomeTotal)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-2 md:p-4">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.expense')}</h3>
            <p className="text-sm md:text-lg font-bold text-red-600 truncate">{formatCurrency(monthlyExpenseTotal)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-2 md:p-4">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.balance')}</h3>
            <p className={`text-sm md:text-lg font-bold ${monthlyBalance >= 0 ? 'text-slate-800' : 'text-red-600'} truncate`}>
              {formatCurrency(monthlyBalance)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-2 md:p-4 col-span-4 md:col-span-1">
            <h3 className="text-xs font-medium text-slate-600 mb-1">{t('summary.breakdown')}</h3>
            <div className="space-y-1">
              {monthlyExpenseByCategory.length > 0 ? (
                monthlyExpenseByCategory.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-[11px] md:text-xs text-slate-600">
                    {item.category}: {formatCurrency(item.amount)}
                  </div>
                ))
              ) : (
                <p className="text-[11px] md:text-xs text-slate-400">No expenses to display.</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid - Optimized Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          {/* Add New Transaction - Desktop only (mobile uses FAB + modal) */}
          <div className="hidden lg:block bg-white rounded-lg shadow-md p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800">{t('form.addTransaction')}</h3>
              <div className="flex items-center gap-2"><AIAssist data={data} /></div>
            </div>
            <AddTransactionFormInline accounts={accounts} categories={categories} onAdd={addTransaction} />
          </div>

          {/* Transaction History - Expanded */}
          <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-3 flex flex-col min-h-0 lg:min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-800">{t('nav.transactions')}</h3>
              <input
                type="text"
                placeholder={t('placeholder.search')}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md w-48"
              />
            </div>
            
            <div className="space-y-2 flex-1 min-h-0 overflow-visible lg:overflow-y-auto lg:max-h-[50vh] touch-pan-y">
              {recentTransactions.length > 0 ? (
                <TransactionsList
                  transactions={recentTransactions}
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
                  <p className="text-slate-500 text-sm font-medium">No transactions yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Add a transaction to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating draggable toggle for form (mobile only) */}
      {!isDesktop && !isEditModalOpen && (
        <FloatingFormToggle onOpen={() => {
          setEditingTransaction(null);
          setIsEditModalOpen(true);
        }} />
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
    </div>
  );
};

// Floating draggable round toggle button (mobile only)
const FloatingFormToggle: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
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

  return (
    <button
      aria-label={'거래 폼 열기'}
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
      onPointerDown={onPointerDown}
      className={
        'fixed lg:hidden z-50 w-14 h-14 rounded-full shadow-lg border border-slate-200 flex items-center justify-center bg-indigo-600 text-white'
      }
      style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
    >
      <svg className={'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
};
