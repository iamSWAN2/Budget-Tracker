
import React, { useState, useMemo } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useData } from './hooks/useData';
import { Page } from './types';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { UISettingsProvider, useUISettings } from './ui/UISettingsProvider';

function AppInner() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [txFilter, setTxFilter] = useState<{ q?: string; start?: string; end?: string } | null>(null);
  const data = useData();
  const { t, lang, toggle } = useI18n();
  const { density, toggleDensity } = useUISettings();

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const page = ce.detail?.page as Page | undefined;
      if (page) {
        if (ce.detail?.filter) setTxFilter(ce.detail.filter as { q?: string; start?: string; end?: string });
        setCurrentPage(page);
      }
    };
    window.addEventListener('app:navigate', handler as EventListener);
    return () => window.removeEventListener('app:navigate', handler as EventListener);
  }, []);

  const CurrentPageComponent = useMemo(() => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage data={data} />;
      case 'accounts':
        return <AccountsPage data={data} />;
      case 'transactions':
        return <TransactionsPage data={data} initialFilter={txFilter ?? undefined} />;
      case 'settings':
        return <SettingsPage data={data} />;
      default:
        return <DashboardPage data={data} />;
    }
  }, [currentPage, data]);

  return (
    <div className="min-h-[100svh] bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">Household Ledger</h1>
            <p className="text-slate-600">{t('app.subtitle')}</p>
          </div>
          
          {/* Navigation */}
          <nav className="mt-6 flex justify-center items-center space-x-3">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {t('nav.dashboard')}
              </button>
              <button
                onClick={() => setCurrentPage('accounts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'accounts'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                자산
              </button>
              <button
                onClick={() => setCurrentPage('transactions')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'transactions'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {t('nav.transactions')}
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'settings'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {t('nav.settings')}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-auto lg:overflow-hidden">
        {data.isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-lg text-slate-600 text-center">
              {t('loading')}
            </div>
          </div>
        ) : data.error ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-lg text-red-500 bg-red-100 p-4 rounded-lg max-w-md">
              {t('error')}
            </div>
          </div>
        ) : (
          <div className="h-full">
            {CurrentPageComponent}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <UISettingsProvider>
        <AppInner />
      </UISettingsProvider>
    </I18nProvider>
  );
}
