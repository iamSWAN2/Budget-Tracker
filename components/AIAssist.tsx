
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { AIIcon } from './icons/Icons';
import { Spinner } from './ui/Spinner';
import { analyzeTransactionsFromFile } from '../services/geminiService';
import { AITransaction, Account } from '../types';
import { UseDataReturn } from '../hooks/useData';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const AIAssist: React.FC<{data: UseDataReturn}> = ({ data }) => {
  const { accounts, addMultipleTransactions } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'confirm' | 'loading' | 'error'>('upload');
  const [analyzedTransactions, setAnalyzedTransactions] = useState<AITransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('loading');
    try {
      const results = await analyzeTransactionsFromFile(file);
      setAnalyzedTransactions(results);
      setStep('confirm');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    if (!selectedAccountId) {
        setErrorMessage("Please select an account to add transactions to.");
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

  const handleClose = () => {
    setIsModalOpen(false);
    // Reset state after a short delay to allow modal to close smoothly
    setTimeout(() => {
        setStep('upload');
        setAnalyzedTransactions([]);
        setErrorMessage('');
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
            <p className="mt-4 text-slate-600">Analyzing your document... Please wait.</p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-red-600 font-semibold">Analysis Failed</p>
            <p className="mt-2 text-slate-600">{errorMessage}</p>
            <button
                onClick={() => setStep('upload')}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
                Try Again
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div>
            <p className="text-slate-600 mb-4">Upload an image or a supported document of your bank statement to automatically extract transactions.</p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <label htmlFor="file-upload" className="cursor-pointer text-primary-600 font-semibold">
                Choose a file
              </label>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,.csv,.pdf" onChange={handleFileChange} />
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF, CSV, PDF up to 10MB</p>
            </div>
          </div>
        )}
        
        {step === 'confirm' && (
          <div>
            <p className="text-slate-700 mb-2">Review the transactions found. Select an account to add them to.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700">Add to Account:</label>
              <select 
                value={selectedAccountId} 
                onChange={e => setSelectedAccountId(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
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
                <button type="button" onClick={() => setStep('upload')} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Back</button>
                <button type="button" onClick={handleConfirm} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Confirm and Add</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AIAssist;
