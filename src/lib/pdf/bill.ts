import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import fs from "fs";
import path from "path";

const MARGIN = 35;
const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [""];
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

function formatCurrency(amt: number): string {
  return "Rs. " + (amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function generateBillPdfPackage(data: {
  site: any;
  runningBill: any;
  towers: any[];
  supplyEntries: any[];
  payments: any[];
}): Promise<Uint8Array> {
  const { site, runningBill, towers, supplyEntries, payments } = data;
  const pdfDoc = await PDFDocument.create();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const teal = rgb(0.12, 0.55, 0.68);
  const black = rgb(0.1, 0.1, 0.1);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const lightGray = rgb(0.93, 0.95, 0.97);

  let logoImage: any = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    }
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  let signImage: any = null;
  try {
    const signPath = path.join(process.cwd(), "public", "sign&logo.png");
    if (fs.existsSync(signPath)) {
      const signBytes = fs.readFileSync(signPath);
      signImage = await pdfDoc.embedPng(signBytes);
    }
  } catch (e) {
    console.error("Failed to load sign image", e);
  }

  const clientName = site.client?.name || "Client Name";
  const projectName = site.projectName || "Project";
  const billNo = runningBill?.billNo || "007/2026-27";
  const refNo = runningBill?.refNo || "01";
  const billDate = runningBill?.billDate
    ? new Date(runningBill.billDate).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");
  const workOrderNo = site.workOrderNo || "PARKSITE/SSHIVAAY/2026-27";

  const retPct = runningBill?.retentionPct ?? site.retentionPct ?? 2;
  const tdsPct = runningBill?.tdsPct ?? site.tdsPct ?? 1;
  const cgstPct = runningBill?.cgstPct ?? site.cgstPct ?? 9;
  const sgstPct = runningBill?.sgstPct ?? site.sgstPct ?? 9;

  let page!: PDFPage;
  let y = PAGE_H - MARGIN;


  const startNewPage = (sheetTitle: string) => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;

    if (logoImage) {
      const dims = logoImage.scale(0.22);
      page.drawImage(logoImage, {
        x: MARGIN,
        y: y - 55,
        width: 75,
        height: 75 * (dims.height / dims.width),
      });
    }

    page.drawText("RCR ENTERPRISES", { x: MARGIN + 85, y: y - 18, size: 20, font: bold, color: teal });
    page.drawText(`GST NO: ${site.gstNo || "27AAJFN6629D1Z5"} | CONCRETE & REINFORCEMENT WORK`, {
      x: MARGIN + 85, y: y - 32, size: 8, font, color: darkGray
    });

    page.drawText(sheetTitle.toUpperCase(), {
      x: PAGE_W - MARGIN - bold.widthOfTextAtSize(sheetTitle.toUpperCase(), 10.5),
      y: y - 18,
      size: 10.5,
      font: bold,
      color: teal,
    });
    page.drawText(`Date: ${billDate}`, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(`Date: ${billDate}`, 9),
      y: y - 32,
      size: 9,
      font,
      color: darkGray,
    });

    y -= 42;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1.5, color: teal });
    y -= 15;

    // Meta box
    page.drawRectangle({ x: MARGIN, y: y - 36, width: PAGE_W - 2 * MARGIN, height: 38, color: lightGray });
    page.drawText(`To: ${clientName.toUpperCase()}`, { x: MARGIN + 8, y: y - 12, size: 9.5, font: bold, color: black });
    page.drawText(`Project: ${projectName}`, { x: MARGIN + 8, y: y - 26, size: 9, font, color: darkGray });

    page.drawText(`Invoice No: ${billNo}`, { x: PAGE_W - MARGIN - 180, y: y - 12, size: 9, font: bold, color: black });
    page.drawText(`W.O. No: ${workOrderNo}`, { x: PAGE_W - MARGIN - 180, y: y - 26, size: 9, font, color: darkGray });

    y -= 48;
  };

  const newPageIfNeeded = (minSpace = 60, sheetTitle = "CONTINUATION") => {
    if (y < minSpace) {
      startNewPage(sheetTitle);
    }
  };

  // ==========================================
  // SECTION 1: TAX INVOICE (PAGE 1)
  // ==========================================
  startNewPage("SECTION 1: TAX INVOICE");

  const lines = runningBill?.lines || [];
  const currentTotal = lines.reduce((sum: number, l: any) => sum + (l.currentAmount || 0), 0);
  const cgstAmt = currentTotal * (cgstPct / 100);
  const sgstAmt = currentTotal * (sgstPct / 100);
  const netPayable = currentTotal + cgstAmt + sgstAmt;

  // Table header
  page.drawRectangle({ x: MARGIN, y: y - 20, width: PAGE_W - 2 * MARGIN, height: 20, color: lightGray });
  page.drawText("Sr.", { x: MARGIN + 5, y: y - 14, size: 9, font: bold, color: black });
  page.drawText("Particulars / Work Description", { x: MARGIN + 35, y: y - 14, size: 9, font: bold, color: black });
  page.drawText("Amount (Rs.)", { x: PAGE_W - MARGIN - 90, y: y - 14, size: 9, font: bold, color: black });
  y -= 20;

  // Invoice Items
  let sr = 1;
  for (const b of towers) {
    const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => {
      return s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * i.rate));
    }, 0);

    if (towerWorkAmt > 0) {
      page.drawText(String(sr++), { x: MARGIN + 5, y: y - 14, size: 9, font, color: darkGray });
      page.drawText(`${projectName} - ${b.name} Reinforcement & Civil Work`, { x: MARGIN + 35, y: y - 14, size: 9, font, color: black });
      page.drawText(formatCurrency(towerWorkAmt), { x: PAGE_W - MARGIN - 100, y: y - 14, size: 9, font: bold, color: black });
      y -= 18;
    }
  }
  
  const currentSupplyEntries = supplyEntries.filter((e: any) => e.runningBillId === runningBill?.id || (!runningBill && !e.runningBillId));
  const previousSupplyEntries = supplyEntries.filter((e: any) => e.runningBillId && e.runningBillId !== runningBill?.id);

  const supplyTotal = currentSupplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);
  const prevSupplyTotal = previousSupplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);

  if (supplyTotal > 0) {
    page.drawText(String(sr++), { x: MARGIN + 5, y: y - 14, size: 9, font, color: darkGray });
    page.drawText(`Departmental Extra Labour Supply Amount`, { x: MARGIN + 35, y: y - 14, size: 9, font, color: black });
    page.drawText(formatCurrency(supplyTotal), { x: PAGE_W - MARGIN - 100, y: y - 14, size: 9, font: bold, color: black });
    y -= 18;
  }

  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: darkGray });
  y -= 16;

  page.drawText("Taxable Work Done Amount:", { x: MARGIN + 180, y, size: 9.5, font: bold, color: black });
  page.drawText(formatCurrency(currentTotal), { x: PAGE_W - MARGIN - 100, y, size: 9.5, font: bold, color: black });
  y -= 16;

  page.drawText(`Add CGST @ ${cgstPct}%:`, { x: MARGIN + 180, y, size: 9, font, color: darkGray });
  page.drawText(formatCurrency(cgstAmt), { x: PAGE_W - MARGIN - 100, y, size: 9, font, color: darkGray });
  y -= 14;

  page.drawText(`Add SGST @ ${sgstPct}%:`, { x: MARGIN + 180, y, size: 9, font, color: darkGray });
  page.drawText(formatCurrency(sgstAmt), { x: PAGE_W - MARGIN - 100, y, size: 9, font, color: darkGray });
  y -= 16;

  page.drawRectangle({ x: MARGIN + 170, y: y - 18, width: PAGE_W - MARGIN - 170 - MARGIN, height: 20, color: lightGray });
  page.drawText("NET PAYABLE AMOUNT (WITH 18% GST):", { x: MARGIN + 180, y: y - 13, size: 10, font: bold, color: teal });
  page.drawText(formatCurrency(netPayable), { x: PAGE_W - MARGIN - 100, y: y - 13, size: 10, font: bold, color: teal });

  // ==========================================
  // SECTION 2: ABSTRACT SUMMARY (SEPARATE PAGE)
  // ==========================================
  startNewPage("SECTION 2: ABSTRACT SUMMARY");

  page.drawRectangle({ x: MARGIN, y: y - 20, width: PAGE_W - 2 * MARGIN, height: 20, color: lightGray });
  page.drawText("Sr.", { x: MARGIN + 4, y: y - 14, size: 8, font: bold, color: black });
  page.drawText("Description", { x: MARGIN + 25, y: y - 14, size: 8, font: bold, color: black });
  page.drawText("Unit", { x: MARGIN + 180, y: y - 14, size: 8, font: bold, color: black });
  page.drawText("Rate", { x: MARGIN + 215, y: y - 14, size: 8, font: bold, color: black });
  page.drawText("Prev. Amt", { x: MARGIN + 265, y: y - 14, size: 8, font: bold, color: black });
  page.drawText("This Bill Amt", { x: MARGIN + 340, y: y - 14, size: 8, font: bold, color: black });
  page.drawText("Cum. Amt", { x: PAGE_W - MARGIN - 75, y: y - 14, size: 8, font: bold, color: black });
  y -= 20;

  let totPrevAmt = 0;
  let totCurrAmt = 0;

  lines.forEach((line: any, idx: number) => {
    newPageIfNeeded(30, "SECTION 2: ABSTRACT SUMMARY");
    const pAmt = line.previousAmount || 0;
    const cAmt = line.currentAmount || 0;
    const cumAmt = pAmt + cAmt;
    totPrevAmt += pAmt;
    totCurrAmt += cAmt;

    page.drawText(String(idx + 1), { x: MARGIN + 4, y: y - 12, size: 8, font, color: darkGray });
    const descStr = (line.description || "").slice(0, 32);
    page.drawText(descStr, { x: MARGIN + 25, y: y - 12, size: 8, font, color: black });
    page.drawText(line.unit || "%", { x: MARGIN + 180, y: y - 12, size: 8, font, color: darkGray });
    page.drawText(String(line.rate || 0), { x: MARGIN + 215, y: y - 12, size: 8, font, color: darkGray });

    page.drawText(formatCurrency(pAmt), { x: MARGIN + 265, y: y - 12, size: 8, font, color: darkGray });
    page.drawText(formatCurrency(cAmt), { x: MARGIN + 340, y: y - 12, size: 8, font: bold, color: teal });
    page.drawText(formatCurrency(cumAmt), { x: PAGE_W - MARGIN - 75, y: y - 12, size: 8, font: bold, color: black });
    y -= 15;
  });

  // Supply Labour on Abstract Summary (Page 2)
  if (supplyTotal > 0 || prevSupplyTotal > 0) {
    newPageIfNeeded(30, "SECTION 2: ABSTRACT SUMMARY");
    page.drawText(String(lines.length + 1), { x: MARGIN + 4, y: y - 12, size: 8, font, color: darkGray });
    page.drawText("Departmental Extra Labour Supply Amount", { x: MARGIN + 25, y: y - 12, size: 8, font, color: black });
    page.drawText("—", { x: MARGIN + 180, y: y - 12, size: 8, font, color: darkGray });
    page.drawText("—", { x: MARGIN + 215, y: y - 12, size: 8, font, color: darkGray });

    page.drawText(formatCurrency(prevSupplyTotal), { x: MARGIN + 265, y: y - 12, size: 8, font, color: darkGray });
    page.drawText(formatCurrency(supplyTotal), { x: MARGIN + 340, y: y - 12, size: 8, font: bold, color: teal });
    page.drawText(formatCurrency(prevSupplyTotal + supplyTotal), { x: PAGE_W - MARGIN - 75, y: y - 12, size: 8, font: bold, color: black });
    y -= 15;
  }
  
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: teal });
  y -= 16;

  const retAmt = totCurrAmt * (retPct / 100);
  const tdsAmt = totCurrAmt * (tdsPct / 100);
  const netBalAmt = totCurrAmt - retAmt - tdsAmt;

  page.drawText(`TOTAL WORK DONE AMOUNT:`, { x: MARGIN + 180, y, size: 8.5, font: bold, color: black });
  page.drawText(formatCurrency(totCurrAmt), { x: PAGE_W - MARGIN - 90, y, size: 8.5, font: bold, color: black });
  y -= 14;

  page.drawText(`LESS RETENTION @ ${retPct}%:`, { x: MARGIN + 180, y, size: 8, font, color: darkGray });
  page.drawText(`- ${formatCurrency(retAmt)}`, { x: PAGE_W - MARGIN - 90, y, size: 8, font, color: darkGray });
  y -= 13;

  page.drawText(`LESS TDS @ ${tdsPct}%:`, { x: MARGIN + 180, y, size: 8, font, color: darkGray });
  page.drawText(`- ${formatCurrency(tdsAmt)}`, { x: PAGE_W - MARGIN - 90, y, size: 8, font, color: darkGray });
  y -= 15;

  page.drawRectangle({ x: MARGIN + 170, y: y - 16, width: PAGE_W - MARGIN - 170 - MARGIN, height: 18, color: lightGray });
  page.drawText("NET PAYABLE BALANCE:", { x: MARGIN + 180, y: y - 12, size: 9, font: bold, color: teal });
  page.drawText(formatCurrency(netBalAmt), { x: PAGE_W - MARGIN - 90, y: y - 12, size: 9, font: bold, color: teal });

  // ==========================================
  // SECTION 3: TOWER PROGRESS BREAKDOWN (SEPARATE PAGE PER TOWER)
  // ==========================================
  for (const tower of towers) {
    startNewPage(`SECTION 3: BUILDING - ${tower.name.toUpperCase()}`);

    const approxArea = tower.approxArea || 0;
    const contractRate = tower.contractRate || 0;
    const totalTowerVal = approxArea * contractRate;

    page.drawText(`BUA Area: ${approxArea} Sft  @  Rs. ${contractRate}/Sft  =  ${formatCurrency(totalTowerVal)}`, {
      x: MARGIN, y, size: 9, font: bold, color: teal
    });
    y -= 20;

    page.drawRectangle({ x: MARGIN, y: y - 18, width: PAGE_W - 2 * MARGIN, height: 18, color: lightGray });
    page.drawText("Sr.", { x: MARGIN + 4, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Particulars of Item", { x: MARGIN + 25, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Unit", { x: MARGIN + 220, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Prev %", { x: MARGIN + 265, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Curr %", { x: MARGIN + 315, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Curr Amount (Rs)", { x: PAGE_W - MARGIN - 100, y: y - 13, size: 8, font: bold, color: black });
    y -= 18;

    const items = tower.workItems || [];
    let tCurrTotal = 0;

    items.forEach((item: any, i: number) => {
      newPageIfNeeded(25, `BUILDING - ${tower.name.toUpperCase()}`);
      const prevQ = item.previousPct ?? item.previousQty ?? 0;
      const currQ = item.currentPct ?? item.currentQty ?? 0;
      const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : (currQ > 0 ? (item.partAmount * currQ / 100) : 0);
      tCurrTotal += currA;

      page.drawText(String(i + 1), { x: MARGIN + 4, y: y - 11, size: 8, font, color: darkGray });
      page.drawText((item.name || "").slice(0, 38), { x: MARGIN + 25, y: y - 11, size: 8, font, color: black });
      page.drawText(item.unit || "%", { x: MARGIN + 220, y: y - 11, size: 8, font, color: darkGray });
      page.drawText(`${prevQ}%`, { x: MARGIN + 265, y: y - 11, size: 8, font, color: darkGray });
      page.drawText(`${currQ}%`, { x: MARGIN + 315, y: y - 11, size: 8, font: bold, color: teal });
      page.drawText(formatCurrency(currA), { x: PAGE_W - MARGIN - 100, y: y - 11, size: 8, font: bold, color: black });
      y -= 14;
    });

    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: teal });
    y -= 14;
    page.drawText(`TOTAL ${tower.name.toUpperCase()} WORK DONE:`, { x: MARGIN + 180, y, size: 8.5, font: bold, color: black });
    page.drawText(formatCurrency(tCurrTotal), { x: PAGE_W - MARGIN - 100, y, size: 8.5, font: bold, color: teal });
  }

  // ==========================================
  // SECTION 4: EXTRA SUPPLY LABOUR SHEET (SEPARATE PAGE)
  // ==========================================
  if (supplyEntries.length > 0) {
    startNewPage("SECTION 4: EXTRA SUPPLY LABOUR SHEET");

    page.drawRectangle({ x: MARGIN, y: y - 18, width: PAGE_W - 2 * MARGIN, height: 18, color: lightGray });
    page.drawText("Date", { x: MARGIN + 4, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Challan", { x: MARGIN + 60, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Description of Extra Work", { x: MARGIN + 120, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Fitter (Nos/Hrs)", { x: MARGIN + 310, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Helper (Nos/Hrs)", { x: MARGIN + 395, y: y - 13, size: 8, font: bold, color: black });
    page.drawText("Amount (Rs)", { x: PAGE_W - MARGIN - 75, y: y - 13, size: 8, font: bold, color: black });
    y -= 18;

    let totSupplyAmt = 0;
    supplyEntries.forEach((se: any) => {
      newPageIfNeeded(25, "EXTRA SUPPLY LABOUR SHEET");
      const dateStr = se.date ? new Date(se.date).toLocaleDateString("en-IN") : "-";
      totSupplyAmt += se.totalAmount || 0;

      page.drawText(dateStr, { x: MARGIN + 4, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(se.challanNo || "-", { x: MARGIN + 60, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText((se.description || "").slice(0, 35), { x: MARGIN + 120, y: y - 11, size: 7.5, font, color: black });
      page.drawText(`${se.fitterQty || 0} / ${se.fitterHours || 0}h`, { x: MARGIN + 310, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(`${se.helperQty || 0} / ${se.helperHours || 0}h`, { x: MARGIN + 395, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(formatCurrency(se.totalAmount || 0), { x: PAGE_W - MARGIN - 75, y: y - 11, size: 7.5, font: bold, color: black });
      y -= 14;
    });

    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: teal });
    y -= 14;
    page.drawText("TOTAL EXTRA LABOUR SUPPLY AMOUNT:", { x: MARGIN + 180, y, size: 8.5, font: bold, color: black });
    page.drawText(formatCurrency(totSupplyAmt), { x: PAGE_W - MARGIN - 75, y, size: 8.5, font: bold, color: teal });
  }

  // ==========================================
  // SECTION 5: CLIENT BALANCE SHEET & LEDGER (SEPARATE PAGE)
  // ==========================================
  startNewPage("SECTION 5: CLIENT BALANCE SHEET & LEDGER");

  page.drawRectangle({ x: MARGIN, y: y - 18, width: PAGE_W - 2 * MARGIN, height: 18, color: lightGray });
  page.drawText("Date", { x: MARGIN + 4, y: y - 13, size: 8, font: bold, color: black });
  page.drawText("Reference / Description", { x: MARGIN + 60, y: y - 13, size: 8, font: bold, color: black });
  page.drawText("Bill Gross", { x: MARGIN + 210, y: y - 13, size: 8, font: bold, color: black });
  page.drawText("Net Bill", { x: MARGIN + 270, y: y - 13, size: 8, font: bold, color: black });
  page.drawText("Recd Amt", { x: MARGIN + 330, y: y - 13, size: 8, font: bold, color: black });
  page.drawText("1% TDS", { x: MARGIN + 395, y: y - 13, size: 8, font: bold, color: black });
  page.drawText("Running Bal (Rs)", { x: PAGE_W - MARGIN - 90, y: y - 13, size: 8, font: bold, color: black });
  y -= 18;

  const ledger: any[] = [];
  (site.bills || []).forEach((b: any) => {
    const gross = (b.lines || []).reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
    const bRetAmt = gross * ((b.retentionPct ?? retPct) / 100);
    const bNetAmt = gross - bRetAmt;
    const bTdsAmt = gross * ((b.tdsPct ?? tdsPct) / 100);

    ledger.push({
      type: "BILL",
      date: new Date(b.billDate || b.createdAt),
      refName: `BILL NO.${b.billNo || "01"}`,
      grossAmount: gross,
      netBilledAmt: bNetAmt,
      paymentRecd: 0,
      tdsAmt: bTdsAmt,
    });
  });

  (payments || []).forEach((p: any) => {
    ledger.push({
      type: "PAYMENT",
      date: new Date(p.date || p.createdAt),
      refName: p.remarks || `PAYMENT (${p.mode || "NEFT"})`,
      grossAmount: 0,
      netBilledAmt: 0,
      paymentRecd: p.amount || 0,
      tdsAmt: 0,
    });
  });

  ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runCumNet = 0;
  let runCumRecd = 0;

  ledger.forEach((item) => {
    newPageIfNeeded(25, "CLIENT BALANCE SHEET & LEDGER");
    if (item.type === "BILL") runCumNet += item.netBilledAmt;
    else runCumRecd += item.paymentRecd;

    const runBal = runCumNet - runCumRecd;

    page.drawText(item.date.toLocaleDateString("en-IN"), { x: MARGIN + 4, y: y - 11, size: 7.5, font, color: darkGray });
    page.drawText((item.refName || "").slice(0, 30), { x: MARGIN + 60, y: y - 11, size: 7.5, font: bold, color: black });

    page.drawText(item.type === "BILL" ? formatCurrency(item.grossAmount) : "-", { x: MARGIN + 210, y: y - 11, size: 7.5, font, color: darkGray });
    page.drawText(item.type === "BILL" ? formatCurrency(item.netBilledAmt) : "-", { x: MARGIN + 270, y: y - 11, size: 7.5, font, color: darkGray });
    page.drawText(item.type === "PAYMENT" ? formatCurrency(item.paymentRecd) : "-", { x: MARGIN + 330, y: y - 11, size: 7.5, font: bold, color: teal });
    page.drawText(item.type === "BILL" ? formatCurrency(item.tdsAmt) : "-", { x: MARGIN + 395, y: y - 11, size: 7.5, font, color: darkGray });

    const balStr = formatCurrency(runBal);
    page.drawText(balStr, {
      x: PAGE_W - MARGIN - 90, y: y - 11, size: 7.5, font: bold, color: runBal > 0 ? rgb(0.85, 0.2, 0.2) : rgb(0.1, 0.6, 0.3)
    });
    y -= 14;
  });

  // ==========================================
  // PAGE BORDERS, FOOTERS & SEAL STAMP ON EVERY SINGLE PAGE
  // ==========================================
  const allPages = pdfDoc.getPages();
  const totalPages = allPages.length;
  const BORDER_M = 15;
  const addressText = "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305";

  allPages.forEach((p, pageIdx) => {
    // Draw Border Frame
    p.drawRectangle({
      x: BORDER_M,
      y: BORDER_M,
      width: PAGE_W - 2 * BORDER_M,
      height: PAGE_H - 2 * BORDER_M,
      borderWidth: 1.5,
      borderColor: teal,
    });

    // Draw Footer Divider Line
    p.drawLine({
      start: { x: BORDER_M, y: BORDER_M + 22 },
      end: { x: PAGE_W - BORDER_M, y: BORDER_M + 22 },
      thickness: 1,
      color: teal,
    });

    // Address & Page Numbers in Footer
    const addrW = font.widthOfTextAtSize(addressText, 8);
    p.drawText(addressText, { x: PAGE_W / 2 - addrW / 2, y: BORDER_M + 6, size: 8, font, color: teal });

    const pNumStr = `Page ${pageIdx + 1} of ${totalPages}`;
    const pNumW = font.widthOfTextAtSize(pNumStr, 8);
    p.drawText(pNumStr, { x: PAGE_W - BORDER_M - 15 - pNumW, y: BORDER_M + 6, size: 8, font, color: darkGray });

    // Draw Official Company Seal & Signature Stamp (sign&logo.png) on EVERY PAGE
    p.drawText("FOR RCR ENTERPRISES", { x: PAGE_W - BORDER_M - 160, y: BORDER_M + 90, size: 8.5, font: bold, color: black });

    if (signImage) {
      try {
        const signDims = signImage.scale(0.22);
        p.drawImage(signImage, {
          x: PAGE_W - BORDER_M - 165,
          y: BORDER_M + 28,
          width: signDims.width,
          height: signDims.height,
        });
      } catch (e) {
        console.error("Failed to draw seal stamp on page", e);
      }
    }

    p.drawText("AUTHORISED SIGNATORY", { x: PAGE_W - BORDER_M - 160, y: BORDER_M + 26, size: 8, font: bold, color: darkGray });
  });

  return pdfDoc.save();
}

export async function generateBillPdfs(bill: any): Promise<{ filename: string; buffer: Uint8Array }[]> {
  const pdfBytes = await generateBillPdfPackage({
    site: bill.site,
    runningBill: bill,
    towers: bill.site.buildings || [],
    supplyEntries: bill.site.supplyLabourEntries || [],
    payments: bill.site.payments || [],
  });

  return [
    {
      filename: `Running_Bill_${(bill.billNo || "007").replace(/\//g, "-")}_Package.pdf`,
      buffer: pdfBytes,
    },
  ];
}
