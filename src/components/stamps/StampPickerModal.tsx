import React, { useState, useEffect, useRef } from 'react';
import { usePDF } from '../../context/PDFContext';
import type { StampPreset } from '../../types/pdf';
import { 
  CheckCircle2, 
  XCircle, 
  Lock, 
  FileCheck, 
  AlertTriangle, 
  Flame, 
  Award, 
  FileText, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  Tag, 
  X,
  Plus,
  Check,
  Pencil
} from 'lucide-react';

const STAMP_PRESETS: Array<{
  id: StampPreset;
  label: string;
  defaultNote: string;
  color: string;
  icon: React.ElementType;
}> = [
  { id: 'APPROVED', label: 'APPROVED', defaultNote: 'Verified & Approved', color: '#10b981', icon: CheckCircle2 },
  { id: 'REVIEWED', label: 'REVIEWED', defaultNote: 'Audit Completed', color: '#3b82f6', icon: FileCheck },
  { id: 'CONFIDENTIAL', label: 'CONFIDENTIAL', defaultNote: 'Internal Eyes Only', color: '#ef4444', icon: Lock },
  { id: 'IMPORTANT', label: 'IMPORTANT', defaultNote: 'High Priority Action', color: '#f59e0b', icon: AlertTriangle },
  { id: 'URGENT', label: 'URGENT', defaultNote: 'Immediate Attention', color: '#dc2626', icon: Flame },
  { id: 'FINAL', label: 'FINAL VERSION', defaultNote: 'Signed & Sealed', color: '#8b5cf6', icon: Award },
  { id: 'DRAFT', label: 'DRAFT COPY', defaultNote: 'Work in Progress', color: '#64748b', icon: FileText },
  { id: 'PAID', label: 'PAID & SETTLED', defaultNote: 'Invoice Complete', color: '#059669', icon: DollarSign },
  { id: 'STAR', label: 'BOOKMARKED', defaultNote: 'Key Section', color: '#eab308', icon: Star },
  { id: 'VERIFIED', label: 'VERIFIED', defaultNote: 'Quality Assured', color: '#06b6d4', icon: ShieldCheck },
  { id: 'REJECTED', label: 'REJECTED', defaultNote: 'Needs Revision', color: '#e11d48', icon: XCircle },
];

