
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
import { modalFormStyles } from './ui/FormStyles';
import { TransactionPreview } from './ui/TransactionPreview';
import { ProgressBar, ProgressStep } from './ui/ProgressBar';

const AIAssist: React.FC<{data: UseDataReturn}> = ({ data }) => {
  const { accounts, addMultipleTransactions, addMultipleTransactionsWithAccounts, addMultipleFullTransactions, addAccount } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'method' | 'upload' | 'mapping' | 'account' | 'confirm' | 'loading' | 'error' | 'new-account'>('method');
  const [analyzedTransactions, setAnalyzedTransactions] = useState<AITransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(''); // 빈 값으로 시작 - 나중에 선택
  const [errorMessage, setErrorMessage] = useState('');
  const [parseMode, setParseMode] = useState<'ai' | 'local'>('ai');
  const [csvData, setCsvData] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [parsedColumns, setParsedColumns] = useState<ParsedColumn[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    propensity: AccountPropensity.CHECKING,
    balance: ''
  });
  const [mappingPreview, setMappingPreview] = useState<AITransaction[]>([]);
  const [extendedPreviewData, setExtendedPreviewData] = useState<any[]>([]);
  const [fullTransactionData, setFullTransactionData] = useState<any[]>([]);
  
  // 진행률 관련 상태
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);

  // AI 처리 단계 정의
  const aiSteps: ProgressStep[] = [
    {
      id: 'file-read',
      label: '파일 읽기',
      icon: '📁',
      message: '파일을 읽고 있습니다...'
    },
    {
      id: 'ai-upload',
      label: 'AI 전송',
      icon: '🚀',
      message: 'AI 서버로 데이터를 전송하고 있습니다...'
    },
    {
      id: 'ai-analysis',
      label: 'AI 분석',
      icon: '🤖',
      message: 'AI가 문서를 분석하고 있습니다...'
    },
    {
      id: 'data-parsing',
      label: '데이터 추출',
      icon: '🔄',
      message: '거래 내역을 추출하고 있습니다...'
    }
  ];

  // CSV 처리 단계 정의
  const csvSteps: ProgressStep[] = [
    {
      id: 'csv-read',
      label: '파일 읽기',
      icon: '📄',
      message: 'CSV 파일을 읽고 있습니다...'
    },
    {
      id: 'header-analysis',
      label: '헤더 분석',
      icon: '🔍',
      message: '컬럼 헤더를 분석하고 있습니다...'
    },
    {
      id: 'column-detection',
      label: '컬럼 감지',
      icon: '🎯',
      message: '데이터 패턴을 감지하고 있습니다...'
    },
    {
      id: 'auto-mapping',
      label: '자동 매핑',
      icon: '⚙️',
      message: '자동 매핑을 생성하고 있습니다...'
    }
  ];

  const currentSteps = parseMode === 'ai' ? aiSteps : csvSteps;

  // 매핑 변경시 미리보기 업데이트
  const updateMappingPreview = (mapping: ColumnMapping, csvData: { headers: string[], rows: string[][] }) => {
    try {
      if (!csvData || !mapping.date || !mapping.description || !mapping.amount) {
        setMappingPreview([]);
        setExtendedPreviewData([]);
        return;
      }
      
      // 처음 3-5개 행만 미리보기로 변환
      const previewRows = csvData.rows.slice(0, 5);
      const preview = LocalCsvParser.convertToTransactions(
        csvData.headers, 
        previewRows, 
        mapping
      );
      
      // 확장 데이터 생성 (추가 필드들)
      const extendedData = previewRows.map(row => ({
        type: mapping.type !== undefined ? 
          LocalCsvParser.normalizeType(row[mapping.type] || 'expense') === 'INCOME' ? '수입' : '지출' : 
          '지출',
        category: mapping.category !== undefined ? 
          (row[mapping.category] || '미분류') : '미분류',
        account: mapping.account !== undefined ? 
          (row[mapping.account] || '미지정') : '미지정',
        reference: mapping.reference !== undefined ? 
          (row[mapping.reference] || '') : '',
        installmentMonths: mapping.installmentMonths !== undefined ? 
          parseInt(row[mapping.installmentMonths] || '1') || 1 : 1,
        isInterestFree: mapping.isInterestFree !== undefined ? 
          LocalCsvParser.normalizeBoolean(row[mapping.isInterestFree] || '') : undefined
      }));

      setMappingPreview(preview);
      setExtendedPreviewData(extendedData);
    } catch (error) {
      console.warn('미리보기 생성 오류:', error);
      setMappingPreview([]);
      setExtendedPreviewData([]);
    }
  };

  // CSV 데이터 완전 처리 함수
  const processCSVData = async (csvData: { headers: string[], rows: string[][] }, mapping: ColumnMapping) => {
    try {
      // 1. 필요한 계좌들 수집 및 생성
      const accountMapping = await processAccountsFromCSV(csvData, mapping);
      
      // 2. 확장된 거래 데이터 변환
      const fullTransactions = LocalCsvParser.convertToFullTransactions(
        csvData.headers,
        csvData.rows,
        mapping,
        '', // accountId는 나중에 설정
        'Uncategorized'
      );
      
      // 3. 각 거래에 올바른 계좌 ID 할당
      const processedTransactions = fullTransactions.map(transaction => ({
        ...transaction,
        accountId: accountMapping[transaction.accountId] || accountMapping['default'] || accounts[0]?.id || ''
      }));
      
      // 4. AITransaction 형태로 변환 (미리보기용)
      const aiTransactions: AITransaction[] = processedTransactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
      }));
      
      // 5. 확장 데이터 생성 (미리보기용)
      const extendedData = processedTransactions.map(t => ({
        type: t.type === 'INCOME' ? '수입' : '지출',
        category: t.category,
        account: accounts.find(acc => acc.id === t.accountId)?.name || '알 수 없는 계좌',
        installmentMonths: t.installmentMonths,
        isInterestFree: t.isInterestFree
      }));
      
      setAnalyzedTransactions(aiTransactions);
      setExtendedPreviewData(extendedData);
      
      // 전체 거래 정보를 상태로 저장 (실제 저장용)
      setFullTransactionData(processedTransactions);
      
      setStep('confirm');
    } catch (error) {
      throw new Error(`CSV 데이터 처리 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // CSV에서 계좌 정보 처리 및 자동 생성
  const processAccountsFromCSV = async (csvData: { headers: string[], rows: string[][] }, mapping: ColumnMapping): Promise<Record<string, string>> => {
    const accountMapping: Record<string, string> = {};
    
    if (mapping.account !== undefined) {
      // CSV의 모든 고유한 계좌명 추출
      const csvAccountNames = [...new Set(
        csvData.rows
          .map(row => row[mapping.account!]?.trim())
          .filter(Boolean)
      )];
      
      for (const csvAccountName of csvAccountNames) {
        // 기존 계좌 매칭 시도
        const matchingAccount = accounts.find(acc => 
          acc.name.toLowerCase().includes(csvAccountName.toLowerCase()) ||
          csvAccountName.toLowerCase().includes(acc.name.toLowerCase())
        );
        
        if (matchingAccount) {
          accountMapping[csvAccountName] = matchingAccount.id;
        } else {
          // 새 계좌 자동 생성
          try {
            const newAccount = {
              name: csvAccountName,
              propensity: AccountPropensity.CHECKING,
              balance: 0,
              initialBalance: 0
            };
            await addAccount(newAccount);
            
            // 계좌 생성 후 데이터 새로고침을 위한 약간의 지연
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 새로 생성된 계좌 찾기
            const createdAccount = data.accounts.find(acc => acc.name === csvAccountName);
            if (createdAccount) {
              accountMapping[csvAccountName] = createdAccount.id;
            } else {
              // 계좌를 찾을 수 없는 경우 기본 계좌 사용
              accountMapping[csvAccountName] = accounts[0]?.id || '';
            }
            
          } catch (error) {
            console.warn(`계좌 생성 실패: ${csvAccountName}`, error);
            // 기본 계좌 사용
            accountMapping[csvAccountName] = accounts[0]?.id || '';
          }
        }
      }
    }
    
    // 기본 계좌 설정
    if (accounts.length > 0) {
      accountMapping['default'] = accounts[0].id;
    }
    
    return accountMapping;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('loading');
    setCurrentStep(1);
    setProgress(0);
    
    try {
      if (parseMode === 'ai') {
        // 1단계: 파일 읽기
        setCurrentStep(1);
        setProgress(25);
        await new Promise(resolve => setTimeout(resolve, 500)); // 시각적 효과를 위한 딜레이
        
        // 2단계: AI 전송
        setCurrentStep(2);
        setProgress(50);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 3-4단계: AI 분석 및 데이터 추출
        setCurrentStep(3);
        setProgress(75);
        const results = await analyzeTransactionsFromFile(file);
        
        setCurrentStep(4);
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setAnalyzedTransactions(results);
        
        // AI 분석 결과를 위한 확장 데이터 생성 - 개별 계좌 정보 보존
        const extendedData = results.map(t => ({
          type: t.type === 'INCOME' ? '수입' : '지출',
          category: t.category || '미분류',
          account: t.account || '미지정', // AI가 인식한 개별 계좌 정보 그대로 사용
          reference: t.reference || '',
          installmentMonths: t.installmentMonths || 1,
          isInterestFree: t.isInterestFree || false
        }));
        
        setExtendedPreviewData(extendedData);
        setStep('confirm'); // AI 분석 후 바로 confirm 단계로
      } else {
        // 로컬 파싱
        if (!file.name.toLowerCase().endsWith('.csv')) {
          throw new Error('로컬 파싱은 CSV 파일만 지원합니다.');
        }
        
        // 1단계: CSV 파일 읽기
        setCurrentStep(1);
        setProgress(25);
        const { headers, rows } = await LocalCsvParser.parseFile(file);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 2단계: 헤더 분석
        setCurrentStep(2);
        setProgress(50);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 3단계: 컬럼 감지
        setCurrentStep(3);
        setProgress(75);
        const columns = LocalCsvParser.analyzeColumns(headers, rows);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        setCsvData({ headers, rows });
        setParsedColumns(columns);
        
        // 4단계: 자동 매핑
        setCurrentStep(4);
        setProgress(100);
        
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
              case 'account':
                if (!autoMapping.account) autoMapping.account = index;
                break;
              case 'balance':
                if (!autoMapping.balance) autoMapping.balance = index;
                break;
              case 'installmentMonths':
                if (!autoMapping.installmentMonths) autoMapping.installmentMonths = index;
                break;
              case 'isInterestFree':
                if (!autoMapping.isInterestFree) autoMapping.isInterestFree = index;
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
              case 'account':
                if (!autoMapping.account) autoMapping.account = index;
                break;
              case 'installmentMonths':
                if (!autoMapping.installmentMonths) autoMapping.installmentMonths = index;
                break;
              case 'isInterestFree':
                if (!autoMapping.isInterestFree) autoMapping.isInterestFree = index;
                break;
            }
          }
        });
        
        setColumnMapping(autoMapping);
        // 초기 미리보기 생성
        if (csvData) {
          updateMappingPreview(autoMapping, { headers, rows });
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep('mapping');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "파일 처리 중 오류가 발생했습니다.");
      setStep('error');
    }
  };

  const handleMappingConfirm = async () => {
    if (!csvData) return;
    
    try {
      // 필수 필드 검증
      const validation = LocalCsvParser.validateRequiredFields(columnMapping);
      if (!validation.isValid) {
        setErrorMessage(`필수 필드가 매핑되지 않았습니다: ${validation.missingFields.join(', ')}`);
        setStep('error');
        return;
      }

      // CSV에서 모든 정보를 완전 처리하여 바로 confirm 단계로 이동
      await processCSVData(csvData, columnMapping);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "데이터 변환 중 오류가 발생했습니다.");
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    setStep('loading');
    try {
      if (parseMode === 'local') {
        // CSV 모드: 완전한 거래 데이터를 직접 저장
        await addMultipleFullTransactions(fullTransactionData);
      } else {
        // AI 모드: 개별 계좌 정보를 고려한 거래 추가
        await addMultipleTransactionsWithAccounts(analyzedTransactions);
      }
      
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
      const accountData = {
        ...newAccountForm,
        balance: parseFloat(newAccountForm.balance as string) || 0
      };
      await addAccount(accountData);
      // 새로 생성된 계좌를 선택하도록 하기 위해 accounts 배열이 업데이트되기를 기다립니다
      setTimeout(() => {
        const updatedAccounts = data.accounts;
        const newAccount = updatedAccounts.find(acc => acc.name === newAccountForm.name);
        if (newAccount) {
          setSelectedAccountId(newAccount.id);
        }
        setStep('account');
        setNewAccountForm({ name: '', propensity: AccountPropensity.CHECKING, balance: '' });
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
        setStep('method');
        setAnalyzedTransactions([]);
        setErrorMessage('');
        setCsvData(null);
        setParsedColumns([]);
        setColumnMapping({});
        setParseMode('ai');
        setSelectedAccountId('');
        setMappingPreview([]);
        setExtendedPreviewData([]);
        setFullTransactionData([]);
        setCurrentStep(1);
        setProgress(0);
        setNewAccountForm({ name: '', propensity: AccountPropensity.CHECKING, balance: '' });
    }, 300);
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} title="AI 가져오기" aria-label="AI 가져오기" variant="accent" size="icon" className="rounded-full w-full h-full">
        <AIIcon />
      </Button>

      <Modal isOpen={isModalOpen} onClose={handleClose} title="거래 내역 가져오기">
        {step === 'method' && (
          <div className={modalFormStyles.section}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">📁 분석 방법 선택</h3>
            <p className="text-slate-600 mb-6">파일 유형에 따라 적합한 분석 방법을 선택하세요.</p>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                parseMode === 'ai' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  value="ai"
                  checked={parseMode === 'ai'}
                  onChange={(e) => setParseMode(e.target.value as 'ai' | 'local')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 mr-3 mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 mb-1">🤖 AI 스마트 분석</div>
                  <div className="text-sm text-slate-600 mb-2">
                    은행 명세서, 카드 내역서, 스크린샷을 AI가 자동으로 분석
                  </div>
                  <div className="text-xs text-slate-500">
                    <strong>지원 형식:</strong> 이미지 (JPG, PNG), PDF, 엑셀 (XLS, XLSX), CSV
                  </div>
                </div>
              </label>
              
              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                parseMode === 'local' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  value="local"
                  checked={parseMode === 'local'}
                  onChange={(e) => setParseMode(e.target.value as 'ai' | 'local')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 mr-3 mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 mb-1">💾 로컬 CSV 처리</div>
                  <div className="text-sm text-slate-600 mb-2">
                    CSV 파일을 브라우저에서 안전하게 처리 (데이터 유출 없음)
                  </div>
                  <div className="text-xs text-slate-500">
                    <strong>지원 형식:</strong> CSV 파일만
                  </div>
                </div>
              </label>
            </div>

            <div className={modalFormStyles.actions}>
              <Button
                type="button"
                onClick={() => setStep('upload')}
                variant="primary"
              >
                다음: 파일 업로드
              </Button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="p-6">
            <div className="mb-6 text-center">
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {parseMode === 'ai' ? '🤖 AI 문서 분석' : '💾 CSV 파일 처리'}
              </h3>
              <p className="text-slate-600">
                {parseMode === 'ai' 
                  ? '인공지능이 문서를 분석하여 거래 내역을 추출하고 있습니다.' 
                  : 'CSV 파일을 안전하게 분석하여 거래 내역을 준비하고 있습니다.'
                }
              </p>
            </div>
            
            <ProgressBar
              currentStep={currentStep}
              totalSteps={currentSteps.length}
              steps={currentSteps}
              percentage={progress}
              showPercentage={true}
              animated={true}
            />
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                {parseMode === 'ai' 
                  ? '분석 시간은 파일 크기와 복잡도에 따라 달라질 수 있습니다.'
                  : '로컬에서 안전하게 처리되며 데이터가 외부로 전송되지 않습니다.'
                }
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-48 text-center p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold text-lg mb-2">처리 실패</p>
            <p className="mt-2 text-slate-600 mb-6 max-w-md leading-relaxed">{errorMessage}</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setStep('method')}
                variant="primary"
              >
                🔄 다시 시도
              </Button>
              
              {/* AI 오류인 경우 CSV 로컬 처리 제안 */}
              {(errorMessage.includes('AI 서비스') || errorMessage.includes('과부하') || errorMessage.includes('API')) && (
                <Button
                  onClick={() => {
                    setParseMode('local');
                    setStep('upload');
                    setErrorMessage('');
                  }}
                  variant="secondary"
                >
                  💾 CSV 로컬 처리로 전환
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'account' && (
          <div className={modalFormStyles.section}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">🏦 계좌 연결</h3>
            <p className="text-slate-600 mb-4">분석된 거래내역을 어느 계좌에 추가할지 선택하세요.</p>
            
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-900 mb-3">📊 분석 결과 미리보기</h4>
              <TransactionPreview 
                transactions={analyzedTransactions} 
                maxHeight="max-h-48"
                showSummary={true}
              />
            </div>
            
            {/* CSV 계좌 매핑 정보 표시 */}
            {csvData && columnMapping.account !== undefined && csvData.rows.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-800 mb-1">📋 CSV에서 발견된 계좌 정보:</div>
                <div className="text-sm text-blue-700">
                  "{csvData.rows[0][columnMapping.account]?.trim() || '정보 없음'}"
                  {selectedAccountId && accounts.find(acc => acc.id === selectedAccountId) && (
                    <span className="ml-2 text-green-600">✅ 자동 매칭됨</span>
                  )}
                </div>
              </div>
            )}

            {accounts.length > 0 ? (
              <div className="mb-6">
                <legend className={modalFormStyles.label}>계좌 선택:</legend>
                <div className="space-y-3 mt-2">
                  {/* 기존 계좌들 */}
                  {accounts.map(account => (
                    <label key={account.id} className={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-colors ${
                      selectedAccountId === account.id 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        value={account.id}
                        checked={selectedAccountId === account.id}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{account.name}</div>
                        <div className="text-sm text-slate-600">
                          잔액: {formatCurrency(account.balance)} | {account.propensity}
                        </div>
                      </div>
                    </label>
                  ))}
                  
                  {/* 계좌 정보 없음 옵션 */}
                  <label className={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-colors ${
                    selectedAccountId === 'no-account' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      value="no-account"
                      checked={selectedAccountId === 'no-account'}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-400 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">❓ 계좌 정보 없음</div>
                      <div className="text-sm text-slate-600">
                        CSV에 계좌 정보가 없거나 확실하지 않은 경우
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-md">
                <p className="text-yellow-800 font-medium">계좌이 없습니다. 먼저 새 계좌을 만들어 주세요.</p>
              </div>
            )}

            <div className="mb-6">
              <Button
                type="button"
                onClick={() => setStep('new-account')}
                variant="outline"
                className="w-full p-3 border-2 border-dashed text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
              >
                + 새 계좌 생성
              </Button>
            </div>

            <div className={modalFormStyles.actions}>
              <Button
                type="button"
                onClick={() => setStep(parseMode === 'local' ? 'mapping' : 'upload')}
                variant="secondary"
              >
                이전
              </Button>
              <Button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={!selectedAccountId}
                variant="primary"
              >
                다음: 최종 확인
              </Button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className={modalFormStyles.section}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              📤 파일 업로드 - {parseMode === 'ai' ? '🤖 AI 분석' : '💾 CSV 처리'}
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                <strong>선택된 방법:</strong> {parseMode === 'ai' ? 'AI 스마트 분석' : '로컬 CSV 처리'}
              </p>
            </div>
            
            <p className="text-slate-600 mb-4">
              {parseMode === 'ai' 
                ? '은행 명세서, 카드 내역서, 엑셀 파일 등을 업로드하면 AI가 자동으로 거래 내역을 추출합니다.'
                : 'CSV 파일을 업로드하면 브라우저에서 안전하게 처리됩니다. 인터넷에 전송되지 않습니다.'
              }
            </p>
            
            {parseMode === 'ai' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 text-sm">
                  💡 <strong>팁:</strong> CSV 파일의 경우 AI가 텍스트로 처리하여 더 빠르고 정확합니다. 
                  AI 서비스 오류 시 자동으로 로컬 처리로 전환할 수 있습니다.
                </p>
              </div>
            )}
            
            <div className="border-2 border-dashed border-slate-400 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
              <div className="text-4xl mb-3">
                {parseMode === 'ai' ? '🤖' : '📁'}
              </div>
              <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 font-semibold text-lg">
                파일 선택 또는 드래그 앤 드롭
              </label>
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                className="sr-only" 
                accept={parseMode === 'ai' ? "image/*,.csv,.pdf,.xls,.xlsx" : ".csv"} 
                onChange={handleFileChange} 
              />
              <p className="text-sm text-slate-600 mt-2">
                {parseMode === 'ai' 
                  ? '이미지 (JPG, PNG), PDF, 엑셀 (XLS, XLSX), CSV'
                  : 'CSV 파일만 지원'
                }
              </p>
              <p className="text-xs text-slate-500 mt-1">최대 10MB</p>
            </div>

            <div className={modalFormStyles.actions}>
              <Button
                type="button"
                onClick={() => setStep('method')}
                variant="secondary"
              >
                이전: 방법 변경
              </Button>
            </div>
          </div>
        )}

        {step === 'mapping' && csvData && parsedColumns.length > 0 && (
          <div className={modalFormStyles.section}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">열 매핑 설정</h3>
            <p className="text-slate-600 mb-4">각 CSV 열이 무엇을 나타내는지 확인하거나 수정해주세요.</p>
            
            <div className="space-y-3 mb-6">
              {[
                { key: 'date', label: '날짜', required: true, priority: 'REQUIRED', description: '거래 발생 일자' },
                { key: 'description', label: '설명', required: true, priority: 'REQUIRED', description: '거래 내역 또는 가맹점명' },
                { key: 'amount', label: '금액', required: true, priority: 'REQUIRED', description: '거래 금액 (양수/음수 구분)' },
                { key: 'type', label: '거래 유형', required: false, priority: 'SEMI_REQUIRED', description: '입금/출금/기타 구분 (기본값: 지출)' },
                { key: 'category', label: '카테고리', required: false, priority: 'SEMI_REQUIRED', description: '거래 카테고리 (기본값: 미분류)' },
                { key: 'account', label: '계좌', required: false, priority: 'SEMI_REQUIRED', description: '계좌 정보 (별도 선택 가능)' },
                { key: 'reference', label: '참조번호', required: false, priority: 'OPTIONAL', description: '거래 고유번호 또는 승인번호' },
                { key: 'balance', label: '잔액', required: false, priority: 'OPTIONAL', description: '거래 후 계좌 잔액' },
                { key: 'installmentMonths', label: '할부 개월수', required: false, priority: 'OPTIONAL', description: '할부 개월수 (신용카드 할부용)' },
                { key: 'isInterestFree', label: '무이자 할부', required: false, priority: 'OPTIONAL', description: '무이자 할부 여부' }
              ].map(({ key, label, required, priority, description }) => (
                <div key={key} className={`rounded-lg border p-4 ${
                  priority === 'REQUIRED' 
                    ? 'border-red-200 bg-red-50/30' 
                    : priority === 'SEMI_REQUIRED'
                    ? 'border-yellow-200 bg-yellow-50/30'
                    : 'border-slate-200 bg-slate-50/30'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-slate-700">
                        {priority === 'REQUIRED' ? '🔴' : priority === 'SEMI_REQUIRED' ? '🟡' : '🔵'} {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                        {priority === 'SEMI_REQUIRED' && <span className="text-yellow-600 ml-1 text-xs">(기본값 사용)</span>}
                      </label>
                      <p className="text-xs text-slate-500 leading-tight">{description}</p>
                    </div>
                    <div className="col-span-2">
                      <select
                        value={columnMapping[key as keyof ColumnMapping] ?? ''}
                        onChange={(e) => {
                          const newMapping = {
                            ...columnMapping,
                            [key]: e.target.value ? parseInt(e.target.value) : undefined
                          };
                          setColumnMapping(newMapping);
                          // 매핑 변경시 실시간 미리보기 업데이트
                          if (csvData) {
                            updateMappingPreview(newMapping, csvData);
                          }
                        }}
                        className={modalFormStyles.select}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">📄 원본 CSV 데이터:</h4>
                <div className="max-h-40 overflow-auto border rounded-md bg-slate-50 relative">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        {parsedColumns.map((col, index) => (
                          <th key={index} className="p-2 text-left border-r bg-slate-100">
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
                            <td key={cellIndex} className="p-2 border-r max-w-24 truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-700 mb-2">🔄 변환 결과 미리보기:</h4>
                <TransactionPreview 
                  transactions={mappingPreview} 
                  maxHeight="max-h-40"
                  showSummary={false}
                  showExtendedFields={true}
                  extendedData={extendedPreviewData}
                />
              </div>
            </div>

            <div className={modalFormStyles.actions}>
              <Button 
                type="button" 
                onClick={() => setStep('account')} 
                variant="secondary"
              >
                이전
              </Button>
              <Button 
                type="button" 
                onClick={handleMappingConfirm}
                disabled={!LocalCsvParser.validateRequiredFields(columnMapping).isValid}
                variant="primary"
              >
                다음
              </Button>
            </div>
          </div>
        )}
        
        {step === 'confirm' && (
          <div className={modalFormStyles.section}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">거래 내역 확인</h3>
            <p className="text-slate-600 mb-4">발견된 거래 내역을 검토하고 확인하여 추가하세요.</p>
            {/* AI 모드의 경우 자동 선택된 계좌 정보 표시 */}
            {parseMode !== 'local' && (
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <span className={modalFormStyles.label}>대상 계좌: </span>
                  <span className="text-slate-900 font-medium">
                    {accounts.find(acc => acc.id === selectedAccountId)?.name || '알 수 없는 계좌'}
                  </span>
                  <span className="ml-2 text-blue-600 text-sm">
                    {extendedPreviewData.some(d => d.account && d.account !== '미지정') ? '🔍 AI 인식됨' : '✨ 자동 선택됨'}
                  </span>
                </div>
              </div>
            )}
            
            {/* 확장된 미리보기 사용 (AI 모드에서도 확장 정보 표시) */}
            <TransactionPreview 
              transactions={analyzedTransactions}
              maxHeight="max-h-64"
              showSummary={true}
              showExtendedFields={true}
              extendedData={extendedPreviewData}
            />
            <div className={modalFormStyles.actions}>
                <Button 
                  type="button" 
                  onClick={() => setStep(parseMode === 'local' ? 'mapping' : 'upload')} 
                  variant="secondary"
                >
                  {parseMode === 'local' ? '이전: 매핑 수정' : '이전: 파일 변경'}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleConfirm} 
                  variant="primary"
                >
                  확인 및 추가
                </Button>
            </div>
          </div>
        )}

        {step === 'new-account' && (
          <div className={modalFormStyles.section}>
            <h3 className="text-lg font-medium text-slate-900 mb-4">새 계좌 생성</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="ai-account-name" className={modalFormStyles.label}>계좌명</label>
                <input 
                  id="ai-account-name"
                  type="text" 
                  value={newAccountForm.name} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  required 
                  className={modalFormStyles.input} 
                />
              </div>
              <div>
                <label htmlFor="ai-account-type" className={modalFormStyles.label}>계좌 유형</label>
                <select 
                  id="ai-account-type"
                  value={newAccountForm.propensity} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, propensity: e.target.value as AccountPropensity }))}
                  className={modalFormStyles.select}
                >
                  {Object.values(AccountPropensity).map(type => 
                    <option key={type} value={type}>{type}</option>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="ai-account-balance" className={modalFormStyles.label}>초기 잔액</label>
                <input 
                  id="ai-account-balance"
                  type="number" 
                  value={newAccountForm.balance} 
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, balance: e.target.value }))}
                  step="0.01" 
                  placeholder="초기 잔액을 입력하세요" 
                  className={modalFormStyles.input} 
                />
              </div>
            </div>
            <div className={modalFormStyles.actions}>
              <Button 
                type="button" 
                onClick={() => setStep('account')} 
                variant="secondary"
              >
                취소
              </Button>
              <Button 
                type="button" 
                onClick={handleCreateAccount}
                variant="primary"
              >
                계좌 생성
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AIAssist;
