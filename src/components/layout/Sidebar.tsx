import React, { useEffect, useState, useRef } from 'react';
import { usePDF } from '../../context/PDFContext';
import { StampSidebarList } from '../stamps/StampSidebarList';
import { getOrLoadPdfDocument } from '../../utils/pdfDocumentManager';
import { 
  LayoutGrid, 
  Tag, 
  ListTree, 
  PenTool, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  FileText,
  Loader2,
  Pencil,
  Check,
  X
} from 'lucide-react';

// Global thumbnail cache: Map<`${docId}_p${pageNum}`, dataUrl>
const thumbnailDataUrlCache = new Map<string, string>();

// Concurrency queue to prevent worker congestion on 400+ page books
let activeRenderCount = 0;
const MAX_CONCURRENT_THUMBNAILS = 2;
const thumbnailQueue: Array<() => void> = [];

function enqueueThumbnailRender(fn: () => void) {
  if (activeRenderCount < MAX_CONCURRENT_THUMBNAILS) {
    activeRenderCount++;
    fn();
  } else {
    thumbnailQueue.push(fn);
  }
}

function finishThumbnailRender() {
  activeRenderCount = Math.max(0, activeRenderCount - 1);
  if (thumbnailQueue.length > 0) {
    const next = thumbnailQueue.shift();
    if (next) {
      activeRenderCount++;
      next();
    }
  }
}

