import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentState, PageStamp, DrawingStroke, ShapeAnnotation, TextAnnotation } from '../types/pdf';

/**
 * Draws all vector annotations onto an HTML5 canvas context
 */
export function renderAnnotationsToContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: DrawingStroke[],
  shapes: ShapeAnnotation[],
  textNotes: TextAnnotation[],
  stamps: PageStamp[],
  pageNumber: number,
  pageWidthPt: number,
  pageHeightPt: number
) {
  const scaleX = width / pageWidthPt;
  const scaleY = height / pageHeightPt;

  // 1. Draw Strokes (Pen & Highlighter)
  const pageStrokes = strokes.filter(s => s.pageNumber === pageNumber);
  for (const stroke of pageStrokes) {
    if (stroke.points.length < 2) continue;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size * scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;

    if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
    }

    const firstPt = stroke.points[0];
    ctx.moveTo(firstPt.x * scaleX, firstPt.y * scaleY);

    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 2. Draw Shapes
  const pageShapes = shapes.filter(s => s.pageNumber === pageNumber);
  for (const shape of pageShapes) {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth * scaleX;
    ctx.fillStyle = shape.fillColor || 'transparent';

    const sx = shape.startX * scaleX;
    const sy = shape.startY * scaleY;
    const ex = shape.endX * scaleX;
    const ey = shape.endY * scaleY;

    if (shape.type === 'rect') {
      const rx = Math.min(sx, ex);
      const ry = Math.min(sy, ey);
      const rw = Math.abs(ex - sx);
      const rh = Math.abs(ey - sy);
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillRect(rx, ry, rw, rh);
      }
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (shape.type === 'circle') {
      const cx = (sx + ex) / 2;
      const cy = (sy + ey) / 2;
      const rx = Math.abs(ex - sx) / 2;
      const ry = Math.abs(ey - sy) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, 2 * Math.PI);
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    } else if (shape.type === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Arrow head
      const headlen = 12 * scaleX;
      const angle = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - headlen * Math.cos(angle - Math.PI / 6),
        ey - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ex - headlen * Math.cos(angle + Math.PI / 6),
        ey - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = shape.color;
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Draw Text Notes
  const pageTexts = textNotes.filter(t => t.pageNumber === pageNumber);
  for (const textItem of pageTexts) {
    ctx.save();
    const tx = textItem.x * scaleX;
    const ty = textItem.y * scaleY;
    const fSize = textItem.fontSize * scaleX;

    ctx.font = `${fSize}px sans-serif`;
    ctx.textBaseline = 'top';

    if (textItem.bgColor) {
      const metrics = ctx.measureText(textItem.text);
      ctx.fillStyle = textItem.bgColor;
      ctx.fillRect(tx - 4, ty - 2, metrics.width + 8, fSize * 1.3);
    }

    ctx.fillStyle = textItem.color;
    ctx.fillText(textItem.text, tx, ty);
    ctx.restore();
  }

  // 4. Draw Stamps
  const pageStamps = stamps.filter(s => s.pageNumber === pageNumber);
  for (const stamp of pageStamps) {
    ctx.save();
    const sx = (stamp.x / 100) * width;
    const sy = (stamp.y / 100) * height;

    const stampWidth = 140 * scaleX;
    const stampHeight = 44 * scaleX;

    ctx.translate(sx, sy);
    ctx.rotate(-0.08);

    // Stamp Border & Background
    ctx.fillStyle = stamp.color + '15';
    ctx.strokeStyle = stamp.color;
    ctx.lineWidth = 3 * scaleX;
    ctx.beginPath();
    ctx.roundRect(-stampWidth / 2, -stampHeight / 2, stampWidth, stampHeight, 6 * scaleX);
    ctx.fill();
    ctx.stroke();

    // Inner dashed border
    ctx.strokeStyle = stamp.color + '80';
    ctx.lineWidth = 1 * scaleX;
    ctx.setLineDash([4 * scaleX, 2 * scaleX]);
    ctx.strokeRect(-stampWidth / 2 + 3, -stampHeight / 2 + 3, stampWidth - 6, stampHeight - 6);
    ctx.setLineDash([]);

    // Stamp Label Text
    ctx.fillStyle = stamp.color;
    ctx.font = `bold ${14 * scaleX}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp.label, 0, stamp.note ? -6 * scaleX : 0);

    if (stamp.note) {
      ctx.font = `${8 * scaleX}px sans-serif`;
      ctx.fillText(stamp.note, 0, 10 * scaleX);
    }

    ctx.restore();
  }
}

/**
 * Exports the modified PDF with flattened annotations and stamps
 */
export async function exportAnnotatedPdf(docState: PDFDocumentState): Promise<void> {
  if (!docState.arrayBuffer) {
    throw new Error('Document buffer not found');
  }

  const pdfDoc = await PDFDocument.load(docState.arrayBuffer);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const page = pages[i];
    const { width, height } = page.getSize();

    const hasStrokes = docState.strokes.some(s => s.pageNumber === pageNum);
    const hasShapes = docState.shapes.some(s => s.pageNumber === pageNum);
    const hasTexts = docState.textNotes.some(t => t.pageNumber === pageNum);
    const hasStamps = docState.stamps.some(s => s.pageNumber === pageNum);

    if (hasStrokes || hasShapes || hasTexts || hasStamps) {
      const dpr = 2;
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = width * dpr;
      offscreenCanvas.height = height * dpr;
      const ctx = offscreenCanvas.getContext('2d');

      if (ctx) {
        ctx.scale(dpr, dpr);
        renderAnnotationsToContext(
          ctx,
          width,
          height,
          docState.strokes,
          docState.shapes,
          docState.textNotes,
          docState.stamps,
          pageNum,
          width,
          height
        );

        const pngDataUrl = offscreenCanvas.toDataURL('image/png');
        const pngImage = await pdfDoc.embedPng(pngDataUrl);

        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `annotated_${docState.name.replace(/\.pdf$/i, '')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a canvas element as high-resolution PNG image
 */
export function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' = 'png'): void {
  const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
