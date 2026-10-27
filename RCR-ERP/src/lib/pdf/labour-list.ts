import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { format } from "date-fns";
import fs from "fs";
import path from "path";

const MARGIN = 25;
const PAGE_W = 841.89; // A4 landscape width
const PAGE_H = 595.28; // A4 landscape height

export interface LabourListExportData {
  siteName: string;
  supervisors: string[];
  labours: any[];
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [];
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

export async function generateLabourListPdf(data: LabourListExportData): Promise<Uint8Array> {
  const { siteName, supervisors, labours } = data;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.04, 0.14, 0.28);
  const primary = rgb(0.12, 0.35, 0.72);
  const darkGray = rgb(0.25, 0.25, 0.25);
  const mutedGray = rgb(0.55, 0.55, 0.55);
  const lightGray = rgb(0.94, 0.95, 0.97);
  const zebraColor = rgb(0.98, 0.98, 0.995);
  const green = rgb(0.05, 0.55, 0.25);
  const red = rgb(0.85, 0.15, 0.15);
  const borderColor = rgb(0.82, 0.85, 0.9);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const usableWidth = PAGE_W - (2 * MARGIN);

  // Logo Embed
  let logoDrawn = false;
  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdfDoc.embedPng(logoBytes);
      const logoDims = logo.scale(0.12);
      page.drawImage(logo, {
        x: MARGIN,
        y: y - logoDims.height + 12,
        width: logoDims.width,
        height: logoDims.height,
      });
      logoDrawn = true;
    }
  } catch (err) {}

  const textStartX = logoDrawn ? MARGIN + 110 : MARGIN;

  // Header Title
  page.drawText("RCR Enterprises", { x: textStartX, y: y - 2, size: 20, font: bold, color: navy });
  page.drawText(`Labour Master List — ${siteName}`, { x: textStartX, y: y - 18, size: 12, font: bold, color: primary });
  
  const supText = supervisors.length > 0 ? supervisors.join(", ") : "None assigned";
  page.drawText(`Supervisors: ${supText}  |  Generated: ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`, {
    x: textStartX,
    y: y - 31,
    size: 8.5,
    font,
    color: darkGray
  });

  // KPI Summary Cards (4 Cards)
  const totalLabours = labours.length;
  const activeLabours = labours.filter(l => l.active).length;
  const inactiveLabours = totalLabours - activeLabours;
  const categoriesSet = new Set(labours.map(l => l.labourCategory?.name || "General"));

  const kpis = [
    { label: "TOTAL LABOURS", val: `${totalLabours}`, color: navy },
    { label: "ACTIVE WORKERS", val: `${activeLabours}`, color: green },
    { label: "INACTIVE WORKERS", val: `${inactiveLabours}`, color: inactiveLabours > 0 ? red : mutedGray },
    { label: "TRADES / CATEGORIES", val: `${categoriesSet.size}`, color: primary },
  ];

  const kpiBoxY = y - 68;
  const kpiBoxH = 26;
  const kpiGap = 10;
  const kpiBoxW = (usableWidth - (kpiGap * (kpis.length - 1))) / kpis.length;

  kpis.forEach((kpi, idx) => {
    const boxX = MARGIN + idx * (kpiBoxW + kpiGap);
    page.drawRectangle({
      x: boxX,
      y: kpiBoxY,
      width: kpiBoxW,
      height: kpiBoxH,
      color: lightGray,
      borderColor,
      borderWidth: 0.5
    });

    page.drawText(kpi.label, {
      x: boxX + 8,
      y: kpiBoxY + 16,
      size: 6.5,
      font: bold,
      color: darkGray
    });

    page.drawText(kpi.val, {
      x: boxX + 8,
      y: kpiBoxY + 5,
      size: 10,
      font: bold,
      color: kpi.color
    });
  });

  y = kpiBoxY - 14;

  // Table Columns Definition
  // Usable width: 791.89
  const cols = [
    { name: "#", w: 28, align: "center" },
    { name: "Labour Name", w: 145, align: "left" },
    { name: "Category / Trade", w: 90, align: "left" },
    { name: "Daily Wage", w: 72, align: "center" },
    { name: "Mobile No.", w: 80, align: "center" },
    { name: "Aadhar No.", w: 95, align: "center" },
    { name: "Bank & A/C Details", w: 135, align: "left" },
    { name: "Joined Date", w: 76, align: "center" },
    { name: "Status", w: 70, align: "center" },
  ];

  const colX: number[] = [MARGIN];
  for (let i = 0; i < cols.length; i++) {
    colX.push(colX[i] + cols[i].w);
  }
  const tableRightX = colX[colX.length - 1];

  const drawRowLine = (yPos: number, thickness = 0.5, color = borderColor) => {
    page.drawLine({ start: { x: MARGIN, y: yPos }, end: { x: tableRightX, y: yPos }, thickness, color });
  };

  const drawVerticalLines = (yTop: number, yBottom: number) => {
    colX.forEach(x => {
      page.drawLine({ start: { x, y: yTop }, end: { x, y: yBottom }, thickness: 0.4, color: borderColor });
    });
  };

  let tableTopY = y;

  const drawHeaders = (currentY: number, isContinuation = false) => {
    const headerHeight = 22;
    page.drawRectangle({
      x: MARGIN,
      y: currentY - headerHeight,
      width: tableRightX - MARGIN,
      height: headerHeight,
      color: rgb(0.12, 0.35, 0.72)
    });

    cols.forEach((col, i) => {
      const headerTextWidth = bold.widthOfTextAtSize(col.name, 7.5);
      let textX = colX[i] + 4;
      if (col.align === "center") {
        textX = colX[i] + (col.w - headerTextWidth) / 2;
      } else if (col.align === "right") {
        textX = colX[i + 1] - headerTextWidth - 4;
      }

      page.drawText(col.name, {
        x: textX,
        y: currentY - 14,
        size: 7.5,
        font: bold,
        color: rgb(1, 1, 1)
      });
    });

    const nextY = currentY - headerHeight;
    drawRowLine(nextY, 1, navy);
    return nextY;
  };

  function newPageIfNeeded(minSpace = 40) {
    if (y < minSpace) {
      drawVerticalLines(tableTopY, y);
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;

      // Small continuation header
      page.drawText(`Labour Master List — ${siteName} (Continued)`, {
        x: MARGIN,
        y: y - 5,
        size: 9,
        font: bold,
        color: navy
      });
      y -= 18;

      tableTopY = y;
      y = drawHeaders(y, true);
      return true;
    }
    return false;
  }

  y = drawHeaders(y);

  const rowH = 18;

  labours.forEach((l, idx) => {
    newPageIfNeeded(rowH + 25);

    // Zebra Background
    if (idx % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowH,
        width: tableRightX - MARGIN,
        height: rowH,
        color: zebraColor
      });
    }

    // 0: Serial Number
    const srText = `${idx + 1}`;
    const srW = font.widthOfTextAtSize(srText, 7);
    page.drawText(srText, {
      x: colX[0] + (cols[0].w - srW) / 2,
      y: y - 11,
      size: 7,
      font,
      color: darkGray
    });

    // 1: Labour Name
    const nameLines = wrapText(l.name, bold, 7.5, cols[1].w - 6);
    if (nameLines.length === 1) {
      page.drawText(nameLines[0], {
        x: colX[1] + 4,
        y: y - 11,
        size: 7.5,
        font: bold,
        color: navy
      });
    } else {
      nameLines.slice(0, 2).forEach((line, li) => {
        page.drawText(line, {
          x: colX[1] + 4,
          y: y - 8 - (li * 7.5),
          size: 7,
          font: bold,
          color: navy
        });
      });
    }

    // 2: Category
    const catName = l.labourCategory?.name || "General";
    page.drawText(catName.substring(0, 18), {
      x: colX[2] + 4,
      y: y - 11,
      size: 7,
      font: bold,
      color: darkGray
    });

    // 3: Daily Wage Rate
    let wageText = "—";
    const wage = l.dailyWage ?? l.labourCategory?.dailyWage ?? 0;
    if (wage > 0) {
      wageText = catName === "Fitter Foreman"
        ? `Rs ${Math.round(wage * 30).toLocaleString("en-IN")}/mo`
        : `Rs ${Math.round(wage)}/hajri`;
    }
    const wageW = font.widthOfTextAtSize(wageText, 6.8);
    page.drawText(wageText, {
      x: colX[3] + (cols[3].w - wageW) / 2,
      y: y - 11,
      size: 6.8,
      font,
      color: green
    });

    // 4: Phone
    const phoneText = l.phone || "—";
    const phoneW = font.widthOfTextAtSize(phoneText, 7);
    page.drawText(phoneText, {
      x: colX[4] + (cols[4].w - phoneW) / 2,
      y: y - 11,
      size: 7,
      font,
      color: darkGray
    });

    // 5: Aadhar
    const aadharText = l.aadharNumber ? l.aadharNumber.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3") : "—";
    const aadharW = font.widthOfTextAtSize(aadharText, 6.8);
    page.drawText(aadharText, {
      x: colX[5] + (cols[5].w - aadharW) / 2,
      y: y - 11,
      size: 6.8,
      font,
      color: darkGray
    });

    // 6: Bank & A/C Details
    if (l.bankName || l.accountNumber) {
      const bName = l.bankName ? l.bankName.substring(0, 20) : "Bank";
      const acText = l.accountNumber ? `A/C: ${l.accountNumber}` : (l.ifscCode ? `IFSC: ${l.ifscCode}` : "");
      page.drawText(bName, {
        x: colX[6] + 4,
        y: y - 8,
        size: 6.5,
        font: bold,
        color: darkGray
      });
      if (acText) {
        page.drawText(acText, {
          x: colX[6] + 4,
          y: y - 15,
          size: 6,
          font,
          color: mutedGray
        });
      }
    } else {
      page.drawText("—", {
        x: colX[6] + 4,
        y: y - 11,
        size: 7,
        font,
        color: mutedGray
      });
    }

    // 7: Joined Date
    let joinDateText = "—";
    const jDate = l.joiningDate || l.createdAt;
    if (jDate) {
      try {
        joinDateText = format(new Date(jDate), "dd-MMM-yyyy");
      } catch (e) {}
    }
    const joinW = font.widthOfTextAtSize(joinDateText, 6.8);
    page.drawText(joinDateText, {
      x: colX[7] + (cols[7].w - joinW) / 2,
      y: y - 11,
      size: 6.8,
      font,
      color: darkGray
    });

    // 8: Status (Badge)
    const statusText = l.active ? "ACTIVE" : "INACTIVE";
    const statusW = bold.widthOfTextAtSize(statusText, 6.5);
    const badgeW = statusW + 12;
    const badgeH = 12;
    const badgeX = colX[8] + (cols[8].w - badgeW) / 2;
    const badgeY = y - 15;

    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: l.active ? rgb(0.9, 0.98, 0.92) : rgb(0.95, 0.95, 0.95),
      borderColor: l.active ? rgb(0.4, 0.8, 0.5) : rgb(0.75, 0.75, 0.75),
      borderWidth: 0.5
    });

    page.drawText(statusText, {
      x: badgeX + 6,
      y: badgeY + 3.5,
      size: 6.5,
      font: bold,
      color: l.active ? green : mutedGray
    });

    y -= rowH;
    drawRowLine(y, 0.4, borderColor);
  });

  drawVerticalLines(tableTopY, y);
  drawRowLine(y, 1, navy);

  // Footer / Signature Section
  newPageIfNeeded(40);
  y -= 25;

  const signBoxW = 160;
  const sig1X = MARGIN + 40;
  const sig2X = PAGE_W - MARGIN - signBoxW - 40;

  page.drawLine({ start: { x: sig1X, y }, end: { x: sig1X + signBoxW, y }, thickness: 0.8, color: darkGray });
  page.drawLine({ start: { x: sig2X, y }, end: { x: sig2X + signBoxW, y }, thickness: 0.8, color: darkGray });

  page.drawText("Site Supervisor Signature", {
    x: sig1X + 15,
    y: y - 12,
    size: 7.5,
    font: bold,
    color: darkGray
  });

  page.drawText("Authorized Signatory (RCR)", {
    x: sig2X + 18,
    y: y - 12,
    size: 7.5,
    font: bold,
    color: darkGray
  });

  return pdfDoc.save();
}
