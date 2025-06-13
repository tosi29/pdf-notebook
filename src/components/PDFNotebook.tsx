import React, { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
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

type LayoutMode = 'normal' | 'comparison' | 'reading';

const PDFNotebook: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [ocrTexts, setOcrTexts] = useState<OcrTexts>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enlargedPage, setEnlargedPage] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('normal');
  const [pdfVisible, setPdfVisible] = useState<boolean>(true);
  const [textVisible, setTextVisible] = useState<boolean>(true);
  const [allTextVisible, setAllTextVisible] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [modalContainerWidth, setModalContainerWidth] = useState<number>(0);
  const [pdfPageWidth, setPdfPageWidth] = useState<number>(0);
  
  // Refs for measuring container dimensions
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(async ({ numPages }: DocumentLoadSuccess) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    // Initialize empty OCR texts for each page
    const initialTexts: OcrTexts = {};
    for (let i = 1; i <= numPages; i++) {
      initialTexts[i] = '';
    }
    setOcrTexts(initialTexts);
    
    // Extract text from each page and get page dimensions
    if (pdfFile) {
      try {
        // Convert File to ArrayBuffer for PDF.js
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const extractedTexts: OcrTexts = {};
        
        // Get the first page to determine dimensions
        if (numPages > 0) {
          const firstPage = await pdf.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1.0 });
          setPdfPageWidth(viewport.width);
        }
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .filter((item): item is { str: string } => 'str' in item)
              .map((item) => item.str)
              .join(' ');
            extractedTexts[pageNum] = pageText;
          } catch (pageError) {
            console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
            extractedTexts[pageNum] = '';
          }
        }
        
        setOcrTexts(extractedTexts);
      } catch (extractError) {
        console.error('Failed to extract text from PDF:', extractError);
        // Keep the empty texts if extraction fails
      }
    }
  }, [pdfFile]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF loading error:', error);
    setLoading(false);
    setError('Failed to load PDF. Please make sure the file is a valid PDF.');
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

  const clearPdf = useCallback(() => {
    setPdfFile(null);
    setNumPages(null);
    setOcrTexts({});
    setLoading(false);
    setError(null);
  }, []);

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

  const togglePdfVisibility = useCallback(() => {
    // Prevent both columns from being hidden
    if (pdfVisible && !textVisible) return;
    setPdfVisible(prev => !prev);
  }, [pdfVisible, textVisible]);

  const toggleTextVisibility = useCallback(() => {
    // Prevent both columns from being hidden
    if (textVisible && !pdfVisible) return;
    setTextVisible(prev => !prev);
  }, [pdfVisible, textVisible]);

  const toggleAllTextVisibility = useCallback(() => {
    setAllTextVisible(prev => !prev);
  }, []);

  // Generate concatenated text from all pages
  const getAllConcatenatedText = useCallback(() => {
    if (!numPages) return '';
    
    const texts: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const pageText = ocrTexts[i];
      if (pageText && pageText.trim()) {
        texts.push(`=== Page ${i} ===\n${pageText.trim()}`);
      }
    }
    return texts.join('\n\n');
  }, [numPages, ocrTexts]);

  // Copy all text to clipboard
  const copyAllTextToClipboard = useCallback(async () => {
    const allText = getAllConcatenatedText();
    if (!allText.trim()) {
      alert('No text to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(allText);
      // You could add a toast notification here instead of alert
      alert('All text copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text to clipboard');
    }
  }, [getAllConcatenatedText]);

  // Calculate responsive scale for PDF pages
  const calculateResponsiveScale = useCallback((containerWidth: number, isModal: boolean = false) => {
    if (!pdfPageWidth || !containerWidth) {
      // Fallback to original fixed scales
      return isModal ? 1.5 : 0.8;
    }
    
    // For modal, aim to use more of the available width while still fitting comfortably
    const targetWidthRatio = isModal ? 0.85 : 0.95;
    const availableWidth = containerWidth * targetWidthRatio;
    const calculatedScale = availableWidth / pdfPageWidth;
    
    // Set reasonable bounds for the scale
    const minScale = 0.3;
    const maxScale = isModal ? 3.0 : 1.5;
    
    return Math.max(minScale, Math.min(maxScale, calculatedScale));
  }, [pdfPageWidth]);

  // Update container width measurements
  const updateContainerWidth = useCallback(() => {
    if (pdfContainerRef.current) {
      const rect = pdfContainerRef.current.getBoundingClientRect();
      setContainerWidth(rect.width);
    }
  }, []);

  // Update modal container width measurements
  const updateModalContainerWidth = useCallback(() => {
    if (modalContainerRef.current) {
      const rect = modalContainerRef.current.getBoundingClientRect();
      setModalContainerWidth(rect.width);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateContainerWidth();
      updateModalContainerWidth();
    };

    // Update container width on mount and when layout changes
    updateContainerWidth();
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateContainerWidth, updateModalContainerWidth, pdfVisible, textVisible, allTextVisible]);

  // Update modal container width when modal opens
  useEffect(() => {
    if (isModalOpen) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        updateModalContainerWidth();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, updateModalContainerWidth]);

  // Generate dynamic grid class based on column visibility
  const getGridClass = useCallback(() => {
    const visibleColumns = [pdfVisible, textVisible, allTextVisible].filter(Boolean).length;
    
    if (visibleColumns === 0) {
      return "hidden";
    } else if (visibleColumns === 1) {
      return "grid grid-cols-1 gap-8 transition-all duration-300";
    } else if (visibleColumns === 2) {
      return "grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-300";
    } else {
      return "grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-300";
    }
  }, [pdfVisible, textVisible, allTextVisible]);

  // Layout mode helper functions
  const getTextareaHeight = useCallback((pageNumber: number) => {
    switch (layoutMode) {
      case 'normal':
        return 'h-64'; // Fixed height like current implementation
      case 'comparison':
        // For comparison mode, make text box height exactly match PDF container height
        // Adjusted height to better match actual PDF rendering at 0.8 scale
        // Using 650px as closer approximation to theoretical A4 height (674px at 0.8 scale)
        return 'h-650'; // Better match for PDF container height
      case 'reading':
        // For reading mode, calculate height to accommodate all content without scrolling
        const text = ocrTexts[pageNumber] || '';
        if (!text.trim()) {
          return 'min-h-32'; // Minimum height for empty text
        }
        
        // Calculate required height based on content
        const lineCount = text.split('\n').length;
        const estimatedLines = Math.max(lineCount, Math.ceil(text.length / 60));
        const totalLines = Math.max(4, estimatedLines + 1); // Add small padding
        
        // Use min-height classes that allow expansion
        if (totalLines <= 8) return 'min-h-32';
        if (totalLines <= 16) return 'min-h-48';
        if (totalLines <= 24) return 'min-h-64';
        if (totalLines <= 32) return 'min-h-80';
        if (totalLines <= 40) return 'min-h-96';
        return 'min-h-96'; // Cap at a reasonable maximum
      default:
        return 'h-64';
    }
  }, [layoutMode, ocrTexts]);

  const getTextareaResize = () => {
    return layoutMode === 'reading' ? 'resize-y' : 'resize-none';
  };

  const getTextareaStyle = useCallback((pageNumber: number) => {
    if (layoutMode === 'reading') {
      // For reading mode, make textarea auto-expand to fit content
      const text = ocrTexts[pageNumber] || '';
      const lineCount = Math.max(4, text.split('\n').length + 1);
      const estimatedHeight = Math.max(128, lineCount * 24); // 24px per line, minimum 128px
      return {
        height: 'auto',
        minHeight: `${estimatedHeight}px`
      };
    }
    return {};
  }, [layoutMode, ocrTexts]);

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
          
          {/* Layout Mode Selector */}
          {pdfFile && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                レイアウトモード
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLayoutMode('normal')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    layoutMode === 'normal'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  通常
                </button>
                <button
                  onClick={() => setLayoutMode('comparison')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    layoutMode === 'comparison'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  比較
                </button>
                <button
                  onClick={() => setLayoutMode('reading')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    layoutMode === 'reading'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  通読
                </button>
              </div>
            </div>
          )}
          
          {/* Column Visibility Controls */}
          {pdfFile && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示カラム
              </label>
              <div className="flex gap-2 flex-wrap">
                {!pdfVisible && (
                  <button
                    onClick={togglePdfVisibility}
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      PDF Pages を表示
                    </div>
                  </button>
                )}
                {!textVisible && (
                  <button
                    onClick={toggleTextVisibility}
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      OCR Text を表示
                    </div>
                  </button>
                )}
                {!allTextVisible && (
                  <button
                    onClick={toggleAllTextVisibility}
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      All Text を表示
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-600 text-sm">Loading PDF...</p>
            </div>
          )}
        </div>

        {/* PDF Display Area */}
        {pdfFile && (
          <div className={getGridClass()}>
            {/* PDF Pages Column */}
            {pdfVisible && (
              <div className="space-y-8 transition-all duration-300 ease-in-out" ref={pdfContainerRef}>
                <div className="flex items-center justify-between text-xl font-semibold text-gray-700 sticky top-0 bg-gray-100 py-2">
                  <h2>PDF Pages</h2>
                  <button
                    onClick={togglePdfVisibility}
                    disabled={pdfVisible && !textVisible}
                    className={`p-1 rounded transition-colors ${
                      pdfVisible && !textVisible 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-200'
                    }`}
                    aria-label="Hide PDF Pages"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
                          scale={calculateResponsiveScale(containerWidth)}
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
            )}

            {/* OCR Text Column */}
            {textVisible && (
              <div className="space-y-8 transition-all duration-300 ease-in-out">
                <div className="flex items-center justify-between text-xl font-semibold text-gray-700 sticky top-0 bg-gray-100 py-2">
                  <h2>OCR Text</h2>
                  <button
                    onClick={toggleTextVisibility}
                    disabled={textVisible && !pdfVisible}
                    className={`p-1 rounded transition-colors ${
                      textVisible && !pdfVisible 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-200'
                    }`}
                    aria-label="Hide OCR Text"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {numPages && Array.from({ length: numPages }, (_, index) => (
                <div key={index + 1} className="bg-white p-4 rounded-lg shadow-md">
                  <div className={`${layoutMode === 'comparison' ? 'mb-2' : 'mb-3'} flex justify-between items-center`}>
                    <label 
                      htmlFor={`ocr-text-${index + 1}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Page {index + 1} Text
                    </label>
                    <span className="text-xs text-gray-400">
                      {ocrTexts[index + 1]?.length || 0} characters
                    </span>
                  </div>
                  <textarea
                    id={`ocr-text-${index + 1}`}
                    value={ocrTexts[index + 1] || ''}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleOcrTextChange(index + 1, e.target.value)}
                    placeholder="Enter or paste text for this page..."
                    style={getTextareaStyle(index + 1)}
                    className={`w-full ${getTextareaHeight(index + 1)} p-3 border border-gray-300 rounded-md 
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${getTextareaResize()}
                      text-sm leading-relaxed transition-colors`}
                  />
                </div>
              ))}
              </div>
            )}

            {/* All Text Column */}
            {allTextVisible && (
              <div className="space-y-8 transition-all duration-300 ease-in-out">
                <div className="flex items-center justify-between text-xl font-semibold text-gray-700 sticky top-0 bg-gray-100 py-2">
                  <h2>All Text</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAllTextToClipboard}
                      className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                      title="Copy all text to clipboard"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </div>
                    </button>
                    <button
                      onClick={toggleAllTextVisibility}
                      className="p-1 rounded transition-colors hover:bg-gray-200"
                      aria-label="Hide All Text"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <div className="mb-3 flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Concatenated Text from All Pages
                    </label>
                    <span className="text-xs text-gray-400">
                      {getAllConcatenatedText().length} characters
                    </span>
                  </div>
                  <textarea
                    value={getAllConcatenatedText()}
                    readOnly
                    placeholder="No text available. Add text to individual pages to see concatenated result here..."
                    className="w-full h-96 p-3 border border-gray-300 rounded-md 
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      text-sm leading-relaxed transition-colors bg-gray-50 resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions when no PDF is loaded */}
        {!pdfFile && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Welcome to PDF Notebook
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload a PDF file to get started. You'll be able to view each page 
                  vertically and add text notes for each page.
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
            <div className="relative max-w-7xl max-h-full bg-white rounded-lg shadow-2xl" ref={modalContainerRef}>
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
                    scale={calculateResponsiveScale(modalContainerWidth || window.innerWidth - 100, true)}
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