
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { UseDataReturn } from '../hooks/useData';
import { Account, AccountPropensity, TransactionType, AccountType, isCreditCard, getCreditCardAvailableAmount, getCreditCardUsageRate } from '../types';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/format';
import { useI18n } from '../i18n/I18nProvider';
import { modalFormStyles } from '../components/ui/FormStyles';
const AIAssist = React.lazy(() => import('../components/AIAssist'));
import { AIAssistRef } from '../components/AIAssist';
import { FloatingActionToggle } from '../components/ui/FloatingActionToggle';

// 계좌 유형별 분류 함수
const getAccountCategory = (propensity: AccountPropensity): string => {
    switch (propensity) {
        case AccountPropensity.CHECKING:
        case AccountPropensity.SAVINGS:
        case AccountPropensity.INVESTMENT:
        case AccountPropensity.LOAN:
            return '계좌';
        case AccountPropensity.CASH:
        case AccountPropensity.CREDIT_CARD:
            return '결제수단';
        default:
            return '기타';
    }
};

// CSV 파싱 유틸리티 함수
const parseCSV = (csvText: string): Partial<Account>[] => {
    const lines = csvText.trim().split('\n');
    const accounts: Partial<Account>[] = [];
    
    // 헤더 라인 건너뛰기 (첫 번째 라인이 헤더인지 확인)
    const startIndex = lines[0]?.toLowerCase().includes('계좌명') || lines[0]?.toLowerCase().includes('name') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // CSV 파싱 (따옴표 고려)
        const values = line.split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
        
        if (values.length >= 3) {
            const [name, propensity, balance, initialBalance, paymentDay] = values;
            const accountPropensity = (propensity as AccountPropensity) || AccountPropensity.CHECKING;
            const parsedPaymentDay = paymentDay ? parseInt(paymentDay) || undefined : undefined;
            
            accounts.push({
                name: name || `계좌 ${i}`,
                propensity: accountPropensity,
                balance: parseFloat(balance) || 0,
                initialBalance: parseFloat(initialBalance) || 0,
                paymentDay: accountPropensity === AccountPropensity.CREDIT_CARD ? parsedPaymentDay : undefined
            });
        }
    }
    
    return accounts;
};

// 일괄 입력 텍스트 파싱 함수
const parseBulkText = (text: string): Partial<Account>[] => {
    const lines = text.trim().split('\n');
    const accounts: Partial<Account>[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 탭, 쉼표, 또는 공백으로 구분
        const parts = line.split(/[\t,\s]+/).filter(part => part.length > 0);
        
        if (parts.length >= 1) {
            const propensity = (parts[1] as AccountPropensity) || AccountPropensity.CHECKING;
            const paymentDay = parts[4] ? parseInt(parts[4]) || undefined : undefined;
            
            accounts.push({
                name: parts[0] || `계좌 ${i + 1}`,
                propensity: propensity,
                balance: parts[2] ? parseFloat(parts[2]) || 0 : 0,
                initialBalance: parts[3] ? parseFloat(parts[3]) || 0 : 0,
                paymentDay: propensity === AccountPropensity.CREDIT_CARD ? paymentDay : undefined
            });
        }
    }
    
    return accounts;
};

