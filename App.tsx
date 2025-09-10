
import React, { useState, useMemo, Suspense, useEffect } from 'react';
// pages는 named export를 사용하므로 lazy 로드 시 default로 매핑
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AccountsPage = React.lazy(() => import('./pages/AccountsPage').then(m => ({ default: m.AccountsPage })));
const TransactionsPage = React.lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
import { useData } from './hooks/useData';
import { Page } from './types';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { UISettingsProvider, useUISettings } from './ui/UISettingsProvider';
import { Spinner } from './components/ui/Spinner';

function AppInner() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [txFilter, setTxFilter] = useState<{ q?: string; start?: string; end?: string } | null>(null);
  const [appTitle, setAppTitle] = useState<string>('Household Ledger');
  const [titleColor, setTitleColor] = useState<string>('#4f46e5'); // default indigo-600
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const data = useData();
  const { t, lang, toggle } = useI18n();
  const { density, toggleDensity } = useUISettings();

  // Load saved title and color from localStorage
  useEffect(() => {
    const savedTitle = localStorage.getItem('app-title');
    const savedColor = localStorage.getItem('app-title-color');
    if (savedTitle) {
      setAppTitle(savedTitle);
    }
    if (savedColor) {
      setTitleColor(savedColor);
    }
  }, []);

  // Listen for settings changes from the settings page
  useEffect(() => {
    const handleTitleColorChange = (event: CustomEvent) => {
      setTitleColor(event.detail);
    };

    window.addEventListener('title-color-changed', handleTitleColorChange as EventListener);
    
    return () => {
      window.removeEventListener('title-color-changed', handleTitleColorChange as EventListener);
    };
  }, []);

  // Save title to localStorage when changed
  const saveTitle = (newTitle: string) => {
    setAppTitle(newTitle);
    localStorage.setItem('app-title', newTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      saveTitle(target.value);
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

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
    <div className="min-h-[100svh] bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            {isEditingTitle ? (
              <input
                type="text"
                defaultValue={appTitle}
                onKeyDown={handleTitleKeyPress}
                onBlur={(e) => saveTitle(e.target.value)}
                className="text-3xl font-bold mb-2 bg-transparent border-b-2 focus:outline-none text-center"
                style={{ 
                  color: titleColor,
                  borderColor: `${titleColor}50`,
                  width: `${Math.max(appTitle.length * 0.6, 10)}em` 
                }}
                autoFocus
              />
            ) : (
              <h1 
                className="text-3xl font-bold mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: titleColor }}
                onClick={() => setIsEditingTitle(true)}
                title="클릭하여 제목 편집"
              >
                {appTitle}
              </h1>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="mt-6 flex justify-center items-center px-4">
            <div className="relative inline-flex rounded-2xl bg-slate-100 p-1 overflow-hidden w-full max-w-md">
              {/* Sliding Background Indicator */}
              <div 
                className="absolute top-1 bottom-1 bg-indigo-600 rounded-xl shadow-sm transition-all duration-300 ease-out"
                style={{
                  width: 'calc(25% - 2px)',
                  left: '2px',
                  transform: `translateX(${
                    currentPage === 'dashboard' ? '0%' :
                    currentPage === 'accounts' ? '100%' :
                    currentPage === 'transactions' ? '200%' :
                    '300%'
                  })`
                }}
              />
              
              {/* Navigation Buttons */}
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`relative z-10 flex-1 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap text-center ${
                  currentPage === 'dashboard'
                    ? 'text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {t('nav.dashboard')}
              </button>
              <button
                onClick={() => setCurrentPage('accounts')}
                className={`relative z-10 flex-1 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap text-center ${
                  currentPage === 'accounts'
                    ? 'text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                자산
              </button>
              <button
                onClick={() => setCurrentPage('transactions')}
                className={`relative z-10 flex-1 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap text-center ${
                  currentPage === 'transactions'
                    ? 'text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {t('nav.transactions')}
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`relative z-10 flex-1 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap text-center ${
                  currentPage === 'settings'
                    ? 'text-white'
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
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
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner /></div>}>
              {CurrentPageComponent}
            </Suspense>
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
