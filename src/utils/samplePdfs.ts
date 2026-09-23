import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates a sample multi-page PDF dynamically using pdf-lib
 * This allows instant testing without requiring local files.
 */
export async function createSamplePdf(title: string, themeColor: 'blue' | 'purple' | 'emerald' = 'blue'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    blue: { r: 0.15, g: 0.38, b: 0.92 },
    purple: { r: 0.58, g: 0.2, b: 0.88 },
    emerald: { r: 0.05, g: 0.6, b: 0.4 }
  };
  const c = colors[themeColor];

  // --- PAGE 1: Cover & Intro ---
  const page1 = pdfDoc.addPage([600, 800]);
  const { width, height } = page1.getSize();

  // Top header banner
  page1.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(c.r, c.g, c.b),
  });

  page1.drawText(title.toUpperCase(), {
    x: 40,
    y: height - 65,
    size: 26,
    font: timesBoldFont,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Interactive Local PDF Suite & Annotation System', {
    x: 40,
    y: height - 95,
    size: 13,
    font: timesRomanFont,
    color: rgb(0.9, 0.95, 1),
  });

  // Welcome section
  page1.drawText('Welcome to Ultimate PDF Studio!', {
    x: 40,
    y: height - 170,
    size: 18,
    font: timesBoldFont,
    color: rgb(0.1, 0.15, 0.25),
  });

  const bodyLines = [
    'This is an all-in-one local PDF workstation built with advanced rendering,',
    'live shape annotation, customizable page stamps, brightness filters, and',
    'multi-tab document management.',
    '',
    'Explore the powerful built-in features:',
    '• Multi-Document Tabs: Upload multiple PDFs and switch easily between them.',
    '• Visual Page Stamps: Apply APPROVED, CONFIDENTIAL, REVIEWED & custom stamps.',
    '• Quick Stamp Jump Navigator: 1-click jump from the sidebar to any stamped page.',
    '• Rich Drawing & Shape Studio: Pen, Highlighter, Rectangles, Circles, Arrows, & Text.',
    '• Eye-Care & Visual Controls: Brightness, Contrast, Dark Invert Mode, & Sepia.',
    '• Search & Text Copying: Fast in-document keyword search with match jumping.',
    '• Exporting: Burn all annotations and stamps directly into standard PDF files.'
  ];

  let currentY = height - 210;
  for (const line of bodyLines) {
    page1.drawText(line, {
      x: 40,
      y: currentY,
      size: 12,
      font: line.startsWith('•') || line.startsWith('Explore') ? timesBoldFont : timesRomanFont,
      color: line.startsWith('•') ? rgb(c.r, c.g, c.b) : rgb(0.2, 0.25, 0.35),
    });
    currentY -= 22;
  }

  // Feature highlight card
  page1.drawRectangle({
    x: 40,
    y: 120,
    width: width - 80,
    height: 140,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(c.r, c.g, c.b),
    borderWidth: 1.5,
  });

  page1.drawText('Try Drawing & Stamping on this Page!', {
    x: 60,
    y: 225,
    size: 14,
    font: timesBoldFont,
    color: rgb(c.r, c.g, c.b),
  });

  page1.drawText('Use the toolbar above to select a Pen, Arrow, Rectangle or Stamp.', {
    x: 60,
    y: 195,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.3, 0.35, 0.45),
  });

  page1.drawText('Click on "Add Stamp" in the top bar to test the Stamp Navigator sidebar.', {
    x: 60,
    y: 170,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.3, 0.35, 0.45),
  });

  page1.drawText('Page 1 of 3 - Ultimate PDF Studio Demo Document', {
    x: 40,
    y: 40,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.6, 0.65, 0.75),
  });

  // --- PAGE 2: Technical Specifications & Diagrams ---
  const page2 = pdfDoc.addPage([600, 800]);
  
  page2.drawText('Chapter 2: Technical Architecture & Features', {
    x: 40,
    y: height - 60,
    size: 18,
    font: timesBoldFont,
    color: rgb(0.1, 0.15, 0.25),
  });

  page2.drawLine({
    start: { x: 40, y: height - 75 },
    end: { x: width - 40, y: height - 75 },
    thickness: 2,
    color: rgb(c.r, c.g, c.b),
  });

  page2.drawText('Key System Modules:', {
    x: 40,
    y: height - 110,
    size: 14,
    font: timesBoldFont,
    color: rgb(0.2, 0.25, 0.35),
  });

  const specs = [
    ['1. PDF.js Rendering Engine', 'Hardware-accelerated canvas rendering with crisp font vectorization.'],
    ['2. Annotation Coordinate Sync', 'Relative percentage coordinate normalization for responsive resize.'],
    ['3. Dynamic Stamp Indexer', 'Bi-directional index linking stamps to sidebar list for zero-latency jumping.'],
    ['4. Visual Shader Filters', 'Hardware CSS matrix pipeline for brightness, contrast, invert & sepia modes.'],
    ['5. PDF-lib Flattening Pipeline', 'Vector-based canvas rasterization embedded into native PDF streams.']
  ];

  let specY = height - 145;
  for (const [titleItem, desc] of specs) {
    page2.drawRectangle({
      x: 40,
      y: specY - 20,
      width: width - 80,
      height: 48,
      color: rgb(0.97, 0.98, 1.0),
      borderColor: rgb(0.85, 0.9, 0.98),
      borderWidth: 1,
    });

    page2.drawText(titleItem, {
      x: 55,
      y: specY + 10,
      size: 12,
      font: timesBoldFont,
      color: rgb(c.r, c.g, c.b),
    });

    page2.drawText(desc, {
      x: 55,
      y: specY - 8,
      size: 10,
      font: timesRomanFont,
      color: rgb(0.3, 0.35, 0.45),
    });

    specY -= 60;
  }

  // Sample Box for testing drawing
  page2.drawRectangle({
    x: 40,
    y: 80,
    width: width - 80,
    height: 180,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.75, 0.85),
    borderWidth: 1,
  });

  page2.drawText('Signature & Review Box', {
    x: 60,
    y: 235,
    size: 13,
    font: timesBoldFont,
    color: rgb(0.2, 0.25, 0.35),
  });

  page2.drawText('Try stamping "REVIEWED" or "APPROVED" here and signing with the Pen tool.', {
    x: 60,
    y: 215,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.5, 0.55, 0.65),
  });

  page2.drawLine({
    start: { x: 60, y: 120 },
    end: { x: 300, y: 120 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  page2.drawText('Sign above this line', {
    x: 60,
    y: 100,
    size: 9,
    font: timesRomanFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  page2.drawText('Page 2 of 3 - Ultimate PDF Studio Demo Document', {
    x: 40,
    y: 40,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.6, 0.65, 0.75),
  });

  // --- PAGE 3: Final Audit & Stamp Checklist ---
  const page3 = pdfDoc.addPage([600, 800]);

  page3.drawText('Chapter 3: Verification & Stamp Checklist', {
    x: 40,
    y: height - 60,
    size: 18,
    font: timesBoldFont,
    color: rgb(0.1, 0.15, 0.25),
  });

  page3.drawLine({
    start: { x: 40, y: height - 75 },
    end: { x: width - 40, y: height - 75 },
    thickness: 2,
    color: rgb(c.r, c.g, c.b),
  });

  page3.drawText('Stamp Navigation Demonstration:', {
    x: 40,
    y: height - 110,
    size: 13,
    font: timesBoldFont,
    color: rgb(0.2, 0.25, 0.35),
  });

  page3.drawText('1. Click the "Add Stamp" button in the top navigation or press Stamp icon.', {
    x: 40,
    y: height - 135,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.3, 0.35, 0.45),
  });
  page3.drawText('2. Choose "FINAL" or "CONFIDENTIAL" and add an optional note.', {
    x: 40,
    y: height - 155,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.3, 0.35, 0.45),
  });
  page3.drawText('3. Open the sidebar (Left panel -> Stamps tab).', {
    x: 40,
    y: height - 175,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.3, 0.35, 0.45),
  });
  page3.drawText('4. Now switch to Page 1, and click on the stamp in the sidebar. Notice how it', {
    x: 40,
    y: height - 195,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.3, 0.35, 0.45),
  });
  page3.drawText('   instantly jumps you back directly to Page 3!', {
    x: 40,
    y: height - 215,
    size: 11,
    font: timesBoldFont,
    color: rgb(c.r, c.g, c.b),
  });

  // Table of features
  page3.drawRectangle({
    x: 40,
    y: 200,
    width: width - 80,
    height: 250,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.8, 0.85, 0.95),
    borderWidth: 1,
  });

  page3.drawText('Supported PDF Operations Summary', {
    x: 60,
    y: 420,
    size: 13,
    font: timesBoldFont,
    color: rgb(0.15, 0.2, 0.3),
  });

  const tableRows = [
    ['Feature', 'Status', 'Description'],
    ['Single / Continuous View', 'Available', 'Seamless vertical scroll or single page focus'],
    ['Drawing & Shapes', 'Available', 'Pen, Highlighter, Rect, Circle, Arrow, Line'],
    ['Stamps & Jump Navigator', 'Available', '10+ presets + custom text & sidebar jump'],
    ['Brightness & Contrast', 'Available', 'Real-time 50%-200% slider controls'],
    ['Dark Mode & Eye Care', 'Available', 'Negative inversion & Sepia warm filters'],
    ['Multi-Document Tabs', 'Available', 'Work on multiple PDFs simultaneously'],
    ['PDF-lib Direct Export', 'Available', 'Download with all annotations burned in']
  ];

  let rowY = 390;
  for (let i = 0; i < tableRows.length; i++) {
    const [col1, col2, col3] = tableRows[i];
    const isHeader = i === 0;
    
    if (isHeader) {
      page3.drawRectangle({
        x: 45,
        y: rowY - 5,
        width: width - 90,
        height: 22,
        color: rgb(0.9, 0.93, 0.98),
      });
    }

    page3.drawText(col1, {
      x: 55,
      y: rowY,
      size: 10,
      font: isHeader ? timesBoldFont : timesRomanFont,
      color: isHeader ? rgb(0.1, 0.1, 0.2) : rgb(0.2, 0.25, 0.35),
    });

    page3.drawText(col2, {
      x: 230,
      y: rowY,
      size: 10,
      font: isHeader ? timesBoldFont : timesRomanFont,
      color: isHeader ? rgb(0.1, 0.1, 0.2) : rgb(0.05, 0.6, 0.3),
    });

    page3.drawText(col3, {
      x: 310,
      y: rowY,
      size: 9,
      font: isHeader ? timesBoldFont : timesRomanFont,
      color: isHeader ? rgb(0.1, 0.1, 0.2) : rgb(0.35, 0.4, 0.5),
    });

    rowY -= 24;
  }

  page3.drawText('Page 3 of 3 - Ultimate PDF Studio Demo Document', {
    x: 40,
    y: 40,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.6, 0.65, 0.75),
  });

  return await pdfDoc.save();
}
