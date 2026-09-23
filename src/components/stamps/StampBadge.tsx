import React from 'react';
import type { PageStamp } from '../../types/pdf';
import { X } from 'lucide-react';
import { usePDF } from '../../context/PDFContext';

interface StampBadgeProps {
  stamp: PageStamp;
  scale?: number;
}

export const StampBadge: React.FC<StampBadgeProps> = ({ stamp }) => {
  const { removeStamp } = usePDF();

  return (
    <div
      style={{
        left: `${stamp.x}%`,
        top: `${stamp.y}%`,
        transform: 'translate(-50%, -50%) rotate(-3deg)',
        borderColor: stamp.color,
        backgroundColor: `${stamp.color}15`,
        color: stamp.color,
      }}
      className="absolute group z-20 select-none cursor-grab active:cursor-grabbing border-2 border-dashed rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-[1px] transition-all hover:scale-105 flex flex-col items-center justify-center min-w-[120px]"
    >
      {/* Delete button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeStamp(stamp.id);
        }}
        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-500 cursor-pointer"
        title="Remove stamp"
      >
        <X className="w-3 h-3" />
      </button>

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