const AccountForm: React.FC<{
    account: Partial<Account> | null;
    onSave: (account: Omit<Account, 'id'> | Account) => void;
    onBulkSave: (accounts: Omit<Account, 'id'>[]) => void;
    onClose: () => void;
}> = ({ account, onSave, onBulkSave, onClose }) => {
    const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'csv'>('single');
    const [bulkText, setBulkText] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<{
        name: number | null;
        propensity: number | null;
        balance: number | null;
        initialBalance: number | null;
        paymentDay: number | null;
    }>({
        name: null,
        propensity: null,
        balance: null,
        initialBalance: null,
        paymentDay: null
    });
    const [previewAccounts, setPreviewAccounts] = useState<Partial<Account>[]>([]);
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [duplicateInfo, setDuplicateInfo] = useState<{total: number, unique: number}>({total: 0, unique: 0});
    const [formData, setFormData] = useState({
        name: account?.name || '',
        propensity: account?.propensity || AccountPropensity.CHECKING,
        balance: '',
        initialBalance: '',
        paymentDay: account?.paymentDay || 14,
        creditLimit: account?.creditLimit || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'balance' || name === 'initialBalance' || name === 'creditLimit' ? value :
                   name === 'paymentDay' ? parseInt(value) || 1 : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Credit Card가 아닌 경우 payment_day와 creditLimit을 null로 설정
        const processedFormData = {
            ...formData,
            initialBalance: parseFloat(formData.initialBalance as string) || 0,
            paymentDay: formData.propensity === AccountPropensity.CREDIT_CARD ? formData.paymentDay : null,
            creditLimit: formData.propensity === AccountPropensity.CREDIT_CARD ? 
                (parseFloat(formData.creditLimit as string) || null) : null
        };
        
        if (account && 'id' in account) {
            // 수정 모드: balance도 포함
            const updateData = {
                ...processedFormData,
                balance: parseFloat(formData.balance as string) || account.balance,
            };
            onSave({ ...account, ...updateData });
        } else {
            // 추가 모드: balance는 initialBalance와 동일하게 설정 (거래 내역이 없으므로)
            const newAccountData = {
                ...processedFormData,
                balance: processedFormData.initialBalance
            };
            onSave(newAccountData);
        }
        onClose();
    };

    // 일괄 텍스트 처리
    const handleBulkTextChange = (text: string) => {
        setBulkText(text);
        if (text.trim()) {
            const allAccounts = parseBulkText(text);
            const uniqueAccounts = removeDuplicateAccounts(allAccounts);
            setDuplicateInfo({total: allAccounts.length, unique: uniqueAccounts.length});
            setPreviewAccounts(removeDuplicates ? uniqueAccounts : allAccounts);
        } else {
            setPreviewAccounts([]);
            setDuplicateInfo({total: 0, unique: 0});
        }
    };

    // CSV 파일 처리
    const handleCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCsvFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                if (text) {
                    const lines = text.trim().split('\n');
                    const data = lines.map(line => 
                        line.split(',').map(v => v.replace(/^["']|["']$/g, '').trim())
                    );
                    
                    setCsvData(data);
                    if (data.length > 0) {
                        setCsvHeaders(data[0]);
                        // 자동 매핑 시도
                        autoMapColumns(data[0]);
                    }
                }
            };
            reader.readAsText(file, 'UTF-8');
        }
    };

    // 자동 컬럼 매핑
    const autoMapColumns = (headers: string[]) => {
        const mapping = {
            name: null as number | null,
            propensity: null as number | null,
            balance: null as number | null,
            initialBalance: null as number | null,
            paymentDay: null as number | null
        };

        headers.forEach((header, index) => {
            const lower = header.toLowerCase();
            if (lower.includes('계좌명') || lower.includes('name') || lower.includes('계좌')) {
                mapping.name = index;
            } else if (lower.includes('유형') || lower.includes('type') || lower.includes('propensity')) {
                mapping.propensity = index;
            } else if (lower.includes('현재') && (lower.includes('잔액') || lower.includes('balance'))) {
                mapping.balance = index;
            } else if (lower.includes('초기') && (lower.includes('잔액') || lower.includes('balance'))) {
                mapping.initialBalance = index;
            } else if (lower.includes('잔액') || lower.includes('balance') || lower.includes('금액')) {
                mapping.balance = index;
            } else if (lower.includes('결제일') || lower.includes('payment') || lower.includes('일')) {
                mapping.paymentDay = index;
            }
        });

        setColumnMapping(mapping);
        updatePreviewFromMapping(mapping);
    };

    // 컬럼 매핑 변경 처리
    const handleColumnMappingChange = (field: keyof typeof columnMapping, columnIndex: number | null) => {
        const newMapping = { ...columnMapping, [field]: columnIndex };
        setColumnMapping(newMapping);
        updatePreviewFromMapping(newMapping);
    };

    // 중복 제거 함수
    const removeDuplicateAccounts = (accounts: Partial<Account>[]): Partial<Account>[] => {
        const accountMap = new Map<string, Partial<Account>>();
        
        accounts.forEach(account => {
            if (!account.name) return;
            
            const key = account.name.toLowerCase().trim();
            if (accountMap.has(key)) {
                // 중복된 경우 기존 것과 병합 (더 완전한 데이터 우선)
                const existing = accountMap.get(key)!;
                const finalPropensity = existing.propensity || account.propensity;
                const finalPaymentDay = existing.paymentDay || account.paymentDay;
                
                accountMap.set(key, {
                    name: existing.name || account.name,
                    propensity: finalPropensity,
                    balance: existing.balance !== undefined ? existing.balance : account.balance,
                    initialBalance: existing.initialBalance !== undefined ? existing.initialBalance : account.initialBalance,
                    paymentDay: finalPropensity === AccountPropensity.CREDIT_CARD ? finalPaymentDay : undefined
                });
            } else {
                accountMap.set(key, account);
            }
        });
        
        return Array.from(accountMap.values());
    };

    // 매핑을 기반으로 미리보기 업데이트
    const updatePreviewFromMapping = (mapping: typeof columnMapping) => {
        if (csvData.length <= 1) return;

        const allAccounts: Partial<Account>[] = [];
        
        // 헤더 행 제외하고 데이터 처리
        for (let i = 1; i < csvData.length; i++) {
            const row = csvData[i];
            if (row.length === 0 || row.every(cell => !cell.trim())) continue;

            const account: Partial<Account> = {};

            if (mapping.name !== null && row[mapping.name]) {
                account.name = row[mapping.name].trim();
            }
            if (mapping.propensity !== null && row[mapping.propensity]) {
                account.propensity = row[mapping.propensity].trim() as AccountPropensity;
            }
            if (mapping.balance !== null && row[mapping.balance]) {
                account.balance = parseFloat(row[mapping.balance]) || 0;
            }
            if (mapping.initialBalance !== null && row[mapping.initialBalance]) {
                account.initialBalance = parseFloat(row[mapping.initialBalance]) || 0;
            }
            if (mapping.paymentDay !== null && row[mapping.paymentDay] && account.propensity === AccountPropensity.CREDIT_CARD) {
                const day = parseInt(row[mapping.paymentDay]);
                if (day >= 1 && day <= 31) {
                    account.paymentDay = day;
                }
            }

            // 최소한 이름이 있는 경우만 추가
            if (account.name) {
                allAccounts.push(account);
            }
        }

        // 중복 정보 업데이트
        const uniqueAccounts = removeDuplicateAccounts(allAccounts);
        setDuplicateInfo({total: allAccounts.length, unique: uniqueAccounts.length});
        
        // 중복 제거 옵션에 따라 결과 설정
        setPreviewAccounts(removeDuplicates ? uniqueAccounts : allAccounts);
    };

    // 중복 제거 옵션 변경 처리
    const handleDuplicateToggle = (shouldRemove: boolean) => {
        setRemoveDuplicates(shouldRemove);
        
        // CSV 데이터가 있으면 CSV 미리보기 업데이트
        if (csvData.length > 1) {
            updatePreviewFromMapping(columnMapping);
        }
        
        // 일괄 입력 데이터가 있으면 일괄 입력 미리보기 업데이트
        if (bulkText.trim()) {
            const allAccounts = parseBulkText(bulkText);
            const uniqueAccounts = removeDuplicateAccounts(allAccounts);
            setDuplicateInfo({total: allAccounts.length, unique: uniqueAccounts.length});
            setPreviewAccounts(shouldRemove ? uniqueAccounts : allAccounts);
        }
    };

    // 일괄 저장 처리
    const handleBulkSubmit = () => {
        if (previewAccounts.length > 0) {
            onBulkSave(previewAccounts as Omit<Account, 'id'>[]);
            onClose();
        }
    };

    return (
        <div className="space-y-4">
            {/* 탭 헤더 */}
            <div className="flex space-x-1 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setActiveTab('single')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                        activeTab === 'single' 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    단일 입력
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('bulk')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                        activeTab === 'bulk' 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    일괄 입력
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('csv')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                        activeTab === 'csv' 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    CSV 가져오기
                </button>
            </div>

            {/* 탭 컨텐츠 */}
            {activeTab === 'single' && (
                <form onSubmit={handleSubmit} className={modalFormStyles.section}>
                    <div>
                        <label htmlFor="account-name" className={modalFormStyles.label}>계좌명</label>
                        <input id="account-name" type="text" name="name" value={formData.name} onChange={handleChange} required className={modalFormStyles.input} />
                    </div>
                    <div>
                        <label htmlFor="account-propensity" className={modalFormStyles.label}>계좌 유형</label>
                        <select id="account-propensity" name="propensity" value={formData.propensity} onChange={handleChange} className={modalFormStyles.select}>
                            <optgroup label="계좌">
                                <option value={AccountPropensity.CHECKING}>{AccountPropensity.CHECKING}</option>
                                <option value={AccountPropensity.SAVINGS}>{AccountPropensity.SAVINGS}</option>
                                <option value={AccountPropensity.INVESTMENT}>{AccountPropensity.INVESTMENT}</option>
                                <option value={AccountPropensity.LOAN}>{AccountPropensity.LOAN}</option>
                            </optgroup>
                            <optgroup label="결제수단">
                                <option value={AccountPropensity.CASH}>{AccountPropensity.CASH}</option>
                                <option value={AccountPropensity.CREDIT_CARD}>{AccountPropensity.CREDIT_CARD}</option>
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="account-initialBalance" className={modalFormStyles.label}>초기 잔액 (오프닝 밸런스)</label>
                        <input 
                            id="account-initialBalance"
                            type="number" 
                            name="initialBalance" 
                            value={formData.initialBalance} 
                            onChange={handleChange} 
                            step="0.01" 
                            placeholder={account ? `현재: ${formatCurrency(account.initialBalance ?? 0)}` : "초기 잔액을 입력하세요"} 
                            className={modalFormStyles.input} 
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            이 계좌의 시작 잔액입니다. 거래 내역과 별도로 관리됩니다.
                        </p>
                    </div>
                    {account && (
                        <div>
                            <label htmlFor="account-balance" className={modalFormStyles.label}>현재 잔액</label>
                            <input 
                                id="account-balance"
                                type="number" 
                                name="balance" 
                                value={formData.balance} 
                                onChange={handleChange} 
                                step="0.01" 
                                placeholder={`현재: ${formatCurrency(account.balance)}`} 
                                className={modalFormStyles.input} 
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                실제 현재 잔액입니다. 초기 잔액 + 거래 내역 = 현재 잔액
                            </p>
                        </div>
                    )}
                    {formData.propensity === AccountPropensity.CREDIT_CARD && (
                        <>
                            <div>
                                <label htmlFor="account-creditLimit" className={modalFormStyles.label}>신용 한도</label>
                                <input 
                                    id="account-creditLimit"
                                    type="number" 
                                    name="creditLimit" 
                                    value={formData.creditLimit || ''} 
                                    onChange={handleChange} 
                                    step="10000" 
                                    min="0"
                                    placeholder="신용카드 한도를 입력하세요" 
                                    className={modalFormStyles.input} 
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    신용카드의 사용 가능한 총 한도를 입력하세요.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="account-paymentDay" className={modalFormStyles.label}>결제일</label>
                                <select
                                    id="account-paymentDay"
                                    name="paymentDay"
                                    value={formData.paymentDay}
                                    onChange={handleChange}
                                    className={modalFormStyles.select}
                                >
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <option key={day} value={day}>{day}일</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    <div className={modalFormStyles.actions}>
                        <Button type="button" onClick={onClose} variant="secondary" size="sm">취소</Button>
                        <Button type="submit" variant="primary" size="sm">계좌 저장</Button>
                    </div>
                </form>
            )}

            {activeTab === 'bulk' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="bulk-text" className="block text-sm font-medium text-slate-700">
                            일괄 입력
                        </label>
                        <div className="text-xs text-slate-500 mb-2">
                            한 줄에 하나씩: 계좌명 계좌유형 현재잔액 초기잔액 결제일(선택)
                        </div>
                        <textarea
                            id="bulk-text"
                            value={bulkText}
                            onChange={(e) => handleBulkTextChange(e.target.value)}
                            rows={8}
                            placeholder="신한은행 주계좌 Checking 1500000 1000000&#10;삼성카드 Credit Card -200000 0 14&#10;적금계좌 Savings 5000000 3000000"
                            className="mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                    {duplicateInfo.total > 0 && (
                        <div className="bg-slate-50 p-3 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-slate-700">
                                    전체 {duplicateInfo.total}개 → 고유 {duplicateInfo.unique}개 
                                    {duplicateInfo.total > duplicateInfo.unique && (
                                        <span className="text-amber-600 ml-1">
                                            ({duplicateInfo.total - duplicateInfo.unique}개 중복)
                                        </span>
                                    )}
                                </div>
                                <label className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={removeDuplicates}
                                        onChange={(e) => handleDuplicateToggle(e.target.checked)}
                                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                                    />
                                    중복 제거
                                </label>
                            </div>
                            {!removeDuplicates && duplicateInfo.total > duplicateInfo.unique && (
                                <div className="text-xs text-amber-600">
                                    ⚠️ 중복된 계좌명이 여러 개 생성될 수 있습니다
                                </div>
                            )}
                        </div>
                    )}
                    
                    {previewAccounts.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">미리보기 ({previewAccounts.length}개)</h4>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-2 py-1 text-left">계좌명</th>
                                            <th className="px-2 py-1 text-left">유형</th>
                                            <th className="px-2 py-1 text-right">현재잔액</th>
                                            <th className="px-2 py-1 text-right">초기잔액</th>
                                            <th className="px-2 py-1 text-center">결제일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewAccounts.map((acc, idx) => (
                                            <tr key={idx} className="border-t border-slate-100">
                                                <td className="px-2 py-1">{acc.name || '미지정'}</td>
                                                <td className="px-2 py-1">{acc.propensity || 'Checking'}</td>
                                                <td className="px-2 py-1 text-right">{formatCurrency(acc.balance || 0)}</td>
                                                <td className="px-2 py-1 text-right">{formatCurrency(acc.initialBalance || 0)}</td>
                                                <td className="px-2 py-1 text-center">{acc.paymentDay ? `${acc.paymentDay}일` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 space-x-2">
                        <Button type="button" onClick={onClose} variant="secondary" size="sm">취소</Button>
                        <Button 
                            type="button" 
                            onClick={handleBulkSubmit} 
                            variant="primary" 
                            size="sm"
                            disabled={previewAccounts.length === 0}
                        >
                            {previewAccounts.length > 0 ? `${previewAccounts.length}개 저장` : '저장'}
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'csv' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="csv-file" className="block text-sm font-medium text-slate-700">CSV 파일 선택</label>
                        <div className="text-xs text-slate-500 mb-2">
                            어떤 형식의 CSV 파일이든 업로드 후 컬럼을 매핑할 수 있습니다.<br/>
                            예시 파일을 <button type="button" className="text-indigo-600 underline" onClick={() => {
                                const csv = '계좌명,계좌유형,현재잔액,초기잔액,결제일\n신한은행 주계좌,Checking,1500000,1000000,\n삼성카드,Credit Card,-200000,0,14\n적금계좌,Savings,5000000,3000000,';
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'accounts_template.csv';
                                a.click();
                            }}>다운로드</button>하여 참고하세요.
                        </div>
                        <input
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            onChange={handleCSVFileChange}
                            className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>

                    {csvFile && (
                        <div className="text-sm text-slate-600">
                            선택된 파일: {csvFile.name} ({csvData.length > 0 ? `${csvData.length - 1}개 행` : ''})
                        </div>
                    )}

                    {csvHeaders.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-3">컬럼 매핑 선택</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">계좌명</label>
                                    <select
                                        value={columnMapping.name ?? ''}
                                        onChange={(e) => handleColumnMappingChange('name', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full text-xs border border-slate-400 rounded px-2 py-1"
                                    >
                                        <option value="">선택 안함</option>
                                        {csvHeaders.map((header, index) => (
                                            <option key={index} value={index}>{header || `컬럼 ${index + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">계좌 유형</label>
                                    <select
                                        value={columnMapping.propensity ?? ''}
                                        onChange={(e) => handleColumnMappingChange('propensity', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full text-xs border border-slate-400 rounded px-2 py-1"
                                    >
                                        <option value="">선택 안함</option>
                                        {csvHeaders.map((header, index) => (
                                            <option key={index} value={index}>{header || `컬럼 ${index + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">현재 잔액</label>
                                    <select
                                        value={columnMapping.balance ?? ''}
                                        onChange={(e) => handleColumnMappingChange('balance', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full text-xs border border-slate-400 rounded px-2 py-1"
                                    >
                                        <option value="">선택 안함</option>
                                        {csvHeaders.map((header, index) => (
                                            <option key={index} value={index}>{header || `컬럼 ${index + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">초기 잔액</label>
                                    <select
                                        value={columnMapping.initialBalance ?? ''}
                                        onChange={(e) => handleColumnMappingChange('initialBalance', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full text-xs border border-slate-400 rounded px-2 py-1"
                                    >
                                        <option value="">선택 안함</option>
                                        {csvHeaders.map((header, index) => (
                                            <option key={index} value={index}>{header || `컬럼 ${index + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">결제일 (선택)</label>
                                    <select
                                        value={columnMapping.paymentDay ?? ''}
                                        onChange={(e) => handleColumnMappingChange('paymentDay', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full text-xs border border-slate-400 rounded px-2 py-1"
                                    >
                                        <option value="">선택 안함</option>
                                        {csvHeaders.map((header, index) => (
                                            <option key={index} value={index}>{header || `컬럼 ${index + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {duplicateInfo.total > 0 && (
                        <div className="bg-slate-50 p-3 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-slate-700">
                                    전체 {duplicateInfo.total}개 → 고유 {duplicateInfo.unique}개 
                                    {duplicateInfo.total > duplicateInfo.unique && (
                                        <span className="text-amber-600 ml-1">
                                            ({duplicateInfo.total - duplicateInfo.unique}개 중복)
                                        </span>
                                    )}
                                </div>
                                <label className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={removeDuplicates}
                                        onChange={(e) => handleDuplicateToggle(e.target.checked)}
                                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                                    />
                                    중복 제거
                                </label>
                            </div>
                            {!removeDuplicates && duplicateInfo.total > duplicateInfo.unique && (
                                <div className="text-xs text-amber-600">
                                    ⚠️ 중복된 계좌명이 여러 개 생성될 수 있습니다
                                </div>
                            )}
                        </div>
                    )}

                    {previewAccounts.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">미리보기 ({previewAccounts.length}개)</h4>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-2 py-1 text-left">계좌명</th>
                                            <th className="px-2 py-1 text-left">유형</th>
                                            <th className="px-2 py-1 text-right">현재잔액</th>
                                            <th className="px-2 py-1 text-right">초기잔액</th>
                                            <th className="px-2 py-1 text-center">결제일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewAccounts.map((acc, idx) => (
                                            <tr key={idx} className="border-t border-slate-100">
                                                <td className="px-2 py-1">{acc.name || '미지정'}</td>
                                                <td className="px-2 py-1">{acc.propensity || 'Checking'}</td>
                                                <td className="px-2 py-1 text-right">{formatCurrency(acc.balance || 0)}</td>
                                                <td className="px-2 py-1 text-right">{formatCurrency(acc.initialBalance || 0)}</td>
                                                <td className="px-2 py-1 text-center">{acc.paymentDay ? `${acc.paymentDay}일` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 space-x-2">
                        <Button type="button" onClick={onClose} variant="secondary" size="sm">취소</Button>
                        <Button 
                            type="button" 
                            onClick={handleBulkSubmit} 
                            variant="primary" 
                            size="sm"
                            disabled={previewAccounts.length === 0}
                        >
                            {previewAccounts.length > 0 ? `${previewAccounts.length}개 저장` : '저장'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AccountsPage: React.FC<{ data: UseDataReturn }> = ({ data }) => {
    const { accounts, transactions, addAccount, updateAccount, deleteAccount } = data;
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
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

    const accountsWithStats = useMemo(() => {
        const accountsWithData = accounts.map(account => {
            const accountTransactions = transactions.filter(t => t.accountId === account.id);
            const totalIncome = accountTransactions
                .filter(t => t.type === TransactionType.INCOME)
                .reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = accountTransactions
                .filter(t => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                ...account,
                totalIncome,
                totalExpenses,
                transactionCount: accountTransactions.length
            };
        });

        // 기본 계좌를 맨 앞으로 정렬
        return accountsWithData.sort((a, b) => {
            const isADefault = a.id === '00000000-0000-0000-0000-000000000001';
            const isBDefault = b.id === '00000000-0000-0000-0000-000000000001';
            
            if (isADefault && !isBDefault) return -1;
            if (!isADefault && isBDefault) return 1;
            return 0; // 기본 계좌가 아닌 경우 원래 순서 유지
        });
    }, [accounts, transactions]);

    const handleAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        // 해당 계좌의 거래 내역 개수 확인
        const accountTransactions = transactions.filter(t => t.accountId === id);
        const transactionCount = accountTransactions.length;
        
        let confirmMessage = '이 계좌를 삭제하시겠습니까?';
        if (transactionCount > 0) {
            confirmMessage += `\n\n⚠️ 이 계좌에는 ${transactionCount}개의 거래 내역이 있습니다.\n거래 내역이 있는 계좌는 삭제할 수 없습니다.`;
        }
        
        if (window.confirm(confirmMessage)) {
            try {
                await deleteAccount(id);
                // 성공 시 메시지는 필요없음 (자동으로 목록에서 제거됨)
            } catch (error) {
                alert(`❌ ${error instanceof Error ? error.message : '계좌 삭제에 실패했습니다.'}`);
            }
        }
    };
    
    const handleSave = (account: Omit<Account, 'id'> | Account) => {
        if ('id' in account) {
            updateAccount(account);
        } else {
            addAccount(account);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8">
            {/* Accounts Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {accountsWithStats.map(account => (
                    <div key={account.id} className={`bg-white rounded-lg shadow-lg p-6 ${
                        isCreditCard(account) 
                            ? 'border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50' 
                            : 'border border-slate-200'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className={`text-lg font-semibold ${
                                        isCreditCard(account) ? 'text-orange-600' : 'text-indigo-600'
                                    }`}>{account.name}</h3>
                                    {account.id === '00000000-0000-0000-0000-000000000001' && (
                                        <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                                            기본
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                                        {account.propensity}
                                    </span>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                                        getAccountCategory(account.propensity) === '계좌' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                                        {getAccountCategory(account.propensity)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {isCreditCard(account) ? (
                            // 신용카드 전용 표시
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">사용액:</span>
                                    <span className="font-semibold text-orange-600">{formatCurrency(Math.max(0, account.balance))}</span>
                                </div>
                                
                                {account.creditLimit && account.creditLimit > 0 && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">한도:</span>
                                            <span className="font-semibold text-slate-700">{formatCurrency(account.creditLimit)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">사용가능:</span>
                                            <span className="font-semibold text-green-600">{formatCurrency(getCreditCardAvailableAmount(account))}</span>
                                        </div>
                                        
                                        {/* 사용률 진행바 */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-500">사용률</span>
                                                <span className="text-xs text-slate-600">{getCreditCardUsageRate(account).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        getCreditCardUsageRate(account) > 80 
                                                            ? 'bg-red-500' 
                                                            : getCreditCardUsageRate(account) > 60 
                                                                ? 'bg-orange-500' 
                                                                : 'bg-green-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, getCreditCardUsageRate(account))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                {account.paymentDay && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">결제일:</span>
                                        <span className="text-sm text-slate-700">{account.paymentDay}일</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // 일반 계좌 표시 (기존 로직)
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">{t('summary.income')}:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(account.totalIncome)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">{t('summary.expense')}:</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(account.totalExpenses)}</span>
                                </div>
                                
                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-700">{t('summary.balance')}:</span>
                                        <span className={`text-lg font-bold ${account.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                            {formatCurrency(account.balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEdit(account)}
                                    className="flex-1 bg-indigo-50 text-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-100 text-sm font-medium"
                                >
                                    수정
                                </button>
                                {/* 기본 계좌가 아닌 경우에만 삭제 버튼 표시 */}
                                {account.id !== '00000000-0000-0000-0000-000000000001' && (
                                    <button 
                                        onClick={() => handleDelete(account.id)}
                                        className="flex-1 bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 text-sm font-medium"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Add New Account Card */}
                <div className="bg-white rounded-lg shadow-lg border-2 border-dashed border-slate-400 p-6 flex items-center justify-center hover:border-slate-500 transition-colors">
                    <button 
                        onClick={handleAdd}
                        className="text-center text-slate-500 hover:text-indigo-600"
                    >
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <p className="font-medium">Add New Account</p>
                        <p className="text-xs text-slate-400 mt-1">Create a new account to track</p>
                    </button>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAccount ? '계좌 수정' : '계좌 추가'}>
                <AccountForm
                    account={editingAccount}
                    onSave={handleSave}
                    onBulkSave={async (accounts) => {
                        try {
                            for (const accountData of accounts) {
                                await addAccount(accountData);
                            }
                        } catch (error) {
                            console.error('일괄 계좌 추가 오류:', error);
                        }
                    }}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Mobile Floating Action Button */}
            {!isDesktop && !isModalOpen && (
              <FloatingActionToggle 
                data={data}
                onOpen={() => {
                  setEditingAccount(null);
                  setIsModalOpen(true);
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
