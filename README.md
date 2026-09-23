# 🚀 Ultimate PDF Studio

> A high-performance, client-side local PDF workstation and annotation suite built with React 19, TypeScript, Tailwind CSS, PDF.js, and PDF-Lib.

![Ultimate PDF Studio](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80)

---

## ✨ Features

- 📑 **Multi-Document Tabs Workspace**: Open multiple PDFs simultaneously with independent state (zoom, rotation, stamps, annotations, filters).
- 🏷️ **Page Stamp & Jump Marker System**: 10+ preset stamps (`APPROVED`, `REVIEWED`, `CONFIDENTIAL`, `IMPORTANT`, `FINAL`, `PAID`, `URGENT`, etc.) + customizable stamps. Dedicated sidebar list with **1-click jump** to stamped pages.
- 🎨 **120 FPS Annotation Studio**:
  - Freehand Pen (custom stroke width & colors)
  - Highlighter (semi-transparent multiply blend)
  - Shapes (Rectangle, Circle, Line, Arrow) with live preview
  - Text notes & sticky annotations
  - Eraser with full Undo/Redo (`Ctrl+Z`, `Ctrl+Y`)
- 👁️ **Eye-Care & Visual Display Controls**:
  - Real-time Brightness & Contrast sliders (50% – 200%)
  - Dark Mode / Color Inversion (for night reading)
  - Warm Sepia filter (blue light reduction)
  - Monochrome / E-Ink grayscale mode
- 💾 **IndexedDB Local Auto-Save**: All open documents, annotations, stamps, and bookmarks are automatically saved to the browser's local database and restored upon reopening.
- ⚡ **Zero-Latency Performance**: Virtualized continuous scrolling, lazy-loaded sidebar thumbnails (`IntersectionObserver`), and hardware-accelerated rendering.
- 🔍 **In-PDF Text Search & Selection**: Copyable text layer and real-time keyword search with match jumping.
- 📤 **Flattened PDF Export**: Burn all drawings and stamps directly into standard downloadable PDFs using `pdf-lib`.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **PDF Engine**: [Mozilla PDF.js](https://mozilla.github.io/pdf.js/)
- **PDF Modification & Export**: [pdf-lib](https://pdf-lib.js.org/)
- **Storage**: Browser IndexedDB API
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn / pnpm

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Kunal18sm/Ultimate-PDF-viewer.git

# 2. Navigate to project folder
cd Ultimate-PDF-viewer

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `V` / `S` | Select text tool |
| `H` | Hand / Pan tool |
| `P` | Freehand Pen tool |
| `U` | Highlighter tool |
| `R` | Rectangle shape tool |
| `O` | Circle shape tool |
| `A` | Arrow tool |
| `T` | Text note tool |
| `E` | Eraser tool |
| `L` | Laser pointer presentation tool |
| `M` | Add Page Stamp modal |
| `F` | Display & Brightness filters |
| `Ctrl + F` | Find in document |
| `Ctrl + Z` | Undo annotation |
| `Ctrl + Y` | Redo annotation |
| `Ctrl + + / -` | Zoom In / Zoom Out |
| `Ctrl + 0` | Reset zoom (100%) |
| `Left / Right` | Previous / Next page |

---

## 🔒 Privacy & Security

Ultimate PDF Studio is 100% client-side. No files or annotations are ever uploaded to any external server. All PDF processing and database storage happen locally in your browser.

---

## 📄 License

MIT License. Feel free to use and modify!
