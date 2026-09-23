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
  EyeOff
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
  } = usePDF();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);

  if (!activeDoc) return null;

  const { currentPage, numPages, zoom, viewMode } = activeDoc;

  const isShapeActive = ['rect', 'circle', 'arrow', 'line'].includes(currentTool.tool);

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 z-30 select-none backdrop-blur-md overflow-x-auto no-scrollbar">
      {/* 1. Primary Tool Selection Bar */}
      <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
        {/* Select Text */}
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

        {/* Pan Tool */}
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

        {/* Freehand Pen */}
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

        {/* Highlighter */}
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

        {/* Shape Tools Dropdown / Selector */}
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
            title="Shapes (Rectangle, Circle, Arrow, Line)"
          >
            {currentTool.tool === 'circle' ? <Circle className="w-4 h-4" /> :
             currentTool.tool === 'arrow' ? <MoveRight className="w-4 h-4" /> :
             currentTool.tool === 'line' ? <Minus className="w-4 h-4" /> :
             <Square className="w-4 h-4" />}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Dropdown Menu */}
          {isShapeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 min-w-[130px]">
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
          )}
        </div>

        {/* Text Note */}
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

        {/* Eraser */}
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

        {/* Laser Pointer */}
        <button
          onClick={() => setTool('laser')}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            currentTool.tool === 'laser'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
          title="Laser Pointer Presentation Tool (L)"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Color Palette & Thickness Picker */}
      <div className="flex items-center gap-2 bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-700/50">
        {/* Colors */}
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

        {/* Stroke Width */}
        <div className="flex items-center gap-1">
          {[1.5, 3, 6, 10].map(w => (
            <button
              key={w}
              onClick={() => setToolConfig({ strokeWidth: w })}
              className={`p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center w-5 h-5 ${
                currentTool.strokeWidth === w ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'
              }`}
              title={`${w}px line width`}
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
            className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => clearPageAnnotations(currentPage)}
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Clear Annotations on this Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Navigation, View Modes, Search, Zoom */}
      <div className="flex items-center gap-2">
        {/* Find in Document Toggle */}
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
            isSearchOpen
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
          }`}
          title="Find text in PDF (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* View Mode (Single, Continuous, Dual) */}
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

        {/* Rotate */}
        <button
          onClick={() => setRotation(r => r + 90)}
          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Toggle Hide/Show Stamps on Page */}
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
          <span className="hidden lg:inline text-[11px] whitespace-nowrap">
            {showPageStamps ? 'Stamps On' : 'Stamps Off'}
          </span>
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/60 px-1.5 py-1 rounded-xl border border-slate-700/50 text-xs">
          <button
            onClick={() => setZoom(z => z - 0.15)}
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
            onClick={() => setZoom(z => z + 0.15)}
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
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
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
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Search Overlay */}
      <TextSearchBox isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
