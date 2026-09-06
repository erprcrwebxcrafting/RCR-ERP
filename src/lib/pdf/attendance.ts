import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { format, addDays } from "date-fns";
import fs from "fs";
import path from "path";

const MARGIN = 25;
const PAGE_W = 841.89; // A4 landscape width
const PAGE_H = 595.28; // A4 landscape height

export interface AttendanceExportData {
  attendances: any[];
  payments?: any[];
  postPayments?: any[];
  additionalLabours?: any[];
  openingEarned?: Record<string, number>;
  openingPaid?: Record<string, number>;
  siteName: string;
  startDateStr: string;
  endDateStr: string;
}

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

export async function generateAttendancePdf(
  dataOrAttendances: any[] | AttendanceExportData,
  legacySiteName?: string,
  legacyStartDate?: string,
  legacyEndDate?: string
): Promise<Uint8Array> {
  let attendances: any[] = [];
  let payments: any[] = [];
  let postPayments: any[] = [];
  let additionalLabours: any[] = [];
  let openingEarned: Record<string, number> = {};
  let openingPaid: Record<string, number> = {};
  let siteName = "Site";
  let startDateStr = "";
  let endDateStr = "";

  if (Array.isArray(dataOrAttendances)) {
    attendances = dataOrAttendances;
    siteName = legacySiteName || "Site";
    startDateStr = legacyStartDate || "";
    endDateStr = legacyEndDate || "";
  } else {
    attendances = dataOrAttendances.attendances || [];
    payments = dataOrAttendances.payments || [];
    postPayments = dataOrAttendances.postPayments || [];
    additionalLabours = dataOrAttendances.additionalLabours || [];
    openingEarned = dataOrAttendances.openingEarned || {};
    openingPaid = dataOrAttendances.openingPaid || {};
    siteName = dataOrAttendances.siteName || "Site";
    startDateStr = dataOrAttendances.startDateStr || "";
    endDateStr = dataOrAttendances.endDateStr || "";
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const navy = rgb(0.04, 0.14, 0.28);
  const primary = rgb(0.1, 0.4, 0.8);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const mutedGray = rgb(0.55, 0.55, 0.55);
  const lightGray = rgb(0.93, 0.94, 0.96);
  const zebraColor = rgb(0.97, 0.98, 0.99);
  const green = rgb(0.05, 0.55, 0.25);
  const red = rgb(0.85, 0.12, 0.12);
  const borderColor = rgb(0.82, 0.85, 0.9);

  // Generate Date Range
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const dates: Date[] = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  // Group data by labour
  const labourMap = new Map<string, any>();

  // Add from attendances
  attendances.forEach(a => {
    if (!labourMap.has(a.labourId)) {
      labourMap.set(a.labourId, {
        id: a.labourId,
        name: a.labour?.name || "Unknown Worker",
        category: a.labour?.labourCategory?.name || "General",
        dailyWage: a.hajariRate || a.labour?.dailyWage || 0,
        attendanceByDate: {},
        paymentsByDate: {},
        totalHajari: 0,
        totalOT: 0,
        totalEarned: 0, // Current period earned
        totalPaid: 0,   // Current + post period paid
        openingEarned: openingEarned[a.labourId] || 0,
        openingPaid: openingPaid[a.labourId] || 0,
      });
    }

    const worker = labourMap.get(a.labourId);
    const dateKey = format(new Date(a.date), "yyyy-MM-dd");
    const rate = a.hajariRate || worker.dailyWage || 0;

    worker.attendanceByDate[dateKey] = {
      hajari: a.hajari,
      ot: a.overtimeHrs || 0,
      rate,
      remarks: a.remarks
    };

    worker.totalHajari += a.hajari || 0;
    worker.totalOT += a.overtimeHrs || 0;
    worker.totalEarned += (a.earnedAmount !== undefined ? a.earnedAmount : (a.hajari > 0 ? a.hajari * rate : 0));
  });

  // Add additional labours who had no attendance in this period
  additionalLabours.forEach(l => {
    if (!labourMap.has(l.id)) {
      labourMap.set(l.id, {
        id: l.id,
        name: l.name,
        category: l.labourCategory?.name || "General",
        dailyWage: l.dailyWage || 0,
        attendanceByDate: {},
        paymentsByDate: {},
        totalHajari: 0,
        totalOT: 0,
        totalEarned: 0,
        totalPaid: 0,
        openingEarned: openingEarned[l.id] || 0,
        openingPaid: openingPaid[l.id] || 0,
      });
    }
  });

  // Add payments date-wise
  payments.forEach(p => {
    if (!labourMap.has(p.labourId)) {
      labourMap.set(p.labourId, {
        id: p.labourId,
        name: p.labour?.name || "Unknown Worker",
        category: p.labour?.labourCategory?.name || "General",
        dailyWage: p.labour?.dailyWage || 0,
        attendanceByDate: {},
        paymentsByDate: {},
        totalHajari: 0,
        totalOT: 0,
        totalEarned: 0,
        totalPaid: 0,
        openingEarned: openingEarned[p.labourId] || 0,
        openingPaid: openingPaid[p.labourId] || 0,
      });
    }

    const worker = labourMap.get(p.labourId);
    const dateKey = format(new Date(p.date), "yyyy-MM-dd");
    worker.paymentsByDate[dateKey] = (worker.paymentsByDate[dateKey] || 0) + (p.amount || 0);
    worker.totalPaid += (p.amount || 0);
  });

  // Add post-period payments
  postPayments.forEach(p => {
    if (!labourMap.has(p.labourId)) {
      labourMap.set(p.labourId, {
        id: p.labourId,
        name: p.labour?.name || "Unknown Worker",
        category: p.labour?.labourCategory?.name || "General",
        dailyWage: p.labour?.dailyWage || 0,
        attendanceByDate: {},
        paymentsByDate: {}, // Will not render in grid because date is outside range
        totalHajari: 0,
        totalOT: 0,
        totalEarned: 0,
        totalPaid: 0,
        openingEarned: openingEarned[p.labourId] || 0,
        openingPaid: openingPaid[p.labourId] || 0,
      });
    }

    const worker = labourMap.get(p.labourId);
    worker.totalPaid += (p.amount || 0); // We only add to totalPaid, no need to add to paymentsByDate grid
  });

  // Calculate Net Balances and sort alphabetically
  const sortedWorkers = Array.from(labourMap.values()).map(worker => {
    const allTimeEarned = worker.openingEarned + worker.totalEarned;
    const allTimePaid = worker.openingPaid + worker.totalPaid;
    const netBalance = allTimeEarned - allTimePaid;
    return { ...worker, allTimeEarned, allTimePaid, netBalance };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Compute Grand Totals
  let grandTotalHajari = 0;
  let grandTotalOT = 0;
  let grandCurrEarned = 0;
  let grandTotalEarned = 0;
  let grandTotalPaid = 0;
  let grandTotalBalance = 0;

  sortedWorkers.forEach(w => {
    grandTotalHajari += w.totalHajari;
    grandTotalOT += w.totalOT;
    grandCurrEarned += w.totalEarned;
    grandTotalEarned += w.allTimeEarned;
    grandTotalPaid += w.allTimePaid;
    grandTotalBalance += w.netBalance;
  });

  // Daily totals across all workers
  const dailyTotals: Record<string, { hajari: number; paid: number }> = {};
  dates.forEach(d => {
    const dateKey = format(d, "yyyy-MM-dd");
    let dayHajari = 0;
    let dayPaid = 0;
    sortedWorkers.forEach(w => {
      const att = w.attendanceByDate[dateKey];
      if (att && att.hajari > 0) dayHajari += att.hajari;
      const paid = w.paymentsByDate[dateKey];
      if (paid && paid > 0) dayPaid += paid;
    });
    dailyTotals[dateKey] = { hajari: dayHajari, paid: dayPaid };
  });

  // Draw Logo if available
  let logoDrawn = false;
  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdfDoc.embedPng(logoBytes);
      const logoDims = logo.scale(0.11);
      page.drawImage(logo, {
        x: MARGIN,
        y: y - logoDims.height + 10,
        width: logoDims.width,
        height: logoDims.height,
      });
      logoDrawn = true;
    }
  } catch (err) {}

  const textStartX = logoDrawn ? MARGIN + 105 : MARGIN;

  // Header Title
  page.drawText(`RCR Enterprises`, { x: textStartX, y: y - 2, size: 20, font: bold, color: navy });
  page.drawText(`Attendance & Payment Ledger — ${siteName}`, { x: textStartX, y: y - 18, size: 12, font: bold, color: primary });
  page.drawText(`Period: ${format(start, "dd MMM yyyy")} to ${format(end, "dd MMM yyyy")}  |  Generated: ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`, {
    x: textStartX,
    y: y - 31,
    size: 8.5,
    font,
    color: darkGray
  });

  // Top KPI Summary Cards (5 boxes)
  const kpiBoxY = y - 68;
  const kpiBoxH = 26;
  const usableWidth = PAGE_W - (2 * MARGIN);
  const kpiCount = 5;
  const kpiGap = 8;
  const kpiBoxW = (usableWidth - (kpiGap * (kpiCount - 1))) / kpiCount;

  const kpis = [
    { label: "TOTAL LABOURS", val: `${sortedWorkers.length}`, color: navy },
    { label: "TOTAL HAJARIS", val: `${grandTotalHajari.toFixed(1)}`, color: green },
    { label: "WAGES EARNED (ALL TIME)", val: `Rs ${Math.round(grandTotalEarned).toLocaleString("en-IN")}`, color: primary },
    { label: "ADVANCE PAID (ALL TIME)", val: `Rs ${Math.round(grandTotalPaid).toLocaleString("en-IN")}`, color: red },
    { label: "NET BALANCE DUE", val: `Rs ${Math.round(grandTotalBalance).toLocaleString("en-IN")}`, color: green }
  ];

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
      x: boxX + 6,
      y: kpiBoxY + 16,
      size: 6,
      font: bold,
      color: darkGray
    });

    page.drawText(kpi.val, {
      x: boxX + 6,
      y: kpiBoxY + 5,
      size: 9.5,
      font: bold,
      color: kpi.color
    });
  });

  y = kpiBoxY - 14;

  const nameWidth = 76;
  const categoryWidth = 46;
  const rateWidth = 26;
  const hajariWidth = 32;
  const curEarnWidth = 36;
  const totEarnWidth = 42;
  const totPaidWidth = 42;
  const balanceWidth = 44;

  const fixedWidths = nameWidth + categoryWidth + rateWidth + hajariWidth + curEarnWidth + totEarnWidth + totPaidWidth + balanceWidth;
  const availableForDates = usableWidth - fixedWidths;
  const dayColWidth = dates.length > 0 ? Math.min(22, availableForDates / dates.length) : 20;

  const cols = [
    { name: "Labour Name", w: nameWidth, align: "left" },
    { name: "Category", w: categoryWidth, align: "left" },
    { name: "Rate", w: rateWidth, align: "center" },
  ];

  dates.forEach(d => {
    cols.push({ name: format(d, "dd"), w: dayColWidth, align: "center" });
  });

  cols.push({ name: "T.Haj", w: hajariWidth, align: "center" });
  cols.push({ name: "C.Earn", w: curEarnWidth, align: "right" });
  cols.push({ name: "T.Earn", w: totEarnWidth, align: "right" });
  cols.push({ name: "T.Paid", w: totPaidWidth, align: "right" });
  cols.push({ name: "Net Bal", w: balanceWidth, align: "right" });

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

  const drawHeaders = (currentY: number) => {
    const headerHeight = 22;
    page.drawRectangle({
      x: MARGIN,
      y: currentY - headerHeight,
      width: tableRightX - MARGIN,
      height: headerHeight,
      color: rgb(0.12, 0.35, 0.72)
    });

    // Draw Day-of-week initials above dates
    dates.forEach((d, i) => {
      const idx = i + 3;
      const dayInitial = format(d, "EEE").charAt(0);
      page.drawText(dayInitial, {
        x: colX[idx] + (dayColWidth / 2) - 2.5,
        y: currentY - 8,
        size: 5.5,
        font: bold,
        color: rgb(0.8, 0.9, 1)
      });
    });

    // Draw Column Headers
    cols.forEach((col, i) => {
      const isDateCol = i >= 3 && i < 3 + dates.length;
      const yOffset = isDateCol ? currentY - 18 : currentY - 14;
      const fontSize = isDateCol ? 6.5 : 7.5;
      const headerTextWidth = bold.widthOfTextAtSize(col.name, fontSize);

      let textX = colX[i] + 3;
      if (col.align === "center" || isDateCol) {
        textX = colX[i] + (col.w - headerTextWidth) / 2;
      } else if (col.align === "right") {
        textX = colX[i + 1] - headerTextWidth - 3;
      }

      page.drawText(col.name, {
        x: textX,
        y: yOffset,
        size: fontSize,
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
      tableTopY = y;
      y = drawHeaders(y);
      return true;
    }
    return false;
  }

  y = drawHeaders(y);

  // Helper to format currency/amount for tight columns
  const formatShortAmount = (amt: number): string => {
    if (amt >= 1000) {
      const k = amt / 1000;
      return `${k.toFixed(k % 1 === 0 ? 0 : 1)}k`;
    }
    return `${amt}`;
  };

  const rowH = 19; // Allows 2 clean lines per date cell (Hajari on top, Advance below)

  // Draw Worker Rows
  sortedWorkers.forEach((worker, i) => {
    newPageIfNeeded(rowH + 30);

    // Zebra background
    if (i % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowH,
        width: tableRightX - MARGIN,
        height: rowH,
        color: zebraColor
      });
    }

    // Name (wrapped if long)
    const nameLines = wrapText(worker.name, bold, 7, nameWidth - 6);
    nameLines.slice(0, 2).forEach((l, li) => {
      page.drawText(l, {
        x: colX[0] + 3,
        y: y - 9 - (li * 8),
        size: 7,
        font: bold,
        color: navy
      });
    });

    // Category
    page.drawText(worker.category.substring(0, 10), {
      x: colX[1] + 3,
      y: y - 11,
      size: 6.5,
      font,
      color: darkGray
    });

    // Rate
    const rateText = worker.dailyWage > 0 ? `${worker.dailyWage}` : "—";
    const rateW = font.widthOfTextAtSize(rateText, 6.5);
    page.drawText(rateText, {
      x: colX[2] + (rateWidth - rateW) / 2,
      y: y - 11,
      size: 6.5,
      font,
      color: darkGray
    });

    // Date Columns
    dates.forEach((d, di) => {
      const dateKey = format(d, "yyyy-MM-dd");
      const att = worker.attendanceByDate[dateKey];
      const paid = worker.paymentsByDate[dateKey] || 0;
      const colIdx = di + 3;
      const cellW = cols[colIdx].w;

      let attText = "—";
      let attColor = mutedGray;
      let attFont = font;

      if (att) {
        if (att.hajari > 0) {
          attText = att.hajari.toString();
          attColor = green;
          attFont = bold;
        } else {
          attText = "A";
          attColor = red;
          attFont = bold;
        }
      }

      // Line 1: Hajari
      const attTextW = attFont.widthOfTextAtSize(attText, 6.5);
      const attY = paid > 0 ? y - 8 : y - 11;
      page.drawText(attText, {
        x: colX[colIdx] + (cellW - attTextW) / 2,
        y: attY,
        size: 6.5,
        font: attFont,
        color: attColor
      });

      // Line 2: Advance Paid on this date
      if (paid > 0) {
        const paidText = formatShortAmount(paid);
        const paidTextW = bold.widthOfTextAtSize(paidText, 5);
        page.drawText(paidText, {
          x: colX[colIdx] + (cellW - paidTextW) / 2,
          y: y - 16,
          size: 5,
          font: bold,
          color: red
        });
      }
    });

    // Total Hajari
    const hajText = `${worker.totalHajari}`;
    const hajW = bold.widthOfTextAtSize(hajText, 7.5);
    page.drawText(hajText, {
      x: colX[3 + dates.length] + (hajariWidth - hajW) / 2,
      y: y - 11,
      size: 7.5,
      font: bold,
      color: green
    });

    // Curr Earned
    const curEarnText = `${Math.round(worker.totalEarned)}`;
    const curEarnW = bold.widthOfTextAtSize(curEarnText, 7);
    page.drawText(curEarnText, {
      x: colX[4 + dates.length] - curEarnW - 3,
      y: y - 11,
      size: 7,
      font: bold,
      color: primary
    });

    // Total Earned (All Time)
    const totEarnText = `${Math.round(worker.allTimeEarned)}`;
    const totEarnW = bold.widthOfTextAtSize(totEarnText, 7);
    page.drawText(totEarnText, {
      x: colX[5 + dates.length] - totEarnW - 3,
      y: y - 11,
      size: 7,
      font: bold,
      color: navy
    });

    // Total Paid (All Time)
    const paidText = worker.allTimePaid > 0 ? `${Math.round(worker.allTimePaid)}` : "0";
    const paidW = bold.widthOfTextAtSize(paidText, 7);
    page.drawText(paidText, {
      x: colX[6 + dates.length] - paidW - 3,
      y: y - 11,
      size: 7,
      font: bold,
      color: worker.allTimePaid > 0 ? red : darkGray
    });

    // Net Balance
    const balText = `${Math.round(worker.netBalance)}`;
    const balW = bold.widthOfTextAtSize(balText, 7.5);
    page.drawText(balText, {
      x: colX[7 + dates.length] - balW - 3,
      y: y - 11,
      size: 7.5,
      font: bold,
      color: worker.netBalance > 0 ? green : (worker.netBalance < 0 ? red : darkGray)
    });

    y -= rowH;
    drawRowLine(y, 0.4, borderColor);
  });

  // GRAND TOTAL ROW
  newPageIfNeeded(26);

  const grandRowH = 22;
  page.drawRectangle({
    x: MARGIN,
    y: y - grandRowH,
    width: tableRightX - MARGIN,
    height: grandRowH,
    color: rgb(0.88, 0.92, 0.97)
  });

  page.drawText("TOTAL", {
    x: colX[0] + 3,
    y: y - 13,
    size: 7.5,
    font: bold,
    color: navy
  });

  page.drawText(`${sortedWorkers.length} Labours`, {
    x: colX[1] + 3,
    y: y - 13,
    size: 6.5,
    font: bold,
    color: darkGray
  });

  // Daily totals in grand total row
  dates.forEach((d, di) => {
    const dateKey = format(d, "yyyy-MM-dd");
    const day = dailyTotals[dateKey];
    const colIdx = di + 3;
    const cellW = cols[colIdx].w;

    if (day.hajari > 0) {
      const hajText = `${day.hajari}`;
      const hajW = bold.widthOfTextAtSize(hajText, 6);
      const hajY = day.paid > 0 ? y - 9 : y - 13;
      page.drawText(hajText, {
        x: colX[colIdx] + (cellW - hajW) / 2,
        y: hajY,
        size: 6,
        font: bold,
        color: navy
      });
    }

    if (day.paid > 0) {
      const paidText = formatShortAmount(day.paid);
      const paidW = bold.widthOfTextAtSize(paidText, 4.8);
      page.drawText(paidText, {
        x: colX[colIdx] + (cellW - paidW) / 2,
        y: y - 18,
        size: 4.8,
        font: bold,
        color: red
      });
    }
  });

  // Grand Total Hajari
  const gHajText = `${grandTotalHajari.toFixed(1)}`;
  const gHajW = bold.widthOfTextAtSize(gHajText, 7.5);
  page.drawText(gHajText, {
    x: colX[3 + dates.length] + (hajariWidth - gHajW) / 2,
    y: y - 13,
    size: 7.5,
    font: bold,
    color: green
  });

  // Grand Curr Earned
  const gCurEarnText = `${Math.round(grandCurrEarned).toLocaleString("en-IN")}`;
  const gCurEarnW = bold.widthOfTextAtSize(gCurEarnText, 7);
  page.drawText(gCurEarnText, {
    x: colX[4 + dates.length] - gCurEarnW - 3,
    y: y - 13,
    size: 7,
    font: bold,
    color: primary
  });

  // Grand Total Earned
  const gEarnText = `${Math.round(grandTotalEarned).toLocaleString("en-IN")}`;
  const gEarnW = bold.widthOfTextAtSize(gEarnText, 7);
  page.drawText(gEarnText, {
    x: colX[5 + dates.length] - gEarnW - 3,
    y: y - 13,
    size: 7,
    font: bold,
    color: navy
  });

  // Grand Total Paid
  const gPaidText = `${Math.round(grandTotalPaid).toLocaleString("en-IN")}`;
  const gPaidW = bold.widthOfTextAtSize(gPaidText, 7);
  page.drawText(gPaidText, {
    x: colX[6 + dates.length] - gPaidW - 3,
    y: y - 13,
    size: 7,
    font: bold,
    color: red
  });

  // Grand Total Balance
  const gBalText = `${Math.round(grandTotalBalance).toLocaleString("en-IN")}`;
  const gBalW = bold.widthOfTextAtSize(gBalText, 7.5);
  page.drawText(gBalText, {
    x: colX[7 + dates.length] - gBalW - 3,
    y: y - 13,
    size: 7.5,
    font: bold,
    color: grandTotalBalance > 0 ? green : (grandTotalBalance < 0 ? red : darkGray)
  });

  y -= grandRowH;
  drawRowLine(y, 1.2, navy);
  drawVerticalLines(tableTopY, y);

  // Footer Legend
  y -= 14;
  page.drawText(
    "Legend: Green = Hajari (1 = Full, 0.5 = Half)  |  Red (bottom) = Advance / Payment Paid  |  A = Absent  |  C.Earn = Cur. Earned, T.Earn = Total All Time, T.Paid = Paid All Time",
    {
      x: MARGIN,
      y,
      size: 6.5,
      font,
      color: darkGray
    }
  );

  return pdfDoc.save();
}
