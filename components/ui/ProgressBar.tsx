import React from 'react';

export interface ProgressStep {
  id: string;
  label: string;
  icon: string;
  message: string;
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: ProgressStep[];
  percentage?: number;
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  steps,
  percentage,
  showPercentage = true,
  animated = true
}) => {
  // percentage가 제공되지 않으면 단계 기반으로 계산
  const calculatedPercentage = percentage ?? Math.round((currentStep / totalSteps) * 100);
  
  // 현재 단계의 정보 가져오기
  const currentStepInfo = steps[currentStep - 1];
  
  return (
    <div className="w-full space-y-4">
      {/* 현재 단계 정보 */}
      {currentStepInfo && (
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="text-3xl">{currentStepInfo.icon}</div>
          <div className="text-center">
            <div className="text-sm font-medium text-slate-700">
              {currentStepInfo.label}
            </div>
            <div className="text-slate-600 text-sm">
              {currentStepInfo.message}
            </div>
          </div>
        </div>
      )}

      {/* 진행률 바 */}
      <div className="relative">
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out ${
              animated ? 'animate-pulse' : ''
            }`}
            style={{ 
              width: `${Math.min(calculatedPercentage, 100)}%`,
              background: calculatedPercentage >= 100 
                ? 'linear-gradient(90deg, #10b981, #059669)' 
                : 'linear-gradient(90deg, #6366f1, #4f46e5)'
            }}
          />
        </div>
        
        {/* 퍼센트 표시 */}
        {showPercentage && (
          <div className="absolute -top-6 left-0 right-0 text-center">
            <span className="text-sm font-semibold text-slate-700">
              {calculatedPercentage}%
            </span>
          </div>
        )}
      </div>

      {/* 단계 표시 */}
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>1단계</span>
        <span className="font-medium">
          {currentStep} / {totalSteps} 단계
        </span>
        <span>{totalSteps}단계</span>
      </div>

      {/* 모든 단계 미리보기 (옵션) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;
          
          return (
            <div 
              key={step.id}
              className={`flex items-center space-x-2 p-2 rounded-md text-xs transition-colors ${
                isCompleted ? 'bg-green-50 text-green-700' :
                isCurrent ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' :
                'bg-slate-50 text-slate-400'
              }`}
            >
              <span className="text-sm">
                {isCompleted ? '✅' : isCurrent ? step.icon : '⏳'}
              </span>
              <span className="font-medium truncate">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};