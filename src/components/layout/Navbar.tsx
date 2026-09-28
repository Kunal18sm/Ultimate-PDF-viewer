import React, { useState, useRef, useEffect } from 'react';
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
  Lock,
  Pencil,
  ChevronDown,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { StorageManagerModal } from '../common/StorageManagerModal';

export const Navbar: React.FC = () => {
  const {
    documents,
    activeDocId,
    activeDoc,
    setActiveDocument,
    closeDocument,
    renameDocument,
    openFiles,
    setIsFiltersModalOpen,
    setIsStampPickerOpen,
    setIsShortcutsOpen,
    isAutoSaved,
    requestProtectedDelete,
    openPasswordSettings,
  } = usePDF();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Tab renaming state
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Dropdown switcher state
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDocDropdownOpen(false);
      }
    };
    if (isDocDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDocDropdownOpen]);

  const startRenaming = (docId: string, currentName: string) => {
    setRenamingDocId(docId);
    setRenameInput(currentName.replace(/\.pdf$/i, ''));
  };

  const handleSaveRename = (docId: string) => {
    if (renameInput.trim()) {
      renameDocument(docId, renameInput.trim());
    }
    setRenamingDocId(null);
  };

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

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <header className="bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2.5 sm:px-3 py-1.5 z-40 select-none gap-2 relative">
      {/* Left: Logo & Document Tabs Bar */}
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        {/* App Logo */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-xs">
            UP
          </div>
          <span className="font-bold text-xs bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent hidden md:inline whitespace-nowrap">
            Ultimate PDF
          </span>
        </div>

        {/* All Documents Dropdown Switcher Button */}
        {documents.length > 0 && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDocDropdownOpen(!isDocDropdownOpen)}
              className={`p-1 px-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isDocDropdownOpen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
              title="View all open PDFs in list"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-mono font-bold">{documents.length}</span>
              <span className="hidden sm:inline text-[11px]">PDFs</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isDocDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Document Switcher Floating Dropdown Menu */}
            {isDocDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 min-w-[280px] max-w-[340px] flex flex-col gap-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 px-1">
                  <span className="text-xs font-bold text-slate-300">Open Documents ({documents.length})</span>
                  <span className="text-[10px] text-slate-500">Click to switch or rename</span>
                </div>

                {/* Quick Search in documents if > 3 */}
                {documents.length > 3 && (
                  <div className="relative mb-1">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search PDF names..."
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Documents List */}
                <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
                  {filteredDocs.map(doc => {
                    const isActive = doc.id === activeDocId;
                    const isRenamingThis = renamingDocId === doc.id;
                    const cleanName = doc.name.replace(/\.pdf$/i, '');

                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          if (!isRenamingThis) {
                            setActiveDocument(doc.id);
                            setIsDocDropdownOpen(false);
                          }
                        }}
                        className={`group p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer text-xs ${
                          isActive
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                            : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          
                          {isRenamingThis ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveRename(doc.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 flex-1"
                            >
                              <input
                                type="text"
                                value={renameInput}
                                onChange={(e) => setRenameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setRenamingDocId(null);
                                }}
                                autoFocus
                                className="w-full bg-slate-950 text-white text-xs px-1.5 py-0.5 rounded border border-blue-500 focus:outline-hidden"
                              />
                              <button
                                type="submit"
                                className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                                title="Save Name"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </form>
                          ) : (
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate text-xs" title={doc.name}>
                                {cleanName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {doc.numPages} pages • p.{doc.currentPage}
                              </span>
                            </div>
                          )}
                        </div>

                        {!isRenamingThis && (
                          <div className="flex items-center gap-1 shrink-0">
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}

                            {/* Rename button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startRenaming(doc.id, doc.name);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Rename Document"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            {/* Close button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                requestProtectedDelete({
                                  title: 'Close Document Tab',
                                  itemDescription: `Are you sure you want to close "${doc.name}"? It will be removed from your active session.`,
                                  onConfirm: () => closeDocument(doc.id),
                                });
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Close Tab"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Multi-Document Compact Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocId;
            const isRenaming = renamingDocId === doc.id;
            const cleanName = doc.name.replace(/\.pdf$/i, '');

            return (
              <div
                key={doc.id}
                onClick={() => !isRenaming && setActiveDocument(doc.id)}
                onDoubleClick={() => !isRenaming && startRenaming(doc.id, doc.name)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium cursor-pointer transition-all shrink-0 max-w-[130px] sm:max-w-[160px] md:max-w-[190px] ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500/80 text-blue-300 shadow-xs ring-1 ring-blue-500/40'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={`Double click to rename: ${doc.name}`}
              >
                <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />

                {isRenaming ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveRename(doc.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 min-w-0 flex-1"
                  >
                    <input
                      type="text"
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setRenamingDocId(null);
                      }}
                      autoFocus
                      className="w-20 sm:w-28 bg-slate-950 text-white text-[11px] px-1 py-0.5 rounded border border-blue-500 focus:outline-hidden font-mono"
                    />
                    <button
                      type="submit"
                      className="p-0.5 rounded bg-blue-600 text-white hover:bg-blue-500"
                    >
                      <Check className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingDocId(null)}
                      className="p-0.5 rounded hover:bg-slate-700 text-slate-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="truncate text-[11px] flex-1 font-semibold">{cleanName}</span>
                    
                    {/* Action buttons on hover */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Rename icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenaming(doc.id, doc.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-slate-700/80 text-slate-400 hover:text-blue-300 transition-opacity cursor-pointer"
                        title="Rename Tab (or double click tab)"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>

                      {/* Close Tab */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestProtectedDelete({
                            title: 'Close Document Tab',
                            itemDescription: `Are you sure you want to close "${doc.name}"? It will be removed from your active session.`,
                            onConfirm: () => closeDocument(doc.id),
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-opacity cursor-pointer"
                        title="Close Tab"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* New Tab / Upload Button */}
          <label
            className="p-1 px-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors flex items-center gap-1 text-xs shrink-0 font-medium shadow-xs"
            title="Open New PDF File"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] pr-0.5 font-semibold">Open</span>
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
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Storage / RAM Manager Button */}
        <button
          onClick={() => setIsStorageModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white cursor-pointer transition-colors"
          title="Storage & RAM Manager"
        >
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden 2xl:inline text-[11px]">Storage</span>
          <Check className={`w-3 h-3 ${isAutoSaved ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
        </button>

        {/* Display / Brightness Controls Modal */}
        <button
          onClick={() => setIsFiltersModalOpen(true)}
          className={`p-1 px-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
            activeDoc?.filters.brightness !== 100 || activeDoc?.filters.contrast !== 100 || activeDoc?.filters.invert || activeDoc?.filters.sepia
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
          }`}
          title="Brightness & Visual Filters"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline text-[11px]">Eye Care</span>
        </button>

        {/* Add Stamp Button */}
        <button
          onClick={() => setIsStampPickerOpen(true)}
          disabled={!activeDoc}
          className="p-1 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
          title="Add Page Stamp & Jump Marker"
        >
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Stamp</span>
        </button>

        {/* Export Annotated PDF */}
        <button
          onClick={handleExport}
          disabled={!activeDoc || isExporting}
          className="p-1 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
          title="Download PDF with annotations and stamps embedded"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">{isExporting ? 'Exporting...' : 'Export'}</span>
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          disabled={!activeDoc}
          className="p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
          title="Print Document"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        {/* Master Delete Password Security */}
        <button
          onClick={openPasswordSettings}
          className="p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
          title="Master Delete Password & Security Settings"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
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
