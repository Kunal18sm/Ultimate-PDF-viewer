import React from 'react';
import { usePDF } from '../../context/PDFContext';
import { Keyboard, X } from 'lucide-react';

const SHORTCUT_LIST = [
  { key: 'V / S', desc: 'Select Text tool' },
  { key: 'H', desc: 'Hand / Pan tool' },
  { key: 'P', desc: 'Pen / Freehand Draw tool' },
  { key: 'U', desc: 'Highlighter tool' },
  { key: 'R', desc: 'Rectangle Shape tool' },
  { key: 'O', desc: 'Circle Shape tool' },
  { key: 'A', desc: 'Arrow Shape tool' },
  { key: 'T', desc: 'Text Annotation tool' },
  { key: 'E', desc: 'Eraser tool' },
  { key: 'L', desc: 'Laser Pointer' },
  { key: 'Ctrl + F', desc: 'Find / Search in document' },
  { key: 'Ctrl + Z', desc: 'Undo stroke / shape' },
  { key: 'Ctrl + Y', desc: 'Redo stroke / shape' },
  { key: 'Ctrl + + / -', desc: 'Zoom in / Zoom out' },
  { key: 'Ctrl + 0', desc: 'Reset zoom (100%)' },
  { key: 'Left / Right', desc: 'Previous / Next page' },
  { key: 'B', desc: 'Toggle bookmark on page' },
  { key: 'F', desc: 'Open Display / Brightness panel' },
  { key: 'M', desc: 'Add Page Stamp modal' },
];

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = usePDF();

  if (!isShortcutsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Boost productivity with quick hotkeys</p>
            </div>
          </div>
          <button 
            onClick={() => setIsShortcutsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHORTCUT_LIST.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80 text-xs">
              <span className="text-slate-300">{item.desc}</span>
              <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-md font-mono text-[11px] text-blue-400 shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 text-right">
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