const STAMP_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const StampPickerModal: React.FC = () => {
  const { 
    isStampPickerOpen, 
    setIsStampPickerOpen, 
    addStamp, 
    updateStamp,
    editingStamp,
    setEditingStamp,
    activeDoc 
  } = usePDF();
  
  const [selectedPreset, setSelectedPreset] = useState<StampPreset>('APPROVED');
  const [customLabel, setCustomLabel] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [customColor, setCustomColor] = useState('#10b981');
  const [isCustomMode, setIsCustomMode] = useState(true); // Custom Stamp is default
  const [stampPosition, setStampPosition] = useState<'top-right' | 'top-left' | 'center' | 'bottom-right'>('top-right');
  
  const labelInputRef = useRef<HTMLInputElement | null>(null);
  const colorButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const isSubmittingRef = useRef(false);

  // Auto-focus and initialize text / values whenever modal opens
  useEffect(() => {
    if (isStampPickerOpen) {
      isSubmittingRef.current = false;
      if (editingStamp) {
        setCustomLabel(editingStamp.label);
        setCustomNote(editingStamp.note || '');
        setCustomColor(editingStamp.color);
        setIsCustomMode(true);
        if (editingStamp.preset && editingStamp.preset !== 'CUSTOM') {
          setSelectedPreset(editingStamp.preset);
        }
      } else {
        setCustomLabel('');
        setCustomNote('');
        setCustomColor('#10b981');
        setIsCustomMode(true);
      }
      
      const timer = setTimeout(() => {
        labelInputRef.current?.focus();
        labelInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isStampPickerOpen, editingStamp]);

  const handleClose = () => {
    setEditingStamp(null);
    setIsStampPickerOpen(false);
  };

  if (!isStampPickerOpen || !activeDoc) return null;

  const currentPreset = STAMP_PRESETS.find(p => p.id === selectedPreset);

  const getCoordinatesForPosition = (pos: string) => {
    switch (pos) {
      case 'top-left': return { x: 18, y: 10 };
      case 'top-right': return { x: 82, y: 10 };
      case 'center': return { x: 50, y: 50 };
      case 'bottom-right': return { x: 80, y: 88 };
      default: return { x: 80, y: 10 };
    }
  };

  const handleApplyStamp = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const coords = getCoordinatesForPosition(stampPosition);
    const finalLabel = isCustomMode
      ? (customLabel.trim() ? customLabel.toUpperCase() : (editingStamp ? editingStamp.label : 'APPROVED'))
      : (currentPreset?.label || 'APPROVED');
    const finalColor = isCustomMode ? customColor : (currentPreset?.color || customColor);
    const finalNote = customNote.trim() || undefined;
    const finalPreset = isCustomMode ? 'CUSTOM' : (currentPreset?.id || 'CUSTOM');

    if (editingStamp) {
      // Edit mode: update existing stamp
      updateStamp(editingStamp.id, {
        label: finalLabel,
        color: finalColor,
        note: finalNote,
        preset: finalPreset,
      });
    } else {
      // Add mode: create new stamp
      addStamp({
        preset: finalPreset,
        label: finalLabel,
        note: finalNote,
        color: finalColor,
        pageNumber: activeDoc.currentPage,
        x: coords.x,
        y: coords.y,
      });
    }

    handleClose();
  };

  // Keyboard navigation from Title input -> Color palette
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      // Move focus to current or first color swatch
      const curIdx = STAMP_COLORS.indexOf(customColor);
      const targetIdx = curIdx >= 0 ? curIdx : 0;
      colorButtonsRef.current[targetIdx]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  };

  // Keyboard navigation between color buttons using Arrow keys and Enter to save
  const handleColorKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (index + 1) % STAMP_COLORS.length;
      setCustomColor(STAMP_COLORS[nextIdx]);
      colorButtonsRef.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + STAMP_COLORS.length) % STAMP_COLORS.length;
      setCustomColor(STAMP_COLORS[prevIdx]);
      colorButtonsRef.current[prevIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Move back to title input
      labelInputRef.current?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleApplyStamp();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {editingStamp ? <Pencil className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                {editingStamp ? 'Edit Page Stamp' : 'Add Page Stamp & Jump Marker'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingStamp 
                  ? `Editing stamp on Page ${editingStamp.pageNumber}` 
                  : `Apply to Page ${activeDoc.currentPage} of ${activeDoc.numPages}`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                isCustomMode ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Stamp (Default)
            </button>
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                !isCustomMode ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Preset Stamps
            </button>
          </div>

          {isCustomMode ? (
            /* Custom Stamp Inputs (Default) */
            <div className="space-y-3.5 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Stamp Title <span className="text-blue-400 font-normal">(Press Enter to choose Color)</span>
                </label>
                <input
                  ref={labelInputRef}
                  type="text"
                  placeholder="e.g. APPROVED, IMP, REVISED, DOUBT..."
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Stamp Color</label>
                  <span className="text-[10px] text-slate-400 font-normal">← → Arrow keys to change, Enter to Save</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {STAMP_COLORS.map((c, idx) => (
                    <button
                      key={c}
                      ref={(el) => { colorButtonsRef.current[idx] = el; }}
                      type="button"
                      tabIndex={0}
                      onClick={() => setCustomColor(c)}
                      onKeyDown={(e) => handleColorKeyDown(idx, e)}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer shrink-0 focus:outline-hidden ${
                        customColor === c 
                          ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900 shadow-sm' 
                          : 'hover:scale-110 opacity-80 hover:opacity-100 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-slate-900'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Color ${c} (Press Enter to apply)`}
                    />
                  ))}
                  <div className="relative w-5 h-5 rounded-full overflow-hidden border border-slate-600 cursor-pointer shrink-0 flex items-center justify-center hover:scale-110 transition-transform">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="absolute inset-0 w-8 h-8 -top-1.5 -left-1.5 cursor-pointer bg-transparent border-0"
                      title="Custom Color Picker"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Presets Grid */
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">Select Stamp Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {STAMP_PRESETS.map(preset => {
                  const Icon = preset.icon;
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setCustomNote('');
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all relative overflow-hidden cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40' 
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-4 h-4" style={{ color: preset.color }} />
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: preset.color }} 
                        />
                      </div>
                      <span className="text-xs font-bold tracking-wide" style={{ color: preset.color }}>
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {preset.defaultNote}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Note / Subtext */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Custom Subtitle / Note <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder={isCustomMode ? "e.g. Verified, Revise this, Important formula..." : currentPreset?.defaultNote}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyStamp();
                } else if (e.key === 'Escape') {
                  handleClose();
                }
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Stamp Placement */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Page Position</label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: 'top-right', label: 'Top Right' },
                { id: 'top-left', label: 'Top Left' },
                { id: 'center', label: 'Center' },
                { id: 'bottom-right', label: 'Bottom Right' }
              ].map(pos => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setStampPosition(pos.id as any)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    stampPosition === pos.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview of the Stamp */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center min-h-[90px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Live Stamp Preview</span>
            <div 
              className="inline-flex flex-col items-center justify-center px-4 py-1.5 rounded-lg border-2 border-dashed transform -rotate-1 shadow-lg"
              style={{
                borderColor: isCustomMode ? customColor : currentPreset?.color,
                backgroundColor: `${isCustomMode ? customColor : currentPreset?.color}15`,
                color: isCustomMode ? customColor : currentPreset?.color,
              }}
            >
              <span className="text-sm font-black tracking-wider uppercase">
                {isCustomMode ? (customLabel.trim() || 'STAMP PREVIEW') : currentPreset?.label}
              </span>
              {(customNote.trim() || (!isCustomMode && currentPreset?.defaultNote)) && (
                <span className="text-[10px] opacity-80 font-medium">
                  {customNote.trim() || currentPreset?.defaultNote}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyStamp}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
          >
            {editingStamp ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingStamp 
              ? 'Save Stamp Changes' 
              : `Apply Stamp to Page ${activeDoc.currentPage}`}
          </button>
        </div>
      </div>
    </div>
  );
};
