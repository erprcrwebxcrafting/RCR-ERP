import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import fs from "fs";
import path from "path";

export type QuotationItem = { description: string; unit: string; rate: number; remarks?: string };

export type QuotationData = {
  companyName: string;
  companyGst: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  projectAddress: string;
  subject: string;
  date: string;
  items: QuotationItem[];
  terms: string[];
  exclusions: string[];
  logoUrl?: string;
  signUrl?: string;
  quotationNo?: string;
};

const MARGIN = 40;
const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height

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

export async function generateQuotationPdf(data: QuotationData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const teal = rgb(0.15, 0.6, 0.75);
  const black = rgb(0.1, 0.1, 0.1);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const lightGray = rgb(0.92, 0.94, 0.96);
  const zebraColor = rgb(0.97, 0.98, 0.99);

  let logoImage = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    }
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  function newPageIfNeeded(minSpace = 60) {
    if (y < minSpace) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  // --- Header ---
  if (logoImage) {
    const dims = logoImage.scale(0.25);
    page.drawImage(logoImage, { x: MARGIN, y: PAGE_H - 95, width: 90, height: 90 * (dims.height/dims.width) });
  }

  page.drawText(data.companyName, { x: MARGIN + 110, y: PAGE_H - 55, size: 26, font: bold, color: teal });
  
  page.drawText(`GST NO. ${data.companyGst}    |    Email: ${data.companyEmail}    |    Mob: ${data.companyPhone}`, {
    x: MARGIN + 110, y: PAGE_H - 75, size: 9, font, color: darkGray
  });

  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 105 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - 105 },
    thickness: 2,
    color: teal,
  });

  y = PAGE_H - 130;

  // --- To Details ---
  page.drawText("To,", { x: MARGIN, y, size: 10, font: bold, color: black });
  
  const dateStr = `Date : ${data.date}`;
  const dateW = bold.widthOfTextAtSize(dateStr, 10);
  page.drawText(dateStr, { x: PAGE_W - MARGIN - dateW, y, size: 10, font: bold, color: darkGray });

  y -= 16;
  page.drawText(data.clientName, { x: MARGIN, y, size: 12, font: bold, color: teal });
  y -= 16;
  for (const line of wrapText(`Add Project :- ${data.projectAddress}`, font, 10, PAGE_W - 2 * MARGIN)) {
    page.drawText(line, { x: MARGIN, y, size: 10, font: bold, color: darkGray });
    y -= 14;
  }
  y -= 10;

  // Premium Subject Block
  page.drawRectangle({
    x: MARGIN, y: y - 22, width: PAGE_W - 2 * MARGIN, height: 26, color: lightGray
  });
  page.drawText(`Subject : `, { x: MARGIN + 10, y: y - 14, size: 11, font: bold, color: teal });
  const subjWidth = bold.widthOfTextAtSize(`Subject : `, 11);
  page.drawText(data.subject, { x: MARGIN + 12 + subjWidth, y: y - 14, size: 11, font: bold, color: black });
  y -= 45;

  page.drawText("Dear Sir,", { x: MARGIN, y, size: 10, font: bold, color: black });
  y -= 18;
  page.drawText("We are pleased to submit our quotation for the reinforcement work on labour basis as per the rates below:", { x: MARGIN, y, size: 10, font: italic, color: darkGray });
  y -= 25;

  // --- Table ---
  const colX = [MARGIN, MARGIN + 40, MARGIN + 290, MARGIN + 350, MARGIN + 420, PAGE_W - MARGIN];
  const tableW = PAGE_W - 2 * MARGIN;

  const drawRowLine = (yPos: number, thickness = 1, color = black) => {
    page.drawLine({ start: { x: MARGIN, y: yPos }, end: { x: PAGE_W - MARGIN, y: yPos }, thickness, color });
  };

  const drawVerticalLines = (yTop: number, yBottom: number) => {
    colX.forEach(x => {
      page.drawLine({ start: { x, y: yTop }, end: { x, y: yBottom }, thickness: 1, color: rgb(0.8, 0.85, 0.9) });
    });
  };

  const tableTopY = y;
  
  // Header row Background
  page.drawRectangle({
    x: MARGIN, y: y - 24, width: tableW, height: 24, color: lightGray
  });

  drawRowLine(y, 1.5, teal);
  page.drawText("Sr. No.", { x: colX[0] + 5, y: y - 16, size: 10, font: bold, color: black });
  page.drawText("Description", { x: colX[1] + 10, y: y - 16, size: 10, font: bold, color: black });
  
  const hUnitW = bold.widthOfTextAtSize("Unit", 10);
  page.drawText("Unit", { x: colX[2] + (colX[3]-colX[2])/2 - hUnitW/2, y: y - 16, size: 10, font: bold, color: black });
  
  const hRateW = bold.widthOfTextAtSize("Rate (Rs)", 10);
  page.drawText("Rate (Rs)", { x: colX[4] - 10 - hRateW, y: y - 16, size: 10, font: bold, color: black });
  
  page.drawText("Remarks", { x: colX[4] + 10, y: y - 16, size: 10, font: bold, color: black });
  y -= 24;
  drawRowLine(y, 1.5, teal);

  // Rows
  data.items.forEach((item, i) => {
    newPageIfNeeded(80);
    const lines = wrapText(item.description, bold, 9.5, colX[2] - colX[1] - 15);
    const rowH = Math.max(26, lines.length * 14 + 10);
    
    // Zebra Stripe
    if (i % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: y - rowH, width: tableW, height: rowH, color: zebraColor });
    }
    
    // Number
    page.drawText(String(i + 1), { x: colX[0] + 15, y: y - 17, size: 9.5, font: bold, color: teal });
    
    // Description
    lines.forEach((l, li) => page.drawText(l, { x: colX[1] + 10, y: y - 17 - li * 14, size: 9.5, font: bold, color: black }));
    
    // Unit (Centered)
    const unitW = font.widthOfTextAtSize(item.unit, 9.5);
    page.drawText(item.unit, { x: colX[2] + (colX[3]-colX[2])/2 - unitW/2, y: y - 17, size: 9.5, font, color: darkGray });
    
    // Rate (Right-aligned)
    const rateStr = item.rate.toFixed(2);
    const rateW = bold.widthOfTextAtSize(rateStr, 9.5);
    page.drawText(rateStr, { x: colX[4] - 10 - rateW, y: y - 17, size: 9.5, font: bold, color: teal });
    
    // Remarks
    page.drawText(item.remarks || "", { x: colX[4] + 10, y: y - 17, size: 9, font: italic, color: darkGray });
    
    y -= rowH;
    drawRowLine(y, 1, rgb(0.8, 0.85, 0.9));
  });
  
  drawVerticalLines(tableTopY, y);
  y -= 30;

  // --- Terms & Conditions ---
  const printTextList = (title: string, list: string[]) => {
    if (!list || list.length === 0) return;
    
    newPageIfNeeded(60);
    page.drawText(title, { x: MARGIN, y, size: 11, font: bold, color: teal });
    y -= 16;
    
    list.forEach((t) => {
      newPageIfNeeded(40);
      
      let xOffset = MARGIN;
      let isHeader = false;
      let isBullet = false;
      let prefix = "";
      let indentSpace = 0;
      let textToPrint = t.trim();

      if (textToPrint === "---" || textToPrint === "[PAGE BREAK]") {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
        return;
      }

      const numMatch = textToPrint.match(/^((?:\d+|[ivx]+)[\)\.])\s*/i);

      if (textToPrint.startsWith("**") && textToPrint.endsWith("**")) {
        isHeader = true;
        textToPrint = textToPrint.replace(/\*\*/g, "");
      } else if (textToPrint.startsWith("- ")) {
        isBullet = true;
        prefix = "•";
        indentSpace = 10;
        xOffset = MARGIN + 10;
        textToPrint = textToPrint.substring(2);
      } else if (numMatch) {
        isBullet = true;
        prefix = numMatch[1];
        indentSpace = 18;
        xOffset = MARGIN + 10;
        textToPrint = textToPrint.substring(numMatch[0].length);
      } else if (textToPrint !== "") {
        indentSpace = 0;
        xOffset = MARGIN + 28; // Indent continuation lines
      }

      if (textToPrint === "") {
        y -= 6;
        return;
      }

      if (isHeader) {
        y -= 8; // Extra space above headers
      }

      const lines = wrapText(textToPrint, isHeader ? bold : font, 9.5, PAGE_W - MARGIN - xOffset - indentSpace);
      lines.forEach((l, li) => { 
        if (isBullet && li === 0) {
          page.drawText(prefix, { x: xOffset, y, size: 9.5, font: bold, color: teal });
          page.drawText(l, { x: xOffset + indentSpace, y, size: 9.5, font: isHeader ? bold : font, color: black }); 
        } else {
          page.drawText(l, { x: xOffset + indentSpace, y, size: 9.5, font: isHeader ? bold : font, color: isHeader ? teal : black }); 
        }
        y -= 14; 
      });
      if (isHeader) y -= 4; // Space below header
    });
    y -= 10;
  };

  printTextList("Terms & Conditions :", data.terms);
  printTextList("Exclusions :", data.exclusions);

  // --- Signatures ---
  newPageIfNeeded(150);
  y -= 40;
  
  page.drawText(data.companyName.toUpperCase(), { x: MARGIN, y, size: 11, font: bold, color: black });
  
  const clientTextWidth = bold.widthOfTextAtSize(data.clientName.toUpperCase(), 11);
  page.drawText(data.clientName.toUpperCase(), { x: PAGE_W - MARGIN - clientTextWidth, y, size: 11, font: bold, color: black });
  
  try {
    const signPath = path.join(process.cwd(), "public", "sign&logo.png");
    if (fs.existsSync(signPath)) {
      const signBytes = fs.readFileSync(signPath);
      const signImg = await pdfDoc.embedPng(signBytes);
      const signDims = signImg.scale(0.25); // Scale down a bit more to fit perfectly
      page.drawImage(signImg, {
        x: MARGIN - 5,
        y: y - signDims.height - 5,
        width: signDims.width,
        height: signDims.height,
      });
    }
  } catch (err) {
    console.error("Could not load sign&logo.png", err);
  }

  y -= 110;
  page.drawText("Signature", { x: MARGIN, y, size: 11, font: bold, color: black });
  const authTextWidth = bold.widthOfTextAtSize("Signature", 11);
  page.drawText("Signature", { x: PAGE_W - MARGIN - authTextWidth, y, size: 11, font: bold, color: black });

  // --- Stamp on previous pages ---
  const allPages = pdfDoc.getPages();
  const totalPages = allPages.length;
  if (totalPages > 1) {
    try {
      const signPath = path.join(process.cwd(), "public", "sign&logo.png");
      if (fs.existsSync(signPath)) {
        const signBytes = fs.readFileSync(signPath);
        const signImg = await pdfDoc.embedPng(signBytes);
        const signDims = signImg.scale(0.20); // slightly smaller for page footers
        for (let i = 0; i < totalPages - 1; i++) {
          const p = allPages[i];
          p.drawImage(signImg, {
            x: PAGE_W / 2 - signDims.width / 2, // Center the stamp
            y: MARGIN,
            width: signDims.width,
            height: signDims.height,
          });
        }
      }
    } catch (err) {
      console.error("Could not load sign&logo.png for page footers", err);
    }
  }

  // --- Page Borders & Footer ---
  const BORDER_MARGIN = 15;
  const addressText = "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305";
  const addressW = font.widthOfTextAtSize(addressText, 10);

  for (const p of allPages) {
    p.drawRectangle({
      x: BORDER_MARGIN,
      y: BORDER_MARGIN,
      width: PAGE_W - 2 * BORDER_MARGIN,
      height: PAGE_H - 2 * BORDER_MARGIN,
      borderWidth: 2,
      borderColor: teal,
    });

    p.drawLine({
      start: { x: BORDER_MARGIN, y: BORDER_MARGIN + 22 },
      end: { x: PAGE_W - BORDER_MARGIN, y: BORDER_MARGIN + 22 },
      thickness: 1,
      color: teal,
    });

    p.drawText(addressText, {
      x: PAGE_W / 2 - addressW / 2,
      y: BORDER_MARGIN + 7,
      size: 10,
      font: font,
      color: teal,
    });
  }

  return pdfDoc.save();
}
