
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { AIIcon } from './icons/Icons';
import { Spinner } from './ui/Spinner';
import { Button } from './ui/Button';
import { analyzeTransactionsFromFile } from '../services/geminiService';
import { LocalCsvParser, ParsedColumn, ColumnMapping } from '../services/localCsvParser';
import { AITransaction, Account, AccountPropensity } from '../types';
import { UseDataReturn } from '../hooks/useData';
import { formatCurrency } from '../utils/format';

const AIAssist: React.FC<{data: UseDataReturn}> = ({ data }) => {
  const { accounts, addMultipleTransactions, addAccount } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'account' | 'upload' | 'mapping' | 'confirm' | 'loading' | 'error' | 'new-account'>('account');
  const [analyzedTransactions, setAnalyzedTransactions] = useState<AITransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [parseMode, setParseMode] = useState<'ai' | 'local'>('ai');
  const [csvData, setCsvData] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [parsedColumns, setParsedColumns] = useState<ParsedColumn[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    propensity: AccountPropensity.CHECKING,
    balance: 0
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('loading');
    try {
      if (parseMode === 'ai') {
        // AI 파싱 (기존 로직)
        const results = await analyzeTransactionsFromFile(file);
        setAnalyzedTransactions(results);
        setStep('confirm');
      } else {
        // 로컬 파싱
        if (!file.name.toLowerCase().endsWith('.csv')) {
          throw new Error('로컬 파싱은 CSV 파일만 지원합니다.');
        }
        
        const { headers, rows } = await LocalCsvParser.parseFile(file);
        const columns = LocalCsvParser.analyzeColumns(headers, rows);
        
        setCsvData({ headers, rows });
        setParsedColumns(columns);
        
        // 자동 매핑 시도 (신뢰도 기반)
        const autoMapping: ColumnMapping = {};
        columns.forEach((col, index) => {
          // 높은 신뢰도(0.7+) 필드들은 자동 매핑
          if (col.confidence > 0.7) {
            switch (col.detectedType) {
              case 'date':
                if (!autoMapping.date) autoMapping.date = index;
                break;
              case 'amount':
                if (!autoMapping.amount) autoMapping.amount = index;
                break;
              case 'description':
                if (!autoMapping.description) autoMapping.description = index;
                break;
              case 'type':
                if (!autoMapping.type) autoMapping.type = index;
                break;
              case 'reference':
                if (!autoMapping.reference) autoMapping.reference = index;
                break;
              case 'category':
                if (!autoMapping.category) autoMapping.category = index;
                break;
              case 'balance':
                if (!autoMapping.balance) autoMapping.balance = index;
                break;
            }
          }
          // 중간 신뢰도(0.5+) 필드들도 참고용으로 매핑
          else if (col.confidence > 0.5) {
            switch (col.detectedType) {
              case 'reference':
                if (!autoMapping.reference) autoMapping.reference = index;
                break;
              case 'category':
                if (!autoMapping.category) autoMapping.category = index;
                break;
              case 'balance':
                if (!autoMapping.balance) autoMapping.balance = index;
                break;
            }
          }
        });
        
        setColumnMapping(autoMapping);
        setStep('mapping');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "파일 처리 중 오류가 발생했습니다.");
      setStep('error');
    }
  };

  const handleMappingConfirm = () => {
    if (!csvData) return;
    
    try {
      const transactions = LocalCsvParser.convertToTransactions(
        csvData.headers, 
        csvData.rows, 
        columnMapping
      );
      setAnalyzedTransactions(transactions);
      setStep('confirm');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "데이터 변환 중 오류가 발생했습니다.");
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    if (!selectedAccountId) {
        setErrorMessage("계좌을 선택해주세요.");
        setStep('error');
        return;
    }
    setStep('loading');
    try {
        await addMultipleTransactions(analyzedTransactions, selectedAccountId);
        handleClose();
    } catch (error) {
        setErrorMessage("거래 내역 저장에 실패했습니다.");
        setStep('error');
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountForm.name.trim()) {
      setErrorMessage("계좌명을 입력해주세요.");
      setStep('error');
      return;
    }
    
    try {
      setStep('loading');
      await addAccount(newAccountForm);
      // 새로 생성된 계좌를 선택하도록 하기 위해 accounts 배열이 업데이트되기를 기다립니다
      setTimeout(() => {
        const updatedAccounts = data.accounts;
        const newAccount = updatedAccounts.find(acc => acc.name === newAccountForm.name);
        if (newAccount) {
          setSelectedAccountId(newAccount.id);
        }
        setStep('account');
        setNewAccountForm({ name: '', propensity: AccountPropensity.CHECKING, balance: 0 });
      }, 100);
    } catch (error) {
      setErrorMessage("계좌 생성에 실패했습니다.");
      setStep('error');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    // Reset state after a short delay to allow modal to close smoothly
    setTimeout(() => {
        setStep('account');
        setAnalyzedTransactions([]);
        setErrorMessage('');
        setCsvData(null);
        setParsedColumns([]);
        setColumnMapping({});
        setParseMode('ai');
        setSelectedAccountId(accounts[0]?.id || '');
        setNewAccountForm({ name: '', propensity: AccountPropensity.CHECKING, balance: 0 });
    }, 300);
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} title="AI 가져오기" aria-label="AI 가져오기" variant="accent" size="sm" className="px-2.5 py-1.5">
        <AIIcon />
      </Button>

      <Modal isOpen={isModalOpen} onClose={handleClose} title="AI Transaction Import">
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center h-48">
            <Spinner />
            <p className="mt-4 text-slate-600">
              {parseMode === 'ai' ? 'AI로 문서를 분석 중입니다... 잠시만 기다려주세요.' : 'CSV 파일을 처리 중입니다... 잠시만 기다려주세요.'}
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-red-600 font-semibold">처리 실패</p>
            <p className="mt-2 text-slate-600">{errorMessage}</p>
            <button
                onClick={() => setStep('account')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
                다시 시도
            </button>
          </div>
        )}

        {step === 'account' && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">계좌 선택</h3>
            <p className="text-slate-600 mb-4">기존 계좌을 선택하거나 거래를 위한 새 계좌을 만드세요.</p>
            
            {accounts.length > 0 ? (
              <fieldset className="mb-6">
                <legend className="block text-sm font-medium text-slate-700 mb-2">기존 계좌 선택:</legend>
                <div className="space-y-2">
                  {accounts.map(account => (
                    <label key={account.id} className="flex items-center p-3 border rounded-md hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        value={account.id}
                        checked={selectedAccountId === account.id}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-slate-500">
                          잔액: {formatCurrency(account.balance)} | {account.propensity}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">계좌이 없습니다. 먼저 새 계좌을 만들어 주세요.</p>
              </div>
            )}

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setStep('new-account')}
                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-md text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                + 새 계좌 생성
              </button>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setStep('upload')}
                disabled={!selectedAccountId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div>
            <fieldset className="mb-4">
              <legend className="block text-sm font-medium text-slate-700 mb-2">파싱 방법 선택:</legend>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ai"
                    checked={parseMode === 'ai'}
                    onChange={(e) => setParseMode(e.target.value as 'ai' | 'local')}
                    className="mr-2"
                  />
                  AI 파싱 (이미지, PDF 지원)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="local"
                    checked={parseMode === 'local'}
                    onChange={(e) => setParseMode(e.target.value as 'ai' | 'local')}
                    className="mr-2"
                  />
                  로컬 파싱 (CSV만 지원)
                </label>
              </div>
            </fieldset>
            
            <p className="text-slate-600 mb-4">
              {parseMode === 'ai' 
                ? '은행 명세서 이미지나 문서를 업로드하여 AI로 거래 내역을 자동 추출합니다.'
                : 'CSV 파일을 업로드하여 로컬에서 안전하게 거래 내역을 처리합니다.'
              }
            </p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 font-semibold">
파일 선택
              </label>
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                className="sr-only" 
                accept={parseMode === 'ai' ? "image/*,.csv,.pdf" : ".csv"} 
                onChange={handleFileChange} 
              />
              <p className="text-xs text-slate-500 mt-1">
                {parseMode === 'ai' 
                  ? 'PNG, JPG, GIF, CSV, PDF up to 10MB'
                  : 'CSV files up to 10MB'
                }
              </p>
            </div>
          </div>
        )}

        {step === 'mapping' && csvData && parsedColumns.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">열 매핑 설정</h3>
            <p className="text-slate-600 mb-4">각 CSV 열이 무엇을 나타내는지 확인하거나 수정해주세요.</p>
            
            <div className="space-y-3 mb-6">
              {[
                { key: 'date', label: '날짜', required: true, description: '거래 발생 일자' },
                { key: 'description', label: '설명', required: true, description: '거래 내역 또는 가맹점명' },
                { key: 'amount', label: '금액', required: true, description: '거래 금액 (양수/음수 구분)' },
                { key: 'type', label: '거래 유형', required: false, description: '입금/출금/이체 구분' },
                { key: 'reference', label: '참조번호', required: false, description: '거래 고유번호 또는 승인번호' },
                { key: 'category', label: '카테고리', required: false, description: '거래 카테고리 (자동 분류용)' },
                { key: 'balance', label: '잔액', required: false, description: '거래 후 계좌 잔액' }
              ].map(({ key, label, required, description }) => (
                <div key={key} className={`rounded-lg border p-4 ${
                  required 
                    ? 'border-red-200 bg-red-50/30' 
                    : 'border-slate-200 bg-slate-50/30'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-slate-700">
                        {required ? '🔴' : '🔵'} {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <p className="text-xs text-slate-500 leading-tight">{description}</p>
                    </div>
                    <div className="col-span-2">
                      <select
                        value={columnMapping[key as keyof ColumnMapping] ?? ''}
                        onChange={(e) => setColumnMapping(prev => ({
                          ...prev,
                          [key]: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">{required ? '⚠️ 필수 선택' : '📋 선택 안함'}</option>
                        {parsedColumns.map((col, index) => (
                          <option key={index} value={index}>
                            📊 {col.name} ({col.detectedType}, 신뢰도: {(col.confidence * 100).toFixed(0)}%)
                          </option>
                        ))}
                      </select>
                      {columnMapping[key as keyof ColumnMapping] !== undefined && (
                        <div className="mt-2 p-2 bg-white rounded border text-xs">
                          <span className="font-semibold text-green-700">✅ 매핑된 값:</span>
                          <span className="ml-2 text-slate-700 font-mono">
                            "{csvData?.rows[0]?.[columnMapping[key as keyof ColumnMapping]!] || 'N/A'}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-slate-700 mb-2">데이터 미리보기:</h4>
              <div className="max-h-48 overflow-auto border rounded-md bg-slate-50">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      {parsedColumns.map((col, index) => (
                        <th key={index} className="p-2 text-left border-r">
                          {col.name}
                          <br />
                          <span className="text-xs text-slate-500">({col.detectedType})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.slice(0, 3).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-2 border-r max-w-32 truncate">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 space-x-2">
              <button 
                type="button" 
                onClick={() => setStep('account')} 
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
              >
                이전
              </button>
              <button 
                type="button" 
                onClick={() => {
                  console.log('Debug - columnMapping:', columnMapping);
                  console.log('Debug - parsedColumns:', parsedColumns);
                  console.log('Debug - Button enabled conditions:', {
                    hasDate: !!columnMapping.date,
                    hasDescription: !!columnMapping.description,
                    hasAmount: !!columnMapping.amount
                  });
                  handleMappingConfirm();
                }}
                disabled={columnMapping.date === undefined || columnMapping.description === undefined || columnMapping.amount === undefined}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
        
        {step === 'confirm' && (
          <div>
            <p className="text-slate-700 mb-2">Review the transactions found and confirm to add them.</p>
            <div className="mb-4">
              <div className="bg-slate-50 p-3 rounded-md">
                <span className="text-sm font-medium text-slate-700">대상 계좌: </span>
                <span className="text-slate-900">{accounts.find(acc => acc.id === selectedAccountId)?.name}</span>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md p-2 bg-slate-50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">날짜</th>
                    <th className="p-2">설명</th>
                    <th className="p-2">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedTransactions.map((t, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{t.date}</td>
                      <td className="p-2">{t.description}</td>
                      <td className={`p-2 font-semibold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={() => setStep(parseMode === 'local' ? 'mapping' : 'upload')} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">이전</button>
                <button type="button" onClick={handleConfirm} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">확인 및 추가</button>
            </div>
          </div>
        )}

        {step === 'new-account' && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">새 계좌 생성</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="ai-account-name" className="block text-sm font-medium text-slate-700">계좌명</label>
                <input 
                  id="ai-account-name"
                  type="text" 
                  value={newAccountForm.name} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  required 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label htmlFor="ai-account-type" className="block text-sm font-medium text-slate-700">계좌 유형</label>
                <select 
                  id="ai-account-type"
                  value={newAccountForm.propensity} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, propensity: e.target.value as AccountPropensity }))}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {Object.values(AccountPropensity).map(type => 
                    <option key={type} value={type}>{type}</option>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="ai-account-balance" className="block text-sm font-medium text-slate-700">초기 잔액</label>
                <input 
                  id="ai-account-balance"
                  type="number" 
                  value={newAccountForm.balance} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                  step="0.01" 
                  placeholder="0.00" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
              <button 
                type="button" 
                onClick={() => setStep('account')} 
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
              >
                취소
              </button>
              <button 
                type="button" 
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                계좌 생성
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AIAssist;
