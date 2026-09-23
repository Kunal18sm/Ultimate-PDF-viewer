import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePDF } from '../../context/PDFContext';
import type { ShapeAnnotation, Point } from '../../types/pdf';

interface AnnotationCanvasProps {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  pageNumber,
  width,
  height,
  scale,
}) => {
  const {
    currentTool,
    activeDoc,
    addStroke,
    addShape,
    addTextNote,
    removeStroke,
    removeShape,
    setLaserPosition,
  } = usePDF();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);

  // Use refs for live drawing to avoid triggering React re-renders on every mouse move
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const strokes = activeDoc?.strokes.filter(s => s.pageNumber === pageNumber) || [];
  const shapes = activeDoc?.shapes.filter(s => s.pageNumber === pageNumber) || [];
  const textNotes = activeDoc?.textNotes.filter(t => t.pageNumber === pageNumber) || [];

  // Get normalized coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / width) * (width / scale);
    const y = ((e.clientY - rect.top) / height) * (height / scale);
    return { x, y };
  };

  // Main canvas redraw for committed annotations
  const redrawCommitted = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Completed Strokes
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      }

      ctx.moveTo(stroke.points[0].x * scale, stroke.points[0].y * scale);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * scale, stroke.points[i].y * scale);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Shapes
    for (const shape of shapes) {
      drawSingleShape(ctx, shape, scale);
    }

    // 3. Text Notes
    for (const textItem of textNotes) {
      ctx.save();
      const tx = textItem.x * scale;
      const ty = textItem.y * scale;
      const fSize = textItem.fontSize * scale;

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
  }, [width, height, scale, strokes, shapes, textNotes]);

  useEffect(() => {
    redrawCommitted();
  }, [redrawCommitted]);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // only left click
    const coords = getCanvasCoords(e);

    if (currentTool.tool === 'pen' || currentTool.tool === 'highlighter') {
      isDrawingRef.current = true;
      currentPointsRef.current = [coords];
      lastPointRef.current = coords;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (['rect', 'circle', 'arrow', 'line'].includes(currentTool.tool)) {
      isDrawingRef.current = true;
      shapeStartRef.current = coords;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (currentTool.tool === 'text') {
      setTextInput({ x: coords.x, y: coords.y, text: '' });
    } else if (currentTool.tool === 'eraser') {
      isDrawingRef.current = true;
      eraseAt(coords);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  // Pointer Move (Runs direct to Canvas 2D context - 120 FPS buttery smooth)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentTool.tool === 'laser') {
      setLaserPosition({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawingRef.current) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool.tool === 'pen' || currentTool.tool === 'highlighter') {
      currentPointsRef.current.push(coords);

      // Direct incremental line draw for zero latency
      if (lastPointRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = currentTool.color;
        ctx.lineWidth = (currentTool.tool === 'highlighter' ? currentTool.strokeWidth * 3 : currentTool.strokeWidth) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = currentTool.tool === 'highlighter' ? 0.35 : currentTool.opacity;

        if (currentTool.tool === 'highlighter') {
          ctx.globalCompositeOperation = 'multiply';
        }

        ctx.moveTo(lastPointRef.current.x * scale, lastPointRef.current.y * scale);
        ctx.lineTo(coords.x * scale, coords.y * scale);
        ctx.stroke();
        ctx.restore();
      }
      lastPointRef.current = coords;
    } else if (shapeStartRef.current && ['rect', 'circle', 'arrow', 'line'].includes(currentTool.tool)) {
      // Redraw committed items and overlay current shape preview
      redrawCommitted();
      const liveShape: ShapeAnnotation = {
        id: 'preview',
        type: currentTool.tool as any,
        startX: shapeStartRef.current.x,
        startY: shapeStartRef.current.y,
        endX: coords.x,
        endY: coords.y,
        color: currentTool.color,
        fillColor: currentTool.fillColor,
        strokeWidth: currentTool.strokeWidth,
        pageNumber,
      };
      drawSingleShape(ctx, liveShape, scale);
    } else if (currentTool.tool === 'eraser') {
      eraseAt(coords);
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const pts = currentPointsRef.current;
    if ((currentTool.tool === 'pen' || currentTool.tool === 'highlighter') && pts.length > 1) {
      addStroke({
        id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        tool: currentTool.tool,
        color: currentTool.color,
        size: currentTool.tool === 'highlighter' ? currentTool.strokeWidth * 3 : currentTool.strokeWidth,
        opacity: currentTool.tool === 'highlighter' ? 0.35 : currentTool.opacity,
        points: pts,
        pageNumber,
      });
    } else if (shapeStartRef.current && ['rect', 'circle', 'arrow', 'line'].includes(currentTool.tool)) {
      const coords = getCanvasCoords(e);
      const dist = Math.hypot(coords.x - shapeStartRef.current.x, coords.y - shapeStartRef.current.y);
      if (dist > 3) {
        addShape({
          id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: currentTool.tool as any,
          startX: shapeStartRef.current.x,
          startY: shapeStartRef.current.y,
          endX: coords.x,
          endY: coords.y,
          color: currentTool.color,
          fillColor: currentTool.fillColor,
          strokeWidth: currentTool.strokeWidth,
          pageNumber,
        });
      }
    }

    currentPointsRef.current = [];
    shapeStartRef.current = null;
    lastPointRef.current = null;
  };

  // Erase nearby elements
  const eraseAt = (pt: Point) => {
    const threshold = 18;
    for (const s of strokes) {
      for (const p of s.points) {
        if (Math.hypot(p.x - pt.x, p.y - pt.y) < threshold) {
          removeStroke(s.id);
          return;
        }
      }
    }
    for (const sh of shapes) {
      const midX = (sh.startX + sh.endX) / 2;
      const midY = (sh.startY + sh.endY) / 2;
      if (Math.hypot(midX - pt.x, midY - pt.y) < threshold * 2) {
        removeShape(sh.id);
        return;
      }
    }
  };

  const handleTextSubmit = () => {
    if (textInput && textInput.text.trim()) {
      addTextNote({
        id: `text_${Date.now()}`,
        text: textInput.text,
        x: textInput.x,
        y: textInput.y,
        fontSize: currentTool.fontSize || 16,
        color: currentTool.color,
        bgColor: 'rgba(255, 255, 255, 0.9)',
        pageNumber,
      });
    }
    setTextInput(null);
  };

  const isInteractive = ['pen', 'highlighter', 'rect', 'circle', 'arrow', 'line', 'text', 'eraser', 'laser'].includes(currentTool.tool);

  return (
    <div
      style={{ width, height }}
      className={`absolute inset-0 z-10 ${isInteractive ? 'pointer-events-auto touch-none' : 'pointer-events-none'}`}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          if (currentTool.tool === 'laser') setLaserPosition(null);
        }}
        className={`w-full h-full ${
          currentTool.tool === 'pen' || currentTool.tool === 'highlighter' ? 'cursor-crosshair' :
          currentTool.tool === 'eraser' ? 'cursor-cell' :
          currentTool.tool === 'text' ? 'cursor-text' :
          currentTool.tool === 'laser' ? 'cursor-none' :
          ['rect', 'circle', 'arrow', 'line'].includes(currentTool.tool) ? 'cursor-crosshair' : ''
        }`}
      />

      {/* Inline Text Box Editor */}
      {textInput && (
        <div
          style={{
            left: textInput.x * scale,
            top: textInput.y * scale,
          }}
          className="absolute z-30 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-xl p-2.5 shadow-2xl flex flex-col gap-2 min-w-[220px] animate-in zoom-in-95 duration-100"
        >
          <textarea
            autoFocus
            rows={2}
            value={textInput.text}
            onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
              } else if (e.key === 'Escape') {
                setTextInput(null);
              }
            }}
            placeholder="Type note (Enter to save)..."
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs p-2 rounded-lg border-0 focus:outline-hidden resize-none"
          />
          <div className="flex justify-end gap-1.5 text-[10px]">
            <button
              onClick={() => setTextInput(null)}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleTextSubmit}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 cursor-pointer shadow-xs"
            >
              Add Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function drawSingleShape(ctx: CanvasRenderingContext2D, shape: ShapeAnnotation, scale: number) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth * scale;
  ctx.fillStyle = shape.fillColor || 'transparent';

  const sx = shape.startX * scale;
  const sy = shape.startY * scale;
  const ex = shape.endX * scale;
  const ey = shape.endY * scale;

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

    const headlen = 12 * scale;
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
