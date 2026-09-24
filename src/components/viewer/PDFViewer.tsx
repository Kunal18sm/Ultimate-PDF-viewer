import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePDF } from '../../context/PDFContext';
import { getOrLoadPdfDocument } from '../../utils/pdfDocumentManager';
import { PageRenderer } from './PageRenderer';
import { 
  Layers, 
  Upload,
  ArrowLeftRight,
  Columns2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const PDFViewer: React.FC = () => {
  const { 
    activeDoc, 
    setCurrentPage,
    setZoom,
    openFiles, 
    laserPosition,
    currentTool,
    dualActivePane,
    setDualActivePane,
    setDualLeftPage,
    setDualRightPage,
    swapDualPages,
  } = usePDF();

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  });

  // Load PDF.js doc instance via singleton cache to avoid duplicate parsing
  useEffect(() => {
    let isCancelled = false;

    if (!activeDoc?.arrayBuffer) {
      setPdfDoc(null);
      return;
    }

    setIsLoadingPdf(true);
    getOrLoadPdfDocument(activeDoc.id, activeDoc.arrayBuffer)
      .then((loadedDoc: any) => {
        if (!isCancelled) {
          setPdfDoc(loadedDoc);
          setIsLoadingPdf(false);
        }
      })
      .catch((err: any) => {
        console.error('Error loading pdf document:', err);
        if (!isCancelled) {
          setIsLoadingPdf(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeDoc?.id, activeDoc?.arrayBuffer]);

  // Scroll to active page in continuous view
  useEffect(() => {
    if (!activeDoc || activeDoc.viewMode !== 'continuous') return;
    const pageEl = document.getElementById(`page-container-${activeDoc.currentPage}`);
    if (pageEl && containerRef.current) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeDoc?.currentPage, activeDoc?.viewMode]);

  // Handle Mouse Wheel Zoom when in Hand / Pan tool OR when Ctrl is held
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // When Hand / Pan tool is active OR when Ctrl / Cmd is held
      if (currentTool.tool === 'pan' || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
        setZoom(prevZoom => {
          const next = prevZoom + zoomDelta;
          return Math.max(0.25, Math.min(4.0, Number(next.toFixed(2))));
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [currentTool.tool, setZoom]);

  // Handle Drag & Drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      openFiles(e.dataTransfer.files);
    }
  }, [openFiles]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool.tool === 'pan' && containerRef.current) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && currentTool.tool === 'pan' && containerRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  if (!activeDoc) {
    return (
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${
          isDragOver ? 'bg-blue-900/20 border-2 border-dashed border-blue-500' : 'bg-slate-950'
        }`}
      >
        <div className="max-w-md text-center flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-2xl">
            <Layers className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Ultimate PDF Studio</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Open single or multiple PDFs with tabs, high-speed drawing, shape annotations, visual stamps with 1-click jump, and brightness eye-care filters.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Upload className="w-4 h-4" />
              Open / Upload PDF File(s)
              <input
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files && openFiles(e.target.files)}
              />
            </label>
          </div>

          <span className="text-xs text-slate-500">
            or drag and drop your PDF files here
          </span>
        </div>
      </div>
    );
  }

  const { currentPage, numPages, zoom, rotation, viewMode, filters } = activeDoc;

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`flex-1 relative overflow-auto bg-slate-950 flex flex-col items-center p-4 sm:p-8 ${
        isDragOver ? 'ring-4 ring-blue-500 ring-inset bg-blue-950/20' : ''
      } ${
        currentTool.tool === 'pan'
          ? isPanning
            ? 'cursor-grabbing select-none'
            : 'cursor-grab'
          : ''
      }`}
    >
      {/* Laser Pointer Dot */}
      {laserPosition && currentTool.tool === 'laser' && (
        <div
          style={{ left: laserPosition.x, top: laserPosition.y }}
          className="laser-dot"
        />
      )}

      {/* Pages View Rendering */}
      {pdfDoc && (
        <div className="w-full flex flex-col items-center justify-center gap-8 pb-16">
          {viewMode === 'single' && (
            <PageRenderer
              key={`p-${activeDoc.id}-${currentPage}-${zoom}-${rotation}`}
              pageNumber={currentPage}
              pdfDoc={pdfDoc}
              scale={zoom}
              rotation={rotation}
              filters={filters}
            />
          )}

          {viewMode === 'continuous' && (
            Array.from({ length: numPages }, (_, i) => i + 1).map(pageNumber => (
              <ContinuousPageWrapper
                key={`p-${activeDoc.id}-${pageNumber}-${zoom}-${rotation}`}
                pageNumber={pageNumber}
                currentPage={currentPage}
                pdfDoc={pdfDoc}
                scale={zoom}
                rotation={rotation}
                filters={filters}
                onVisible={() => setCurrentPage(pageNumber)}
              />
            ))
          )}

          {viewMode === 'dual' && (() => {
            const leftPage = activeDoc.dualLeftPage ?? activeDoc.currentPage ?? 1;
            const rightPage = activeDoc.dualRightPage ?? (leftPage < numPages ? leftPage + 1 : leftPage);

            return (
              <div className="w-full flex flex-col items-center gap-5">
                {/* Top Floating Dual Screen Controls Bar */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shadow-xl max-w-4xl w-full">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Columns2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        Dual Screen Comparison Mode
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Click Screen 1 or Screen 2 to set active target. Any stamp or page you click will open in that screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Active Target Buttons */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={() => setDualActivePane('left')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          dualActivePane === 'left'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {dualActivePane === 'left' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
                        Screen 1 (p.{leftPage})
                      </button>

                      <button
                        onClick={() => setDualActivePane('right')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          dualActivePane === 'right'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {dualActivePane === 'right' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
                        Screen 2 (p.{rightPage})
                      </button>
                    </div>

                    {/* Swap Screens Button */}
                    <button
                      onClick={swapDualPages}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      title="Swap Left and Right Screen Pages (⇄)"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Swap</span>
                    </button>
                  </div>
                </div>

                {/* The Two Screen Containers */}
                <div className="flex flex-wrap items-start justify-center gap-6 w-full max-w-full">
                  {/* Left Screen (Screen 1) */}
                  <div
                    onClick={() => setDualActivePane('left')}
                    className={`flex flex-col items-center rounded-2xl p-2.5 transition-all duration-150 relative ${
                      dualActivePane === 'left'
                        ? 'ring-2 ring-blue-500 bg-blue-950/20 shadow-2xl shadow-blue-500/10 border border-blue-500/60'
                        : 'border border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    {/* Screen 1 Header */}
                    <div className="w-full flex items-center justify-between pb-2.5 px-1 border-b border-slate-800/80 mb-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          dualActivePane === 'left'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Screen 1 (Left)
                        </span>

                        {dualActivePane === 'left' ? (
                          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ● Active Target (Stamps Jump Here)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300">
                            Click to select
                          </span>
                        )}
                      </div>

                      {/* Screen 1 Page Navigation */}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 font-mono text-[11px]"
                      >
                        <button
                          onClick={() => setDualLeftPage(leftPage - 1)}
                          disabled={leftPage <= 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Previous Page on Screen 1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={numPages}
                          value={leftPage}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) setDualLeftPage(val);
                          }}
                          className="w-8 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <span className="text-slate-500">/ {numPages}</span>

                        <button
                          onClick={() => setDualLeftPage(leftPage + 1)}
                          disabled={leftPage >= numPages}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Next Page on Screen 1"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <PageRenderer
                      key={`p-${activeDoc.id}-left-${leftPage}-${zoom}-${rotation}`}
                      pageNumber={leftPage}
                      pdfDoc={pdfDoc}
                      scale={zoom}
                      rotation={rotation}
                      filters={filters}
                    />
                  </div>

                  {/* Right Screen (Screen 2) */}
                  <div
                    onClick={() => setDualActivePane('right')}
                    className={`flex flex-col items-center rounded-2xl p-2.5 transition-all duration-150 relative ${
                      dualActivePane === 'right'
                        ? 'ring-2 ring-blue-500 bg-blue-950/20 shadow-2xl shadow-blue-500/10 border border-blue-500/60'
                        : 'border border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    {/* Screen 2 Header */}
                    <div className="w-full flex items-center justify-between pb-2.5 px-1 border-b border-slate-800/80 mb-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          dualActivePane === 'right'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Screen 2 (Right)
                        </span>

                        {dualActivePane === 'right' ? (
                          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ● Active Target (Stamps Jump Here)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300">
                            Click to select
                          </span>
                        )}
                      </div>

                      {/* Screen 2 Page Navigation */}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 font-mono text-[11px]"
                      >
                        <button
                          onClick={() => setDualRightPage(rightPage - 1)}
                          disabled={rightPage <= 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Previous Page on Screen 2"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={numPages}
                          value={rightPage}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) setDualRightPage(val);
                          }}
                          className="w-8 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <span className="text-slate-500">/ {numPages}</span>

                        <button
                          onClick={() => setDualRightPage(rightPage + 1)}
                          disabled={rightPage >= numPages}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Next Page on Screen 2"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <PageRenderer
                      key={`p-${activeDoc.id}-right-${rightPage}-${zoom}-${rotation}`}
                      pageNumber={rightPage}
                      pdfDoc={pdfDoc}
                      scale={zoom}
                      rotation={rotation}
                      filters={filters}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoadingPdf && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-300">Loading Document Pages...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Continuous Page Wrapper with IntersectionObserver for virtualized rendering
const ContinuousPageWrapper: React.FC<{
  pageNumber: number;
  currentPage: number;
  pdfDoc: any;
  scale: number;
  rotation: number;
  filters: any;
  onVisible: () => void;
}> = ({ pageNumber, currentPage, pdfDoc, scale, rotation, filters, onVisible }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(
    Math.abs(pageNumber - currentPage) <= 2 // pre-render near pages immediately
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldRender(true);
          onVisible();
        }
      },
      { rootMargin: '300px 0px 300px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  if (!shouldRender) {
    return (
      <div
        ref={containerRef}
        id={`page-container-${pageNumber}`}
        style={{
          width: 600 * scale,
          height: 800 * scale,
        }}
        className="my-4 bg-slate-900/30 border border-slate-800 rounded-sm flex items-center justify-center"
      >
        <span className="text-xs text-slate-600 font-mono">Page {pageNumber}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <PageRenderer
        pageNumber={pageNumber}
        pdfDoc={pdfDoc}
        scale={scale}
        rotation={rotation}
        filters={filters}
      />
    </div>
  );
};
