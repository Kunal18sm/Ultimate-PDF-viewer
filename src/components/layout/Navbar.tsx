import React, { useState } from 'react';
import { usePDF } from '../../context/PDFContext';
import { exportAnnotatedPdf } from '../../utils/pdfExport';
import confetti from 'canvas-confetti';
import {
  FileText,
  Plus,
  X,
  Sliders,
  Download,
  Printer,
  Maximize,
  Minimize,
  Keyboard,
  Tag,
  Check,
  HardDrive,
} from 'lucide-react';
import { StorageManagerModal } from '../common/StorageManagerModal';

export const Navbar: React.FC = () => {
  const {
    documents,
    activeDocId,
    activeDoc,
    setActiveDocument,
    closeDocument,
    openFiles,
    setIsFiltersModalOpen,
    setIsStampPickerOpen,
    setIsShortcutsOpen,
    isAutoSaved,
  } = usePDF();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExport = async () => {
    if (!activeDoc) return;
    setIsExporting(true);
    try {
      await exportAnnotatedPdf(activeDoc);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.2 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export PDF: ' + (err as any)?.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 py-2 z-40 select-none">
      {/* Left: Logo & Document Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto max-w-[65%] no-scrollbar">
        {/* App Logo */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-sm">
            UP
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent hidden sm:inline">
            Ultimate PDF
          </span>
        </div>

        {/* Multi-Document Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDocument(doc.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all shrink-0 max-w-[200px] ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500/80 text-blue-300 shadow-xs'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{doc.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDocument(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-white transition-opacity cursor-pointer"
                  title="Close Tab (frees RAM & deletes from cache)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* New Tab / Upload Button */}
          <label
            className="p-1.5 px-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors flex items-center gap-1 text-xs shrink-0 font-medium shadow-xs"
            title="Open New PDF File"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] pr-1">Open PDF</span>
            <input
              type="file"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && openFiles(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Storage / RAM Manager Button */}
        <button
          onClick={() => setIsStorageModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white cursor-pointer transition-colors"
          title="Storage & RAM Manager"
        >
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden xl:inline text-[11px]">Storage / RAM</span>
          <Check className={`w-3 h-3 ${isAutoSaved ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
        </button>

        {/* Display / Brightness Controls Modal */}
        <button
          onClick={() => setIsFiltersModalOpen(true)}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeDoc?.filters.brightness !== 100 || activeDoc?.filters.contrast !== 100 || activeDoc?.filters.invert || activeDoc?.filters.sepia
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
          }`}
          title="Brightness & Visual Filters"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Brightness / Eye Care</span>
        </button>

        {/* Add Stamp Button */}
        <button
          onClick={() => setIsStampPickerOpen(true)}
          disabled={!activeDoc}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
          title="Add Page Stamp & Jump Marker"
        >
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Stamp</span>
        </button>

        {/* Export Annotated PDF */}
        <button
          onClick={handleExport}
          disabled={!activeDoc || isExporting}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
          title="Download PDF with annotations and stamps embedded"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          disabled={!activeDoc}
          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
          title="Print Document"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Storage Manager Modal */}
      <StorageManagerModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
      />
    </header>
  );
};
