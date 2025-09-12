import React from 'react';
import { UseDataReturn } from '../../hooks/useData';
import { FloatingActionMenu } from './FloatingActionMenu';
import { AIIcon } from '../icons/Icons';

interface FloatingActionToggleProps {
  onOpen: () => void;
  onOpenAI: () => void;
  data: UseDataReturn;
}

export const FloatingActionToggle: React.FC<FloatingActionToggleProps> = ({ onOpen, onOpenAI, data }) => {
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const dragging = React.useRef(false);
  const moved = React.useRef(false);
  const offset = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const start = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    // initial position near bottom-right
    const init = () => setPos({ x: (window.innerWidth - 72), y: (window.innerHeight - 140) });
    init();
    window.addEventListener('resize', init);
    return () => window.removeEventListener('resize', init);
  }, []);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const nx = e.clientX - offset.current.x;
      const ny = e.clientY - offset.current.y;
      const maxX = window.innerWidth - 56 - 8;
      const maxY = window.innerHeight - 56 - 8;
      setPos({ x: Math.min(Math.max(8, nx), maxX), y: Math.min(Math.max(8, ny), maxY) });
      // 이동 임계값 초과 시 클릭 무시 플래그
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true;
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  // 메뉴 심볼 아이콘
  const menuIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
    </svg>
  );

  return (
    <div 
      className="fixed lg:hidden z-50"
      style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
      onPointerDown={onPointerDown}
    >
      <FloatingActionMenu 
        triggerIcon={menuIcon}
        position="left"
        className="w-14 h-14"
      >
        <>
          {/* 거래 추가 버튼 */}
          <button
            onClick={(ev) => {
              // 드래그 직후 클릭 방지
              if (dragging.current || moved.current) {
                ev.preventDefault();
                ev.stopPropagation();
                moved.current = false;
                return;
              }
              onOpen();
            }}
            aria-label="거래 추가"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 active:from-indigo-600 active:to-indigo-800 text-white flex items-center justify-center shadow-xl hover:shadow-2xl active:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
          
          {/* AI 어시스트 버튼 */}
          <button
            onClick={() => onOpenAI()}
            aria-label="AI 거래 분석"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 active:from-purple-600 active:to-purple-800 text-white flex items-center justify-center shadow-xl hover:shadow-2xl active:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
          >
            <AIIcon />
          </button>
        </>
      </FloatingActionMenu>
    </div>
  );
};

export default FloatingActionToggle;