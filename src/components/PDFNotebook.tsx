import React, { useState, useCallback, ChangeEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Type definitions
interface OcrTexts {
  [pageNumber: number]: string;
}

interface DocumentLoadSuccess {
  numPages: number;
}

const PDFNotebook: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [ocrTexts, setOcrTexts] = useState<OcrTexts>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
                      <span className="text-xs text-gray-400">
                        {index + 1} of {numPages}
                      </span>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <Page
                        pageNumber={index + 1}
                        className="mx-auto"
                        scale={0.8}
                        loading={<div className="text-center py-8 text-gray-500">Loading page...</div>}
                      />
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
                  vertically and add OCR text notes for each page.
                </p>
                <div className="text-sm text-gray-500">
                  <strong>Supported format:</strong> PDF files only
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFNotebook;