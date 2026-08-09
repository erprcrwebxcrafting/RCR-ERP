import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { format } from "date-fns";
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

export async function generateAttendancePdf(attendances: any[], siteName: string, startDate: string, endDate: string): Promise<Uint8Array> {
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

  function newPageIfNeeded(minSpace = 60) {
    if (y < minSpace) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

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
  page.drawText(`Period: ${startDate} to ${endDate}`, { x: textStartX, y, size: 10, font, color: darkGray });
  page.drawText(`Total Records: ${attendances.length}`, { x: PAGE_W - MARGIN - 100, y: y + 41, size: 10, font: bold, color: darkGray });
  y -= 25;

  // --- Table ---
  // Columns: Date, Building, Category, Name, Status, OT, Rate, Total, Remarks
  const cols = [
    { name: "Date", w: 60 },
    { name: "Building", w: 90 },
    { name: "Category", w: 90 },
    { name: "Labour Name", w: 120 },
    { name: "Status", w: 60 },
    { name: "OT Hrs", w: 50 },
    { name: "Rate", w: 60 },
    { name: "Total", w: 60 },
    { name: "Remarks", w: PAGE_W - 2 * MARGIN - 590 },
  ];

  let colX: number[] = [MARGIN];
  for (let i = 0; i < cols.length; i++) {
    colX.push(colX[i] + cols[i].w);
  }

  const drawRowLine = (yPos: number, thickness = 1, color = black) => {
    page.drawLine({ start: { x: MARGIN, y: yPos }, end: { x: PAGE_W - MARGIN, y: yPos }, thickness, color });
  };

  const drawVerticalLines = (yTop: number, yBottom: number) => {
    colX.forEach(x => {
      page.drawLine({ start: { x, y: yTop }, end: { x, y: yBottom }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    });
  };

  let tableTopY = y;
  
  // Header row Background
  page.drawRectangle({ x: MARGIN, y: y - 20, width: PAGE_W - 2 * MARGIN, height: 20, color: lightGray });
  drawRowLine(y, 1.5, primary);

  cols.forEach((col, i) => {
    page.drawText(col.name, { x: colX[i] + 5, y: y - 14, size: 9, font: bold, color: black });
  });

  y -= 20;
  drawRowLine(y, 1.5, primary);

  // Rows
  attendances.forEach((a, i) => {
    newPageIfNeeded(50);
    if (y === PAGE_H - MARGIN) {
        // Just added new page, draw headers again
        tableTopY = y;
        page.drawRectangle({ x: MARGIN, y: y - 20, width: PAGE_W - 2 * MARGIN, height: 20, color: lightGray });
        drawRowLine(y, 1.5, primary);
        cols.forEach((col, i) => {
            page.drawText(col.name, { x: colX[i] + 5, y: y - 14, size: 9, font: bold, color: black });
        });
        y -= 20;
        drawRowLine(y, 1.5, primary);
    }

    const remarksLines = wrapText(a.remarks || "", font, 8, cols[8].w - 10);
    const nameLines = wrapText(a.labour.name, bold, 9, cols[3].w - 10);
    const rowH = Math.max(20, (Math.max(remarksLines.length, nameLines.length) * 12) + 8);
    
    // Zebra Stripe
    if (i % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: y - rowH, width: PAGE_W - 2 * MARGIN, height: rowH, color: zebraColor });
    }
    
    // Date
    page.drawText(format(new Date(a.date), "dd MMM yyyy"), { x: colX[0] + 5, y: y - 14, size: 9, font, color: black });
    
    // Building
    page.drawText((a.building?.name || "General").substring(0, 20), { x: colX[1] + 5, y: y - 14, size: 9, font, color: black });
    
    // Category
    page.drawText((a.labour.labourCategory.name).substring(0, 18), { x: colX[2] + 5, y: y - 14, size: 9, font, color: darkGray });
    
    // Name
    nameLines.forEach((l, li) => page.drawText(l, { x: colX[3] + 5, y: y - 14 - li * 12, size: 9, font: bold, color: primary }));
    
    // Status
    let statusColor = black;
    if (a.hajari > 0) statusColor = rgb(0.1, 0.6, 0.2);
    else statusColor = rgb(0.8, 0.1, 0.1);

    page.drawText(a.hajari > 0 ? `${a.hajari} Hajari` : "Absent", { x: colX[4] + 5, y: y - 14, size: 9, font: bold, color: statusColor });
    
    // OT
    if (a.overtimeHrs > 0) {
      page.drawText(`+${a.overtimeHrs}h`, { x: colX[5] + 5, y: y - 14, size: 9, font: bold, color: primary });
    }
    
    // Rate & Total
    const appliedRate = a.hajariRate || a.labour.dailyWage || 0;
    const totalEarned = a.hajari > 0 ? a.hajari * appliedRate : 0;
    
    if (appliedRate > 0) {
      page.drawText(`Rs ${appliedRate}`, { x: colX[6] + 5, y: y - 14, size: 9, font, color: black });
    } else {
      page.drawText(`-`, { x: colX[6] + 5, y: y - 14, size: 9, font, color: darkGray });
    }

    if (totalEarned > 0) {
      page.drawText(`Rs ${totalEarned}`, { x: colX[7] + 5, y: y - 14, size: 9, font: bold, color: black });
    } else {
      page.drawText(`-`, { x: colX[7] + 5, y: y - 14, size: 9, font, color: darkGray });
    }

    // Remarks
    remarksLines.forEach((l, li) => page.drawText(l, { x: colX[8] + 5, y: y - 14 - li * 12, size: 8, font, color: darkGray }));
    
    y -= rowH;
    drawRowLine(y, 1, rgb(0.85, 0.85, 0.85));
  });
  
  drawVerticalLines(tableTopY, y);

  return pdfDoc.save();
}
