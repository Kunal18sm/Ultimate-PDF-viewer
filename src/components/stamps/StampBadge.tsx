import React from 'react';
import type { PageStamp } from '../../types/pdf';
import { X, Pencil } from 'lucide-react';
import { usePDF } from '../../context/PDFContext';

interface StampBadgeProps {
  stamp: PageStamp;
  scale?: number;
}

export const StampBadge: React.FC<StampBadgeProps> = ({ stamp }) => {
  const { removeStamp, openStampEditor, requestProtectedDelete } = usePDF();

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
        borderColor: stamp.color,
        backgroundColor: `${stamp.color}15`,
        color: stamp.color,
      }}
      className="absolute group z-20 select-none cursor-pointer border-2 border-dashed rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-[1px] transition-all hover:scale-105 flex flex-col items-center justify-center min-w-[120px]"
      title="Double click to edit stamp"
    >
      {/* Action buttons on hover */}
      <div className="absolute -top-2.5 -right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
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

      {/* Label */}
      <span className="font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs">
        {stamp.label}
      </span>

      {/* Note */}
      {stamp.note && (
        <span className="text-[9px] font-medium opacity-90 truncate max-w-[150px]">
          {stamp.note}
        </span>
      )}
    </div>
  );
};
