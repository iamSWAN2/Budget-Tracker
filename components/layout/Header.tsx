
import React from 'react';
import { Page } from '../../types';

interface HeaderProps {
  currentPage: Page;
  onMenuClick?: () => void;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard Overview',
  transactions: 'All Transactions',
  accounts: 'Manage Accounts',
  installments: 'Installment Payments',
  settings: 'Settings',
};

export const Header: React.FC<HeaderProps> = ({ currentPage, onMenuClick }) => {
  return (
    <header className="bg-white h-16 lg:h-20 flex items-center px-4 lg:px-6 shadow-sm z-10 border-b border-slate-200">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-600 hover:bg-slate-100 mr-3"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Page title */}
      <h2 className="text-lg lg:text-2xl font-semibold text-slate-800">
        {pageTitles[currentPage]}
      </h2>
      
      {/* Right side - can be expanded later */}
      <div className="ml-auto">
        {/* Future: user profile, notifications, etc. */}
      </div>
    </header>
  );
};
