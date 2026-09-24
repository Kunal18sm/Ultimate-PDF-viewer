import React from 'react';
import { usePDF } from '../../context/PDFContext';
import { Plus, Trash2, ArrowRight, Tag, Pencil, Eye, EyeOff } from 'lucide-react';

export const StampSidebarList: React.FC = () => {
  const { 
    activeDoc, 
    jumpToStamp, 
    removeStamp, 
    setIsStampPickerOpen,
    openStampEditor,
    setEditingStamp,
    showPageStamps,
    toggleShowPageStamps,
    requestProtectedDelete,
    dualActivePane,
    setDualActivePane,
    setDualLeftPage,
    setDualRightPage,
  } = usePDF();

  if (!activeDoc) {
    return (
      <div className="p-4 text-center text-xs text-slate-500">
        No document open
      </div>
    );
  }

  const stamps = activeDoc.stamps || [];
  const isDual = activeDoc.viewMode === 'dual';
  const leftPage = activeDoc.dualLeftPage ?? activeDoc.currentPage ?? 1;
  const rightPage = activeDoc.dualRightPage ?? (leftPage < activeDoc.numPages ? leftPage + 1 : leftPage);

  return (
    <div className="flex flex-col h-full">
      {/* Top action buttons */}
      <div className="p-3 border-b border-slate-800 flex items-center gap-2">
        <button
          onClick={() => {
            setEditingStamp(null);
            setIsStampPickerOpen(true);
          }}
          className="flex-1 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stamp
        </button>

        <button
          onClick={toggleShowPageStamps}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
            showPageStamps
              ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
          }`}
          title={showPageStamps ? 'Hide Stamps on PDF Pages' : 'Show Stamps on PDF Pages'}
        >
          {showPageStamps ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
        </button>
      </div>

      {/* Dual Screen Target Banner */}
      {isDual && (
        <div className="px-3 py-2 bg-blue-950/40 border-b border-blue-900/50 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium">Stamps target:</span>
            <span className="text-[10px] text-blue-400 font-bold">
              {dualActivePane === 'left' ? 'Screen 1 (Left)' : 'Screen 2 (Right)'}
            </span>
          </div>
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDualActivePane('left')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                dualActivePane === 'left'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Screen 1 (p.{leftPage})
            </button>
            <button
              onClick={() => setDualActivePane('right')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                dualActivePane === 'right'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Screen 2 (p.{rightPage})
            </button>
          </div>
        </div>
      )}

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
            const isLeft = isDual && leftPage === stamp.pageNumber;
            const isRight = isDual && rightPage === stamp.pageNumber;
            const isCurrentPage = !isDual && activeDoc.currentPage === stamp.pageNumber;

            return (
              <div
                key={stamp.id}
                onClick={() => jumpToStamp(stamp)}
                className={`group px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isLeft || isRight || isCurrentPage
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
                  <div className="flex flex-col min-w-0">
                    <span 
                      className="text-xs font-bold tracking-wider truncate"
                      style={{ color: stamp.color }}
                      title={stamp.label}
                    >
                      {stamp.label}
                    </span>
                    {stamp.note && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {stamp.note}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Page Badge, Dual Jump buttons, Edit, Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDual && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDualLeftPage(stamp.pageNumber);
                          setDualActivePane('left');
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[9px] font-mono font-bold border border-slate-700 cursor-pointer"
                        title={`Open on Screen 1 (Left)`}
                      >
                        S1
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDualRightPage(stamp.pageNumber);
                          setDualActivePane('right');
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[9px] font-mono font-bold border border-slate-700 cursor-pointer"
                        title={`Open on Screen 2 (Right)`}
                      >
                        S2
                      </button>
                    </div>
                  )}

                  <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                    isLeft
                      ? 'bg-blue-600 text-white border-blue-400'
                      : isRight
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-900 border-slate-700/60 text-slate-400 group-hover:text-blue-300 group-hover:border-blue-500/40'
                  }`}>
                    {isLeft ? 'S1: p.' : isRight ? 'S2: p.' : 'p.'}{stamp.pageNumber}
                    {!isDual && <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </span>

                  {/* Edit Stamp Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openStampEditor(stamp);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                    title="Edit Stamp (Color, Name, Note)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Stamp Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requestProtectedDelete({
                        title: 'Delete Stamp',
                        itemDescription: `Are you sure you want to delete stamp "${stamp.label}" on Page ${stamp.pageNumber}?`,
                        onConfirm: () => removeStamp(stamp.id),
                      });
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
