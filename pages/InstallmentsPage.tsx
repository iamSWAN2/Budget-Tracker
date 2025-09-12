
import React, { useState, useEffect, useRef } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Card } from '../components/ui/Card';
import { Installment } from '../types';
import { formatCurrency } from '../utils/format';
const AIAssist = React.lazy(() => import('../components/AIAssist'));
import { AIAssistRef } from '../components/AIAssist';
import { FloatingActionToggle } from '../components/ui/FloatingActionToggle';

export const InstallmentsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { installments, accounts } = data;
  const [isDesktop, setIsDesktop] = useState(false);
  const aiAssistRef = useRef<AIAssistRef>(null);

  // 데스크톱 감지
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', listener);
    else if (mql.addListener) mql.addListener(listener as any);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', listener);
      else if (mql.removeListener) mql.removeListener(listener as any);
    };
  }, []);

  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-700">활성 할부 계획</h3>
        <p className="text-sm text-slate-500">
          할부 결제로 표시된 지출에서 자동으로 추적됩니다. 완전히 결제되면 이 목록에서 사라집니다.
        </p>
      </div>
      {installments.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <p>활성 할부 계획이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installments.map((inst) => (
            <Card key={inst.id} title={inst.description}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">월 납부액:</span>
                  <span className="font-semibold text-indigo-600">{formatCurrency(inst.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">남은 납부 횟수:</span>
                  <span className="font-semibold text-slate-700">{inst.remainingMonths} / {inst.totalMonths}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">총 금액:</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(inst.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">계좌:</span>
                  <span className="font-semibold text-slate-700">{getAccountName(inst.accountId)}</span>
                </div>

                <div className="pt-2">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${((inst.totalMonths - inst.remainingMonths) / inst.totalMonths) * 100}%` }}>
                        </div>
                    </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile Floating Action Button */}
      {!isDesktop && (
        <FloatingActionToggle 
          data={data}
          onOpen={() => {
            // InstallmentsPage에서는 거래 추가 기능을 TransactionsPage로 연결
            window.location.hash = '#/transactions';
          }} 
          onOpenAI={() => aiAssistRef.current?.openModal()}
        />
      )}

      {/* AIAssist 컴포넌트 - ref로 모달 제어 */}
      <React.Suspense fallback={<div className="hidden">AI 로딩 중...</div>}>
        <AIAssist ref={aiAssistRef} data={data} showTrigger={false} />
      </React.Suspense>
    </div>
  );
};
