import type { PDFDocumentState } from '../types/pdf';

const DB_NAME = 'UltimatePDF_DB';
const DB_VERSION = 1;
const DOC_STORE = 'documents';
const META_STORE = 'meta';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DOC_STORE)) {
        db.createObjectStore(DOC_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves all documents and active tab state into local IndexedDB
 */
export async function saveDocumentsToDB(docs: PDFDocumentState[], activeDocId: string | null): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([DOC_STORE, META_STORE], 'readwrite');
    const docStore = tx.objectStore(DOC_STORE);
    const metaStore = tx.objectStore(META_STORE);

    // Save or update docs
    for (const doc of docs) {
      const docToSave = {
        id: doc.id,
        name: doc.name,
        arrayBuffer: doc.arrayBuffer,
        numPages: doc.numPages,
        currentPage: doc.currentPage,
        zoom: doc.zoom,
        rotation: doc.rotation,
        viewMode: doc.viewMode,
        filters: doc.filters,
        strokes: doc.strokes,
        shapes: doc.shapes,
        textNotes: doc.textNotes,
        stamps: doc.stamps,
        bookmarks: doc.bookmarks,
        outline: doc.outline,
        history: { past: [], future: [] },
      };
      docStore.put(docToSave);
    }

    // Save active doc ID
    metaStore.put({ key: 'activeDocId', value: activeDocId });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving to IndexedDB:', err);
  }
}

/**
 * Loads all saved documents from IndexedDB on startup
 */
export async function loadDocumentsFromDB(): Promise<{ documents: PDFDocumentState[]; activeDocId: string | null }> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([DOC_STORE, META_STORE], 'readonly');
    const docStore = tx.objectStore(DOC_STORE);
    const metaStore = tx.objectStore(META_STORE);

    const docsRequest = docStore.getAll();
    const activeDocRequest = metaStore.get('activeDocId');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        const rawDocs = docsRequest.result || [];
        const activeMeta = activeDocRequest.result;

        const documents: PDFDocumentState[] = rawDocs.map((d: any) => ({
          ...d,
          history: { past: [], future: [] },
        }));

        resolve({
          documents,
          activeDocId: activeMeta ? activeMeta.value : (documents[0]?.id || null),
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error loading from IndexedDB:', err);
    return { documents: [], activeDocId: null };
  }
}

/**
 * Deletes a document from IndexedDB when its tab is closed
 */
export async function deleteDocumentFromDB(docId: string): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([DOC_STORE], 'readwrite');
    tx.objectStore(DOC_STORE).delete(docId);
  } catch (err) {
    console.error('Error deleting from IndexedDB:', err);
  }
}

/**
 * Clears all documents and resets IndexedDB storage
 */
export async function clearAllDocumentsFromDB(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([DOC_STORE, META_STORE], 'readwrite');
    tx.objectStore(DOC_STORE).clear();
    tx.objectStore(META_STORE).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error clearing IndexedDB:', err);
  }
}

/**
 * Calculates approximate storage usage in bytes
 */
export async function getStorageInfoFromDB(): Promise<{ totalBytes: number; count: number }> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([DOC_STORE], 'readonly');
    const docStore = tx.objectStore(DOC_STORE);
    const docsRequest = docStore.getAll();

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        const docs = docsRequest.result || [];
        let totalBytes = 0;
        for (const d of docs) {
          if (d.arrayBuffer) {
            totalBytes += d.arrayBuffer.byteLength;
          }
        }
        resolve({ totalBytes, count: docs.length });
      };
      tx.onerror = () => resolve({ totalBytes: 0, count: 0 });
    });
  } catch {
    return { totalBytes: 0, count: 0 };
  }
}
