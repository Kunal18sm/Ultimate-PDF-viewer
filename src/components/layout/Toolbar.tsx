import React, { useState } from 'react';
import { usePDF } from '../../context/PDFContext';
import {
  MousePointer,
  Hand,
  Pen,
  Highlighter,
  Square,
  Circle,
  MoveRight,
  Minus,
  Type,
  Eraser,
  Zap,
  Undo2,
  Redo2,
  Trash2,
  Search,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Rows3,
  Columns2,
  ChevronDown,
  Eye,
  EyeOff,
  Tag,
  X,
  PanelLeft,
  PenTool,
  LayoutGrid,
  SlidersHorizontal,
  Code2,
} from 'lucide-react';
import { TextSearchBox } from '../common/TextSearchBox';

const PRESET_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#000000',
  '#ffffff',
];

export const Toolbar: React.FC = () => {
  const {
    activeDoc,
    currentTool,
    setTool,
    setToolConfig,
    setCurrentPage,
    setZoom,
    setRotation,
    setViewMode,
    undo,
    redo,
    canUndo,
    canRedo,
    clearPageAnnotations,
    showPageStamps,
    toggleShowPageStamps,
    requestProtectedDelete,
    dualActivePane,
    setDualActivePane,
    setIsStampPickerOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    setActiveSidebarTab,
    setIsBlueprintModalOpen,
  } = usePDF();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);
  const [isDesktopToolbarOpen, setIsDesktopToolbarOpen] = useState(true);

  // Mobile Group Sheets state
  const [activeMobileSheet, setActiveMobileSheet] = useState<'tools' | 'view' | 'stamps' | null>(null);

  if (!activeDoc) return null;

  const { currentPage, numPages, zoom, viewMode, rotation } = activeDoc;
  const currentActivePage = viewMode === 'dual'
    ? (dualActivePane === 'right' 
        ? (activeDoc.dualRightPage ?? Math.min((activeDoc.dualLeftPage ?? currentPage) + 1, numPages))
        : (activeDoc.dualLeftPage ?? currentPage))
    : currentPage;

  const isShapeActive = ['rect', 'circle', 'arrow', 'line'].includes(currentTool.tool);

  // Helper to get active tool display name
  const getToolDisplayName = () => {
    switch (currentTool.tool) {
      case 'select': return 'Select';
      case 'pan': return 'Hand';
      case 'pen': return 'Pen';
      case 'highlighter': return 'Highlight';
      case 'rect': return 'Rectangle';
      case 'circle': return 'Circle';
      case 'arrow': return 'Arrow';
      case 'line': return 'Line';
      case 'text': return 'Text Note';
      case 'eraser': return 'Eraser';
      case 'laser': return 'Laser';
      default: return 'Tool';
    }
  };

  return (
    <>
      {/* 🖥️ Desktop Top Toolbar (Visible >= md) */}
      <div className="hidden md:block relative z-30 select-none">
        <div
          className={`transition-all duration-300 ease-in-out bg-slate-900/95 border-b border-slate-800 backdrop-blur-md overflow-visible ${
            isDesktopToolbarOpen
              ? 'max-h-24 opacity-100 py-1.5 px-3'
              : 'max-h-0 opacity-0 py-0 px-3 overflow-hidden border-b-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            {/* 1. Primary Tool Selection Bar */}
            <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setTool('select')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTool.tool === 'select'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Select & Copy Text (V)"
              >
                <MousePointer className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('pan')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTool.tool === 'pan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Hand / Pan View (H)"
              >
                <Hand className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

              <button
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTool.tool === 'pen'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Pen / Freehand Drawing (P)"
              >
                <Pen className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('highlighter')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTool.tool === 'highlighter'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Highlighter (U)"
              >
                <Highlighter className="w-4 h-4" />
              </button>

              {/* Shape Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!isShapeActive) setTool('rect');
                    setIsShapeDropdownOpen(!isShapeDropdownOpen);
                  }}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-0.5 ${
                    isShapeActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title="Shapes"
                >
                  {currentTool.tool === 'circle' ? <Circle className="w-4 h-4" /> :
                   currentTool.tool === 'arrow' ? <MoveRight className="w-4 h-4" /> :
                   currentTool.tool === 'line' ? <Minus className="w-4 h-4" /> :
                   <Square className="w-4 h-4" />}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isShapeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsShapeDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 min-w-[140px] animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10">
                      <button
                        onClick={() => { setTool('rect'); setIsShapeDropdownOpen(false); }}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer ${
                          currentTool.tool === 'rect' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Square className="w-4 h-4" /> Rectangle
                      </button>
                      <button
                        onClick={() => { setTool('circle'); setIsShapeDropdownOpen(false); }}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer ${
                          currentTool.tool === 'circle' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Circle className="w-4 h-4" /> Circle
                      </button>
                      <button
                        onClick={() => { setTool('arrow'); setIsShapeDropdownOpen(false); }}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer ${
                          currentTool.tool === 'arrow' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <MoveRight className="w-4 h-4" /> Arrow
                      </button>
                      <button
                        onClick={() => { setTool('line'); setIsShapeDropdownOpen(false); }}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer ${
                          currentTool.tool === 'line' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Minus className="w-4 h-4" /> Line
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setTool('text')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTool.tool === 'text'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Add Text Note (T)"
              >
                <Type className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTool.tool === 'eraser'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Eraser (E)"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('laser')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTool.tool === 'laser'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Laser Pointer (L)"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Color Palette & Thickness Picker */}
            <div className="flex items-center gap-2 bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setToolConfig({ color: c })}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      currentTool.color === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  value={currentTool.color}
                  onChange={(e) => setToolConfig({ color: e.target.value })}
                  className="w-5 h-5 rounded-md cursor-pointer bg-transparent border-0 ml-1"
                  title="Custom Hex Color"
                />
              </div>

              <div className="w-px h-4 bg-slate-700/60" />

              <div className="flex items-center gap-1">
                {[1.5, 3, 6, 10].map(w => (
                  <button
                    key={w}
                    onClick={() => setToolConfig({ strokeWidth: w })}
                    className={`p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center w-5 h-5 ${
                      currentTool.strokeWidth === w ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                    }`}
                    title={`${w}px width`}
                  >
                    <span
                      className="rounded-full bg-current"
                      style={{ width: Math.max(2, w), height: Math.max(2, w) }}
                    />
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-slate-700/60" />

              {/* Undo / Redo / Clear */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700/50 transition-colors cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700/50 transition-colors cursor-pointer"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    requestProtectedDelete({
                      title: 'Clear Page Annotations',
                      itemDescription: `Are you sure you want to erase all drawings, shapes, and notes on Page ${currentPage}?`,
                      onConfirm: () => clearPageAnnotations(currentPage),
                    });
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Clear Annotations on this Page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Navigation, View Modes, Search, Zoom */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isSearchOpen
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
                title="Find in PDF (Ctrl+F)"
              >
                <Search className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-0.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
                <button
                  onClick={() => setViewMode('single')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Single Page View"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('continuous')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'continuous' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Continuous Scroll View"
                >
                  <Rows3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('dual')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'dual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Two-Page Spread View"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setRotation(r => r + 90)}
                className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleShowPageStamps}
                className={`p-1.5 px-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                  showPageStamps
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                    : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                }`}
                title={showPageStamps ? 'Hide Stamps on PDF Page' : 'Show Stamps on PDF Page'}
              >
                {showPageStamps ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
                <span className="hidden xl:inline text-[11px] whitespace-nowrap">
                  {showPageStamps ? 'Stamps On' : 'Stamps Off'}
                </span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-800/60 px-1.5 py-1 rounded-xl border border-slate-700/50 text-xs">
                <button
                  onClick={() => setZoom(z => Math.max(0.25, z - 0.15))}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                  title="Zoom Out (Ctrl -)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setZoom(1.0)}
                  className="font-mono text-slate-300 hover:text-blue-400 px-1 cursor-pointer text-[11px]"
                  title="Reset Zoom to 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  onClick={() => setZoom(z => Math.min(4.0, z + 0.15))}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                  title="Zoom In (Ctrl +)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setZoom(1.3)}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer ml-0.5"
                  title="Fit to Width"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-700/50 text-xs">
                {viewMode === 'dual' && (
                  <button
                    onClick={() => setDualActivePane(dualActivePane === 'left' ? 'right' : 'left')}
                    className="px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-[10px] font-bold cursor-pointer mr-0.5 transition-colors"
                  >
                    {dualActivePane === 'left' ? 'S1' : 'S2'}
                  </button>
                )}

                <button
                  onClick={() => setCurrentPage(currentActivePage - 1)}
                  disabled={currentActivePage <= 1}
                  className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
                  <input
                    type="number"
                    min={1}
                    max={numPages}
                    value={currentActivePage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setCurrentPage(val);
                    }}
                    className="w-8 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="text-slate-500">/</span>
                  <span>{numPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(currentActivePage + 1)}
                  disabled={currentActivePage >= numPages}
                  className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Desktop Arrow Toggle Button */}
        <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-auto">
          <button
            onClick={() => setIsDesktopToolbarOpen(prev => !prev)}
            className="group/btn flex items-center gap-1 bg-slate-900/95 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 rounded-b-xl px-3 py-0.5 text-[10px] font-semibold shadow-md shadow-black/50 cursor-pointer transition-all duration-200 hover:scale-105 backdrop-blur-md"
            title={isDesktopToolbarOpen ? 'Collapse Tools' : 'Expand Tools'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 text-blue-400 group-hover/btn:text-blue-300 ${
                isDesktopToolbarOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
            <span className="text-[10px] font-medium text-slate-400 group-hover/btn:text-slate-200">
              {isDesktopToolbarOpen ? 'Hide' : 'Tools'}
            </span>
          </button>
        </div>
      </div>

      {/* 📱 Mobile Floating Bottom Action Bar & Group Buttons (Visible < md) */}
      <div className="md:hidden fixed bottom-2.5 inset-x-2 z-40 flex flex-col items-center gap-2 pointer-events-none select-none">
        {/* Mobile Quick Drawer / Sheet when a group button is active */}
        {activeMobileSheet && (
          <div className="pointer-events-auto w-full max-w-sm bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl p-3 backdrop-blur-2xl animate-in slide-in-from-bottom-3 duration-200 mb-1 ring-1 ring-white/10">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-blue-400">
                {activeMobileSheet === 'tools' ? <Pen className="w-3.5 h-3.5" /> :
                 activeMobileSheet === 'stamps' ? <Tag className="w-3.5 h-3.5" /> :
                 <SlidersHorizontal className="w-3.5 h-3.5" />}
                {activeMobileSheet === 'tools' ? 'Draw & Annotate Tools' :
                 activeMobileSheet === 'stamps' ? 'Page Stamps & Markers' :
                 'View, Zoom & Page Controls'}
              </span>
              <button
                onClick={() => setActiveMobileSheet(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Tools Sheet Content */}
            {activeMobileSheet === 'tools' && (
              <div className="space-y-3">
                {/* Tool Selection Grid */}
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    onClick={() => setTool('select')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'select' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <MousePointer className="w-4 h-4" /> Select
                  </button>

                  <button
                    onClick={() => setTool('pan')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'pan' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Hand className="w-4 h-4" /> Hand
                  </button>

                  <button
                    onClick={() => setTool('pen')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'pen' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Pen className="w-4 h-4" /> Pen
                  </button>

                  <button
                    onClick={() => setTool('highlighter')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'highlighter' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Highlighter className="w-4 h-4" /> Highlight
                  </button>

                  <button
                    onClick={() => setTool('text')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'text' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Type className="w-4 h-4" /> Note
                  </button>

                  <button
                    onClick={() => setTool('rect')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'rect' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Square className="w-4 h-4" /> Rect
                  </button>

                  <button
                    onClick={() => setTool('circle')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'circle' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Circle className="w-4 h-4" /> Circle
                  </button>

                  <button
                    onClick={() => setTool('arrow')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'arrow' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <MoveRight className="w-4 h-4" /> Arrow
                  </button>

                  <button
                    onClick={() => setTool('eraser')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'eraser' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Eraser className="w-4 h-4" /> Eraser
                  </button>

                  <button
                    onClick={() => setTool('laser')}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                      currentTool.tool === 'laser' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" /> Laser
                  </button>
                </div>

                {/* Color Palette & Stroke Size */}
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setToolConfig({ color: c })}
                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                          currentTool.color === c ? 'scale-125 ring-2 ring-white' : 'opacity-80'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={currentTool.color}
                      onChange={(e) => setToolConfig({ color: e.target.value })}
                      className="w-5 h-5 rounded-md cursor-pointer bg-transparent border-0"
                    />
                  </div>

                  <div className="w-px h-6 bg-slate-800" />

                  {/* Widths */}
                  <div className="flex items-center gap-1">
                    {[1.5, 3, 6, 10].map(w => (
                      <button
                        key={w}
                        onClick={() => setToolConfig({ strokeWidth: w })}
                        className={`p-1.5 rounded-lg flex items-center justify-center w-6 h-6 ${
                          currentTool.strokeWidth === w ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <span
                          className="rounded-full bg-current"
                          style={{ width: Math.max(2, w), height: Math.max(2, w) }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Undo / Redo / Clear Actions */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Redo2 className="w-3.5 h-3.5" /> Redo
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      requestProtectedDelete({
                        title: 'Clear Page Annotations',
                        itemDescription: `Erase all drawings, shapes, and notes on Page ${currentPage}?`,
                        onConfirm: () => clearPageAnnotations(currentPage),
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Page
                  </button>
                </div>

                {/* Quick Link to Drawings in Sidebar */}
                <button
                  onClick={() => {
                    setActiveSidebarTab('annotations');
                    setIsSidebarOpen(true);
                    setActiveMobileSheet(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Open Drawings &amp; Notes List (Sidebar)</span>
                </button>
              </div>
            )}

            {/* 2. Stamps Sheet Content */}
            {activeMobileSheet === 'stamps' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                  <span>Total Document Stamps:</span>
                  <span className="font-bold text-blue-400 font-mono px-2 py-0.5 bg-slate-800 rounded-md">
                    {activeDoc.stamps?.length || 0}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsStampPickerOpen(true);
                      setActiveMobileSheet(null);
                    }}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition-all"
                  >
                    <Tag className="w-4 h-4" />
                    <span>+ Add Stamp</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSidebarTab('stamps');
                      setIsSidebarOpen(true);
                      setActiveMobileSheet(null);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <LayoutGrid className="w-4 h-4 text-indigo-400" />
                    <span>View Stamps List</span>
                  </button>
                </div>

                {/* Toggle Stamps on Page */}
                <button
                  onClick={toggleShowPageStamps}
                  className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs cursor-pointer transition-colors ${
                    showPageStamps ? 'bg-slate-800 border-slate-700 text-white' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {showPageStamps ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
                  <span>{showPageStamps ? 'Page Stamps: Visible' : 'Page Stamps: Hidden'}</span>
                </button>

                {/* PDF Blueprint & Sync Code Button */}
                <button
                  onClick={() => {
                    setIsBlueprintModalOpen(true);
                    setActiveMobileSheet(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 hover:text-white font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <span>Copy / Paste PDF Edit Code (Sync)</span>
                </button>
              </div>
            )}

            {/* 3. Page & View Sheet Content */}
            {activeMobileSheet === 'view' && (
              <div className="space-y-3 text-xs">
                {/* View Modes */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">View Mode</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setViewMode('single')}
                      className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold text-[11px] cursor-pointer ${
                        viewMode === 'single' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Single
                    </button>
                    <button
                      onClick={() => setViewMode('continuous')}
                      className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold text-[11px] cursor-pointer ${
                        viewMode === 'continuous' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Rows3 className="w-3.5 h-3.5" /> Scroll
                    </button>
                    <button
                      onClick={() => setViewMode('dual')}
                      className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold text-[11px] cursor-pointer ${
                        viewMode === 'dual' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Columns2 className="w-3.5 h-3.5" /> Dual
                    </button>
                  </div>
                </div>

                {/* Zoom & Rotate Controls */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Zoom &amp; Rotation</span>
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setZoom(z => Math.max(0.25, z - 0.15))}
                        className="p-1.5 bg-slate-800 rounded-lg text-slate-300 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoom(1.0)}
                        className="px-2 py-1 bg-slate-800 rounded-lg text-white font-mono text-xs font-bold cursor-pointer"
                      >
                        {Math.round(zoom * 100)}%
                      </button>
                      <button
                        onClick={() => setZoom(z => Math.min(4.0, z + 0.15))}
                        className="p-1.5 bg-slate-800 rounded-lg text-slate-300 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoom(1.2)}
                        className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        Fit
                      </button>
                    </div>

                    <button
                      onClick={() => setRotation(r => r + 90)}
                      className="p-1.5 bg-slate-800 rounded-lg text-slate-300 flex items-center gap-1 text-[11px] cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{rotation}°</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📱 Mobile Primary Bottom Floating Action Bar */}
        <div className="pointer-events-auto bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl p-1 flex items-center gap-1 backdrop-blur-xl ring-1 ring-white/10 w-full max-w-[calc(100vw-1rem)] sm:max-w-sm justify-between shrink-0">
          {/* Group 1: ✍️ Draw / Tools Button */}
          <button
            onClick={() => setActiveMobileSheet(activeMobileSheet === 'tools' ? null : 'tools')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              activeMobileSheet === 'tools'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-1 ring-blue-400'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full border border-white/50 shrink-0"
              style={{ backgroundColor: currentTool.color }}
            />
            <span className="truncate max-w-[46px]">{getToolDisplayName()}</span>
          </button>

          {/* Group 2: 🏷️ Stamp Button */}
          <button
            onClick={() => setActiveMobileSheet(activeMobileSheet === 'stamps' ? null : 'stamps')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              activeMobileSheet === 'stamps'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-1 ring-blue-400'
                : 'bg-blue-600/15 text-blue-300 border border-blue-500/25 hover:bg-blue-600/25'
            }`}
            title="Stamps List & Add Stamp"
          >
            <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Stamp</span>
          </button>

          {/* Group 3: 📄 Page Navigator with < 1/10 > */}
          <div className="flex items-center gap-0.5 bg-slate-950/90 px-1.5 py-0.5 rounded-xl border border-slate-800 font-mono text-[11px] shrink-0">
            <button
              onClick={() => setCurrentPage(currentActivePage - 1)}
              disabled={currentActivePage <= 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('thumbnails');
                setIsSidebarOpen(true);
              }}
              className="text-white font-bold px-0.5 hover:text-blue-400 transition-colors cursor-pointer"
              title="Click to view Page Thumbnails"
            >
              {currentActivePage}<span className="text-slate-500 font-normal">/</span><span className="text-slate-400 font-normal">{numPages}</span>
            </button>

            <button
              onClick={() => setCurrentPage(currentActivePage + 1)}
              disabled={currentActivePage >= numPages}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Group 4: 📑 Sidebar Lists Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isSidebarOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white'
            }`}
            title="Open Sidebar (Pages, Stamps, Outline, Notes)"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>

          {/* Group 5: ⚙️ View & Zoom Group Trigger */}
          <button
            onClick={() => setActiveMobileSheet(activeMobileSheet === 'view' ? null : 'view')}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              activeMobileSheet === 'view'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
            }`}
            title="View, Zoom & Page Mode"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Group 6: 🔍 Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isSearchOpen
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
            }`}
            title="Search Text"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Search Overlay */}
      <TextSearchBox isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
