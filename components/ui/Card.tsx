
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', titleAction }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 h-full flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        {titleAction}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};
