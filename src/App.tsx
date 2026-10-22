import React, { useEffect } from 'react';
import { PDFProvider, usePDF } from './context/PDFContext';
import { Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Toolbar } from './components/layout/Toolbar';
import { Sidebar } from './components/layout/Sidebar';
import { PDFViewer } from './components/viewer/PDFViewer';
import { StampPickerModal } from './components/stamps/StampPickerModal';
import { VisualFiltersModal } from './components/common/VisualFiltersModal';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { SecurityDeleteModal } from './components/common/SecurityDeleteModal';
import { BlueprintModal } from './components/blueprint/BlueprintModal';
import { TextSearchBox } from './components/common/TextSearchBox';

const PDFStudioApp: React.FC = () => {
  const {
    activeDoc,
    setTool,
    setZoom,
    setCurrentPage,
    undo,
    redo,
    isStampPickerOpen,
    isFiltersModalOpen,
    isShortcutsOpen,
    securityAction,
    setIsStampPickerOpen,
    setIsFiltersModalOpen,
    setIsShortcutsOpen,
    isFullscreen,
    exitFullscreen,
    isSearchOpen,
    setIsSearchOpen,
    closeSearch,
  } = usePDF();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if any modal is open
      if (isStampPickerOpen || isFiltersModalOpen || isShortcutsOpen || securityAction) {
        return;
      }

      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        exitFullscreen();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Don't trigger if typing in an input, textarea, or button
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON' || 
        target.isContentEditable ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(z => z + 0.15);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom(z => z - 0.15);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (activeDoc && activeDoc.currentPage > 1) {
          e.preventDefault();
          setCurrentPage(activeDoc.currentPage - 1);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (activeDoc && activeDoc.currentPage < activeDoc.numPages) {
          e.preventDefault();
          setCurrentPage(activeDoc.currentPage + 1);
        }
        return;
      }

      // Tool shortcuts
      const key = e.key.toLowerCase();
      switch (key) {
        case 'v': setTool('select'); break;
        case 'h': setTool('pan'); break;
        case 'p': setTool('pen'); break;
        case 'u': setTool('highlighter'); break;
        case 'r': setTool('rect'); break;
        case 'o': setTool('circle'); break;
        case 'a': setTool('arrow'); break;
        case 't': setTool('text'); break;
        case 'e': setTool('eraser'); break;
        case 'l': setTool('laser'); break;
        case 'm': setIsStampPickerOpen(true); break;
        case 'f': setIsFiltersModalOpen(true); break;
        case '?': setIsShortcutsOpen(true); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeDoc,
    setTool,
    setZoom,
    setCurrentPage,
    undo,
    redo,
    isStampPickerOpen,
    isFiltersModalOpen,
    isShortcutsOpen,
    securityAction,
    isFullscreen,
    exitFullscreen,
    setIsSearchOpen,
    setIsStampPickerOpen,
    setIsFiltersModalOpen,
    setIsShortcutsOpen,
  ]);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Top Navigation & Tabs - Hidden in Fullscreen Pure Mode */}
      {!isFullscreen && <Navbar />}

      {/* Main Toolbar - Hidden in Fullscreen Pure Mode */}
      {!isFullscreen && <Toolbar />}

      {/* Center Studio Area (Sidebar + PDF Viewport) */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {!isFullscreen && <Sidebar />}
        <PDFViewer />
      </div>

      {/* Floating Minimize Button & Page Navigator in Full Screen Mode */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          {activeDoc && activeDoc.numPages > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs text-slate-300 font-mono shadow-2xl">
              <button
                onClick={() => setCurrentPage(Math.max(1, activeDoc.currentPage - 1))}
                disabled={activeDoc.currentPage <= 1}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-25 cursor-pointer text-slate-400 hover:text-white transition-colors"
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-semibold text-slate-200 select-none">
                {activeDoc.currentPage} / {activeDoc.numPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(activeDoc.numPages, activeDoc.currentPage + 1))}
                disabled={activeDoc.currentPage >= activeDoc.numPages}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-25 cursor-pointer text-slate-400 hover:text-white transition-colors"
                title="Next Page (Right Arrow)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={exitFullscreen}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all duration-150 cursor-pointer group hover:border-blue-500/60 hover:scale-105 active:scale-95"
            title="Minimize / Exit Fullscreen (Esc) - Show all tools"
          >
            <Minimize className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">Minimize</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
              Esc
            </kbd>
          </button>
        </div>
      )}

      {/* Search Overlay */}
      <TextSearchBox isOpen={isSearchOpen} onClose={closeSearch} />

      {/* Modals & Dialogs */}
      <StampPickerModal />
      <VisualFiltersModal />
      <ShortcutsModal />
      <SecurityDeleteModal />
      <BlueprintModal />
    </div>
  );
};

export function App() {
  return (
    <PDFProvider>
      <PDFStudioApp />
    </PDFProvider>
  );
}

export default App;
