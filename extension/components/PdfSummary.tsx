import React, { useState, useRef } from 'react';
import { FileText, Upload, Save, Loader2, AlertCircle, X } from './Icons';
import { ApiClient } from '../utils/api';
import { StorageManager } from '../utils/storage';
import type { Summary } from '../types';

interface PdfSummaryProps {
  onSaveNote: (note: Summary) => void;
}

export const PdfSummary: React.FC<PdfSummaryProps> = ({ onSaveNote }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setSummary('');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
      setSummary('');
    } else {
      setError('Please drop a PDF file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setSummary('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSummarize = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await ApiClient.summarizePdf(selectedFile);
      
      if (response.success && response.data) {
        setSummary(response.data.summary);
      } else {
        setError(response.error || 'Failed to summarize PDF');
      }
    } catch (error) {
      setError('Network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!summary || !selectedFile) return;

    try {
      const note: Summary = {
        id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `PDF: ${selectedFile.name}`,
        content: summary,
        type: 'pdf',
        timestamp: Date.now(),
        source: selectedFile.name,
      };

      await StorageManager.saveNote(note);
      onSaveNote(note);
      
      // Show success feedback
      const originalText = 'Save to Notes';
      const button = document.querySelector('[data-pdf-save-button]') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Saved!';
        button.disabled = true;
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      setError('Failed to save note');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">PDF Summary</h3>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">
              Click to upload or drag and drop a PDF file
            </p>
            <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
          </div>
        )}
      </div>

      {selectedFile && (
        <button
          onClick={handleSummarize}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Summarizing PDF...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>Summarize PDF</span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {summary && (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {summary}
            </div>
          </div>
          
          <button
            onClick={handleSaveToNotes}
            data-pdf-save-button
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save to Notes</span>
          </button>
        </div>
      )}
    </div>
  );
};
