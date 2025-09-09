import React, { useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Category, TransactionType } from '../types';
import { Modal } from '../components/ui/Modal';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';
import { useUISettings } from '../ui/UISettingsProvider';
import { useI18n } from '../i18n/I18nProvider';

type CategoryFormState = {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  parentId: string;
  isDefault: boolean;
  isActive: boolean;
};

const CategoryForm: React.FC<{
  category: Partial<Category> | null;
  categories: Category[];
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  onClose: () => void;
}> = ({ category, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState<CategoryFormState>({
    name: category?.name || '',
    type: category?.type || TransactionType.EXPENSE,
    icon: category?.icon || '',
    color: category?.color || '#3b82f6',
    parentId: category?.parentId || '',
    isDefault: category?.isDefault || false,
    isActive: category?.isActive !== false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = (target as HTMLInputElement).name;
    const value = (target as HTMLInputElement).value;

    setFormData(prev => {
      switch (name) {
        case 'isActive':
          return { ...prev, isActive: (target as HTMLInputElement).checked };
        case 'isDefault':
          return { ...prev, isDefault: (target as HTMLInputElement).checked };
        case 'type':
          return { ...prev, type: value as TransactionType };
        case 'parentId':
          return { ...prev, parentId: value };
        case 'name':
          return { ...prev, name: value };
        case 'icon':
          return { ...prev, icon: value };
        case 'color':
          return { ...prev, color: value };
        default:
          return prev;
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryData = {
      ...formData,
      parentId: formData.parentId || undefined
    };
    
    if (category && 'id' in category) {
      onSave({ ...categoryData, id: category.id });
    } else {
      onSave(categoryData);
    }
    onClose();
  };

  const parentCategories = categories.filter(c => !c.parentId && c.type === formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category-name" className="block text-sm font-medium text-slate-700">카테고리 이름</label>
        <input 
          id="category-name"
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category-type" className="block text-sm font-medium text-slate-700">타입</label>
          <select 
            id="category-type"
            name="type" 
            value={formData.type} 
            onChange={handleChange} 
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value={TransactionType.INCOME}>수입</option>
            <option value={TransactionType.EXPENSE}>지출</option>
          </select>
        </div>
        <div>
          <label htmlFor="category-color" className="block text-sm font-medium text-slate-700">색상</label>
          <input 
            id="category-color"
            type="color" 
            name="color" 
            value={formData.color} 
            onChange={handleChange} 
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10" 
          />
        </div>
      </div>

      <div>
        <label htmlFor="category-parent" className="block text-sm font-medium text-slate-700">상위 카테고리</label>
        <select 
          id="category-parent"
          name="parentId" 
          value={formData.parentId} 
          onChange={handleChange} 
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">없음 (최상위 카테고리)</option>
          {parentCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="category-icon" className="block text-sm font-medium text-slate-700">아이콘 (옵션)</label>
        <input 
          id="category-icon"
          type="text" 
          name="icon" 
          value={formData.icon} 
          onChange={handleChange} 
          placeholder="🏠 또는 아이콘 클래스명"
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
        />
      </div>

      <div className="flex items-center">
        <input 
          id="category-active"
          type="checkbox" 
          name="isActive" 
          checked={formData.isActive} 
          onChange={handleChange} 
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" 
        />
        <label htmlFor="category-active" className="ml-2 block text-sm text-slate-900">활성 상태</label>
      </div>

      <div className="flex justify-end pt-4 space-x-2">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
        >
          취소
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          저장
        </button>
      </div>
    </form>
  );
};

const CategoryManager: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { t, lang, toggle } = useI18n();
  const { density, toggleDensity } = useUISettings();

  const handleAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 카테고리를 삭제하시겠습니까?')) {
      deleteCategory(id);
    }
  };

  const handleSave = (category: Omit<Category, 'id'> | Category) => {
    if ('id' in category) {
      updateCategory(category);
    } else {
      addCategory(category);
    }
  };

  // 수입/지출별로 카테고리 그룹화
  const incomeCategories = categories.filter(c => c.type === TransactionType.INCOME);
  const expenseCategories = categories.filter(c => c.type === TransactionType.EXPENSE);
  const transferCategories = categories.filter(c => c.type === TransactionType.TRANSFER);
  
  const groupCategoriesByType = (cats: Category[]) => {
    return cats.reduce((acc, category) => {
      if (!category.parentId) {
        acc[category.id] = {
          parent: category,
          children: cats.filter(c => c.parentId === category.id)
        };
      }
      return acc;
    }, {} as Record<string, { parent: Category, children: Category[] }>);
  };

  const incomeGrouped = groupCategoriesByType(incomeCategories);
  const expenseGrouped = groupCategoriesByType(expenseCategories);
  const transferGrouped = groupCategoriesByType(transferCategories);

  const rowY = density === 'compact' ? 'py-1' : 'py-1.5';

  const CategorySection: React.FC<{
    title: string;
    groupedCategories: Record<string, { parent: Category, children: Category[] }>;
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
  }> = ({ title, groupedCategories, textColor = 'text-slate-800', bgColor = 'bg-white', borderColor = 'border-slate-200' }) => (
    <div className={`rounded-xl ${bgColor} shadow-sm border ${borderColor} overflow-hidden`}>
      {/* 섹션 헤더 */}
      <div className={`px-6 py-4 bg-gradient-to-r ${
        title.includes('수입') ? 'from-green-50 to-emerald-50 border-b border-green-100' :
        title.includes('지출') ? 'from-red-50 to-rose-50 border-b border-red-100' :
        'from-slate-50 to-gray-50 border-b border-slate-100'
      }`}>
        <h4 className={`text-lg font-bold ${textColor} flex items-center`}>
          {title}
          <span className="ml-3 text-xs font-medium bg-white/70 px-2 py-1 rounded-full">
            {Object.keys(groupedCategories).length}개 그룹
          </span>
        </h4>
      </div>
      
      {/* 섹션 컨텐츠 */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.values(groupedCategories).map(({ parent, children }) => (
            <div key={parent.id} className={`relative rounded-lg border-2 bg-white hover:shadow-md transition-all duration-200 ${density === 'compact' ? 'p-3' : 'p-4'}`} style={{ borderColor: parent.color + '20' }}>
              {/* 색상 인디케이터 */}
              <div className="absolute top-3 right-3 w-3 h-3 rounded-full" style={{ backgroundColor: parent.color }} />
              
              {/* 상위 카테고리 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-5 h-5 rounded-lg shadow-sm" 
                    style={{ backgroundColor: parent.color }}
                  />
                  <div>
                    <span className="font-semibold text-base">{parent.name}</span>
                    {!parent.isActive && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                        비활성
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleEdit(parent)} 
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                    title="수정"
                  >
                    <EditIcon />
                  </button>
                  {!parent.isDefault && (
                    <button 
                      onClick={() => handleDelete(parent.id)} 
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="삭제"
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </div>
              
              {/* 하위 카테고리들 */}
              {children.length > 0 && (
                <div className="space-y-2 pl-2">
                  <div className="text-xs font-medium text-slate-500 mb-2">하위 카테고리 ({children.length}개)</div>
                  <div className="space-y-1">
                    {children.map(child => (
                      <div key={child.id} className={`group flex items-center justify-between ${density === 'compact' ? 'py-1' : 'py-1.5'} px-2 rounded-md hover:bg-slate-50 transition-colors`}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: child.color }}
                          />
                          <span className="text-sm">{child.name}</span>
                          {!child.isActive && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                              비활성
                            </span>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button 
                            onClick={() => handleEdit(child)} 
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                            title="수정"
                          >
                            <EditIcon />
                          </button>
                          {!child.isDefault && (
                            <button 
                              onClick={() => handleDelete(child.id)} 
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              <DeleteIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">카테고리 관리</h3>
          <p className="text-sm text-slate-600 mt-1">수입, 지출, 기타 카테고리를 관리하세요</p>
        </div>
        <button 
          onClick={handleAdd} 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon />
          <span className="ml-2">카테고리 추가</span>
        </button>
      </div>

      <div className="space-y-8">
        {/* 수입 카테고리 섹션 */}
        <CategorySection 
          title="💰 수입 카테고리" 
          groupedCategories={incomeGrouped} 
          textColor="text-green-800"
        />

        {/* 지출 카테고리 섹션 */}
        <CategorySection 
          title="💸 지출 카테고리" 
          groupedCategories={expenseGrouped} 
          textColor="text-red-800"
        />

        {/* 기타 카테고리 섹션 */}
        <CategorySection 
          title="📂 기타 카테고리" 
          groupedCategories={transferGrouped} 
          textColor="text-slate-800"
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCategory ? '카테고리 수정' : '카테고리 추가'}
      >
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

const DataManager: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const { clearAllData, exportData, importData } = data;
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    if (!window.confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    if (!window.confirm('정말로 모든 거래 내역, 계좌, 사용자 정의 카테고리를 삭제하시겠습니까?')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearAllData();
      alert('모든 데이터가 삭제되었습니다.');
    } catch (error) {
      alert('데이터 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const confirmReplace = window.confirm('백업 복원은 현재 데이터를 모두 삭제하고 업로드한 백업으로 교체합니다. 진행할까요?');
      if (!confirmReplace) {
        e.target.value = '';
        return;
      }
      importData(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">데이터 관리</h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* 백업 */}
        <div className="flex items-center justify-between p-5 border rounded-lg bg-white min-h-28">
          <div>
            <h4 className="font-medium text-slate-900">백업</h4>
            <p className="text-xs text-slate-500 mt-1">전체 데이터를 JSON으로 저장</p>
          </div>
          <button 
            onClick={exportData}
            className="w-28 justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            다운로드
          </button>
        </div>

        {/* 복원 */}
        <div className="flex items-center justify-between p-5 border rounded-lg bg-white min-h-28">
          <div>
            <h4 className="font-medium text-slate-900">복원</h4>
            <p className="text-xs text-slate-500 mt-1">백업 파일로 전체 덮어쓰기</p>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label 
              htmlFor="import-file"
              className="w-28 inline-flex justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
            >
              가져오기
            </label>
          </div>
        </div>

        {/* 초기화 */}
        <div className="flex items-center justify-between p-5 border rounded-lg bg-white min-h-28">
          <div>
            <h4 className="font-medium text-slate-900">초기화</h4>
            <p className="text-xs text-slate-500 mt-1">계좌/거래/사용자 카테고리 삭제</p>
          </div>
          <button 
            onClick={handleClearData}
            disabled={isClearing}
            className="w-28 justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isClearing ? '진행 중…' : '전체 삭제'}
          </button>
        </div>
      </div>
    </div>
  );
};

type TabType = 'app' | 'categories' | 'data';

const AppSettings: React.FC<{
  toggle: () => void;
  lang: string;
  toggleDensity: () => void;
  density: string;
}> = ({ toggle, lang, toggleDensity, density }) => {
  return (
    <div className="space-y-6">
      {/* 언어 및 표시 설정 */}
      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">언어 및 표시 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">언어</label>
            <button
              onClick={toggle}
              className="w-full px-4 py-3 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 flex items-center justify-between transition-all duration-200"
            >
              <div className="flex items-center">
                <span className="mr-2">🌐</span>
                <span className="font-medium">{lang === 'ko' ? '한국어' : 'English'}</span>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">UI 밀도</label>
            <button
              onClick={toggleDensity}
              className="w-full px-4 py-3 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 flex items-center justify-between transition-all duration-200"
            >
              <div className="flex items-center">
                <span className="mr-2">{density === 'compact' ? '📏' : '📐'}</span>
                <span className="font-medium">{density === 'compact' ? '컴팩트' : '보통'}</span>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 앱 정보 */}
      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">앱 정보</h3>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>버전</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>빌드</span>
            <span>2025.01</span>
          </div>
          <div className="flex justify-between">
            <span>개발자</span>
            <span>Budget Tracker Team</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('app');
  const { toggle, lang } = useI18n();
  const { toggleDensity, density } = useUISettings();

  const tabs = [
    { id: 'app' as TabType, name: '앱 설정', icon: '⚙️' },
    { id: 'categories' as TabType, name: '카테고리 관리', icon: '📂' },
    { id: 'data' as TabType, name: '데이터 관리', icon: '💾' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'app':
        return <AppSettings toggle={toggle} lang={lang} toggleDensity={toggleDensity} density={density} />;
      case 'categories':
        return <CategoryManager data={data} />;
      case 'data':
        return <DataManager data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-full flex flex-col mx-auto w-full max-w-3xl lg:max-w-4xl">
      {/* 헤더 - 제목과 탭 */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl border-b border-slate-200">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">설정</h2>
              <p className="text-sm text-slate-600 mt-1">앱 환경설정 및 데이터 관리</p>
            </div>
            {/* 현재 탭 정보 표시 (모바일에서 유용) */}
            <div className="hidden sm:block">
              <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/50">
                <span className="text-xs font-medium text-slate-700">
                  {tabs.find(tab => tab.id === activeTab)?.icon} {tabs.find(tab => tab.id === activeTab)?.name}
                </span>
              </div>
            </div>
          </div>
          
          {/* 탭 네비게이션 */}
          <nav className="flex space-x-1" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`flex items-center px-5 py-3 rounded-t-xl text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-700 shadow-md border-t border-l border-r border-slate-200 -mb-px z-10'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50 backdrop-blur-sm'
                }`}
              >
                <span className="text-base mr-2">{tab.icon}</span>
                <span>{tab.name}</span>
                {/* 활성 탭 인디케이터 */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
