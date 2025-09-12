import React from 'react';

interface AddAccountButtonProps {
  onAdd: () => void;
}

export const AddAccountButton: React.FC<AddAccountButtonProps> = ({ onAdd }) => {
  return (
    <button
      onClick={onAdd}
      className="w-full bg-white border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div className="text-left">
        <div className="font-medium text-slate-600 group-hover:text-indigo-600">새 계좌 추가</div>
        <div className="text-xs text-slate-400 group-hover:text-indigo-500">계좌를 추가하여 자산을 관리하세요</div>
      </div>
    </button>
  );
};