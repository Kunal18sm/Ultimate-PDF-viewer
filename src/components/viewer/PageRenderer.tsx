import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePDF } from '../../context/PDFContext';
import { pdfjsLib } from '../../utils/pdfWorker';
import { AnnotationCanvas } from '../annotation/AnnotationCanvas';
import { StampBadge } from '../stamps/StampBadge';
import { Bookmark } from 'lucide-react';

interface PageRendererProps {
  pageNumber: number;
  pdfDoc: any;
  scale: number;
  rotation: number;
  filters: {
    brightness: number;
    contrast: number;
    invert: boolean;
    sepia: boolean;
    grayscale: boolean;
  };
}

export const PageRenderer: React.FC<PageRendererProps> = ({
  pageNumber,
  pdfDoc,
  scale,
  rotation,
  filters,
}) => {
  const { activeDoc, toggleBookmark, searchQuery, showPageStamps } = usePDF();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pageSize, setPageSize] = useState<{ width: number; height: number; originalWidth: number; originalHeight: number }>({
    width: 0,
    height: 0,
    originalWidth: 0,
    originalHeight: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const pageStamps = activeDoc?.stamps.filter(s => s.pageNumber === pageNumber) || [];
  const isBookmarked = activeDoc?.bookmarks.includes(pageNumber);

  // Compute CSS filter string
  const filterStyle = useMemo(() => {
    const parts = [
      `brightness(${filters.brightness}%)`,
      `contrast(${filters.contrast}%)`,
    ];
    if (filters.invert) parts.push('invert(1) hue-rotate(180deg)');
    if (filters.sepia) parts.push('sepia(0.6)');
    if (filters.grayscale) parts.push('grayscale(1)');
    return parts.join(' ');
  }, [filters]);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    const renderPage = async () => {
      if (!pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const baseViewport = page.getViewport({ scale: 1.0, rotation });
        const viewport = page.getViewport({ scale, rotation });

        const width = Math.floor(viewport.width);
        const height = Math.floor(viewport.height);

        setPageSize({
          width,
          height,
          originalWidth: baseViewport.width,
          originalHeight: baseViewport.height,
        });

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Cap DPR at 1.75 to balance razor-sharp text with high rendering speed & low RAM
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (isCancelled) return;

        // Render Text Layer in a single DOM fragment batch for peak speed
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          textLayerDiv.innerHTML = '';
          textLayerDiv.style.width = `${width}px`;
          textLayerDiv.style.height = `${height}px`;

          const textContent = await page.getTextContent();
          if (isCancelled) return;

          const fragment = document.createDocumentFragment();
          const query = searchQuery.trim().toLowerCase();
          const regex = query ? new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi') : null;

          for (const item of textContent.items as any[]) {
            if (!item.str) continue;
            const textSpan = document.createElement('span');
            const text = item.str;

            if (regex && text.toLowerCase().includes(query)) {
              textSpan.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            } else {
              textSpan.textContent = text;
            }

            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
            
            textSpan.style.left = `${tx[4]}px`;
            textSpan.style.top = `${tx[5] - fontHeight}px`;
            textSpan.style.fontSize = `${fontHeight}px`;
            textSpan.style.fontFamily = item.fontName || 'sans-serif';
            
            fragment.appendChild(textSpan);
          }
          textLayerDiv.appendChild(fragment);
        }

        setIsLoading(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation, searchQuery]);

  return (
    <div
      ref={containerRef}
      id={`page-container-${pageNumber}`}
      style={{
        width: pageSize.width || 600 * scale,
        height: pageSize.height || 800 * scale,
        transform: 'translateZ(0)',
      }}
      className="relative mx-auto my-4 bg-white shadow-2xl rounded-sm transition-shadow group select-none will-change-transform"
    >
      {/* Visual Filter Container for PDF Rendering */}
      <div
        style={{
          filter: filterStyle,
          width: pageSize.width,
          height: pageSize.height,
        }}
        className="relative overflow-hidden w-full h-full"
      >
        {/* PDF Canvas */}
        <canvas ref={canvasRef} className="block absolute inset-0 pointer-events-none" />

        {/* Text Selection & Search Layer */}
        <div ref={textLayerRef} className="textLayer" />
      </div>

      {/* Vector Annotation Layer (Strokes, Shapes, Notes) */}
      {pageSize.width > 0 && (
        <AnnotationCanvas
          pageNumber={pageNumber}
          width={pageSize.width}
          height={pageSize.height}
          scale={scale}
        />
      )}

      {/* Visual Stamps Overlay */}
      {showPageStamps && pageStamps.map(stamp => (
        <StampBadge key={stamp.id} stamp={stamp} />
      ))}

      {/* Bookmark Ribbon Button */}
      <button
        onClick={() => toggleBookmark(pageNumber)}
        className={`absolute top-0 right-4 z-30 p-2 transition-all cursor-pointer ${
          isBookmarked
            ? 'text-amber-400 drop-shadow-md scale-110'
            : 'text-slate-400/40 hover:text-amber-400 opacity-0 group-hover:opacity-100'
        }`}
        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Page'}
      >
        <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
      </button>

      {/* Page Number Floating Indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-mono font-medium text-slate-400 select-none bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
        Page {pageNumber}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
