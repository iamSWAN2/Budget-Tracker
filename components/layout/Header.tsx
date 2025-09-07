
import React from 'react';
import { Page } from '../../types';

interface HeaderProps {
  currentPage: Page;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard Overview',
  transactions: 'All Transactions',
  accounts: 'Manage Accounts',
  installments: 'Installment Payments',
};

export const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  return (
    <header className="bg-white h-20 flex items-center px-6 shadow-sm z-10">
      <h2 className="text-2xl font-semibold text-slate-800">{pageTitles[currentPage]}</h2>
    </header>
  );
};
