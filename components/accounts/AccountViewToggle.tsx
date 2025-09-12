import React from 'react';

export type ViewMode = 'card' | 'list' | 'table';

interface AccountViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  accountCount?: number;
}

export const AccountViewToggle: React.FC<AccountViewToggleProps> = ({ 
  viewMode, 
  onViewModeChange, 
  accountCount 
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-slate-800">자산 관리</h2>
        {accountCount !== undefined && (
          <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
            {accountCount}개 계좌
          </span>
        )}
      </div>

      <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-white">
        <button
          onClick={() => onViewModeChange('card')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === 'card'
              ? 'bg-indigo-100 text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
          title="카드형 보기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="hidden sm:inline">카드</span>
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === 'list'
              ? 'bg-indigo-100 text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
          title="목록형 보기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="hidden sm:inline">목록</span>
        </button>
        <button
          onClick={() => onViewModeChange('table')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === 'table'
              ? 'bg-indigo-100 text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
          title="테이블 보기 (데스크톱)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h12a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
          </svg>
          <span className="hidden sm:inline">테이블</span>
        </button>
      </div>
    </div>
  );
};