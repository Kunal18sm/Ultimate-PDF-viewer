import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePDF } from '../../context/PDFContext';
import { pdfjsLib } from '../../utils/pdfWorker';
import { PageRenderer } from './PageRenderer';
import { 
  Layers, 
  Upload
} from 'lucide-react';

export const PDFViewer: React.FC = () => {
  const { 
    activeDoc, 
    setCurrentPage,
    openFiles, 
    laserPosition,
    currentTool 
  } = usePDF();

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load PDF.js doc instance when arrayBuffer changes
  useEffect(() => {
    let isCancelled = false;

    if (!activeDoc?.arrayBuffer) {
      setPdfDoc(null);
      return;
    }

    setIsLoadingPdf(true);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(activeDoc.arrayBuffer.slice(0)) });

    loadingTask.promise
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

  // Handle Drag & Drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      openFiles(e.dataTransfer.files);
    }
  }, [openFiles]);

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
      className={`flex-1 relative overflow-auto bg-slate-950 flex flex-col items-center p-4 sm:p-8 scroll-smooth ${
        isDragOver ? 'ring-4 ring-blue-500 ring-inset bg-blue-950/20' : ''
      } ${currentTool.tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''}`}
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

          {viewMode === 'dual' && (
            <div className="flex flex-wrap items-start justify-center gap-6">
              <PageRenderer
                key={`p-${activeDoc.id}-${currentPage}-${zoom}-${rotation}`}
                pageNumber={currentPage}
                pdfDoc={pdfDoc}
                scale={zoom}
                rotation={rotation}
                filters={filters}
              />
              {currentPage + 1 <= numPages && (
                <PageRenderer
                  key={`p-${activeDoc.id}-${currentPage + 1}-${zoom}-${rotation}`}
                  pageNumber={currentPage + 1}
                  pdfDoc={pdfDoc}
                  scale={zoom}
                  rotation={rotation}
                  filters={filters}
                />
              )}
            </div>
          )}
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
