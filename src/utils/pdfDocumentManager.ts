import { pdfjsLib } from './pdfWorker';

// Singleton cache of docId -> Promise<PDFDocumentProxy>
const pdfDocPromiseCache = new Map<string, Promise<any>>();
// Cache of docId -> PDFDocumentProxy
const pdfDocCache = new Map<string, any>();

/**
 * Returns the cached PDFDocumentProxy for a document or parses it once.
 */
export async function getOrLoadPdfDocument(docId: string, arrayBuffer: ArrayBuffer): Promise<any> {
  if (pdfDocCache.has(docId)) {
    return pdfDocCache.get(docId);
  }

  if (pdfDocPromiseCache.has(docId)) {
    return pdfDocPromiseCache.get(docId);
  }

  const promise = (async () => {
    try {
      const bufferCopy = new Uint8Array(arrayBuffer.slice(0));
      const loadingTask = pdfjsLib.getDocument({ 
        data: bufferCopy,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
      });
      const pdf = await loadingTask.promise;
      pdfDocCache.set(docId, pdf);
      return pdf;
    } catch (err) {
      pdfDocPromiseCache.delete(docId);
      throw err;
    }
  })();

  pdfDocPromiseCache.set(docId, promise);
  return promise;
}

/**
 * Evicts document from memory when closed
 */
export function evictPdfDocument(docId: string): void {
  if (pdfDocCache.has(docId)) {
    try {
      const doc = pdfDocCache.get(docId);
      doc?.destroy();
    } catch {}
    pdfDocCache.delete(docId);
  }
  pdfDocPromiseCache.delete(docId);
}
