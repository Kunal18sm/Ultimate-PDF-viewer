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
              Add stamps like APPROVED, CONFIDENTIAL, or custom tags to quickly jump back to important pages.
            </p>
          </div>
        ) : (
          stamps.map(stamp => {
            const isCurrentPage = activeDoc.currentPage === stamp.pageNumber;
            return (
              <div
                key={stamp.id}
                onClick={() => jumpToStamp(stamp)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                  isCurrentPage
                    ? 'bg-blue-600/10 border-blue-500/60 ring-1 ring-blue-500/20'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Header: Label + Page Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stamp.color }}
                    />
                    <span 
                      className="text-xs font-bold tracking-wider"
                      style={{ color: stamp.color }}
                    >
                      {stamp.label}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium bg-slate-900 px-2 py-0.5 rounded-md text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-950/80 transition-colors flex items-center gap-1">
                    Page {stamp.pageNumber}
                    <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>

                {/* Subtitle / Note */}
                {stamp.note && (
                  <p className="text-[11px] text-slate-400 pl-4.5 line-clamp-2">
                    {stamp.note}
                  </p>
                )}

                {/* Footer details & Delete */}
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 pl-4.5">
                  <span>
                    {new Date(stamp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
