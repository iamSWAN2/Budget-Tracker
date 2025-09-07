
import React from 'react';
import { Page } from '../../types';
import { DashboardIcon, AccountsIcon, InstallmentsIcon, LogoIcon } from '../icons/Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen = true, onClose }) => {
  const navItems: { id: Page; label: string; icon: JSX.Element }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'accounts', label: 'Accounts', icon: <AccountsIcon /> },
    { id: 'installments', label: 'Installments', icon: <InstallmentsIcon /> },
  ];

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    if (onClose) onClose(); // Close mobile sidebar after navigation
  };

  return (
    <>
      {/* Desktop Sidebar - Always visible on large screens */}
      <nav className="hidden lg:flex w-64 bg-white shadow-md flex-col h-screen">
        <div className="flex items-center justify-center h-20 border-b">
          <LogoIcon />
          <h1 className="text-xl font-bold text-slate-800 ml-2">Ledger</h1>
        </div>
        <ul className="flex-1 px-4 py-6">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => handleNavClick(item.id)}
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

      {/* Mobile Sidebar - Slide-in overlay */}
      <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center">
            <LogoIcon />
            <h1 className="text-lg font-bold text-slate-800 ml-2">Ledger</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <ul className="px-4 py-6 space-y-2">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 text-left
                  ${currentPage === item.id 
                    ? 'bg-primary-500 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-primary-100 hover:text-primary-600'
                  }`}
              >
                <span className="w-6 h-6 flex-shrink-0">{item.icon}</span>
                <span className="ml-3 font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} AI Household Ledger
        </div>
      </nav>
    </>
  );
};
