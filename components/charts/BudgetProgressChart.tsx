import React from 'react';
import { formatCurrency } from '../../utils/format';

interface BudgetData {
  category: string;
  budget: number;
  spent: number;
  color: string;
}

interface BudgetProgressChartProps {
  data: BudgetData[];
}

const ProgressBar: React.FC<{
  category: string;
  budget: number;
  spent: number;
  color: string;
}> = ({ category, budget, spent, color }) => {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">{category}</span>
        <div className="text-xs text-slate-500">
          <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
            {formatCurrency(spent)}
          </span>
          <span className="text-slate-400"> / {formatCurrency(budget)}</span>
        </div>
      </div>
      
      <div className="relative">
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-red-500' : ''
            }`}
            style={{ 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isOverBudget ? '#ef4444' : color
            }}
          />
          {isOverBudget && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          )}
        </div>
        
        <div className="flex justify-between text-xs mt-1">
          <span className={`font-medium ${
            percentage < 50 ? 'text-green-600' : 
            percentage < 80 ? 'text-yellow-600' : 
            percentage < 100 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {percentage.toFixed(0)}%
          </span>
          <span className="text-slate-400">
            {formatCurrency(Math.max(0, budget - spent))} 남음
          </span>
        </div>
      </div>
    </div>
  );
};

export const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm">예산 설정 기능을 곧 추가할 예정입니다.</p>
      </div>
    );
  }

  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* 전체 요약 */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-slate-800">전체 예산 현황</h4>
          <span className={`text-sm font-medium ${
            overallPercentage < 80 ? 'text-green-600' : 
            overallPercentage < 100 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {overallPercentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-white rounded-full h-3 shadow-inner">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              overallPercentage < 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
              overallPercentage < 100 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
              'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-600">
            지출: <span className="font-medium">{formatCurrency(totalSpent)}</span>
          </span>
          <span className="text-slate-600">
            예산: <span className="font-medium">{formatCurrency(totalBudget)}</span>
          </span>
        </div>
      </div>

      {/* 카테고리별 진행률 */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <ProgressBar
            key={index}
            category={item.category}
            budget={item.budget}
            spent={item.spent}
            color={item.color}
          />
        ))}
      </div>
    </div>
  );
};