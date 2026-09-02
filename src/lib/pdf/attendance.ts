import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { format, addDays } from "date-fns";
import fs from "fs";
import path from "path";

const MARGIN = 30;
const PAGE_W = 841.89; // A4 landscape width
const PAGE_H = 595.28; // A4 landscape height

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateAttendancePdf(attendances: any[], siteName: string, startDateStr: string, endDateStr: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const primary = rgb(0.1, 0.4, 0.8);
  const black = rgb(0.1, 0.1, 0.1);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const lightGray = rgb(0.9, 0.9, 0.92);
  const zebraColor = rgb(0.97, 0.97, 0.97);
  const green = rgb(0.1, 0.6, 0.2);
  const red = rgb(0.8, 0.1, 0.1);

  function newPageIfNeeded(minSpace = 60) {
    if (y < minSpace) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      return true;
    }
    return false;
  }

  // Generate Date Range
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const dates: Date[] = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  // Map to group attendances by labour
  const labourMap = new Map<string, any>();
  attendances.forEach(a => {
    if (!labourMap.has(a.labourId)) {
      labourMap.set(a.labourId, {
        id: a.labourId,
        name: a.labour.name,
        category: a.labour.labourCategory.name,
        dailyWage: a.hajariRate || a.labour.dailyWage || 0,
        attendanceByDate: {},
        totalHajari: 0,
        totalOT: 0,
        totalEarned: 0,
      });
    }

    const worker = labourMap.get(a.labourId);
    const dateKey = format(new Date(a.date), "yyyy-MM-dd");
    
    worker.attendanceByDate[dateKey] = {
      hajari: a.hajari,
      ot: a.overtimeHrs,
      remarks: a.remarks
    };

    worker.totalHajari += a.hajari || 0;
    worker.totalOT += a.overtimeHrs || 0;
    worker.totalEarned += (a.hajari > 0 ? a.hajari * worker.dailyWage : 0);
  });

  const sortedWorkers = Array.from(labourMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    const logo = await pdfDoc.embedPng(logoBytes);
    const logoDims = logo.scale(0.12);
    page.drawImage(logo, {
      x: MARGIN,
      y: y - logoDims.height + 15,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (err) {}

  const textStartX = MARGIN + 120; // Shifted right for logo

  page.drawText(`RCR Enterprises`, { x: textStartX, y, size: 24, font: bold, color: rgb(0.04, 0.14, 0.28) });
  y -= 25;
  page.drawText(`Attendance Report - ${siteName}`, { x: textStartX, y, size: 14, font: bold, color: primary });
  y -= 16;
  page.drawText(`Period: ${format(start, "dd MMM yyyy")} to ${format(end, "dd MMM yyyy")}`, { x: textStartX, y, size: 10, font, color: darkGray });
  page.drawText(`Total Workers: ${sortedWorkers.length}`, { x: PAGE_W - MARGIN - 100, y: y + 41, size: 10, font: bold, color: darkGray });
  y -= 25;

  // --- Table Configuration ---
  const usableWidth = PAGE_W - (2 * MARGIN);
  
  // Calculate column widths
  const nameWidth = 90;
  const categoryWidth = 60;
  const rateWidth = 40;
  const hajariWidth = 45;
  const earnedWidth = 55;
  
  const fixedWidths = nameWidth + categoryWidth + rateWidth + hajariWidth + earnedWidth;
  const remainingWidth = usableWidth - fixedWidths;
  
  // Dynamic day width depending on how many days we have, but cap it so it looks nice
  const maxDayWidth = dates.length > 0 ? Math.floor(remainingWidth / dates.length) : 0;
  const dayColWidth = Math.min(25, maxDayWidth); // Don't make them too wide

  const cols = [
    { name: "Name", w: nameWidth },
    { name: "Type", w: categoryWidth },
    { name: "Rate", w: rateWidth },
  ];
  
  dates.forEach(d => {
    cols.push({ name: format(d, "dd"), w: dayColWidth });
  });

  cols.push({ name: "T.Hajari", w: hajariWidth });
  cols.push({ name: "T.Earned", w: earnedWidth });

  let colX: number[] = [MARGIN];
  for (let i = 0; i < cols.length; i++) {
    colX.push(colX[i] + cols[i].w);
  }

  const drawRowLine = (yPos: number, thickness = 1, color = black) => {
    page.drawLine({ start: { x: MARGIN, y: yPos }, end: { x: colX[colX.length - 1], y: yPos }, thickness, color });
  };

  const drawVerticalLines = (yTop: number, yBottom: number) => {
    colX.forEach(x => {
      page.drawLine({ start: { x, y: yTop }, end: { x, y: yBottom }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    });
  };

  let tableTopY = y;
  
  const drawHeaders = (currentY: number) => {
    // Header row Background
    page.drawRectangle({ x: MARGIN, y: currentY - 24, width: colX[colX.length - 1] - MARGIN, height: 24, color: lightGray });
    drawRowLine(currentY, 1.5, primary);
    
    // Draw Day names above dates
    dates.forEach((d, i) => {
      const idx = i + 3; // Offset for Name, Type, Rate
      page.drawText(format(d, "E").charAt(0), { x: colX[idx] + 2, y: currentY - 10, size: 6, font, color: darkGray });
    });

    // Draw Column Headers
    cols.forEach((col, i) => {
      const yOffset = (i >= 3 && i < 3 + dates.length) ? currentY - 20 : currentY - 15;
      const fontSize = (i >= 3 && i < 3 + dates.length) ? 7 : 8;
      page.drawText(col.name, { x: colX[i] + 3, y: yOffset, size: fontSize, font: bold, color: black });
    });

    const nextY = currentY - 24;
    drawRowLine(nextY, 1.5, primary);
    return nextY;
  };

  y = drawHeaders(y);

  // Rows
  sortedWorkers.forEach((worker, i) => {
    const isNewPage = newPageIfNeeded(50);
    if (isNewPage) {
        tableTopY = y;
        y = drawHeaders(y);
    }

    const nameLines = wrapText(worker.name, bold, 8, cols[0].w - 6);
    const rowH = Math.max(16, (nameLines.length * 10) + 6);
    
    // Zebra Stripe
    if (i % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: y - rowH, width: colX[colX.length - 1] - MARGIN, height: rowH, color: zebraColor });
    }
    
    // Name
    nameLines.forEach((l, li) => page.drawText(l, { x: colX[0] + 3, y: y - 10 - li * 10, size: 8, font: bold, color: primary }));
    
    // Type (Category)
    page.drawText(worker.category.substring(0, 15), { x: colX[1] + 3, y: y - 11, size: 7, font, color: darkGray });

    // Rate
    page.drawText(`Rs ${worker.dailyWage}`, { x: colX[2] + 3, y: y - 11, size: 7, font, color: black });
    
    // Day Columns
    dates.forEach((d, di) => {
      const dateKey = format(d, "yyyy-MM-dd");
      const record = worker.attendanceByDate[dateKey];
      const colIdx = di + 3;
      
      let text = "-";
      let color = darkGray;
      let textFont = font;

      if (record) {
        if (record.hajari > 0) {
          text = record.hajari.toString();
          color = green;
          textFont = bold;
        } else {
          text = "A";
          color = red;
          textFont = bold;
        }
      }

      page.drawText(text, { x: colX[colIdx] + 3, y: y - 11, size: 7, font: textFont, color });
    });
    
    // Total Hajari
    page.drawText(worker.totalHajari.toString(), { x: colX[3 + dates.length] + 3, y: y - 11, size: 8, font: bold, color: black });
    
    // Total Earned
    page.drawText(`Rs ${worker.totalEarned}`, { x: colX[4 + dates.length] + 3, y: y - 11, size: 8, font: bold, color: black });
    
    y -= rowH;
    drawRowLine(y, 0.5, rgb(0.85, 0.85, 0.85));
  });
  
  drawVerticalLines(tableTopY, y);

  return pdfDoc.save();
}

