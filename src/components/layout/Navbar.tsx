import React, { useState, useEffect } from 'react';
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
  FolderOpen,
  FolderPlus,
  MoveRight,
} from 'lucide-react';
import { StorageManagerModal } from '../common/StorageManagerModal';

const COLOR_PALETTE = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
];

export const Navbar: React.FC = () => {
  const {
    documents,
    activeDocId,
    activeDoc,
    setActiveDocument,
    closeDocument,
    renameDocument,
    openFiles,
    sections,
    activeSectionId,
    setActiveSectionId,
    addSection,
    renameSection,
    deleteSection,
    moveDocumentToSection,
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

  // Section creation state
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].hex);

  // Section editing state
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [sectionRenameInput, setSectionRenameInput] = useState('');

  // Active Move Menu popup for tab
  const [movingDocId, setMovingDocId] = useState<string | null>(null);

  // Close move dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-move-menu]')) {
        setMovingDocId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    addSection(newSectionName.trim(), selectedColor);
    setNewSectionName('');
    setIsCreatingSection(false);
  };

  const handleSaveSectionRename = (sectionId: string) => {
    if (sectionRenameInput.trim()) {
      renameSection(sectionId, sectionRenameInput.trim());
    }
    setRenamingSectionId(null);
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
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
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

  // Filtered documents according to active section
  const sectionFilteredDocs = documents.filter(d => {
    if (activeSectionId === 'all') return true;
    return (d.sectionId || 'default') === activeSectionId;
  });

  const currentSection = sections.find(s => s.id === activeSectionId);

  // When switching section, make sure active document is visible or switch to first doc of this section
  const handleSelectSection = (secId: string) => {
    setActiveSectionId(secId);
    if (secId !== 'all') {
      const sectionDocs = documents.filter(d => (d.sectionId || 'default') === secId);
      if (sectionDocs.length > 0) {
        const isCurrentInSec = sectionDocs.some(d => d.id === activeDocId);
        if (!isCurrentInSec) {
          setActiveDocument(sectionDocs[0].id);
        }
      }
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 flex flex-col z-40 select-none shadow-lg">
      {/* Tier 1: App Header, Section Pills & Global Actions */}
      <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-b border-slate-800/80 gap-2">
        {/* Left: Brand & Custom Section Pills */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          {/* App Logo */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-xs">
              UP
            </div>
            <span className="font-bold text-xs bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent hidden sm:inline whitespace-nowrap">
              Ultimate PDF
            </span>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            {/* "All" Section Pill */}
            <button
              onClick={() => handleSelectSection('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
                activeSectionId === 'all'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
              title="Show all documents across all sections"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeSectionId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {documents.length}
              </span>
            </button>

            {/* Custom Section Pills */}
            {sections.map(section => {
              const isActive = activeSectionId === section.id;
              const isRenaming = renamingSectionId === section.id;
              const count = documents.filter(d => (d.sectionId || 'default') === section.id).length;
              const sectionColor = section.color || '#3b82f6';

              return (
                <div
                  key={section.id}
                  onClick={() => !isRenaming && handleSelectSection(section.id)}
                  onDoubleClick={() => {
                    setRenamingSectionId(section.id);
                    setSectionRenameInput(section.name);
                  }}
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all shrink-0 cursor-pointer relative ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-md ring-1'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  style={{
                    borderColor: isActive ? sectionColor : undefined,
                    boxShadow: isActive ? `0 0 10px ${sectionColor}25` : undefined,
                  }}
                  title={`Section: ${section.name} (Double-click to rename)`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: sectionColor }}
                  />

                  {isRenaming ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleSaveSectionRename(section.id);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={sectionRenameInput}
                        onChange={e => setSectionRenameInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setRenamingSectionId(null);
                        }}
                        autoFocus
                        className="w-20 bg-slate-950 text-white text-[11px] px-1 py-0.5 rounded border border-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="p-0.5 rounded bg-blue-600 text-white hover:bg-blue-500"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="truncate max-w-[100px] sm:max-w-[130px]">{section.name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold"
                        style={{
                          backgroundColor: isActive ? `${sectionColor}35` : '#334155',
                          color: isActive ? sectionColor : '#94a3b8',
                        }}
                      >
                        {count}
                      </span>

                      {/* Section Quick Actions on Hover */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setRenamingSectionId(section.id);
                            setSectionRenameInput(section.name);
                          }}
                          className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-300"
                          title="Rename section"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>

                        {section.id !== 'default' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              requestProtectedDelete({
                                title: `Delete Section "${section.name}"`,
                                itemDescription: `Are you sure you want to delete this section? All ${count} PDFs inside it will be moved to the General section.`,
                                onConfirm: () => deleteSection(section.id),
                              });
                            }}
                            className="p-0.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-300"
                            title="Delete section"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* "+ New Section" Button / Inline Creator */}
            {isCreatingSection ? (
              <form
                onSubmit={handleCreateSection}
                className="flex items-center gap-1.5 bg-slate-950/90 border border-blue-500/80 rounded-xl px-2 py-0.5 shadow-lg shrink-0 animate-in fade-in"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                <input
                  type="text"
                  placeholder="Section Name (e.g. Maths)"
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Escape') setIsCreatingSection(false);
                  }}
                  className="w-28 sm:w-36 bg-transparent text-white text-xs placeholder-slate-500 focus:outline-hidden"
                />

                {/* Color swatches */}
                <div className="flex items-center gap-1">
                  {COLOR_PALETTE.map(c => (
                    <button
                      type="button"
                      key={c.hex}
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        selectedColor === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingSection(false)}
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingSection(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/40 hover:bg-blue-600/20 border border-dashed border-slate-700 hover:border-blue-500/60 text-slate-400 hover:text-blue-300 text-xs font-semibold cursor-pointer transition-all shrink-0"
                title="Create a new customized section"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>New Section</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Studio Utility Action Buttons */}
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

          {/* Eye Care / Visual Filters */}
          <button
            onClick={() => setIsFiltersModalOpen(true)}
            className={`p-1 px-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              activeDoc?.filters.brightness !== 100 ||
              activeDoc?.filters.contrast !== 100 ||
              activeDoc?.filters.invert ||
              activeDoc?.filters.sepia
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
      </div>

      {/* Tier 2: Selected Section's PDF Document Tabs Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-3 py-1 bg-slate-950/60 gap-2 border-t border-slate-800/40">
        {/* Multi-Document Compact Tabs for Current Section */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          {sectionFilteredDocs.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic py-1 px-2">
              No PDFs in this section yet. Click &quot;+ Open PDF&quot; to add one!
            </div>
          ) : (
            sectionFilteredDocs.map(doc => {
              const isActive = doc.id === activeDocId;
              const isRenaming = renamingDocId === doc.id;
              const cleanName = doc.name.replace(/\.pdf$/i, '');
              const docSection = sections.find(s => s.id === (doc.sectionId || 'default'));
              const isMoving = movingDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => !isRenaming && setActiveDocument(doc.id)}
                  onDoubleClick={() => !isRenaming && startRenaming(doc.id, doc.name)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium cursor-pointer transition-all shrink-0 max-w-[140px] sm:max-w-[180px] md:max-w-[220px] ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500/80 text-blue-200 shadow-xs ring-1 ring-blue-500/40 font-semibold'
                      : 'bg-slate-800/40 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={`Double click to rename: ${doc.name}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: docSection?.color || '#3b82f6' }}
                    title={`Section: ${docSection?.name || 'General'}`}
                  />
                  <FileText className={`w-3 h-3 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />

                  {isRenaming ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleSaveRename(doc.id);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 min-w-0 flex-1"
                    >
                      <input
                        type="text"
                        value={renameInput}
                        onChange={e => setRenameInput(e.target.value)}
                        onKeyDown={e => {
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
                      <span className="truncate text-[11px] flex-1">{cleanName}</span>

                      {/* Action buttons on hover */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Move to another section button */}
                        <div className="relative" data-move-menu>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setMovingDocId(isMoving ? null : doc.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-slate-700/80 text-slate-400 hover:text-emerald-300 transition-opacity cursor-pointer"
                            title="Move to another section"
                          >
                            <MoveRight className="w-2.5 h-2.5" />
                          </button>

                          {/* Move Menu Dropdown */}
                          {isMoving && (
                            <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 min-w-[140px] flex flex-col gap-1 backdrop-blur-md">
                              <span className="text-[10px] font-bold text-slate-400 px-1 pb-1 border-b border-slate-800">
                                Move to Section:
                              </span>
                              {sections.map(sec => (
                                <button
                                  key={sec.id}
                                  onClick={e => {
                                    e.stopPropagation();
                                    moveDocumentToSection(doc.id, sec.id);
                                    setMovingDocId(null);
                                  }}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-left hover:bg-slate-800 transition-colors cursor-pointer ${
                                    (doc.sectionId || 'default') === sec.id
                                      ? 'text-blue-400 font-bold bg-blue-500/10'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: sec.color || '#3b82f6' }}
                                  />
                                  <span className="truncate">{sec.name}</span>
                                  {(doc.sectionId || 'default') === sec.id && (
                                    <Check className="w-3 h-3 ml-auto text-blue-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Rename icon */}
                        <button
                          onClick={e => {
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
                          onClick={e => {
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
            })
          )}

          {/* "+ Open PDF to [Section]" Button */}
          <label
            className="p-1 px-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors flex items-center gap-1 text-xs shrink-0 font-medium shadow-xs"
            title={`Open and add PDF directly to ${activeSectionId === 'all' ? 'General' : currentSection?.name || 'Section'}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] pr-0.5 font-semibold">
              Open PDF {activeSectionId !== 'all' && currentSection ? `to ${currentSection.name}` : ''}
            </span>
            <input
              type="file"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  const targetSec = activeSectionId !== 'all' ? activeSectionId : 'default';
                  openFiles(e.target.files, targetSec);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Storage Manager Modal */}
      <StorageManagerModal isOpen={isStorageModalOpen} onClose={() => setIsStorageModalOpen(false)} />
    </header>
  );
};
