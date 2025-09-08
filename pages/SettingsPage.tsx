import React, { useState } from 'react';
import { UseDataReturn } from '../hooks/useData';
import { Category, TransactionType } from '../types';
import { Modal } from '../components/ui/Modal';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons/Icons';

const CategoryForm: React.FC<{
  category: Partial<Category> | null;
  categories: Category[];
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  onClose: () => void;
}> = ({ category, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    type: category?.type || TransactionType.EXPENSE,
    icon: category?.icon || '',
    color: category?.color || '#3b82f6',
    parentId: category?.parentId || '',
    isDefault: category?.isDefault || false,
    isActive: category?.isActive !== false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
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
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10" 
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
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
        />
      </div>

      <div className="flex items-center">
        <input 
          id="category-active"
          type="checkbox" 
          name="isActive" 
          checked={formData.isActive} 
          onChange={handleChange} 
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded" 
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
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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

  const groupedCategories = categories.reduce((acc, category) => {
    if (!category.parentId) {
      acc[category.id] = {
        parent: category,
        children: categories.filter(c => c.parentId === category.id)
      };
    }
    return acc;
  }, {} as Record<string, { parent: Category, children: Category[] }>);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">카테고리 관리</h3>
        <button 
          onClick={handleAdd} 
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon />
          <span className="ml-2">카테고리 추가</span>
        </button>
      </div>

      <div className="space-y-4">
        {Object.values(groupedCategories).map(({ parent, children }) => (
          <div key={parent.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: parent.color }}
                />
                <span className="font-medium">{parent.name}</span>
                <span className="text-sm text-slate-500">
                  ({parent.type === TransactionType.INCOME ? '수입' : '지출'})
                </span>
                {!parent.isActive && (
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                    비활성
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(parent)} 
                  className="text-primary-600 hover:text-primary-800"
                >
                  <EditIcon />
                </button>
                {!parent.isDefault && (
                  <button 
                    onClick={() => handleDelete(parent.id)} 
                    className="text-red-600 hover:text-red-800"
                  >
                    <DeleteIcon />
                  </button>
                )}
              </div>
            </div>
            
            {children.length > 0 && (
              <div className="ml-6 space-y-2">
                {children.map(child => (
                  <div key={child.id} className="flex items-center justify-between py-2 border-t">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: child.color }}
                      />
                      <span className="text-sm">{child.name}</span>
                      {!child.isActive && (
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                          비활성
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(child)} 
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <EditIcon />
                      </button>
                      {!child.isDefault && (
                        <button 
                          onClick={() => handleDelete(child.id)} 
                          className="text-red-600 hover:text-red-800"
                        >
                          <DeleteIcon />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
      importData(file);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">데이터 관리</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-slate-900">데이터 백업</h4>
            <p className="text-sm text-slate-600">모든 데이터를 JSON 파일로 내보내기</p>
          </div>
          <button 
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            백업 다운로드
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-slate-900">데이터 복원</h4>
            <p className="text-sm text-slate-600">백업 파일에서 데이터 가져오기</p>
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
            >
              파일 선택
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
          <div>
            <h4 className="font-medium text-red-900">데이터 초기화</h4>
            <p className="text-sm text-red-600">모든 거래 내역과 계좌를 삭제합니다</p>
          </div>
          <button 
            onClick={handleClearData}
            disabled={isClearing}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isClearing ? '삭제 중...' : '모든 데이터 삭제'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">설정</h2>
      
      <CategoryManager data={data} />
      <DataManager data={data} />
    </div>
  );
};