
import React from 'react';
import { CloseIcon } from '../icons/Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end sm:items-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 p-2 sm:p-1 -mr-2 sm:-mr-1"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};
