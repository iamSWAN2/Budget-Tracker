
import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { useData } from './hooks/useData';
import { Page } from './types';
import { InstallmentsPage } from './pages/InstallmentsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const data = useData();

  const CurrentPageComponent = useMemo(() => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage data={data} />;
      case 'accounts':
        return <AccountsPage data={data} />;
      case 'installments':
        return <InstallmentsPage data={data} />;
      default:
        return <DashboardPage data={data} />;
    }
  }, [currentPage, data]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          {data.isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-xl text-slate-600">Loading your financial data...</div>
            </div>
          ) : data.error ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-xl text-red-500 bg-red-100 p-4 rounded-lg">{data.error}</div>
            </div>
          ) : (
            CurrentPageComponent
          )}
        </main>
      </div>
    </div>
  );
}
