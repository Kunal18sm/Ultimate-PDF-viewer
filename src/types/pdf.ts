export type ToolType = 
  | 'pan'
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'rect'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'text'
  | 'eraser'
  | 'stamp'
  | 'laser';

export type ViewMode = 'single' | 'continuous' | 'dual';

export type StampPreset = 
  | 'APPROVED'
  | 'REJECTED'
  | 'CONFIDENTIAL'
  | 'REVIEWED'
  | 'IMPORTANT'
  | 'URGENT'
  | 'FINAL'
  | 'DRAFT'
  | 'PAID'
  | 'STAR'
  | 'VERIFIED'
  | 'CUSTOM';

export interface PageStamp {
  id: string;
  preset: StampPreset;
  label: string;
  note?: string;
  color: string; // Hex or tailwind class
  icon?: string;
  pageNumber: number; // 1-indexed
  x: number; // percentage (0 to 100) or pixel
  y: number; // percentage (0 to 100)
  createdAt: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'highlighter';
  name?: string;
  color: string;
  size: number;
  opacity: number;
  points: Point[];
  pageNumber: number;
}

export interface ShapeAnnotation {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'line';
  name?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  fillColor?: string;
  strokeWidth: number;
  pageNumber: number;
}

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bgColor?: string;
  pageNumber: number;
}

export interface VisualFilters {
  brightness: number; // 50 to 200 (default 100)
  contrast: number;   // 50 to 200 (default 100)
  invert: boolean;    // Dark mode for PDF
  sepia: boolean;     // Warm reading mode
  grayscale: boolean; // B&W mode
  hueRotate: number;  // 0 to 360
}

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  snippet: string;
}

export interface PDFOutlineItem {
  title: string;
  dest?: any;
  pageNumber?: number;
  items?: PDFOutlineItem[];
}

export interface PDFDocumentState {
  id: string;
  name: string;
  file?: File;
  dataUrl?: string;
  arrayBuffer?: ArrayBuffer;
  numPages: number;
  currentPage: number;
  zoom: number; // 0.25 to 5.0 (default 1.0 = 100%)
  rotation: number; // 0, 90, 180, 270
  viewMode: ViewMode;
  filters: VisualFilters;
  
  // Annotations & stamps per document
  strokes: DrawingStroke[];
  shapes: ShapeAnnotation[];
  textNotes: TextAnnotation[];
  stamps: PageStamp[];
  
  // History for Undo / Redo
  history: {
    past: Array<{
      strokes: DrawingStroke[];
      shapes: ShapeAnnotation[];
      textNotes: TextAnnotation[];
      stamps: PageStamp[];
    }>;
    future: Array<{
      strokes: DrawingStroke[];
      shapes: ShapeAnnotation[];
      textNotes: TextAnnotation[];
      stamps: PageStamp[];
    }>;
  };

  outline: PDFOutlineItem[];
  bookmarks: number[]; // Array of page numbers
}

export interface CurrentToolConfig {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fillColor?: string;
  activeStampPreset?: StampPreset;
}

export interface SecurityProtectedAction {
  title: string;
  itemDescription?: string;
  onConfirm: () => void;
  isResetOnly?: boolean;
}