export const Sidebar: React.FC = () => {
  const {
    activeDoc,
    isSidebarOpen,
    setIsSidebarOpen,
    activeSidebarTab,
    setActiveSidebarTab,
    setCurrentPage,
    removeStroke,
    updateStroke,
    removeShape,
    updateShape,
    removeTextNote,
    updateTextNote,
  } = usePDF();

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentLoadedDocId, setCurrentLoadedDocId] = useState<string | null>(null);

  // Load PDF.js document using singleton cache
  useEffect(() => {
    let isCancelled = false;

    if (!activeDoc?.arrayBuffer) {
      setPdfDoc(null);
      setCurrentLoadedDocId(null);
      return;
    }

    // Immediately clear previous doc reference if different
    if (currentLoadedDocId !== activeDoc.id) {
      setPdfDoc(null);
    }

    getOrLoadPdfDocument(activeDoc.id, activeDoc.arrayBuffer)
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc);
          setCurrentLoadedDocId(activeDoc.id);
        }
      })
      .catch(err => {
        console.error('Sidebar PDF load error:', err);
        if (!isCancelled) {
          setPdfDoc(null);
          setCurrentLoadedDocId(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeDoc?.id, activeDoc?.arrayBuffer]);

  if (!isSidebarOpen) {
    return (
      <div className="bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 px-1 z-30">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Open Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (!activeDoc) return null;

  return (
    <aside className="w-72 sm:w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full z-30 shrink-0 select-none backdrop-blur-md transition-all">
      {/* Sidebar Header & Tabs */}
      <div className="p-2.5 sm:p-3 border-b border-slate-800 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50 flex-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSidebarTab('thumbnails')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSidebarTab === 'thumbnails'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Page Thumbnails"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[11px]">Pages ({activeDoc.numPages})</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('stamps')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSidebarTab === 'stamps'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Page Stamps & Jump Markers"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="text-[11px]">Stamps ({activeDoc.stamps?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('outline')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSidebarTab === 'outline'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Table of Contents"
          >
            <ListTree className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveSidebarTab('annotations')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSidebarTab === 'annotations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Drawings & Notes"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content (Strictly scoped to activeDoc.id) */}
      <div className="flex-1 overflow-y-auto">
        {activeSidebarTab === 'thumbnails' && (
          <ThumbnailsGrid
            key={`thumbs-grid-${activeDoc.id}`}
            docId={activeDoc.id}
            pdfDoc={currentLoadedDocId === activeDoc.id ? pdfDoc : null}
            numPages={activeDoc.numPages}
            currentPage={activeDoc.currentPage}
            onPageSelect={setCurrentPage}
          />
        )}

        {activeSidebarTab === 'stamps' && (
          <StampSidebarList key={`stamps-view-${activeDoc.id}`} />
        )}

        {activeSidebarTab === 'outline' && (
          <OutlineView key={`outline-view-${activeDoc.id}`} outline={activeDoc.outline} onJumpPage={setCurrentPage} />
        )}

        {activeSidebarTab === 'annotations' && (
          <AnnotationsList
            key={`annots-view-${activeDoc.id}`}
            strokes={activeDoc.strokes}
            shapes={activeDoc.shapes}
            textNotes={activeDoc.textNotes}
            onJumpPage={setCurrentPage}
            onDeleteStroke={removeStroke}
            onUpdateStroke={updateStroke}
            onDeleteShape={removeShape}
            onUpdateShape={updateShape}
            onDeleteText={removeTextNote}
            onUpdateText={updateTextNote}
          />
        )}
      </div>

      {/* Sidebar Footer Metadata */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate max-w-[160px]" title={activeDoc.name}>{activeDoc.name}</span>
        <span className="font-mono">{activeDoc.currentPage} / {activeDoc.numPages}</span>
      </div>
    </aside>
  );
};

// Lazy-Loaded Thumbnail Item with Animated Skeleton Loading & DataURL Caching
const ThumbnailItem: React.FC<{
  docId: string;
  pdfDoc: any;
  pageNum: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ docId, pdfDoc, pageNum, isSelected, onClick }) => {
  const cacheKey = `${docId}_p${pageNum}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(() => thumbnailDataUrlCache.get(cacheKey) || null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(!thumbnailDataUrlCache.has(cacheKey));

  // IntersectionObserver to only load visible thumbnails
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '200px 0px 200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [docId]);

  // Render thumbnail image when visible
  useEffect(() => {
    let isCancelled = false;

    // 1. Check cache first
    const cached = thumbnailDataUrlCache.get(cacheKey);
    if (cached) {
      setImgSrc(cached);
      setIsLoading(false);
      return;
    }

    if (!pdfDoc || !isVisible) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);

    enqueueThumbnailRender(() => {
      if (isCancelled) {
        finishThumbnailRender();
        return;
      }

      pdfDoc.getPage(pageNum)
        .then((page: any) => {
          if (isCancelled) {
            finishThumbnailRender();
            return;
          }

          const viewport = page.getViewport({ scale: 0.25 });
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = Math.floor(viewport.width);
          offscreenCanvas.height = Math.floor(viewport.height);
          const ctx = offscreenCanvas.getContext('2d', { alpha: false });

          if (!ctx) {
            finishThumbnailRender();
            return;
          }

          page.render({ canvasContext: ctx, viewport }).promise
            .then(() => {
              if (!isCancelled) {
                const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.8);
                thumbnailDataUrlCache.set(cacheKey, dataUrl);
                setImgSrc(dataUrl);
                setIsLoading(false);
              }
              finishThumbnailRender();
            })
            .catch(() => {
              if (!isCancelled) setIsLoading(false);
              finishThumbnailRender();
            });
        })
        .catch(() => {
          if (!isCancelled) setIsLoading(false);
          finishThumbnailRender();
        });
    });

    return () => {
      isCancelled = true;
    };
  }, [docId, pdfDoc, pageNum, cacheKey, isVisible]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`group p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/40 shadow-md'
          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="w-full aspect-[3/4] bg-slate-950 rounded-md overflow-hidden flex items-center justify-center shadow-xs relative">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={`Page ${pageNum}`}
            className="w-full h-full object-contain select-none animate-in fade-in duration-150"
            loading="lazy"
          />
        ) : null}

        {/* Animated Skeleton Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-800/80 animate-pulse flex flex-col items-center justify-center gap-1.5">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-[10px] text-slate-400 font-mono font-medium">Page {pageNum}</span>
          </div>
        )}
      </div>

      <span className={`text-[11px] font-medium transition-colors ${
        isSelected ? 'text-blue-300 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
      }`}>
        Page {pageNum}
      </span>
    </div>
  );
};

const ThumbnailsGrid: React.FC<{
  docId: string;
  pdfDoc: any;
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}> = ({ docId, pdfDoc, numPages, currentPage, onPageSelect }) => {
  return (
    <div className="p-3 grid grid-cols-2 gap-2.5">
      {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
        <ThumbnailItem
          key={`thumb-${docId}-p-${pageNum}`}
          docId={docId}
          pdfDoc={pdfDoc}
          pageNum={pageNum}
          isSelected={currentPage === pageNum}
          onClick={() => onPageSelect(pageNum)}
        />
      ))}
    </div>
  );
};

const OutlineView: React.FC<{
  outline: any[];
  onJumpPage: (page: number) => void;
}> = ({ outline, onJumpPage }) => {
  if (!outline || outline.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500">
        <ListTree className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>No table of contents embedded in this document</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1 text-xs">
      {outline.map((item, idx) => (
        <button
          key={idx}
          onClick={() => {
            if (item.pageNumber) onJumpPage(item.pageNumber);
          }}
          className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-between cursor-pointer"
        >
          <span className="truncate">{item.title}</span>
          {item.pageNumber && (
            <span className="text-[10px] text-slate-500 font-mono">p.{item.pageNumber}</span>
          )}
        </button>
      ))}
    </div>
  );
};

const COLOR_PALETTE = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ffffff'];

const AnnotationsList: React.FC<{
  strokes: any[];
  shapes: any[];
  textNotes: any[];
  onJumpPage: (page: number) => void;
  onDeleteStroke: (id: string) => void;
  onUpdateStroke: (id: string, updates: any) => void;
  onDeleteShape: (id: string) => void;
  onUpdateShape: (id: string, updates: any) => void;
  onDeleteText: (id: string) => void;
  onUpdateText: (id: string, updates: any) => void;
}> = ({
  strokes,
  shapes,
  textNotes,
  onJumpPage,
  onDeleteStroke,
  onUpdateStroke,
  onDeleteShape,
  onUpdateShape,
  onDeleteText,
  onUpdateText,
}) => {
  const { requestProtectedDelete } = usePDF();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const startEdit = (id: string, currentName: string, currentColor: string) => {
    setEditingId(id);
    setEditName(currentName || '');
    setEditColor(currentColor);
  };

  const totalCount = strokes.length + shapes.length + textNotes.length;

  if (totalCount === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500">
        <PenTool className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>No drawings or shapes added yet</p>
        <p className="text-[11px] text-slate-600 mt-1">Use the pen or shape tools in the top bar to annotate</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {/* Freehand Strokes (Pen & Highlighter Drawings) */}
      {strokes.map(s => {
        const isEditing = editingId === s.id;
        const displayName = s.name || `${s.tool} drawing`;

        if (isEditing) {
          return (
            <div key={s.id} className="p-2.5 rounded-xl bg-slate-800/90 border border-blue-500/60 flex flex-col gap-2 text-xs animate-in fade-in duration-150 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-400 capitalize">Rename {s.tool} Drawing</span>
                <span className="text-[10px] text-slate-400">p.{s.pageNumber}</span>
              </div>

              <input
                type="text"
                placeholder="Give drawing a name (e.g. Formula derivation)..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateStroke(s.id, { name: editName.trim() || undefined, color: editColor });
                    setEditingId(null);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                autoFocus
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />

              {/* Color swatches */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                        editColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStroke(s.id, { name: editName.trim() || undefined, color: editColor });
                      setEditingId(null);
                    }}
                    className="p-1 px-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Save"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={s.id}
            onClick={() => onJumpPage(s.pageNumber)}
            className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 flex items-center justify-between group cursor-pointer text-xs transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: s.color }} />
              <span className="text-slate-200 font-medium truncate" title={displayName}>
                {displayName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">p.{s.pageNumber}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(s.id, s.name || '', s.color);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                title="Edit / Rename drawing"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestProtectedDelete({
                    title: 'Delete Drawing',
                    itemDescription: `Are you sure you want to delete this ${s.tool || 'pen'} drawing on Page ${s.pageNumber}?`,
                    onConfirm: () => onDeleteStroke(s.id),
                  });
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-all cursor-pointer"
                title="Delete drawing"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Shapes (Rect, Circle, Arrow, Line) */}
      {shapes.map(sh => {
        const isEditing = editingId === sh.id;
        const displayName = sh.name || `${sh.type} shape`;

        if (isEditing) {
          return (
            <div key={sh.id} className="p-2.5 rounded-xl bg-slate-800/90 border border-blue-500/60 flex flex-col gap-2 text-xs animate-in fade-in duration-150 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-400 capitalize">Rename {sh.type} Shape</span>
                <span className="text-[10px] text-slate-400">p.{sh.pageNumber}</span>
              </div>

              <input
                type="text"
                placeholder="Give shape a name..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateShape(sh.id, { name: editName.trim() || undefined, color: editColor });
                    setEditingId(null);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                autoFocus
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />

              {/* Color swatches */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                        editColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onUpdateShape(sh.id, { name: editName.trim() || undefined, color: editColor });
                      setEditingId(null);
                    }}
                    className="p-1 px-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Save"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={sh.id}
            onClick={() => onJumpPage(sh.pageNumber)}
            className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 flex items-center justify-between group cursor-pointer text-xs transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-xs" style={{ backgroundColor: sh.color }} />
              <span className="text-slate-200 font-medium truncate capitalize" title={displayName}>
                {displayName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">p.{sh.pageNumber}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(sh.id, sh.name || '', sh.color);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                title="Edit / Rename shape"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestProtectedDelete({
                    title: 'Delete Shape',
                    itemDescription: `Are you sure you want to delete this ${sh.type} shape on Page ${sh.pageNumber}?`,
                    onConfirm: () => onDeleteShape(sh.id),
                  });
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-all cursor-pointer"
                title="Delete shape"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Text Notes */}
      {textNotes.map(t => {
        const isEditing = editingId === t.id;

        if (isEditing) {
          return (
            <div key={t.id} className="p-2.5 rounded-xl bg-slate-800/90 border border-blue-500/60 flex flex-col gap-2 text-xs animate-in fade-in duration-150 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-400">Edit Note</span>
                <span className="text-[10px] text-slate-400">p.{t.pageNumber}</span>
              </div>

              <input
                type="text"
                placeholder="Edit text note..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateText(t.id, { text: editName.trim() || t.text, color: editColor });
                    setEditingId(null);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                autoFocus
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />

              {/* Color swatches */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                        editColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onUpdateText(t.id, { text: editName.trim() || t.text, color: editColor });
                      setEditingId(null);
                    }}
                    className="p-1 px-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Save"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={t.id}
            onClick={() => onJumpPage(t.pageNumber)}
            className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 flex items-center justify-between group cursor-pointer text-xs transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-slate-200 font-medium truncate" title={t.text}>{t.text}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">p.{t.pageNumber}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(t.id, t.text || '', t.color || '#3b82f6');
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                title="Edit text note"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestProtectedDelete({
                    title: 'Delete Text Note',
                    itemDescription: `Are you sure you want to delete this text note on Page ${t.pageNumber}?`,
                    onConfirm: () => onDeleteText(t.id),
                  });
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-all cursor-pointer"
                title="Delete text note"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
