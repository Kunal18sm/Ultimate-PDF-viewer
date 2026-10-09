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
  const [mobileDualTab, setMobileDualTab] = useState<'screen1' | 'screen2' | 'both'>('screen1');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  });

  // Touch Pinch tracking refs & content wrapper ref
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);
  const isPinchingRef = useRef<boolean>(false);
  const pinchCurrentScaleRef = useRef<number>(1.0);

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

  const isUserScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<any>(null);

  const handleContainerScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 250);
  }, []);

  // Scroll to active page in continuous view ONLY when initiated programmatically
  useEffect(() => {
    if (!activeDoc || activeDoc.viewMode !== 'continuous') return;
    if (isUserScrollingRef.current) return;

    const pageEl = document.getElementById(`page-container-${activeDoc.currentPage}`);
    if (pageEl && containerRef.current) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeDoc?.currentPage, activeDoc?.viewMode]);

  const handlePageVisible = useCallback((page: number) => {
    if (activeDoc && activeDoc.currentPage !== page) {
      setCurrentPage(page);
    }
  }, [activeDoc?.currentPage, setCurrentPage]);

  // Handle Mouse Wheel Zoom when in Hand / Pan tool OR when Ctrl is held
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelTimeout: any = null;
    let accumulatedDelta = 0;

    const handleWheel = (e: WheelEvent) => {
      if (currentTool.tool === 'pan' || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        accumulatedDelta += e.deltaY < 0 ? 0.12 : -0.12;
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          setZoom(prevZoom => {
            const next = prevZoom + accumulatedDelta;
            accumulatedDelta = 0;
            return Math.max(0.25, Math.min(4.0, Number(next.toFixed(2))));
          });
        }, 30);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [currentTool.tool, setZoom]);

  // Handle Hardware-Accelerated Touch Gestures (Pinch to zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom start
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartDistRef.current = dist;
        if (activeDoc) {
          touchStartZoomRef.current = activeDoc.zoom;
        }
        isPinchingRef.current = true;
        pinchCurrentScaleRef.current = 1.0;
        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transformOrigin = 'center top';
          contentWrapperRef.current.style.transition = 'none';
          contentWrapperRef.current.style.willChange = 'transform';
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDistRef.current !== null && isPinchingRef.current) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scaleFactor = dist / touchStartDistRef.current;
        pinchCurrentScaleRef.current = scaleFactor;
        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transform = `scale(${scaleFactor})`;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && isPinchingRef.current) {
        isPinchingRef.current = false;
        touchStartDistRef.current = null;
        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transform = '';
          contentWrapperRef.current.style.willChange = '';
        }
        if (activeDoc) {
          const finalZoom = Math.max(0.3, Math.min(4.0, Number((touchStartZoomRef.current * pinchCurrentScaleRef.current).toFixed(2))));
          if (Math.abs(finalZoom - activeDoc.zoom) > 0.02) {
            setZoom(finalZoom);
          }
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeDoc, setZoom]);

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
        className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-8 transition-colors ${
          isDragOver ? 'bg-blue-900/20 border-2 border-dashed border-blue-500' : 'bg-slate-950'
        }`}
      >
        <div className="max-w-md w-full text-center flex flex-col items-center gap-4 sm:gap-5 px-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-2xl">
            <Layers className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Ultimate PDF Studio</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              Open single or multiple PDFs with tabs, high-speed drawing, shape annotations, visual stamps, and brightness eye-care filters.
            </p>
          </div>

          <div className="w-full max-w-xs sm:max-w-sm">
            <label className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
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

          <span className="text-[11px] sm:text-xs text-slate-500">
            100% Offline &amp; Private in Your Browser
          </span>
        </div>
      </div>
    );
  }

  const { currentPage, numPages, zoom, rotation, viewMode, filters } = activeDoc;

  return (
    <div
      ref={containerRef}
      onScroll={handleContainerScroll}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`flex-1 relative overflow-auto bg-slate-950 flex flex-col items-center p-2 sm:p-6 md:p-8 will-change-scroll touch-pan-x touch-pan-y ${
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
        <div ref={contentWrapperRef} className="w-full flex flex-col items-center justify-center gap-4 sm:gap-8 pb-16">
          {viewMode === 'single' && (
            <PageRenderer
              key={`p-${activeDoc.id}-${currentPage}`}
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
                key={`p-${activeDoc.id}-${pageNumber}`}
                pageNumber={pageNumber}
                currentPage={currentPage}
                pdfDoc={pdfDoc}
                scale={zoom}
                rotation={rotation}
                filters={filters}
                onPageVisible={handlePageVisible}
              />
            ))
          )}

          {viewMode === 'dual' && (() => {
            const leftPage = activeDoc.dualLeftPage ?? activeDoc.currentPage ?? 1;
            const rightPage = activeDoc.dualRightPage ?? (leftPage < numPages ? leftPage + 1 : leftPage);

            return (
              <div className="w-full flex flex-col items-center gap-4 sm:gap-5">
                {/* Top Floating Dual Screen Controls Bar */}
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:px-4 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 backdrop-blur-md shadow-xl max-w-4xl w-full">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <Columns2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        Dual Screen Comparison
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-slate-400">
                        Tap Screen 1 or Screen 2 to set active jump target.
                      </p>
                    </div>
                  </div>

                  {/* Dual Mode Switcher & Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Active Target Buttons */}
                    <div className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-xs flex-1 sm:flex-initial justify-center">
                      <button
                        onClick={() => {
                          setDualActivePane('left');
                          setMobileDualTab('screen1');
                        }}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                          dualActivePane === 'left'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {dualActivePane === 'left' && <CheckCircle2 className="w-3 h-3 text-blue-200" />}
                        Screen 1 (p.{leftPage})
                      </button>

                      <button
                        onClick={() => {
                          setDualActivePane('right');
                          setMobileDualTab('screen2');
                        }}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                          dualActivePane === 'right'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {dualActivePane === 'right' && <CheckCircle2 className="w-3 h-3 text-blue-200" />}
                        Screen 2 (p.{rightPage})
                      </button>
                    </div>

                    {/* Swap Screens Button */}
                    <button
                      onClick={swapDualPages}
                      className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs shrink-0"
                      title="Swap Left and Right Screen Pages (⇄)"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Swap</span>
                    </button>
                  </div>

                  {/* Mobile Screen Tab Switcher (Show Screen 1, Screen 2, or Both Stacked on small devices) */}
                  <div className="flex lg:hidden items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[10px] w-full justify-around">
                    <button
                      onClick={() => setMobileDualTab('screen1')}
                      className={`py-1 px-2 rounded-lg font-medium transition-colors ${
                        mobileDualTab === 'screen1' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      View Screen 1
                    </button>
                    <button
                      onClick={() => setMobileDualTab('screen2')}
                      className={`py-1 px-2 rounded-lg font-medium transition-colors ${
                        mobileDualTab === 'screen2' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      View Screen 2
                    </button>
                    <button
                      onClick={() => setMobileDualTab('both')}
                      className={`py-1 px-2 rounded-lg font-medium transition-colors ${
                        mobileDualTab === 'both' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      View Both (Stack)
                    </button>
                  </div>
                </div>

                {/* The Two Screen Containers */}
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full max-w-full">
                  {/* Left Screen (Screen 1) */}
                  <div
                    onClick={() => setDualActivePane('left')}
                    className={`flex flex-col items-center rounded-2xl p-2 sm:p-2.5 transition-all duration-150 relative w-full lg:w-auto ${
                      mobileDualTab === 'screen2' ? 'hidden lg:flex' : 'flex'
                    } ${
                      dualActivePane === 'left'
                        ? 'ring-2 ring-blue-500 bg-blue-950/20 shadow-2xl shadow-blue-500/10 border border-blue-500/60'
                        : 'border border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    {/* Screen 1 Header */}
                    <div className="w-full flex items-center justify-between pb-2 px-1 border-b border-slate-800/80 mb-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] sm:text-[11px] ${
                          dualActivePane === 'left'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Screen 1 (Left)
                        </span>

                        {dualActivePane === 'left' ? (
                          <span className="text-[9px] sm:text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ● Active Target
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-slate-500 cursor-pointer hover:text-slate-300">
                            Tap to target
                          </span>
                        )}
                      </div>

                      {/* Screen 1 Page Navigation */}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-slate-800 font-mono text-[10px] sm:text-[11px]"
                      >
                        <button
                          onClick={() => setDualLeftPage(leftPage - 1)}
                          disabled={leftPage <= 1}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
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
                          className="w-7 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <span className="text-slate-500">/{numPages}</span>

                        <button
                          onClick={() => setDualLeftPage(leftPage + 1)}
                          disabled={leftPage >= numPages}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Next Page on Screen 1"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <PageRenderer
                      key={`p-${activeDoc.id}-left-${leftPage}`}
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
                    className={`flex flex-col items-center rounded-2xl p-2 sm:p-2.5 transition-all duration-150 relative w-full lg:w-auto ${
                      mobileDualTab === 'screen1' ? 'hidden lg:flex' : 'flex'
                    } ${
                      dualActivePane === 'right'
                        ? 'ring-2 ring-blue-500 bg-blue-950/20 shadow-2xl shadow-blue-500/10 border border-blue-500/60'
                        : 'border border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    {/* Screen 2 Header */}
                    <div className="w-full flex items-center justify-between pb-2 px-1 border-b border-slate-800/80 mb-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] sm:text-[11px] ${
                          dualActivePane === 'right'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Screen 2 (Right)
                        </span>

                        {dualActivePane === 'right' ? (
                          <span className="text-[9px] sm:text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ● Active Target
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-slate-500 cursor-pointer hover:text-slate-300">
                            Tap to target
                          </span>
                        )}
                      </div>

                      {/* Screen 2 Page Navigation */}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-slate-800 font-mono text-[10px] sm:text-[11px]"
                      >
                        <button
                          onClick={() => setDualRightPage(rightPage - 1)}
                          disabled={rightPage <= 1}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
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
                          className="w-7 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <span className="text-slate-500">/{numPages}</span>

                        <button
                          onClick={() => setDualRightPage(rightPage + 1)}
                          disabled={rightPage >= numPages}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Next Page on Screen 2"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <PageRenderer
                      key={`p-${activeDoc.id}-right-${rightPage}`}
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

// Continuous Page Wrapper with Dual Observers for butter-smooth virtualized rendering
const ContinuousPageWrapper: React.FC<{
  pageNumber: number;
  currentPage: number;
  pdfDoc: any;
  scale: number;
  rotation: number;
  filters: any;
  onPageVisible: (page: number) => void;
}> = React.memo(({ pageNumber, currentPage, pdfDoc, scale, rotation, filters, onPageVisible }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(
    Math.abs(pageNumber - currentPage) <= 1 // pre-render immediate neighbors
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Observer to mount and render page canvas when within 700px of viewport
    const renderObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldRender(true);
        }
      },
      { rootMargin: '700px 0px 700px 0px' }
    );

    // Observer to track which page is primarily in view (50% visible)
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onPageVisible(pageNumber);
        }
      },
      { threshold: 0.5 }
    );

    renderObserver.observe(el);
    visibilityObserver.observe(el);

    return () => {
      renderObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [onPageVisible, pageNumber]);

  return (
    <div
      ref={containerRef}
      id={`page-container-${pageNumber}`}
      className="w-full flex justify-center my-3 sm:my-4"
    >
      {shouldRender ? (
        <PageRenderer
          pageNumber={pageNumber}
          pdfDoc={pdfDoc}
          scale={scale}
          rotation={rotation}
          filters={filters}
        />
      ) : (
        <div
          style={{
            width: `${Math.min(window.innerWidth - 32, 600 * scale)}px`,
            height: `${800 * scale}px`,
          }}
          className="bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-center shadow-lg"
        >
          <span className="text-xs text-slate-600 font-mono">Page {pageNumber}</span>
        </div>
      )}
    </div>
  );
});
