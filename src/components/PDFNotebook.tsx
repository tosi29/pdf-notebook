import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
// Use the worker file copied to public folder that matches react-pdf's bundled version
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Type definitions
interface OcrTexts {
  [pageNumber: number]: string;
}

interface DocumentLoadSuccess {
  numPages: number;
}

type ViewMode = 'single' | 'comparison';

const PDFNotebook: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  
  // Single PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [ocrTexts, setOcrTexts] = useState<OcrTexts>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Comparison mode state
  const [pdfFile1, setPdfFile1] = useState<File | null>(null);
  const [pdfFile2, setPdfFile2] = useState<File | null>(null);
  const [numPages1, setNumPages1] = useState<number | null>(null);
  const [numPages2, setNumPages2] = useState<number | null>(null);
  const [loading1, setLoading1] = useState<boolean>(false);
  const [loading2, setLoading2] = useState<boolean>(false);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);
  
  // Modal state
  const [enlargedPage, setEnlargedPage] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }: DocumentLoadSuccess) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    // Initialize empty OCR texts for each page
    const initialTexts: OcrTexts = {};
    for (let i = 1; i <= numPages; i++) {
      initialTexts[i] = '';
    }
    setOcrTexts(initialTexts);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF loading error:', error);
    setLoading(false);
    setError('Failed to load PDF. Please make sure the file is a valid PDF.');
  }, []);

  // Comparison mode callbacks
  const onDocument1LoadSuccess = useCallback(({ numPages }: DocumentLoadSuccess) => {
    setNumPages1(numPages);
    setLoading1(false);
    setError1(null);
  }, []);

  const onDocument1LoadError = useCallback((error: Error) => {
    console.error('PDF 1 loading error:', error);
    setLoading1(false);
    setError1('Failed to load PDF 1. Please make sure the file is a valid PDF.');
  }, []);

  const onDocument2LoadSuccess = useCallback(({ numPages }: DocumentLoadSuccess) => {
    setNumPages2(numPages);
    setLoading2(false);
    setError2(null);
  }, []);

  const onDocument2LoadError = useCallback((error: Error) => {
    console.error('PDF 2 loading error:', error);
    setLoading2(false);
    setError2('Failed to load PDF 2. Please make sure the file is a valid PDF.');
  }, []);

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setLoading(true);
        setError(null);
        setNumPages(null);
        setOcrTexts({});
      } else {
        setLoading(false);
        setError('Please select a valid PDF file.');
      }
    }
  }, []);

  const onFile1Change = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile1(file);
        setLoading1(true);
        setError1(null);
        setNumPages1(null);
      } else {
        setLoading1(false);
        setError1('Please select a valid PDF file.');
      }
    }
  }, []);

  const onFile2Change = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile2(file);
        setLoading2(true);
        setError2(null);
        setNumPages2(null);
      } else {
        setLoading2(false);
        setError2('Please select a valid PDF file.');
      }
    }
  }, []);

  const clearPdf = useCallback(() => {
    setPdfFile(null);
    setNumPages(null);
    setOcrTexts({});
    setLoading(false);
    setError(null);
  }, []);

  const clearPdf1 = useCallback(() => {
    setPdfFile1(null);
    setNumPages1(null);
    setLoading1(false);
    setError1(null);
  }, []);

  const clearPdf2 = useCallback(() => {
    setPdfFile2(null);
    setNumPages2(null);
    setLoading2(false);
    setError2(null);
  }, []);

  const clearComparison = useCallback(() => {
    clearPdf1();
    clearPdf2();
  }, [clearPdf1, clearPdf2]);

  const handleOcrTextChange = useCallback((pageNumber: number, text: string) => {
    setOcrTexts(prev => ({
      ...prev,
      [pageNumber]: text
    }));
  }, []);

  const openEnlargedView = useCallback((pageNumber: number) => {
    setEnlargedPage(pageNumber);
    setIsModalOpen(true);
  }, []);

  const closeEnlargedView = useCallback(() => {
    setEnlargedPage(null);
    setIsModalOpen(false);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeEnlargedView();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, closeEnlargedView]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">PDF Notebook</h1>
          
          {/* Mode Toggle */}
          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-gray-200 rounded-lg w-fit">
              <button
                onClick={() => setViewMode('single')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'single'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Single PDF
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'comparison'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Compare PDFs
              </button>
            </div>
          </div>

          {/* File Input Section */}
          {viewMode === 'single' ? (
            <div className="flex gap-4 items-center mb-4">
              <input
                type="file"
                accept=".pdf"
                onChange={onFileChange}
                className="flex-1 text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              {pdfFile && (
                <button
                  onClick={clearPdf}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PDF 1 Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">PDF 1</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={onFile1Change}
                      className="flex-1 text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    {pdfFile1 && (
                      <button
                        onClick={clearPdf1}
                        className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                
                {/* PDF 2 Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">PDF 2</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={onFile2Change}
                      className="flex-1 text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-50 file:text-green-700
                        hover:file:bg-green-100"
                    />
                    {pdfFile2 && (
                      <button
                        onClick={clearPdf2}
                        className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {(pdfFile1 || pdfFile2) && (
                <div className="flex justify-center">
                  <button
                    onClick={clearComparison}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Both PDFs
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Messages */}
          {viewMode === 'single' && error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {viewMode === 'comparison' && (error1 || error2) && (
            <div className="mb-4 space-y-2">
              {error1 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">PDF 1: {error1}</p>
                </div>
              )}
              {error2 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">PDF 2: {error2}</p>
                </div>
              )}
            </div>
          )}

          {/* Loading Messages */}
          {viewMode === 'single' && loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-600 text-sm">Loading PDF...</p>
            </div>
          )}
          
          {viewMode === 'comparison' && (loading1 || loading2) && (
            <div className="mb-4 space-y-2">
              {loading1 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-600 text-sm">Loading PDF 1...</p>
                </div>
              )}
              {loading2 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-600 text-sm">Loading PDF 2...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PDF Display Area */}
        {viewMode === 'single' && pdfFile ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PDF Pages Column */}
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-gray-700 sticky top-0 bg-gray-100 py-2">
                PDF Pages
              </h2>
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="text-center py-8 text-gray-500">Loading PDF...</div>}
                className="space-y-6"
              >
                {numPages && Array.from({ length: numPages }, (_, index) => (
                  <div key={index + 1} className="bg-white p-4 rounded-lg shadow-md">
                    <div className="mb-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Page {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          Click to enlarge
                        </span>
                        <span className="text-xs text-gray-400">
                          {index + 1} of {numPages}
                        </span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group" onClick={() => openEnlargedView(index + 1)}>
                      <div className="relative">
                        <Page
                          pageNumber={index + 1}
                          className="mx-auto"
                          scale={0.8}
                          loading={<div className="text-center py-8 text-gray-500">Loading page...</div>}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-3 shadow-lg">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Document>
            </div>

            {/* OCR Text Column */}
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-gray-700 sticky top-0 bg-gray-100 py-2">
                OCR Text
              </h2>
              {numPages && Array.from({ length: numPages }, (_, index) => (
                <div key={index + 1} className="bg-white p-4 rounded-lg shadow-md">
                  <div className="mb-3 flex justify-between items-center">
                    <label 
                      htmlFor={`ocr-text-${index + 1}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Page {index + 1} OCR Text
                    </label>
                    <span className="text-xs text-gray-400">
                      {ocrTexts[index + 1]?.length || 0} characters
                    </span>
                  </div>
                  <textarea
                    id={`ocr-text-${index + 1}`}
                    value={ocrTexts[index + 1] || ''}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleOcrTextChange(index + 1, e.target.value)}
                    placeholder="Enter or paste OCR text for this page..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-md 
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none
                      text-sm leading-relaxed transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'comparison' && (pdfFile1 || pdfFile2) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PDF 1 Column */}
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-blue-700 sticky top-0 bg-gray-100 py-2">
                PDF 1 {pdfFile1 ? `(${pdfFile1.name})` : '(Not loaded)'}
              </h2>
              {pdfFile1 ? (
                <Document
                  file={pdfFile1}
                  onLoadSuccess={onDocument1LoadSuccess}
                  onLoadError={onDocument1LoadError}
                  loading={<div className="text-center py-8 text-gray-500">Loading PDF 1...</div>}
                  className="space-y-6"
                >
                  {numPages1 && Array.from({ length: numPages1 }, (_, index) => (
                    <div key={index + 1} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-400">
                      <div className="mb-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          Page {index + 1}
                        </span>
                        <span className="text-xs text-gray-400">
                          {index + 1} of {numPages1}
                        </span>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <Page
                          pageNumber={index + 1}
                          className="mx-auto"
                          scale={0.6}
                          loading={<div className="text-center py-8 text-gray-500">Loading page...</div>}
                        />
                      </div>
                    </div>
                  ))}
                </Document>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-gray-500">Load PDF 1 to start comparison</p>
                </div>
              )}
            </div>

            {/* PDF 2 Column */}
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-green-700 sticky top-0 bg-gray-100 py-2">
                PDF 2 {pdfFile2 ? `(${pdfFile2.name})` : '(Not loaded)'}
              </h2>
              {pdfFile2 ? (
                <Document
                  file={pdfFile2}
                  onLoadSuccess={onDocument2LoadSuccess}
                  onLoadError={onDocument2LoadError}
                  loading={<div className="text-center py-8 text-gray-500">Loading PDF 2...</div>}
                  className="space-y-6"
                >
                  {numPages2 && Array.from({ length: numPages2 }, (_, index) => (
                    <div key={index + 1} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-400">
                      <div className="mb-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          Page {index + 1}
                        </span>
                        <span className="text-xs text-gray-400">
                          {index + 1} of {numPages2}
                        </span>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <Page
                          pageNumber={index + 1}
                          className="mx-auto"
                          scale={0.6}
                          loading={<div className="text-center py-8 text-gray-500">Loading page...</div>}
                        />
                      </div>
                    </div>
                  ))}
                </Document>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-gray-500">Load PDF 2 to start comparison</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Instructions when no PDF is loaded */}
        {((viewMode === 'single' && !pdfFile && !loading) || 
          (viewMode === 'comparison' && !pdfFile1 && !pdfFile2 && !loading1 && !loading2)) && (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-4xl mb-4">
                  {viewMode === 'single' ? '📄' : '📄📄'}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {viewMode === 'single' ? 'Welcome to PDF Notebook' : 'PDF Comparison Mode'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {viewMode === 'single' 
                    ? 'Upload a PDF file to get started. You\'ll be able to view each page vertically and add OCR text notes for each page.'
                    : 'Upload two PDF files to compare them side by side. Perfect for reviewing different versions or related documents.'
                  }
                </p>
                <div className="text-sm text-gray-500">
                  <strong>Supported format:</strong> PDF files only
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enlarged PDF Modal */}
        {isModalOpen && enlargedPage && pdfFile && (
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
            onClick={closeEnlargedView}
          >
            <div className="relative max-w-7xl max-h-full bg-white rounded-lg shadow-2xl">
              {/* Close button */}
              <button
                onClick={closeEnlargedView}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Close enlarged view"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Page info */}
              <div className="absolute top-4 left-4 z-10 bg-white rounded-lg px-3 py-2 shadow-lg">
                <span className="text-sm font-medium text-gray-700">
                  Page {enlargedPage} of {numPages}
                </span>
              </div>

              {/* PDF content */}
              <div 
                className="p-4 overflow-auto max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Document file={pdfFile}>
                  <Page
                    pageNumber={enlargedPage}
                    className="mx-auto"
                    scale={1.5}
                    loading={<div className="text-center py-8 text-gray-500">Loading enlarged page...</div>}
                  />
                </Document>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFNotebook;