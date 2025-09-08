
import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useData } from './hooks/useData';
import { Page } from './types';
import { InstallmentsPage } from './pages/InstallmentsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const data = useData();

  const CurrentPageComponent = useMemo(() => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage data={data} />;
      case 'accounts':
        return <AccountsPage data={data} />;
      case 'transactions':
        return <TransactionsPage data={data} />;
      case 'installments':
        return <InstallmentsPage data={data} />;
      case 'settings':
        return <SettingsPage data={data} />;
      default:
        return <DashboardPage data={data} />;
    }
  }, [currentPage, data]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Desktop: flex layout, Mobile: stacked */}
      <div className="lg:flex">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 lg:flex lg:flex-col min-h-screen">
          <Header 
            currentPage={currentPage} 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-2 sm:p-4 lg:p-6">
            {data.isLoading ? (
              <div className="flex justify-center items-center h-64 lg:h-full">
                <div className="text-lg lg:text-xl text-slate-600 text-center px-4">
                  Loading your financial data...
                </div>
              </div>
            ) : data.error ? (
              <div className="flex justify-center items-center h-64 lg:h-full">
                <div className="text-sm lg:text-xl text-red-500 bg-red-100 p-3 lg:p-4 rounded-lg mx-4 max-w-md">
                  {data.error}
                </div>
              </div>
            ) : (
              CurrentPageComponent
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
