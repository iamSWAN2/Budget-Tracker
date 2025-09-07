
import React from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Card } from '../components/ui/Card';
import { Installment } from '../types';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const InstallmentsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { installments, accounts } = data;

  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Active Installment Plans</h3>
        <p className="text-sm text-slate-500">
          These are automatically tracked from expenses marked as installment payments. They will disappear from this list once fully paid.
        </p>
      </div>
      {installments.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <p>No active installment plans found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installments.map((inst) => (
            <Card key={inst.id} title={inst.description}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Payment:</span>
                  <span className="font-semibold text-primary-600">{formatCurrency(inst.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Payments:</span>
                  <span className="font-semibold text-slate-700">{inst.remainingMonths} / {inst.totalMonths}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(inst.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account:</span>
                  <span className="font-semibold text-slate-700">{getAccountName(inst.accountId)}</span>
                </div>

                <div className="pt-2">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div 
                            className="bg-primary-600 h-2.5 rounded-full" 
                            style={{ width: `${((inst.totalMonths - inst.remainingMonths) / inst.totalMonths) * 100}%` }}>
                        </div>
                    </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
