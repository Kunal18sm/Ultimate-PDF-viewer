import React, { useState, useEffect } from 'react';
import { usePDF } from '../../context/PDFContext';
import confetti from 'canvas-confetti';
import {
  Code2,
  Copy,
  Check,
  Download,
  Upload,
  Play,
  Sparkles,
  Tag,
  PenTool,
  Bookmark,
  AlertCircle,
  X,
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    name: 'Review & Approval Stamps',
    desc: 'Approved & Important stamps',
    code: JSON.stringify(
      {
        version: '1.0',
        app: 'UltimatePDF',
        sourceDocName: 'Preset Template',
        stamps: [
          {
            id: 'sample_stamp_1',
            preset: 'APPROVED',
            label: 'APPROVED',
            note: 'Verified',
            color: '#10b981',
            pageNumber: 1,
            x: 75,
            y: 5,
            createdAt: Date.now(),
          },
          {
            id: 'sample_stamp_2',
            preset: 'IMPORTANT',
            label: 'IMPORTANT',
            note: 'Key section',
            color: '#ef4444',
            pageNumber: 1,
            x: 75,
            y: 18,
            createdAt: Date.now(),
          },
        ],
        strokes: [],
        shapes: [],
        textNotes: [],
        bookmarks: [1],
      },
      null,
      2
    ),
  },
  {
    name: 'Study & Star Markers',
    desc: 'Star stamp & Exam notes',
    code: JSON.stringify(
      {
        version: '1.0',
        app: 'UltimatePDF',
        sourceDocName: 'Study Preset',
        stamps: [
          {
            id: 'study_stamp_1',
            preset: 'STAR',
            label: 'STAR',
            note: 'Important topic',
            color: '#f59e0b',
            pageNumber: 1,
            x: 80,
            y: 8,
            createdAt: Date.now(),
          },
        ],
        strokes: [],
        shapes: [],
        textNotes: [
          {
            id: 'study_note_1',
            text: '📌 Review this section before test',
            x: 10,
            y: 85,
            fontSize: 13,
            color: '#8b5cf6',
            pageNumber: 1,
          },
        ],
        bookmarks: [1],
      },
      null,
      2
    ),
  },
];

export const BlueprintModal: React.FC = () => {
  const {
    activeDoc,
    isBlueprintModalOpen,
    setIsBlueprintModalOpen,
    exportDocumentBlueprint,
    importDocumentBlueprint,
  } = usePDF();

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'presets'>('export');
  const [currentCode, setCurrentCode] = useState('');
  const [importCodeInput, setImportCodeInput] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isBlueprintModalOpen && activeDoc) {
      setCurrentCode(exportDocumentBlueprint());
      setFeedback(null);
    }
  }, [isBlueprintModalOpen, activeDoc, exportDocumentBlueprint]);

  if (!isBlueprintModalOpen || !activeDoc) return null;

  const stampsCount = activeDoc.stamps?.length || 0;
  const annotationsCount =
    (activeDoc.strokes?.length || 0) +
    (activeDoc.shapes?.length || 0) +
    (activeDoc.textNotes?.length || 0);
  const bookmarksCount = activeDoc.bookmarks?.length || 0;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = currentCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    const cleanDocName = (activeDoc.name || 'document').replace(/\.pdf$/i, '');
    const blob = new Blob([currentCode], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanDocName}.pdfmeta.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportCodeInput(content);
        setActiveTab('import');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRunAndApplyCode = () => {
    if (!importCodeInput.trim()) {
      setFeedback({ type: 'error', message: 'Please paste code first.' });
      return;
    }

    const res = importDocumentBlueprint(importCodeInput, importMode);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Applied successfully (${res.stats?.stamps || 0} stamps, ${res.stats?.strokes || 0} drawings).`,
      });
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.2 },
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
      });
      setTimeout(() => {
        setCurrentCode(exportDocumentBlueprint());
      }, 100);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85dvh] flex flex-col overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-150">
        
        {/* Clean Header */}
        <div className="p-3 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">PDF Edit Code</h3>
          </div>

          <button
            onClick={() => setIsBlueprintModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Tabs */}
        <div className="flex items-center gap-1 px-3 pt-2.5 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => { setActiveTab('export'); setFeedback(null); }}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-3 h-3" />
            <span>Export Code</span>
          </button>

          <button
            onClick={() => { setActiveTab('import'); setFeedback(null); }}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Import Code</span>
          </button>

          <button
            onClick={() => { setActiveTab('presets'); setFeedback(null); }}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Presets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          {/* Feedback */}
          {feedback && (
            <div
              className={`p-2 rounded-xl border flex items-center gap-2 text-xs animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: EXPORT CODE */}
          {activeTab === 'export' && (
            <div className="space-y-2.5">
              {/* Stats */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-blue-300">
                  <Tag className="w-3 h-3 text-blue-400" /> {stampsCount} Stamps
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300">
                  <PenTool className="w-3 h-3 text-emerald-400" /> {annotationsCount} Drawings
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-300">
                  <Bookmark className="w-3 h-3 text-amber-400" /> {bookmarksCount} Bookmarks
                </span>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  readOnly
                  value={currentCode}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  rows={8}
                  className="w-full p-2.5 bg-slate-950 font-mono text-[11px] text-blue-200 border border-slate-800 rounded-xl focus:outline-hidden focus:border-blue-500 resize-none selection:bg-blue-600 selection:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT CODE */}
          {activeTab === 'import' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer hover:text-white">
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Load from File</span>
                  <input type="file" accept=".json,.pdfmeta" onChange={handleFileUpload} className="hidden" />
                </label>

                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setImportMode('merge')}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                      importMode === 'merge' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                      importMode === 'replace' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Replace
                  </button>
                </div>
              </div>

              <textarea
                value={importCodeInput}
                onChange={(e) => setImportCodeInput(e.target.value)}
                placeholder="Paste code here..."
                rows={8}
                className="w-full p-2.5 bg-slate-950 font-mono text-[11px] text-emerald-300 border border-slate-800 rounded-xl focus:outline-hidden focus:border-emerald-500 placeholder-slate-600 resize-none"
              />

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  onClick={() => setImportCodeInput('')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>

                <button
                  onClick={handleRunAndApplyCode}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Apply Code</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              {PRESET_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.name}
                  className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{tmpl.name}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">{tmpl.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const res = importDocumentBlueprint(tmpl.code, 'merge');
                        if (res.success) {
                          setFeedback({ type: 'success', message: `Applied "${tmpl.name}"` });
                          confetti({ particleCount: 30, spread: 45, origin: { y: 0.2 } });
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="p-2.5 px-4 border-t border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="truncate max-w-[220px]">{activeDoc.name}</span>
          <span className="font-mono text-slate-500">{activeDoc.numPages} Pages</span>
        </div>
      </div>
    </div>
  );
};
