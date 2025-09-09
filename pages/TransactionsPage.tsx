
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Transaction, TransactionType } from '../types';
import { PlusIcon } from '../components/icons/Icons';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { AddTransactionFormInline } from '../components/forms/AddTransactionFormInline';
import { EditTransactionFormInline } from '../components/forms/EditTransactionFormInline';
import { AddTransactionFormInline } from '../components/forms/AddTransactionFormInline';
const AIAssist = React.lazy(() => import('../components/AIAssist'));
import { formatDateDisplay } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';
import { useUISettings } from '../ui/UISettingsProvider';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { TransactionsList } from '../components/transactions/TransactionsList';

export const TransactionsPage: React.FC<{ data: UseDataReturn; initialFilter?: { q?: string; start?: string; end?: string; category?: string; accountId?: string } }> = ({ data, initialFilter }) => {
    const { transactions, accounts, categories, addTransaction, updateTransaction, deleteTransaction } = data;
    const { t } = useI18n();
    const { density } = useUISettings();
    const rowY = density === 'compact' ? 'py-1.5' : 'py-2.5';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [q, setQ] = useState<string>(initialFilter?.q ?? '');
    const [qInput, setQInput] = useState<string>(initialFilter?.q ?? '');
    const [range, setRange] = useState<{ start?: string; end?: string }>({ start: initialFilter?.start, end: initialFilter?.end });
    const [category, setCategory] = useState<string | undefined>(initialFilter?.category);
    const [accountId, setAccountId] = useState<string | undefined>(initialFilter?.accountId);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
      if (initialFilter?.q !== undefined) {
        setQ(initialFilter.q);
        setQInput(initialFilter.q);
      }
      if (initialFilter?.start !== undefined || initialFilter?.end !== undefined) {
        setRange({ start: initialFilter?.start, end: initialFilter?.end });
      }
      if (initialFilter?.category !== undefined) setCategory(initialFilter.category);
      if (initialFilter?.accountId !== undefined) setAccountId(initialFilter.accountId);
    }, [initialFilter?.q, initialFilter?.start, initialFilter?.end]);

    // debounce qInput -> q
    useEffect(() => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setQ(qInput);
      }, 250);
      return () => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
      };
    }, [qInput]);

    const filtered = useMemo(() => {
      const query = q.trim().toLowerCase();
      const startDate = range.start ? new Date(range.start) : null;
      const endDate = range.end ? new Date(range.end) : null;
      return transactions.filter(t => {
        const matchesQuery = !query || (t.description || '').toLowerCase().includes(query) || (t.category || '').toLowerCase().includes(query);
        const matchesCategory = !category || t.category === category;
        const matchesAccount = !accountId || t.accountId === accountId;
        const d = new Date(t.date);
        const inRange = (!startDate || d >= startDate) && (!endDate || d <= endDate);
        return matchesQuery && matchesCategory && matchesAccount && inRange;
      });
    }, [transactions, q, range.start, range.end, category, accountId]);

    const handleAdd = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('이 거래를 삭제하시겠습니까?')) {
            deleteTransaction(id);
        }
    };
    
    const handleSave = (transaction: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in transaction) {
            updateTransaction(transaction);
        } else {
            addTransaction(transaction);
        }
    };

    const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';
    const getCategoryPath = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);
        if (!cat) return categoryName;
        const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
        return parent ? `${parent.name} > ${cat.name}` : cat.name;
    };
    
    return (
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col mx-auto w-full max-w-3xl lg:max-w-4xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-slate-700">{t('nav.transactions')}</h3>
                <div className="flex items-center space-x-2">
                  <input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder={t('placeholder.search')}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md w-40"
                  />
                  <select
                    value={category ?? ''}
                    onChange={(e) => setCategory(e.target.value || undefined)}
                    className="px-2 py-1.5 text-sm border border-slate-300 rounded-md"
                    title="카테고리 선택"
                  >
                    <option value="">전체 카테고리</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={accountId ?? ''}
                    onChange={(e) => setAccountId(e.target.value || undefined)}
                    className="px-2 py-1.5 text-sm border border-slate-300 rounded-md"
                    title="계좌 선택"
                  >
                    <option value="">전체 계좌</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <React.Suspense fallback={<span className="text-xs text-slate-400">AI…</span>}>
                    <AIAssist data={data} />
                  </React.Suspense>
                  <button 
                    onClick={handleAdd} 
                    disabled={accounts.length === 0}
                    className={`flex items-center justify-center px-2.5 py-1.5 rounded-md ${
                      accounts.length === 0 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    aria-label={t('form.addTransaction')}
                    title={t('form.addTransaction')}
                  >
                      <PlusIcon />
                  </button>
                </div>
            </div>
            {/* Active Filters */}
            {(q || range.start || range.end || category || accountId) && (
              <div className="mb-3 flex items-center flex-wrap gap-2 text-xs">
                {q && (
                  <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  검색: “{q}”
                  <button className="text-slate-500 hover:text-slate-800" onClick={() => { setQ(''); setQInput(''); }}>×</button>
                  </span>
                )}
                {(range.start || range.end) && (
                  <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  기간: {range.start ? new Date(range.start).toLocaleDateString('ko-KR') : '…'} ~ {range.end ? new Date(range.end).toLocaleDateString('ko-KR') : '…'}
                  <button className="text-slate-500 hover:text-slate-800" onClick={() => setRange({ start: undefined, end: undefined })}>×</button>
                  </span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    카테고리: {category}
                    <button className="text-slate-500 hover:text-slate-800" onClick={() => setCategory(undefined)}>×</button>
                  </span>
                )}
                {accountId && (
                  <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    계좌: {(() => accounts.find(a => a.id === accountId)?.name || accountId)()}
                    <button className="text-slate-500 hover:text-slate-800" onClick={() => setAccountId(undefined)}>×</button>
                  </span>
                )}
                <button
                  className="ml-auto text-slate-500 hover:text-slate-800 underline"
                  onClick={() => { setQ(''); setQInput(''); setRange({ start: undefined, end: undefined }); setCategory(undefined); setAccountId(undefined); }}
                >
                  필터 초기화
                </button>
              </div>
            )}

            {/* Result count */}
            <div className="mb-3 text-xs text-slate-500">검색 결과: {filtered.length}건</div>
            
            {accounts.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">거래를 추가하려면 먼저 계좌를 생성해주세요.</p>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-2">
                {filtered.length > 0 ? (
                  <TransactionsList
                    transactions={filtered}
                    accounts={accounts}
                    categories={categories}
                    onUpdate={updateTransaction}
                    onDelete={handleDelete}
                    onDeleteDirect={deleteTransaction}
                  />
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium text-lg">거래 내역이 없습니다</p>
                    <p className="text-slate-400 mt-2">첫 번째 거래를 추가해보세요!</p>
                  </div>
                )}
              </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? '거래 수정' : '거래 추가'}>
                {editingTransaction ? (
                  <EditTransactionFormInline
                    transaction={editingTransaction}
                    accounts={accounts}
                    categories={categories}
                    onSave={(tx) => { updateTransaction(tx); setIsModalOpen(false); }}
                    onClose={() => setIsModalOpen(false)}
                  />
                ) : (
                  <AddTransactionFormInline
                    accounts={accounts}
                    categories={categories}
                    onAdd={(tx) => { addTransaction(tx); setIsModalOpen(false); }}
                  />
                )}
            </Modal>
        </div>
    );
};
