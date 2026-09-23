import React from 'react';
import { usePDF } from '../../context/PDFContext';
import { Plus, Trash2, ArrowRight, Tag } from 'lucide-react';

export const StampSidebarList: React.FC = () => {
  const { activeDoc, jumpToStamp, removeStamp, setIsStampPickerOpen } = usePDF();

  if (!activeDoc) {
    return (
      <div className="p-4 text-center text-xs text-slate-500">
        No document open
      </div>
    );
  }

  const stamps = activeDoc.stamps || [];

  return (
    <div className="flex flex-col h-full">
      {/* Top action button */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={() => setIsStampPickerOpen(true)}
          className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stamp on Page {activeDoc.currentPage}
        </button>
      </div>

      {/* Stamps List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {stamps.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <Tag className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-400 mb-1">No Page Stamps Yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Add stamps to quickly jump back to important chapters or pages.
            </p>
          </div>
        ) : (
          stamps.map(stamp => {
            const isCurrentPage = activeDoc.currentPage === stamp.pageNumber;
            return (
              <div
                key={stamp.id}
                onClick={() => jumpToStamp(stamp)}
                className={`group px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentPage
                    ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/40 shadow-xs'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Stamp Color Dot & Label */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: stamp.color }}
                  />
                  <span 
                    className="text-xs font-bold tracking-wider truncate"
                    style={{ color: stamp.color }}
                    title={stamp.label}
                  >
                    {stamp.label}
                  </span>
                </div>

                {/* Page Badge & Delete Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded-md text-slate-400 group-hover:text-blue-300 group-hover:border-blue-500/40 transition-colors flex items-center gap-1">
                    Page {stamp.pageNumber}
                    <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStamp(stamp.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    title="Delete Stamp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
