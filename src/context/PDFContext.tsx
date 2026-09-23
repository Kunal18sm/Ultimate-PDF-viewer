import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  PDFDocumentState,
  CurrentToolConfig,
  ToolType,
  ViewMode,
  VisualFilters,
  DrawingStroke,
  ShapeAnnotation,
  TextAnnotation,
  PageStamp,
  SearchMatch
} from '../types/pdf';
import { pdfjsLib } from '../utils/pdfWorker';
import { saveDocumentsToDB, loadDocumentsFromDB, deleteDocumentFromDB } from '../utils/db';

interface PDFContextType {
  documents: PDFDocumentState[];
  activeDocId: string | null;
  activeDoc: PDFDocumentState | null;
  currentTool: CurrentToolConfig;
  
  // UI State
  isSidebarOpen: boolean;
  activeSidebarTab: 'thumbnails' | 'stamps' | 'outline' | 'annotations';
  isStampPickerOpen: boolean;
  isFiltersModalOpen: boolean;
  isShortcutsOpen: boolean;
  searchQuery: string;
  searchResults: SearchMatch[];
  currentSearchMatchIndex: number;
  isSearching: boolean;
  laserPosition: { x: number; y: number } | null;
  isAutoSaved: boolean;

  // Actions
  openFiles: (files: FileList | File[]) => Promise<void>;
  closeDocument: (docId: string) => void;
  setActiveDocument: (docId: string) => void;
  
  // View & Page controls
  setCurrentPage: (pageNumber: number) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setRotation: (rotation: number | ((prev: number) => number)) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<VisualFilters>) => void;
  resetFilters: () => void;
  
  // Tool controls
  setTool: (tool: ToolType) => void;
  setToolConfig: (config: Partial<CurrentToolConfig>) => void;
  
  // Annotations
  addStroke: (stroke: DrawingStroke) => void;
  updateStroke: (strokeId: string, updates: Partial<DrawingStroke>) => void;
  addShape: (shape: ShapeAnnotation) => void;
  updateShape: (shapeId: string, updates: Partial<ShapeAnnotation>) => void;
  addTextNote: (text: TextAnnotation) => void;
  updateTextNote: (textId: string, updates: Partial<TextAnnotation>) => void;
  removeStroke: (id: string) => void;
  removeShape: (id: string) => void;
  removeTextNote: (id: string) => void;
  clearPageAnnotations: (pageNumber: number) => void;
  
  // Stamps & Bookmarks
  editingStamp: PageStamp | null;
  setEditingStamp: (stamp: PageStamp | null) => void;
  openStampEditor: (stamp: PageStamp) => void;
  addStamp: (stamp: Omit<PageStamp, 'id' | 'createdAt'>) => void;
  updateStamp: (stampId: string, updates: Partial<PageStamp>) => void;
  removeStamp: (stampId: string) => void;
  jumpToStamp: (stamp: PageStamp) => void;
  toggleBookmark: (pageNumber: number) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Search
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  nextSearchMatch: () => void;
  prevSearchMatch: () => void;
  clearSearch: () => void;

  // UI Toggles
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setActiveSidebarTab: (tab: 'thumbnails' | 'stamps' | 'outline' | 'annotations') => void;
  setIsStampPickerOpen: (open: boolean) => void;
  setIsFiltersModalOpen: (open: boolean) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setLaserPosition: (pos: { x: number; y: number } | null) => void;
}

const defaultFilters: VisualFilters = {
  brightness: 100,
  contrast: 100,
  invert: false,
  sepia: false,
  grayscale: false,
  hueRotate: 0,
};

const defaultToolConfig: CurrentToolConfig = {
  tool: 'select',
  color: '#ef4444',
  strokeWidth: 3,
  opacity: 1,
  fontSize: 16,
  fillColor: 'transparent',
  activeStampPreset: 'APPROVED'
};

