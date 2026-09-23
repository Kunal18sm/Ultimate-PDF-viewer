import React, { useEffect } from 'react';
import { PDFProvider, usePDF } from './context/PDFContext';
import { Navbar } from './components/layout/Navbar';
import { Toolbar } from './components/layout/Toolbar';
import { Sidebar } from './components/layout/Sidebar';
import { PDFViewer } from './components/viewer/PDFViewer';
import { StampPickerModal } from './components/stamps/StampPickerModal';
import { VisualFiltersModal } from './components/common/VisualFiltersModal';
import { ShortcutsModal } from './components/common/ShortcutsModal';

const PDFStudioApp: React.FC = () => {
  const {
    activeDoc,
    setTool,
    setZoom,
    setCurrentPage,
    undo,
    redo,
    setIsStampPickerOpen,
    setIsFiltersModalOpen,
    setIsShortcutsOpen,
  } = usePDF();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
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
  }, [activeDoc, setTool, setZoom, setCurrentPage, undo, redo, setIsStampPickerOpen, setIsFiltersModalOpen, setIsShortcutsOpen]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation & Tabs */}
      <Navbar />

      {/* Main Toolbar */}
      <Toolbar />

      {/* Center Studio Area (Sidebar + PDF Viewport) */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <PDFViewer />
      </div>

      {/* Modals & Dialogs */}
      <StampPickerModal />
      <VisualFiltersModal />
      <ShortcutsModal />
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
