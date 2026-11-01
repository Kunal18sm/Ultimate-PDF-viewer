import React from 'react';
import type { PageStamp } from '../../types/pdf';
import { X, Pencil, Check } from 'lucide-react';
import { usePDF } from '../../context/PDFContext';

interface StampBadgeProps {
  stamp: PageStamp;
  scale?: number;
}

export const StampBadge: React.FC<StampBadgeProps> = ({ stamp }) => {
  const { removeStamp, openStampEditor, requestProtectedDelete, toggleStampComplete } = usePDF();
  const isCompleted = Boolean(stamp.completed);

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        openStampEditor(stamp);
      }}
      style={{
        left: `${stamp.x}%`,
        top: `${stamp.y}%`,
        transform: 'translate(-50%, -50%) rotate(-3deg)',
        borderColor: isCompleted ? '#64748b' : stamp.color,
        backgroundColor: isCompleted ? '#1e293b60' : `${stamp.color}15`,
        color: isCompleted ? '#94a3b8' : stamp.color,
      }}
      className={`absolute group z-20 select-none cursor-pointer border-2 border-dashed rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-[1px] transition-all hover:scale-105 flex flex-col items-center justify-center min-w-[120px] ${
        isCompleted
          ? 'opacity-80 hover:opacity-100 ring-1 ring-slate-700'
          : ''
      }`}
      title={isCompleted ? 'Completed Chapter - Click tick to reopen or double-click to edit' : 'Double click to edit stamp'}
    >
      {/* Quick Tick / Complete Toggle Button (Top Left) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleStampComplete(stamp.id);
        }}
        className={`absolute -top-2.5 -left-2.5 rounded-full p-1 shadow-md transition-all cursor-pointer hover:scale-115 z-30 flex items-center justify-center ${
          isCompleted
            ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/40 opacity-100'
            : 'bg-slate-900 text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
        title={isCompleted ? 'Mark chapter as Incomplete' : 'Mark chapter as Completed (Done)'}
      >
        <Check className="w-2.5 h-2.5 stroke-[3]" />
      </button>

      {/* Action buttons on hover / touch (Top Right) */}
      <div className="absolute -top-2.5 -right-2.5 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-30">
        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openStampEditor(stamp);
          }}
          className="bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-500 cursor-pointer transition-transform hover:scale-110"
          title="Edit stamp"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            requestProtectedDelete({
              title: 'Delete Stamp',
              itemDescription: `Are you sure you want to delete stamp "${stamp.label}" on Page ${stamp.pageNumber}?`,
              onConfirm: () => removeStamp(stamp.id),
            });
          }}
          className="bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-500 cursor-pointer transition-transform hover:scale-110"
          title="Remove stamp"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Label with strikethrough/cut when completed */}
      <div className="flex items-center gap-1.5">
        {isCompleted && (
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
        )}
        <span
          className={`font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs transition-all ${
            isCompleted
              ? 'line-through decoration-slate-400 decoration-2 text-slate-400'
              : ''
          }`}
        >
          {stamp.label}
        </span>
      </div>

      {/* Completed indicator badge or Note */}
      {isCompleted ? (
        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase tracking-wider mt-0.5 flex items-center gap-0.5 shadow-2xs">
          Completed ✓
        </span>
      ) : stamp.note ? (
        <span className="text-[9px] font-medium opacity-90 truncate max-w-[150px]">
          {stamp.note}
        </span>
      ) : null}
    </div>
  );
};
