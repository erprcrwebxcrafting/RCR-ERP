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

  let taxableTowerWork = 0;
  for (const b of towers) {
    const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => {
      return s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * (i.rate || 0)));
    }, 0);
    taxableTowerWork += towerWorkAmt;
  }

  const currentSupplyEntries = supplyEntries.filter((e: any) => e.runningBillId === runningBill?.id || (!runningBill && !e.runningBillId));
  const previousSupplyEntries = supplyEntries.filter((e: any) => e.runningBillId && e.runningBillId !== runningBill?.id);

  const supplyTotal = currentSupplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);
  const prevSupplyTotal = previousSupplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);

  const currentTotal = taxableTowerWork + supplyTotal;
  const cgstAmt = currentTotal * (cgstPct / 100);
  const sgstAmt = currentTotal * (sgstPct / 100);
  const netPayable = currentTotal + cgstAmt + sgstAmt;

  // Table header
  page.drawRectangle({ x: MARGIN, y: y - 20, width: PAGE_W - 2 * MARGIN, height: 20, color: lightGray });
  page.drawText("Sr.", { x: MARGIN + 5, y: y - 14, size: 9, font: bold, color: black });
  page.drawText("Particulars / Work Description", { x: MARGIN + 35, y: y - 14, size: 9, font: bold, color: black });
  page.drawText("Amount (Rs.)", { x: PAGE_W - MARGIN - 90, y: y - 14, size: 9, font: bold, color: black });
  y -= 20;

  // Invoice Items (Tower-wise Civil Work Done)
  let sr = 1;
  for (const b of towers) {
    const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => {
      return s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * (i.rate || 0)));
    }, 0);

    if (towerWorkAmt > 0) {
      page.drawText(String(sr++), { x: MARGIN + 5, y: y - 14, size: 9, font, color: darkGray });
      page.drawText(`${projectName} - ${b.name} Reinforcement & Civil Work Done`, { x: MARGIN + 35, y: y - 14, size: 9, font, color: black });
      page.drawText(formatCurrency(towerWorkAmt), { x: PAGE_W - MARGIN - 100, y: y - 14, size: 9, font: bold, color: black });
      y -= 18;
    }
  }

  if (supplyTotal > 0) {
    page.drawText(String(sr++), { x: MARGIN + 5, y: y - 14, size: 9, font, color: darkGray });
    page.drawText(`Departmental Extra Labour Supply (Fitters & Helpers Log Billed)`, { x: MARGIN + 35, y: y - 14, size: 9, font, color: black });
    page.drawText(formatCurrency(supplyTotal), { x: PAGE_W - MARGIN - 100, y: y - 14, size: 9, font, color: black });
    y -= 18;
  }

  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: darkGray });
  y -= 16;

  page.drawText("Taxable Work Done Amount:", { x: MARGIN + 180, y, size: 9.5, font: bold, color: black });
  page.drawText(formatCurrency(currentTotal), { x: PAGE_W - MARGIN - 100, y, size: 9.5, font: bold, color: black });
  y -= 15;

  page.drawText(`Add CGST @ ${cgstPct}%:`, { x: MARGIN + 180, y, size: 9, font, color: darkGray });
  page.drawText(formatCurrency(cgstAmt), { x: PAGE_W - MARGIN - 100, y, size: 9, font, color: darkGray });
  y -= 14;

  page.drawText(`Add SGST @ ${sgstPct}%:`, { x: MARGIN + 180, y, size: 9, font, color: darkGray });
  page.drawText(formatCurrency(sgstAmt), { x: PAGE_W - MARGIN - 100, y, size: 9, font, color: darkGray });
  y -= 16;

  page.drawRectangle({ x: MARGIN + 170, y: y - 18, width: PAGE_W - MARGIN - 170 - MARGIN, height: 20, color: lightGray });
  page.drawText("NET PAYABLE AMOUNT (WITH 18% GST):", { x: MARGIN + 180, y: y - 13, size: 10, font: bold, color: teal });
  page.drawText(formatCurrency(netPayable), { x: PAGE_W - MARGIN - 100, y: y - 13, size: 10, font: bold, color: teal });
  y -= 30;

  // Official Bank Details Box on Sheet 1
  page.drawRectangle({ x: MARGIN, y: y - 55, width: PAGE_W - 2 * MARGIN, height: 55, color: lightGray, borderColor: teal, borderWidth: 1 });
  page.drawText("BANK DETAILS FOR PAYMENT (NEFT / RTGS)", { x: MARGIN + 10, y: y - 14, size: 8.5, font: bold, color: teal });
  page.drawText("ACCOUNT NAME: RCR ENTERPRISES", { x: MARGIN + 10, y: y - 28, size: 8, font: bold, color: black });
  page.drawText("ACCOUNT NO: 088405500559", { x: MARGIN + 10, y: y - 40, size: 8, font, color: darkGray });
  page.drawText("IFSC CODE: ICIC0000884", { x: MARGIN + 230, y: y - 28, size: 8, font, color: darkGray });
  page.drawText("BANK NAME: ICICI BANK LTD.", { x: MARGIN + 230, y: y - 40, size: 8, font, color: darkGray });

  // ==========================================
  // SECTION 2: ABSTRACT SUMMARY (SEPARATE PAGE)
  // ==========================================
  startNewPage("SECTION 2: ABSTRACT SUMMARY");

  page.drawRectangle({ x: MARGIN, y: y - 20, width: PAGE_W - 2 * MARGIN, height: 20, color: lightGray });
  page.drawText("Sr.", { x: MARGIN + 4, y: y - 14, size: 7.5, font: bold, color: black });
  page.drawText("Description", { x: MARGIN + 22, y: y - 14, size: 7.5, font: bold, color: black });
  page.drawText("Unit", { x: MARGIN + 175, y: y - 14, size: 7.5, font: bold, color: black });
  page.drawText("W.O. Area", { x: MARGIN + 202, y: y - 14, size: 7.5, font: bold, color: black });
  page.drawText("Rate", { x: MARGIN + 252, y: y - 14, size: 7.5, font: bold, color: black });
  page.drawText("Prev. Amt", { x: MARGIN + 295, y: y - 14, size: 7.5, font: bold, color: black });
  page.drawText("This Bill Amt", { x: MARGIN + 365, y: y - 14, size: 7.5, font: bold, color: black });
  page.drawText("Cum. Amt", { x: PAGE_W - MARGIN - 75, y: y - 14, size: 7.5, font: bold, color: black });
  y -= 20;

  let totPrevAmt = 0;
  let totCurrAmt = 0;
  let grossContractValue = 0;

  // Tower-wise Consolidated Abstract Rows (Matching UI Format Exactly)
  towers.forEach((b: any, idx: number) => {
    newPageIfNeeded(30, "SECTION 2: ABSTRACT SUMMARY");
    const approxArea = b.approxArea || 0;
    const contractRate = b.contractRate || 0;
    grossContractValue += (approxArea * contractRate);

    const prevA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.previousAmt !== undefined && i.previousAmt !== null) ? i.previousAmt : ((i.previousQty || 0) * (i.rate || 0))), 0);
    const currA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * (i.rate || 0))), 0);
    const cumA = prevA + currA;

    totPrevAmt += prevA;
    totCurrAmt += currA;

    page.drawText(String(idx + 1), { x: MARGIN + 4, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText(`${b.name} Reinforcement Work Done.`, { x: MARGIN + 22, y: y - 12, size: 7.5, font: bold, color: black });
    page.drawText("Sft.", { x: MARGIN + 175, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText(approxArea > 0 ? String(approxArea.toLocaleString()) : "—", { x: MARGIN + 202, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText(contractRate > 0 ? `Rs.${contractRate}` : "—", { x: MARGIN + 252, y: y - 12, size: 7.5, font, color: darkGray });

    page.drawText(formatCurrency(prevA), { x: MARGIN + 295, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText(formatCurrency(currA), { x: MARGIN + 365, y: y - 12, size: 7.5, font: bold, color: teal });
    page.drawText(formatCurrency(cumA), { x: PAGE_W - MARGIN - 75, y: y - 12, size: 7.5, font: bold, color: black });
    y -= 16;
  });

  // Supply Labour on Abstract Summary
  if (supplyTotal > 0 || prevSupplyTotal > 0) {
    newPageIfNeeded(30, "SECTION 2: ABSTRACT SUMMARY");
    totPrevAmt += prevSupplyTotal;
    totCurrAmt += supplyTotal;

    page.drawText(String(towers.length + 1), { x: MARGIN + 4, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText("Departmental Extra Labour Supply Amount", { x: MARGIN + 22, y: y - 12, size: 7.5, font: bold, color: black });
    page.drawText("—", { x: MARGIN + 175, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText("—", { x: MARGIN + 202, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText("—", { x: MARGIN + 252, y: y - 12, size: 7.5, font, color: darkGray });

    page.drawText(formatCurrency(prevSupplyTotal), { x: MARGIN + 295, y: y - 12, size: 7.5, font, color: darkGray });
    page.drawText(formatCurrency(supplyTotal), { x: MARGIN + 365, y: y - 12, size: 7.5, font: bold, color: teal });
    page.drawText(formatCurrency(prevSupplyTotal + supplyTotal), { x: PAGE_W - MARGIN - 75, y: y - 12, size: 7.5, font: bold, color: black });
    y -= 16;
  }
  
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: teal });
  y -= 16;

  const totCumAmt = totPrevAmt + totCurrAmt;
  const cgstAbstract = totCurrAmt * (cgstPct / 100);
  const sgstAbstract = totCurrAmt * (sgstPct / 100);
  const retAmt = totCurrAmt * (retPct / 100);
  const tdsAmt = totCurrAmt * (tdsPct / 100);
  const netBalAmt = totCurrAmt + cgstAbstract + sgstAbstract - retAmt - tdsAmt;

  page.drawText(`TOTAL VALUE OF WORK DONE (CUMULATIVE):`, { x: MARGIN + 60, y, size: 8, font: bold, color: black });
  page.drawText(formatCurrency(totPrevAmt), { x: MARGIN + 295, y, size: 8, font: bold, color: darkGray });
  page.drawText(formatCurrency(totCurrAmt), { x: MARGIN + 365, y, size: 8, font: bold, color: teal });
  page.drawText(formatCurrency(totCumAmt), { x: PAGE_W - MARGIN - 75, y, size: 8, font: bold, color: black });
  y -= 16;

  page.drawText(`Add CGST @ ${cgstPct}%:`, { x: MARGIN + 180, y, size: 8, font, color: darkGray });
  page.drawText(`+ ${formatCurrency(cgstAbstract)}`, { x: PAGE_W - MARGIN - 90, y, size: 8, font, color: darkGray });
  y -= 13;

  page.drawText(`Add SGST @ ${sgstPct}%:`, { x: MARGIN + 180, y, size: 8, font, color: darkGray });
  page.drawText(`+ ${formatCurrency(sgstAbstract)}`, { x: PAGE_W - MARGIN - 90, y, size: 8, font, color: darkGray });
  y -= 13;

  page.drawText(`Less Retention @ ${retPct}%:`, { x: MARGIN + 180, y, size: 8, font, color: darkGray });
  page.drawText(`- ${formatCurrency(retAmt)}`, { x: PAGE_W - MARGIN - 90, y, size: 8, font, color: darkGray });
  y -= 13;

  page.drawText(`Less TDS @ ${tdsPct}%:`, { x: MARGIN + 180, y, size: 8, font, color: darkGray });
  page.drawText(`- ${formatCurrency(tdsAmt)}`, { x: PAGE_W - MARGIN - 90, y, size: 8, font, color: darkGray });
  y -= 16;

  page.drawRectangle({ x: MARGIN + 160, y: y - 16, width: PAGE_W - MARGIN - 160 - MARGIN, height: 18, color: lightGray });
  page.drawText("NET PAYABLE INVOICE BALANCE:", { x: MARGIN + 170, y: y - 12, size: 9, font: bold, color: teal });
  page.drawText(formatCurrency(netBalAmt), { x: PAGE_W - MARGIN - 90, y: y - 12, size: 9, font: bold, color: teal });
  y -= 20;

  if (grossContractValue > 0) {
    page.drawText(`GROSS CONTRACT VALUE (ALL TOWERS):`, { x: MARGIN + 170, y, size: 8, font: bold, color: darkGray });
    page.drawText(formatCurrency(grossContractValue), { x: PAGE_W - MARGIN - 90, y, size: 8, font: bold, color: darkGray });
  }

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
    page.drawText("Sr.", { x: MARGIN + 4, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Particulars of Item", { x: MARGIN + 20, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Unit", { x: MARGIN + 168, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Prev %", { x: MARGIN + 192, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Curr %", { x: MARGIN + 230, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Cum %", { x: MARGIN + 268, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Prev Amt", { x: MARGIN + 305, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Curr Amt", { x: MARGIN + 375, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Cum Amt", { x: MARGIN + 450, y: y - 13, size: 7.5, font: bold, color: black });
    y -= 18;

    const items = tower.workItems || [];
    let tPrevTotal = 0;
    let tCurrTotal = 0;
    let tCumTotal = 0;

    items.forEach((item: any, i: number) => {
      newPageIfNeeded(25, `BUILDING - ${tower.name.toUpperCase()}`);
      const prevQ = item.previousPct ?? item.previousQty ?? 0;
      const currQ = item.currentPct ?? item.currentQty ?? 0;
      const cumQ = item.cumulativePct ?? (prevQ + currQ);

      const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : (prevQ > 0 ? (item.partAmount * prevQ / 100) : 0);
      const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : (currQ > 0 ? (item.partAmount * currQ / 100) : 0);
      const cumA = item.cumulativeAmt ?? (prevA + currA);

      tPrevTotal += prevA;
      tCurrTotal += currA;
      tCumTotal += cumA;

      page.drawText(String(i + 1), { x: MARGIN + 4, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText((item.name || "").slice(0, 28), { x: MARGIN + 20, y: y - 11, size: 7.5, font, color: black });
      page.drawText(item.unit || "%", { x: MARGIN + 168, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(`${prevQ}%`, { x: MARGIN + 192, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(`${currQ}%`, { x: MARGIN + 230, y: y - 11, size: 7.5, font: bold, color: teal });
      page.drawText(`${cumQ}%`, { x: MARGIN + 268, y: y - 11, size: 7.5, font: bold, color: black });

      page.drawText(formatCurrency(prevA), { x: MARGIN + 305, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(formatCurrency(currA), { x: MARGIN + 375, y: y - 11, size: 7.5, font: bold, color: teal });
      page.drawText(formatCurrency(cumA), { x: MARGIN + 450, y: y - 11, size: 7.5, font: bold, color: black });
      y -= 14;
    });

    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: teal });
    y -= 14;
    page.drawText(`TOTAL ${tower.name.toUpperCase()} WORK DONE:`, { x: MARGIN + 150, y, size: 8, font: bold, color: black });
    page.drawText(formatCurrency(tPrevTotal), { x: MARGIN + 305, y, size: 8, font: bold, color: darkGray });
    page.drawText(formatCurrency(tCurrTotal), { x: MARGIN + 375, y, size: 8, font: bold, color: teal });
    page.drawText(formatCurrency(tCumTotal), { x: MARGIN + 450, y, size: 8, font: bold, color: black });
  }

  // ==========================================
  // SECTION 4: EXTRA SUPPLY LABOUR SHEET (SEPARATE PAGE)
  // ==========================================
  if (supplyEntries.length > 0) {
    startNewPage("SECTION 4: EXTRA SUPPLY LABOUR SHEET");

    page.drawRectangle({ x: MARGIN, y: y - 18, width: PAGE_W - 2 * MARGIN, height: 18, color: lightGray });
    page.drawText("Date", { x: MARGIN + 4, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Challan", { x: MARGIN + 55, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Description", { x: MARGIN + 110, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Fitter", { x: MARGIN + 245, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Hrs", { x: MARGIN + 280, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Tot F.Hrs", { x: MARGIN + 310, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Helper", { x: MARGIN + 360, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Hrs", { x: MARGIN + 395, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Tot H.Hrs", { x: MARGIN + 425, y: y - 13, size: 7.5, font: bold, color: black });
    page.drawText("Amount (Rs)", { x: PAGE_W - MARGIN - 55, y: y - 13, size: 7.5, font: bold, color: black });
    y -= 18;

    let totSupplyAmt = 0;
    let sumFitterHrs = 0;
    let sumHelperHrs = 0;

    supplyEntries.forEach((se: any) => {
      newPageIfNeeded(25, "EXTRA SUPPLY LABOUR SHEET");
      const dateStr = se.date ? new Date(se.date).toLocaleDateString("en-IN") : "-";

      const fHrs = (se.fitterQty || 0) * (se.fitterHours || 8);
      const hHrs = (se.helperQty || 0) * (se.helperHours || 8);
      sumFitterHrs += fHrs;
      sumHelperHrs += hHrs;
      totSupplyAmt += se.totalAmount || 0;

      page.drawText(dateStr, { x: MARGIN + 4, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(se.challanNo || "-", { x: MARGIN + 55, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText((se.description || "").slice(0, 24), { x: MARGIN + 110, y: y - 11, size: 7.5, font, color: black });
      page.drawText(String(se.fitterQty || 0), { x: MARGIN + 245, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(`${se.fitterHours || 8}h`, { x: MARGIN + 280, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(`${fHrs}h`, { x: MARGIN + 310, y: y - 11, size: 7.5, font: bold, color: teal });
      page.drawText(String(se.helperQty || 0), { x: MARGIN + 360, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(`${se.helperHours || 8}h`, { x: MARGIN + 395, y: y - 11, size: 7.5, font, color: darkGray });
      page.drawText(`${hHrs}h`, { x: MARGIN + 425, y: y - 11, size: 7.5, font: bold, color: teal });
      page.drawText(formatCurrency(se.totalAmount || 0), { x: PAGE_W - MARGIN - 55, y: y - 11, size: 7.5, font: bold, color: black });
      y -= 14;
    });

    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: teal });
    y -= 14;

    const fDays = Math.round((sumFitterHrs / 8) * 100) / 100;
    const hDays = Math.round((sumHelperHrs / 8) * 100) / 100;
    const fAmtStr = formatCurrency(fDays * 1100);
    const hAmtStr = formatCurrency(hDays * 800);

    page.drawText(`Total Hours: ${sumFitterHrs} Hrs (Fitter)  |  ${sumHelperHrs} Hrs (Helper)`, { x: MARGIN + 110, y, size: 8, font: bold, color: darkGray });
    y -= 14;
    page.drawText(`Total Days: ${fDays} Nos (Fitter @ Rs.1,100)  |  ${hDays} Nos (Helper @ Rs.800)`, { x: MARGIN + 110, y, size: 8, font: bold, color: darkGray });
    y -= 16;

    page.drawText("TOTAL EXTRA LABOUR SUPPLY AMOUNT:", { x: MARGIN + 110, y, size: 8.5, font: bold, color: black });
    page.drawText(formatCurrency(totSupplyAmt), { x: PAGE_W - MARGIN - 75, y, size: 8.5, font: bold, color: teal });
  }

  // ==========================================
  // SECTION 5: CLIENT BALANCE SHEET & LEDGER (SEPARATE PAGE)
  // ==========================================
  startNewPage("SECTION 5: CLIENT BALANCE SHEET & LEDGER");

  page.drawRectangle({ x: MARGIN, y: y - 18, width: PAGE_W - 2 * MARGIN, height: 18, color: lightGray });
  page.drawText("Sr.", { x: MARGIN + 2, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("Date", { x: MARGIN + 18, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("RA Bills / Remarks", { x: MARGIN + 62, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("Bill Gross", { x: MARGIN + 165, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("Retention", { x: MARGIN + 215, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("Net Bill", { x: MARGIN + 258, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("Recd/Advance", { x: MARGIN + 302, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("1% TDS", { x: MARGIN + 352, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("Balance", { x: MARGIN + 392, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("GST Amt", { x: MARGIN + 438, y: y - 13, size: 7, font: bold, color: black });
  page.drawText("Balance+GST", { x: PAGE_W - MARGIN - 48, y: y - 13, size: 7, font: bold, color: black });
  y -= 18;

  const ledger: any[] = [];
  (site.bills || []).forEach((b: any) => {
    const gross = (b.lines || []).reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
    const bRetAmt = gross * ((b.retentionPct ?? retPct) / 100);
    const bNetAmt = gross - bRetAmt;
    const bTdsAmt = gross * ((b.tdsPct ?? tdsPct) / 100);
    const bGstAmt = gross * (((b.cgstPct ?? cgstPct) + (b.sgstPct ?? sgstPct)) / 100);

    ledger.push({
      type: "BILL",
      date: new Date(b.billDate || b.createdAt),
      refName: `BILL NO.${b.billNo || "01"}`,
      grossAmount: gross,
      retentionAmt: bRetAmt,
      netBilledAmt: bNetAmt,
      paymentRecd: 0,
      tdsAmt: bTdsAmt,
      gstAmt: bGstAmt,
    });
  });

  (payments || []).forEach((p: any) => {
    ledger.push({
      type: "PAYMENT",
      date: new Date(p.date || p.createdAt),
      refName: p.remarks || `PAYMENT (${p.mode || "NEFT"})`,
      grossAmount: 0,
      retentionAmt: 0,
      netBilledAmt: 0,
      paymentRecd: p.amount || 0,
      tdsAmt: 0,
      gstAmt: 0,
    });
  });

  ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runCumNet = 0;
  let runCumRecd = 0;
  let runCumTds = 0;
  let runCumGst = 0;

  ledger.forEach((item, idx) => {
    newPageIfNeeded(25, "CLIENT BALANCE SHEET & LEDGER");
    if (item.type === "BILL") {
      runCumNet += item.netBilledAmt;
      runCumTds += item.tdsAmt;
      runCumGst += item.gstAmt;
    } else {
      runCumRecd += item.paymentRecd;
    }

    const cumAdv = runCumRecd + runCumTds;
    const runBal = runCumNet - cumAdv;
    const balWithGst = runBal + runCumGst;

    page.drawText(String(idx + 1), { x: MARGIN + 2, y: y - 11, size: 7, font: bold, color: black });
    page.drawText(item.date.toLocaleDateString("en-IN"), { x: MARGIN + 18, y: y - 11, size: 7, font, color: darkGray });
    page.drawText((item.refName || "").slice(0, 18), { x: MARGIN + 62, y: y - 11, size: 7, font: bold, color: black });

    page.drawText(item.type === "BILL" ? formatCurrency(item.grossAmount) : "-", { x: MARGIN + 165, y: y - 11, size: 7, font, color: darkGray });
    page.drawText(item.type === "BILL" ? formatCurrency(item.retentionAmt) : "-", { x: MARGIN + 215, y: y - 11, size: 7, font, color: darkGray });
    page.drawText(item.type === "BILL" ? formatCurrency(item.netBilledAmt) : "-", { x: MARGIN + 258, y: y - 11, size: 7, font, color: darkGray });
    page.drawText(item.type === "PAYMENT" ? formatCurrency(item.paymentRecd) : "-", { x: MARGIN + 302, y: y - 11, size: 7, font: bold, color: teal });
    page.drawText(item.type === "BILL" ? formatCurrency(item.tdsAmt) : "-", { x: MARGIN + 352, y: y - 11, size: 7, font, color: darkGray });

    page.drawText(formatCurrency(runBal), {
      x: MARGIN + 392, y: y - 11, size: 7, font: bold, color: runBal > 0 ? rgb(0.85, 0.2, 0.2) : rgb(0.1, 0.6, 0.3)
    });
    page.drawText(item.type === "BILL" ? formatCurrency(item.gstAmt) : "-", { x: MARGIN + 438, y: y - 11, size: 7, font, color: darkGray });

    page.drawText(formatCurrency(balWithGst), {
      x: PAGE_W - MARGIN - 48, y: y - 11, size: 7, font: bold, color: balWithGst > 0 ? rgb(0.85, 0.2, 0.2) : rgb(0.1, 0.6, 0.3)
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
