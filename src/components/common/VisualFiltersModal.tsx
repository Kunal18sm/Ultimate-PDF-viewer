import React from 'react';
import { usePDF } from '../../context/PDFContext';
import { 
  Sun, 
  Contrast, 
  Moon, 
  BookOpen, 
  RotateCcw, 
  X, 
  Sliders, 
  Eye
} from 'lucide-react';

export const VisualFiltersModal: React.FC = () => {
  const { activeDoc, isFiltersModalOpen, setIsFiltersModalOpen, setFilters, resetFilters } = usePDF();

  if (!isFiltersModalOpen || !activeDoc) return null;

  const filters = activeDoc.filters;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Display & Eye-Care Controls</h3>
              <p className="text-xs text-slate-400">Customize brightness, contrast & reading modes</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFiltersModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Quick Reading Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => resetFilters()}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  filters.brightness === 100 && filters.contrast === 100 && !filters.invert && !filters.sepia && !filters.grayscale
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                Standard / Original
              </button>

              <button
                onClick={() => setFilters({ invert: true, sepia: false, grayscale: false, brightness: 90, contrast: 110 })}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  filters.invert && !filters.sepia
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                Dark Mode / Invert
              </button>

              <button
                onClick={() => setFilters({ sepia: true, invert: false, grayscale: false, brightness: 95, contrast: 95 })}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  filters.sepia
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                Warm Sepia / Eye Care
              </button>

              <button
                onClick={() => setFilters({ grayscale: true, invert: false, sepia: false, brightness: 105, contrast: 120 })}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  filters.grayscale
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Eye className="w-4 h-4 text-slate-400" />
                E-Ink Monochrome
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Brightness Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Brightness
              </span>
              <span className="text-slate-400 font-mono">{filters.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={filters.brightness}
              onChange={(e) => setFilters({ brightness: Number(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Contrast Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-blue-400" /> Contrast
              </span>
              <span className="text-slate-400 font-mono">{filters.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={filters.contrast}
              onChange={(e) => setFilters({ contrast: Number(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Invert PDF Colors (Dark Mode)</span>
              </div>
              <input
                type="checkbox"
                checked={filters.invert}
                onChange={(e) => setFilters({ invert: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Sepia / Blue Light Filter</span>
              </div>
              <input
                type="checkbox"
                checked={filters.sepia}
                onChange={(e) => setFilters({ sepia: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                <Eye className="w-4 h-4 text-slate-400" />
                <span>Grayscale / Black & White</span>
              </div>
              <input
                type="checkbox"
                checked={filters.grayscale}
                onChange={(e) => setFilters({ grayscale: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={() => setIsFiltersModalOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
