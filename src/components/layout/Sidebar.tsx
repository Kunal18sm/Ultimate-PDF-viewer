import React, { useEffect, useState, useRef } from 'react';
import { usePDF } from '../../context/PDFContext';
import { StampSidebarList } from '../stamps/StampSidebarList';
import { pdfjsLib } from '../../utils/pdfWorker';
import { 
  LayoutGrid, 
  Tag, 
  ListTree, 
  PenTool, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  FileText
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeDoc,
    isSidebarOpen,
    setIsSidebarOpen,
    activeSidebarTab,
    setActiveSidebarTab,
    setCurrentPage,
    removeStroke,
    removeShape,
    removeTextNote,
  } = usePDF();

  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    if (!activeDoc?.arrayBuffer) {
      setPdfDoc(null);
      return;
    }
    pdfjsLib.getDocument({ data: new Uint8Array(activeDoc.arrayBuffer.slice(0)) }).promise
      .then(setPdfDoc)
      .catch(console.error);
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
    <aside className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full z-30 shrink-0 select-none backdrop-blur-md">
      {/* Sidebar Header & Tabs */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveSidebarTab('thumbnails')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSidebarTab === 'thumbnails'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Page Thumbnails"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[11px]">Pages</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('stamps')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
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
            className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
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
            className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
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
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSidebarTab === 'thumbnails' && (
          <ThumbnailsGrid pdfDoc={pdfDoc} numPages={activeDoc.numPages} currentPage={activeDoc.currentPage} onPageSelect={setCurrentPage} />
        )}

        {activeSidebarTab === 'stamps' && <StampSidebarList />}

        {activeSidebarTab === 'outline' && (
          <OutlineView outline={activeDoc.outline} onJumpPage={setCurrentPage} />
        )}

        {activeSidebarTab === 'annotations' && (
          <AnnotationsList
            strokes={activeDoc.strokes}
            shapes={activeDoc.shapes}
            textNotes={activeDoc.textNotes}
            onJumpPage={setCurrentPage}
            onDeleteStroke={removeStroke}
            onDeleteShape={removeShape}
            onDeleteText={removeTextNote}
          />
        )}
      </div>

      {/* Sidebar Footer Metadata */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate max-w-[150px]" title={activeDoc.name}>{activeDoc.name}</span>
        <span className="font-mono">{activeDoc.currentPage} / {activeDoc.numPages}</span>
      </div>
    </aside>
  );
};

// Lazy-Loaded Thumbnail Item with IntersectionObserver for ultra-fast sidebar scrolling
const ThumbnailItem: React.FC<{
  pdfDoc: any;
  pageNum: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ pdfDoc, pageNum, isSelected, onClick }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isRenderedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCancelled = false;
    if (!pdfDoc || !isVisible || isRenderedRef.current) return;

    pdfDoc.getPage(pageNum).then((page: any) => {
      if (isCancelled) return;
      const viewport = page.getViewport({ scale: 0.25 });
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      page.render({ canvasContext: ctx, viewport }).promise.then(() => {
        if (!isCancelled) isRenderedRef.current = true;
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNum, isVisible]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`group p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30'
          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="w-full aspect-[3/4] bg-white rounded-md overflow-hidden flex items-center justify-center shadow-xs relative">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {!isVisible && (
          <div className="absolute inset-0 bg-slate-800/20 flex items-center justify-center">
            <span className="text-[10px] text-slate-400 font-mono">{pageNum}</span>
          </div>
        )}
      </div>
      <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
        Page {pageNum}
      </span>
    </div>
  );
};

const ThumbnailsGrid: React.FC<{
  pdfDoc: any;
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}> = ({ pdfDoc, numPages, currentPage, onPageSelect }) => {
  return (
    <div className="p-3 grid grid-cols-2 gap-2.5">
      {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
        <ThumbnailItem
          key={pageNum}
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

const AnnotationsList: React.FC<{
  strokes: any[];
  shapes: any[];
  textNotes: any[];
  onJumpPage: (page: number) => void;
  onDeleteStroke: (id: string) => void;
  onDeleteShape: (id: string) => void;
  onDeleteText: (id: string) => void;
}> = ({
  strokes,
  shapes,
  textNotes,
  onJumpPage,
  onDeleteStroke,
  onDeleteShape,
  onDeleteText,
}) => {
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
      {/* Shapes */}
      {shapes.map(sh => (
        <div
          key={sh.id}
          onClick={() => onJumpPage(sh.pageNumber)}
          className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 flex items-center justify-between group cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: sh.color }} />
            <span className="capitalize text-slate-300 font-medium">{sh.type} shape</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">p.{sh.pageNumber}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteShape(sh.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      {/* Text Notes */}
      {textNotes.map(t => (
        <div
          key={t.id}
          onClick={() => onJumpPage(t.pageNumber)}
          className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 flex items-center justify-between group cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2 max-w-[160px]">
            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-300 truncate">{t.text}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">p.{t.pageNumber}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteText(t.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      {/* Freehand Strokes */}
      {strokes.map(s => (
        <div
          key={s.id}
          onClick={() => onJumpPage(s.pageNumber)}
          className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 flex items-center justify-between group cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-slate-300 capitalize">{s.tool} drawing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">p.{s.pageNumber}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteStroke(s.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
