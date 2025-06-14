# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Development:
- `npm run dev` - Start development server with Vite
- `npm run build` - Build production bundle 
- `npm run preview` - Preview production build locally

## Architecture

This is a React-based PDF notebook application that allows users to upload PDFs, view them page-by-page, and add/edit text notes for each page.

### Core Components

- **PDFNotebook** (`src/components/PDFNotebook.tsx`) - Main component handling all PDF operations, text extraction, and UI state
- **App** (`src/App.tsx`) - Simple wrapper that renders PDFNotebook

### Key Features

1. **PDF Processing**: Uses `react-pdf` library with PDF.js worker for rendering and text extraction
2. **Multi-column Layout**: Three toggleable columns - PDF pages, per-page text editing, and concatenated text view
3. **Layout Modes**: Normal (fixed height), Comparison (height matches PDF), Reading (auto-expanding height)
4. **Responsive Design**: Dynamic scaling based on container width, with modal enlarged view
5. **Text Management**: Individual page text editing with automatic OCR text extraction, clipboard copy functionality

### State Management

All state is managed locally in PDFNotebook component using React hooks:
- PDF file and metadata (numPages, loading, error states)
- Text content per page (texts object keyed by page number)
- UI state (column visibility, layout mode, modal state)
- Responsive dimensions (container widths, PDF page dimensions)

### Styling

- **Tailwind CSS** for utility-first styling
- **PostCSS** with Autoprefixer for vendor prefixes
- Responsive grid layout that adapts from 1-3 columns based on screen size and visibility toggles

The application automatically extracts text from uploaded PDFs using PDF.js text content API, but allows manual editing of the extracted text for each page.