const PDFContext = createContext<PDFContextType | null>(null);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<PDFDocumentState[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [currentTool, setCurrentToolState] = useState<CurrentToolConfig>(defaultToolConfig);
  const [isLoadedFromDB, setIsLoadedFromDB] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(true);
  const saveTimeoutRef = useRef<any>(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'thumbnails' | 'stamps' | 'outline' | 'annotations'>('thumbnails');
  const [isStampPickerOpen, setIsStampPickerOpen] = useState(false);
  const [editingStamp, setEditingStamp] = useState<PageStamp | null>(null);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [laserPosition, setLaserPosition] = useState<{ x: number; y: number } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [currentSearchMatchIndex, setCurrentSearchMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const activeDoc = documents.find(d => d.id === activeDocId) || null;

  // Load from IndexedDB on startup
  useEffect(() => {
    loadDocumentsFromDB().then(({ documents: loadedDocs, activeDocId: savedActiveId }) => {
      if (loadedDocs && loadedDocs.length > 0) {
        setDocuments(loadedDocs);
        setActiveDocId(savedActiveId || loadedDocs[0]?.id || null);
      }
      setIsLoadedFromDB(true);
    });
  }, []);

  // Auto-save to IndexedDB whenever documents or active tab changes
  useEffect(() => {
    if (!isLoadedFromDB) return;

    setIsAutoSaved(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocumentsToDB(documents, activeDocId).then(() => {
        setIsAutoSaved(true);
      });
    }, 600); // 600ms debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [documents, activeDocId, isLoadedFromDB]);

  // Update active document state helper
  const updateActiveDoc = useCallback((updater: (prev: PDFDocumentState) => PDFDocumentState) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === activeDocId) {
          return updater(doc);
        }
        return doc;
      })
    );
  }, [activeDocId]);

  // Load a document from ArrayBuffer
  const loadPdfFromBuffer = useCallback(async (buffer: ArrayBuffer, fileName: string) => {
    try {
      const bufferData = new Uint8Array(buffer.slice(0));
      const loadingTask = pdfjsLib.getDocument({ data: bufferData });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      let outline: any[] = [];
      try {
        const rawOutline = await pdf.getOutline();
        if (rawOutline) outline = rawOutline;
      } catch (e) {
        console.warn('No outline found in PDF', e);
      }

      const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newDoc: PDFDocumentState = {
        id: newDocId,
        name: fileName,
        arrayBuffer: buffer,
        numPages,
        currentPage: 1,
        zoom: 1.0,
        rotation: 0,
        viewMode: 'single',
        filters: { ...defaultFilters },
        strokes: [],
        shapes: [],
        textNotes: [],
        stamps: [],
        history: { past: [], future: [] },
        outline,
        bookmarks: []
      };

      setDocuments(prev => [...prev, newDoc]);
      setActiveDocId(newDocId);
    } catch (err) {
      console.error('Failed to load PDF', err);
      alert('Error loading PDF file. Please ensure it is a valid PDF format.');
    }
  }, []);

  // Open user-selected files
  const openFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        await loadPdfFromBuffer(buffer, file.name);
      }
    }
  }, [loadPdfFromBuffer]);

  // Close tab
  const closeDocument = useCallback((docId: string) => {
    deleteDocumentFromDB(docId);
    setDocuments(prev => {
      const filtered = prev.filter(d => d.id !== docId);
      if (activeDocId === docId) {
        const remainingIdx = prev.findIndex(d => d.id === docId);
        const nextDoc = filtered[remainingIdx] || filtered[remainingIdx - 1] || filtered[0] || null;
        setActiveDocId(nextDoc ? nextDoc.id : null);
      }
      return filtered;
    });
  }, [activeDocId]);

  // Tool selection
  const setTool = useCallback((tool: ToolType) => {
    setCurrentToolState(prev => ({ ...prev, tool }));
  }, []);

  const setToolConfig = useCallback((config: Partial<CurrentToolConfig>) => {
    setCurrentToolState(prev => ({ ...prev, ...config }));
  }, []);

  // View navigation
  const setCurrentPage = useCallback((pageNumber: number) => {
    updateActiveDoc(doc => {
      const target = Math.max(1, Math.min(doc.numPages, pageNumber));
      return { ...doc, currentPage: target };
    });
  }, [updateActiveDoc]);

  const setZoom = useCallback((zoomOrFn: number | ((prev: number) => number)) => {
    updateActiveDoc(doc => {
      const nextZoom = typeof zoomOrFn === 'function' ? zoomOrFn(doc.zoom) : zoomOrFn;
      const clamped = Math.max(0.25, Math.min(4.0, Number(nextZoom.toFixed(2))));
      return { ...doc, zoom: clamped };
    });
  }, [updateActiveDoc]);

  const setRotation = useCallback((rotOrFn: number | ((prev: number) => number)) => {
    updateActiveDoc(doc => {
      const nextRot = typeof rotOrFn === 'function' ? rotOrFn(doc.rotation) : rotOrFn;
      return { ...doc, rotation: (nextRot % 360 + 360) % 360 };
    });
  }, [updateActiveDoc]);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    updateActiveDoc(doc => ({ ...doc, viewMode }));
  }, [updateActiveDoc]);

  const setFilters = useCallback((filtersUpdate: Partial<VisualFilters>) => {
    updateActiveDoc(doc => ({
      ...doc,
      filters: { ...doc.filters, ...filtersUpdate }
    }));
  }, [updateActiveDoc]);

  const resetFilters = useCallback(() => {
    updateActiveDoc(doc => ({
      ...doc,
      filters: { ...defaultFilters }
    }));
  }, [updateActiveDoc]);

  // History Helper
  const pushHistory = useCallback((currentDoc: PDFDocumentState) => {
    const currentState = {
      strokes: [...currentDoc.strokes],
      shapes: [...currentDoc.shapes],
      textNotes: [...currentDoc.textNotes],
      stamps: [...currentDoc.stamps]
    };
    return {
      past: [...currentDoc.history.past, currentState].slice(-30),
      future: []
    };
  }, []);

  // Annotations adding
  const addStroke = useCallback((stroke: DrawingStroke) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      strokes: [...doc.strokes, stroke]
    }));
  }, [updateActiveDoc, pushHistory]);

  const addShape = useCallback((shape: ShapeAnnotation) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      shapes: [...doc.shapes, shape]
    }));
  }, [updateActiveDoc, pushHistory]);

  const addTextNote = useCallback((textNote: TextAnnotation) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      textNotes: [...doc.textNotes, textNote]
    }));
  }, [updateActiveDoc, pushHistory]);

  const updateStroke = useCallback((strokeId: string, updates: Partial<DrawingStroke>) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      strokes: doc.strokes.map(s => s.id === strokeId ? { ...s, ...updates } : s)
    }));
  }, [updateActiveDoc, pushHistory]);

  const updateShape = useCallback((shapeId: string, updates: Partial<ShapeAnnotation>) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      shapes: doc.shapes.map(sh => sh.id === shapeId ? { ...sh, ...updates } : sh)
    }));
  }, [updateActiveDoc, pushHistory]);

  const updateTextNote = useCallback((textId: string, updates: Partial<TextAnnotation>) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      textNotes: doc.textNotes.map(t => t.id === textId ? { ...t, ...updates } : t)
    }));
  }, [updateActiveDoc, pushHistory]);

  const removeStroke = useCallback((id: string) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      strokes: doc.strokes.filter(s => s.id !== id)
    }));
  }, [updateActiveDoc, pushHistory]);

  const removeShape = useCallback((id: string) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      shapes: doc.shapes.filter(s => s.id !== id)
    }));
  }, [updateActiveDoc, pushHistory]);

  const removeTextNote = useCallback((id: string) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      textNotes: doc.textNotes.filter(t => t.id !== id)
    }));
  }, [updateActiveDoc, pushHistory]);

  const clearPageAnnotations = useCallback((pageNumber: number) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      strokes: doc.strokes.filter(s => s.pageNumber !== pageNumber),
      shapes: doc.shapes.filter(s => s.pageNumber !== pageNumber),
      textNotes: doc.textNotes.filter(t => t.pageNumber !== pageNumber),
      stamps: doc.stamps.filter(s => s.pageNumber !== pageNumber)
    }));
  }, [updateActiveDoc, pushHistory]);

  // Stamps & Bookmarks
  const openStampEditor = useCallback((stamp: PageStamp) => {
    setEditingStamp(stamp);
    setIsStampPickerOpen(true);
  }, []);

  const addStamp = useCallback((stampData: Omit<PageStamp, 'id' | 'createdAt'>) => {
    const newStamp: PageStamp = {
      ...stampData,
      id: `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now()
    };
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      stamps: [...doc.stamps, newStamp]
    }));
    setActiveSidebarTab('stamps');
    setIsSidebarOpen(true);
  }, [updateActiveDoc, pushHistory]);

  const updateStamp = useCallback((stampId: string, updates: Partial<PageStamp>) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      stamps: doc.stamps.map(s => s.id === stampId ? { ...s, ...updates } : s)
    }));
  }, [updateActiveDoc, pushHistory]);

  const removeStamp = useCallback((stampId: string) => {
    updateActiveDoc(doc => ({
      ...doc,
      history: pushHistory(doc),
      stamps: doc.stamps.filter(s => s.id !== stampId)
    }));
    setEditingStamp(prev => prev?.id === stampId ? null : prev);
  }, [updateActiveDoc, pushHistory]);

  const jumpToStamp = useCallback((stamp: PageStamp) => {
    setCurrentPage(stamp.pageNumber);
  }, [setCurrentPage]);

  const toggleBookmark = useCallback((pageNumber: number) => {
    updateActiveDoc(doc => {
      const exists = doc.bookmarks.includes(pageNumber);
      const newBookmarks = exists
        ? doc.bookmarks.filter(p => p !== pageNumber)
        : [...doc.bookmarks, pageNumber].sort((a, b) => a - b);
      return { ...doc, bookmarks: newBookmarks };
    });
  }, [updateActiveDoc]);

  // Undo / Redo
  const undo = useCallback(() => {
    updateActiveDoc(doc => {
      if (doc.history.past.length === 0) return doc;
      const previous = doc.history.past[doc.history.past.length - 1];
      const newPast = doc.history.past.slice(0, -1);
      const current = {
        strokes: doc.strokes,
        shapes: doc.shapes,
        textNotes: doc.textNotes,
        stamps: doc.stamps
      };
      return {
        ...doc,
        strokes: previous.strokes,
        shapes: previous.shapes,
        textNotes: previous.textNotes,
        stamps: previous.stamps,
        history: {
          past: newPast,
          future: [current, ...doc.history.future]
        }
      };
    });
  }, [updateActiveDoc]);

  const redo = useCallback(() => {
    updateActiveDoc(doc => {
      if (doc.history.future.length === 0) return doc;
      const next = doc.history.future[0];
      const newFuture = doc.history.future.slice(1);
      const current = {
        strokes: doc.strokes,
        shapes: doc.shapes,
        textNotes: doc.textNotes,
        stamps: doc.stamps
      };
      return {
        ...doc,
        strokes: next.strokes,
        shapes: next.shapes,
        textNotes: next.textNotes,
        stamps: next.stamps,
        history: {
          past: [...doc.history.past, current],
          future: newFuture
        }
      };
    });
  }, [updateActiveDoc]);

  const canUndo = (activeDoc?.history.past.length ?? 0) > 0;
  const canRedo = (activeDoc?.history.future.length ?? 0) > 0;

  // Search implementation
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !activeDoc?.arrayBuffer) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(activeDoc.arrayBuffer.slice(0)) }).promise;
      const matches: SearchMatch[] = [];
      const lowerQuery = query.toLowerCase();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        const lowerPageText = pageText.toLowerCase();
        let startIndex = 0;
        let matchIdx = 0;

        while ((startIndex = lowerPageText.indexOf(lowerQuery, startIndex)) !== -1) {
          const snippetStart = Math.max(0, startIndex - 20);
          const snippetEnd = Math.min(pageText.length, startIndex + lowerQuery.length + 30);
          const snippet = (snippetStart > 0 ? '...' : '') + 
                          pageText.substring(snippetStart, snippetEnd) + 
                          (snippetEnd < pageText.length ? '...' : '');

          matches.push({
            pageNumber: i,
            matchIndex: matchIdx++,
            snippet
          });
          startIndex += lowerQuery.length;
        }
      }

      setSearchResults(matches);
      setCurrentSearchMatchIndex(0);
      if (matches.length > 0) {
        setCurrentPage(matches[0].pageNumber);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  }, [activeDoc, setCurrentPage]);

  const nextSearchMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchMatchIndex + 1) % searchResults.length;
    setCurrentSearchMatchIndex(nextIdx);
    setCurrentPage(searchResults[nextIdx].pageNumber);
  }, [searchResults, currentSearchMatchIndex, setCurrentPage]);

  const prevSearchMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchMatchIndex(prevIdx);
    setCurrentPage(searchResults[prevIdx].pageNumber);
  }, [searchResults, currentSearchMatchIndex, setCurrentPage]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchMatchIndex(0);
  }, []);

  return (
    <PDFContext.Provider
      value={{
        documents,
        activeDocId,
        activeDoc,
        currentTool,
        isSidebarOpen,
        activeSidebarTab,
        isStampPickerOpen,
        isFiltersModalOpen,
        isShortcutsOpen,
        searchQuery,
        searchResults,
        currentSearchMatchIndex,
        isSearching,
        laserPosition,
        isAutoSaved,
        openFiles,
        closeDocument,
        setActiveDocument: setActiveDocId,
        setCurrentPage,
        setZoom,
        setRotation,
        setViewMode,
        setFilters,
        resetFilters,
        setTool,
        setToolConfig,
        addStroke,
        updateStroke,
        addShape,
        updateShape,
        addTextNote,
        updateTextNote,
        removeStroke,
        removeShape,
        removeTextNote,
        clearPageAnnotations,
        editingStamp,
        setEditingStamp,
        openStampEditor,
        addStamp,
        updateStamp,
        removeStamp,
        jumpToStamp,
        toggleBookmark,
        undo,
        redo,
        canUndo,
        canRedo,
        setSearchQuery,
        performSearch,
        nextSearchMatch,
        prevSearchMatch,
        clearSearch,
        setIsSidebarOpen,
        setActiveSidebarTab,
        setIsStampPickerOpen,
        setIsFiltersModalOpen,
        setIsShortcutsOpen,
        setLaserPosition,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
};

export const usePDF = () => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error('usePDF must be used within a PDFProvider');
  }
  return context;
};
