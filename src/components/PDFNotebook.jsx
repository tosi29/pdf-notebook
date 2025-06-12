import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFNotebook = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [ocrTexts, setOcrTexts] = useState({});

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    // Initialize empty OCR texts for each page
    const initialTexts = {};
    for (let i = 1; i <= numPages; i++) {
      initialTexts[i] = '';
    }
    setOcrTexts(initialTexts);
  }, []);

  const onFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  }, []);

  const handleOcrTextChange = useCallback((pageNumber, text) => {
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
          <div className="mb-4">
            <input
              type="file"
              accept=".pdf"
              onChange={onFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
          </div>
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
                className="space-y-6"
              >
                {Array.from({ length: numPages }, (_, index) => (
                  <div key={index + 1} className="bg-white p-4 rounded-lg shadow-md">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Page {index + 1}
                      </span>
                    </div>
                    <Page
                      pageNumber={index + 1}
                      className="mx-auto"
                      scale={0.8}
                    />
                  </div>
                ))}
              </Document>
            </div>

            {/* OCR Text Column */}
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-gray-700 sticky top-0 bg-gray-100 py-2">
                OCR Text
              </h2>
              {Array.from({ length: numPages }, (_, index) => (
                <div key={index + 1} className="bg-white p-4 rounded-lg shadow-md">
                  <div className="mb-2">
                    <label 
                      htmlFor={`ocr-text-${index + 1}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Page {index + 1} OCR Text
                    </label>
                  </div>
                  <textarea
                    id={`ocr-text-${index + 1}`}
                    value={ocrTexts[index + 1] || ''}
                    onChange={(e) => handleOcrTextChange(index + 1, e.target.value)}
                    placeholder="Enter or paste OCR text for this page..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-md 
                      focus:ring-indigo-500 focus:border-indigo-500 resize-none
                      text-sm leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions when no PDF is loaded */}
        {!pdfFile && (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Welcome to PDF Notebook
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload a PDF file to get started. You'll be able to view each page 
                  vertically and add OCR text notes for each page.
                </p>
                <div className="text-sm text-gray-500">
                  Supported format: PDF files only
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