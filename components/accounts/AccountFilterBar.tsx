import React from 'react';
import { AccountType, getAccountType } from '../../types';

export type FilterType = 'all' | 'debit' | 'credit' | 'cash' | 'liability';
export type SortType = 'name' | 'balance' | 'activity' | 'type';
export type SortOrder = 'asc' | 'desc';

interface AccountFilterBarProps {
  filterType: FilterType;
  sortType: SortType;
  sortOrder: SortOrder;
  searchQuery: string;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
}

const filterOptions = [
  { value: 'all' as FilterType, label: '전체', icon: '📋' },
  { value: 'debit' as FilterType, label: '계좌', icon: '🏦' },
  { value: 'credit' as FilterType, label: '신용카드', icon: '💳' },
  { value: 'cash' as FilterType, label: '현금', icon: '💰' },
  { value: 'liability' as FilterType, label: '대출', icon: '📋' },
];

const sortOptions = [
  { value: 'name' as SortType, label: '이름순' },
  { value: 'balance' as SortType, label: '잔액순' },
  { value: 'activity' as SortType, label: '거래량순' },
  { value: 'type' as SortType, label: '유형순' },
];

export const AccountFilterBar: React.FC<AccountFilterBarProps> = ({
  filterType,
  sortType,
  sortOrder,
  searchQuery,
  onFilterChange,
  onSortChange,
  onSortOrderChange,
  onSearchChange,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      {/* 검색바 */}
      <div className="relative">
        <svg 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="계좌명으로 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 필터 & 정렬 옵션 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* 필터 버튼 그룹 */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-sm text-slate-600 whitespace-nowrap">필터:</span>
          <div className="flex gap-1">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
                  filterType === option.value
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 옵션 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 whitespace-nowrap">정렬:</span>
          <div className="flex items-center gap-1">
            <select
              value={sortType}
              onChange={(e) => onSortChange(e.target.value as SortType)}
              className="text-xs border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-slate-500 hover:text-slate-700 border border-slate-300 rounded"
              title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
            >
              {sortOrder === 'asc' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m0 0l4-4m-4 4l4 4M3 16h3" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m-4-4l4-4m0 0l4 4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 결과 요약 */}
      {(searchQuery || filterType !== 'all' || filteredCount !== totalCount) && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-600">
            {filteredCount !== totalCount ? (
              <>
                <span className="font-medium text-indigo-600">{filteredCount}개</span> 계좌 
                <span className="text-slate-400 ml-1">(전체 {totalCount}개)</span>
              </>
            ) : (
              <span>{totalCount}개 계좌</span>
            )}
          </div>
          {(searchQuery || filterType !== 'all') && (
            <button
              onClick={() => {
                onSearchChange('');
                onFilterChange('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
};