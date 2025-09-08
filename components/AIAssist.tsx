
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { AIIcon } from './icons/Icons';
import { Spinner } from './ui/Spinner';
import { analyzeTransactionsFromFile } from '../services/geminiService';
import { LocalCsvParser, ParsedColumn, ColumnMapping } from '../services/localCsvParser';
import { AITransaction, Account, AccountPropensity } from '../types';
import { UseDataReturn } from '../hooks/useData';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

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
          throw new Error('Local parsing only supports CSV files.');
        }
        
        const { headers, rows } = await LocalCsvParser.parseFile(file);
        const columns = LocalCsvParser.analyzeColumns(headers, rows);
        
        setCsvData({ headers, rows });
        setParsedColumns(columns);
        
        // 자동 매핑 시도
        const autoMapping: ColumnMapping = {};
        columns.forEach((col, index) => {
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
            }
          }
        });
        
        setColumnMapping(autoMapping);
        setStep('mapping');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while processing the file.");
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
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while converting data.");
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    if (!selectedAccountId) {
        setErrorMessage("Please select an account.");
        setStep('error');
        return;
    }
    setStep('loading');
    try {
        await addMultipleTransactions(analyzedTransactions, selectedAccountId);
        handleClose();
    } catch (error) {
        setErrorMessage("Failed to save transactions.");
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
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow"
      >
        <AIIcon />
        <span className="ml-2">AI Import</span>
      </button>

      <Modal isOpen={isModalOpen} onClose={handleClose} title="AI Transaction Import">
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center h-48">
            <Spinner />
            <p className="mt-4 text-slate-600">
              {parseMode === 'ai' ? 'Analyzing your document with AI... Please wait.' : 'Processing your CSV file... Please wait.'}
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-red-600 font-semibold">Processing Failed</p>
            <p className="mt-2 text-slate-600">{errorMessage}</p>
            <button
                onClick={() => setStep('account')}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
                Try Again
            </button>
          </div>
        )}

        {step === 'account' && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Select Account</h3>
            <p className="text-slate-600 mb-4">Choose an existing account or create a new one for your transactions.</p>
            
            {accounts.length > 0 ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select existing account:</label>
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
                          Balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.balance)} | {account.propensity}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">No accounts found. Please create a new account first.</p>
              </div>
            )}

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setStep('new-account')}
                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-md text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
              >
                + Create New Account
              </button>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setStep('upload')}
                disabled={!selectedAccountId}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Choose parsing method:</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ai"
                    checked={parseMode === 'ai'}
                    onChange={(e) => setParseMode(e.target.value as 'ai' | 'local')}
                    className="mr-2"
                  />
                  AI Parsing (Images, PDF supported)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="local"
                    checked={parseMode === 'local'}
                    onChange={(e) => setParseMode(e.target.value as 'ai' | 'local')}
                    className="mr-2"
                  />
                  Local Parsing (CSV only)
                </label>
              </div>
            </div>
            
            <p className="text-slate-600 mb-4">
              {parseMode === 'ai' 
                ? 'Upload bank statement images or documents to automatically extract transactions using AI.'
                : 'Upload CSV files to parse transactions locally and securely.'
              }
            </p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <label htmlFor="file-upload" className="cursor-pointer text-primary-600 font-semibold">
                Choose a file
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
            <h3 className="text-lg font-medium text-slate-900 mb-4">Column Mapping Setup</h3>
            <p className="text-slate-600 mb-4">Please confirm or modify what each CSV column represents.</p>
            
            <div className="space-y-4 mb-6">
              {[
                { key: 'date', label: 'Date', required: true },
                { key: 'description', label: 'Description', required: true },
                { key: 'amount', label: 'Amount', required: true },
                { key: 'type', label: 'Transaction Type', required: false }
              ].map(({ key, label, required }) => (
                <div key={key} className="flex items-center space-x-4">
                  <label className="w-20 text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={columnMapping[key as keyof ColumnMapping] ?? ''}
                    onChange={(e) => setColumnMapping(prev => ({
                      ...prev,
                      [key]: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">None selected</option>
                    {parsedColumns.map((col, index) => (
                      <option key={index} value={index}>
                        {col.name} ({col.detectedType}, confidence: {(col.confidence * 100).toFixed(0)}%)
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-slate-700 mb-2">Data Preview:</h4>
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
                Back
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
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {step === 'confirm' && (
          <div>
            <p className="text-slate-700 mb-2">Review the transactions found and confirm to add them.</p>
            <div className="mb-4">
              <div className="bg-slate-50 p-3 rounded-md">
                <span className="text-sm font-medium text-slate-700">Target Account: </span>
                <span className="text-slate-900">{accounts.find(acc => acc.id === selectedAccountId)?.name}</span>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md p-2 bg-slate-50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Amount</th>
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
                <button type="button" onClick={() => setStep(parseMode === 'local' ? 'mapping' : 'upload')} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Back</button>
                <button type="button" onClick={handleConfirm} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Confirm and Add</button>
            </div>
          </div>
        )}

        {step === 'new-account' && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">새 계좌 생성</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">계좌명</label>
                <input 
                  type="text" 
                  value={newAccountForm.name} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  required 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">계좌 유형</label>
                <select 
                  value={newAccountForm.propensity} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, propensity: e.target.value as AccountPropensity }))}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  {Object.values(AccountPropensity).map(type => 
                    <option key={type} value={type}>{type}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">초기 잔액</label>
                <input 
                  type="number" 
                  value={newAccountForm.balance} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                  step="0.01" 
                  placeholder="0.00" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
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
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
