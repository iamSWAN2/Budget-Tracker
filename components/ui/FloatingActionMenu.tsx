import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  triggerIcon?: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
}

const defaultTriggerIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
  </svg>
);

export const FloatingActionMenu: React.FC<Props> = ({ 
  children, 
  triggerIcon = defaultTriggerIcon, 
  position = 'right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        triggerRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const positionClasses = position === 'left' 
    ? 'right-full mr-2 origin-bottom-right' 
    : 'left-full ml-2 origin-bottom-left';

  return (
    <div className={`relative ${className}`}>
      {/* 트리거 버튼 (메뉴 닫혔을 때만 표시) */}
      {!isOpen && (
        <button
          ref={triggerRef}
          onClick={toggleMenu}
          aria-label="더보기 메뉴"
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="w-full h-full rounded-full bg-white border border-slate-400 text-slate-600 hover:bg-slate-50 flex items-center justify-center shadow-lg transition-all duration-300 ease-out"
        >
          <div className="transform transition-transform duration-200">
            {triggerIcon}
          </div>
        </button>
      )}

      {/* 확장 메뉴 (세로 배치) */}
      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-0 left-0 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className={`flex flex-col gap-3 transform transition-all duration-300 ease-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingActionMenu;