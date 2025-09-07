
import React from 'react';
import { Page } from '../../types';
import { DashboardIcon, AccountsIcon, InstallmentsIcon, LogoIcon } from '../icons/Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const navItems: { id: Page; label: string; icon: JSX.Element }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'accounts', label: 'Accounts', icon: <AccountsIcon /> },
    { id: 'installments', label: 'Installments', icon: <InstallmentsIcon /> },
  ];

  return (
    <nav className="w-64 bg-white shadow-md flex flex-col">
      <div className="flex items-center justify-center h-20 border-b">
        <LogoIcon />
        <h1 className="text-xl font-bold text-slate-800 ml-2">Ledger</h1>
      </div>
      <ul className="flex-1 px-4 py-6">
        {navItems.map(item => (
          <li key={item.id}>
            <button
              onClick={() => setCurrentPage(item.id)}
              className={`flex items-center w-full px-4 py-3 my-1 rounded-lg transition-colors duration-200
                ${currentPage === item.id 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-primary-100 hover:text-primary-600'
                }`}
            >
              <span className="w-6 h-6">{item.icon}</span>
              <span className="ml-4 font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} AI Household Ledger
      </div>
    </nav>
  );
};
