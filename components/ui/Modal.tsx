
import React, { useEffect } from 'react';
import { CloseIcon } from '../icons/Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div 
        className="bg-white rounded-t-lg sm:rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg relative max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 sm:p-6 pb-4 border-b bg-white flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 p-2 sm:p-1 -mr-2 sm:-mr-1"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4 sm:p-6 pt-0 pb-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
