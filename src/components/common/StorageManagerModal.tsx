import React, { useEffect, useState } from 'react';
import { usePDF } from '../../context/PDFContext';
import { clearAllDocumentsFromDB, getStorageInfoFromDB } from '../../utils/db';
import { 
  HardDrive, 
  Trash2, 
  X, 
  Cpu, 
  CheckCircle, 
  FileText,
  RefreshCw
} from 'lucide-react';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({ isOpen, onClose }) => {
  const { documents, closeDocument } = usePDF();
  const [storageInfo, setStorageInfo] = useState<{ totalBytes: number; count: number }>({ totalBytes: 0, count: 0 });

  const refreshStorage = () => {
    getStorageInfoFromDB().then(setStorageInfo);
  };

  useEffect(() => {
    if (isOpen) {
      refreshStorage();
    }
  }, [isOpen, documents]);

  if (!isOpen) return null;

  const totalMb = (storageInfo.totalBytes / (1024 * 1024)).toFixed(2);

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all saved documents from local storage? This will close all open tabs and free up memory.')) {
      await clearAllDocumentsFromDB();
      // Close all document tabs
      for (const doc of documents) {
        closeDocument(doc.id);
      }
      refreshStorage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Local Storage & RAM Manager</h3>
              <p className="text-xs text-slate-400">Control local browser memory & offline cache</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Storage & RAM Status Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <HardDrive className="w-4 h-4 text-blue-400" />
                IndexedDB Disk Usage
              </div>
              <span className="text-xl font-bold text-white font-mono">{totalMb} MB</span>
              <span className="text-[11px] text-slate-500">{storageInfo.count} PDF(s) saved</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Active RAM Status
              </div>
              <span className="text-xl font-bold text-emerald-400 font-mono">Optimized</span>
              <span className="text-[11px] text-slate-500">Only active page rendered</span>
            </div>
          </div>

          {/* Explanation alert */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 text-xs text-blue-200 leading-relaxed flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              IndexedDB stores data on your local hard disk. Closing any tab releases that file from RAM immediately. You can clear all files below to reset storage to 0 MB.
            </p>
          </div>

          {/* Open Documents List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Open Documents in Session</label>
              <button 
                onClick={refreshStorage}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-800/20 rounded-xl border border-slate-800/50">
                No PDFs currently stored in session.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map(doc => {
                  const docMb = ((doc.arrayBuffer?.byteLength || 0) / (1024 * 1024)).toFixed(2);
                  return (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[280px]">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-white font-medium truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-500">{doc.numPages} pages • {docMb} MB</p>
                        </div>
                      </div>

                      <button
                        onClick={() => closeDocument(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Close Tab and delete from local storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={handleClearAll}
            disabled={documents.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 disabled:opacity-30 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Storage & Free RAM
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
