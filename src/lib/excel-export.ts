import ExcelJS from "exceljs";

export async function generateRABillExcelWorkbook(data: {
  site: any;
  runningBill: any;
  towers: any[];
  supplyEntries: any[];
  payments: any[];
}): Promise<Buffer> {
  const { site, runningBill, towers, supplyEntries, payments } = data;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RCR Enterprises ERP";
  workbook.lastModifiedBy = "RCR Enterprises ERP";
  workbook.created = new Date();

  const billNo = runningBill?.billNo || "007/2026-27";
  const refNo = runningBill?.refNo || "01";
  const billDate = runningBill?.billDate ? new Date(runningBill.billDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
  const projectName = site.projectName || "Site Project";
  const clientName = site.client?.name || "Client";
  const workOrderNo = site.workOrderNo || "PARKSITE/SSHIVAAY/2026-27";

  const retPct = runningBill?.retentionPct ?? site.retentionPct ?? 2;
  const tdsPct = runningBill?.tdsPct ?? site.tdsPct ?? 1;
  const cgstPct = runningBill?.cgstPct ?? site.cgstPct ?? 9;
  const sgstPct = runningBill?.sgstPct ?? site.sgstPct ?? 9;

  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E79" }, // Deep Navy
  };

  const subHeaderFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "D9E1F2" }, // Soft Gray Blue
  };

  const highlightFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E2EFDA" }, // Soft Mint Green
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "D3D3D3" } },
    left: { style: "thin", color: { argb: "D3D3D3" } },
    bottom: { style: "thin", color: { argb: "D3D3D3" } },
    right: { style: "thin", color: { argb: "D3D3D3" } },
  };

  // Helper to format table headers
  const formatHeaderRow = (row: ExcelJS.Row) => {
    row.font = { bold: true, color: { argb: "FFFFFF" }, size: 10 };
    row.alignment = { vertical: "middle", horizontal: "center" };
    row.height = 24;
    row.eachCell((cell) => {
      cell.fill = headerFill;
      cell.border = thinBorder;
    });
  };

  // Helper for gridlines
  const finalizeSheet = (sheet: ExcelJS.Worksheet) => {
    sheet.views = [{ showGridLines: true }];
  };

  // Helper to format top details rows (Name, Address, etc.)
  const formatTopDetails = (sheet: ExcelJS.Worksheet, rowIndexes: number[]) => {
    rowIndexes.forEach((idx) => {
      const r = sheet.getRow(idx);
      r.font = { bold: true, size: 11, color: { argb: "1F4E79" } };
      r.alignment = { vertical: "middle" };
    });
  };

  // ==========================================
  // SHEET 1: TAX INVOICE
  // ==========================================
  const sheet1 = workbook.addWorksheet("Sheet1 (Tax Invoice)");
  sheet1.columns = [
    { width: 10 }, // Sr. No.
    { width: 55 }, // Particulars / Work Description
    { width: 25 }, // Amount
  ];

  sheet1.mergeCells("A1:C1");
  const titleCell = sheet1.getCell("A1");
  titleCell.value = "TAX INVOICE";
  titleCell.font = { bold: true, size: 16, color: { argb: "1F4E79" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet1.getRow(1).height = 30;

  sheet1.addRow([`To,`]);
  sheet1.addRow([clientName.toUpperCase(), "", "", "", `Date : ${billDate}`]);
  if (site.address) sheet1.addRow([`ADD :- ${site.address}`, "", "", "", `Invoice No. ${billNo}`]);
  else sheet1.addRow([`Invoice No. ${billNo}`]);
  if (site.gstNo) sheet1.addRow([`GST No. : ${site.gstNo}`]);
  sheet1.addRow([]);

  sheet1.addRow([`Name of Work: Concrete & Reinforcement Construction Work`]);
  sheet1.addRow([`Name Of Project : ${projectName}`]);
  sheet1.addRow([`Subject :- REF NO. : ${refNo}`]);
  sheet1.addRow([]);

  formatTopDetails(sheet1, [2, 3, 4, 5, 7, 8, 9]);

  const lines = runningBill?.lines || [];
  const currentTotal = lines.reduce((sum: number, l: any) => sum + (l.currentAmount || 0), 0);
  const cgst = currentTotal * (cgstPct / 100);
  const sgst = currentTotal * (sgstPct / 100);
  const netPayable = currentTotal + cgst + sgst;

  const invoiceHeaderRow = sheet1.addRow(["Sr. No.", "Particulars / Work Description", "Amount (₹)"]);
  formatHeaderRow(invoiceHeaderRow);

  let sr = 1;
  towers.forEach((b: any) => {
    const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => {
      return s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * i.rate));
    }, 0);

    if (towerWorkAmt > 0) {
      const r = sheet1.addRow([sr++, `${projectName} — ${b.name} Reinforcement & Civil Work`, towerWorkAmt]);
      r.getCell(3).numFmt = "₹ #,##0.00";
      r.getCell(3).alignment = { horizontal: "right" };
    }
  });

  const supplyTotal = supplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);
  if (supplyTotal > 0) {
    const r = sheet1.addRow([sr++, "Departmental Extra Labour Supply Amount", supplyTotal]);
    r.getCell(3).numFmt = "₹ #,##0.00";
    r.getCell(3).alignment = { horizontal: "right" };
  }

  sheet1.addRow([]);
  const rTaxable = sheet1.addRow(["", "Taxable Amount", currentTotal]);
  rTaxable.font = { bold: true };
  rTaxable.getCell(3).numFmt = "₹ #,##0.00";
  rTaxable.getCell(3).alignment = { horizontal: "right" };

  const rCgst = sheet1.addRow(["", `Add CGST @ ${cgstPct}%`, cgst]);
  rCgst.getCell(3).numFmt = "₹ #,##0.00";
  rCgst.getCell(3).alignment = { horizontal: "right" };

  const rSgst = sheet1.addRow(["", `Add SGST @ ${sgstPct}%`, sgst]);
  rSgst.getCell(3).numFmt = "₹ #,##0.00";
  rSgst.getCell(3).alignment = { horizontal: "right" };

  const netRow = sheet1.addRow(["", "Net Payable Amount (With 18% GST)", netPayable]);
  netRow.font = { bold: true, size: 11, color: { argb: "1F4E79" } };
  netRow.getCell(2).fill = highlightFill;
  netRow.getCell(3).fill = highlightFill;
  netRow.getCell(3).numFmt = "₹ #,##0.00";
  netRow.getCell(3).alignment = { horizontal: "right" };

  sheet1.addRow([]);
  sheet1.addRow(["NAME :- RCR ENTERPRISES", "", "FOR RCR ENTERPRISES"]);
  sheet1.addRow(["A/C :- 088405500559"]);
  sheet1.addRow(["IFSC :- ICIC0000884", "", "AUTHORISED SIGNATORY"]);

  finalizeSheet(sheet1);

  // ==========================================
  // SHEET 2: ABSTRACT SUMMARY
  // ==========================================
  const sheet2 = workbook.addWorksheet("Sheet2 (Abstract Summary)");
  sheet2.columns = [
    { width: 8 },  // Sr. No
    { width: 45 }, // Description
    { width: 10 }, // Unit
    { width: 12 }, // W.O. Qty
    { width: 15 }, // Rate
    { width: 15 }, // Prev Qty
    { width: 15 }, // Curr Qty
    { width: 15 }, // Cum Qty
    { width: 20 }, // Prev Amt
    { width: 20 }, // Curr Amt
    { width: 20 }, // Cum Amt
  ];
  sheet2.addRow([`To, ${clientName}`, "", "", "", "", "", "", "", "", `Date : ${billDate}`]);
  sheet2.addRow([`Invoice No. ${billNo}`, "", "", "", "", "", "", "", "", `W. O. No. :- ${workOrderNo}`]);
  sheet2.addRow([`Name Of Project :- ${projectName}`]);
  sheet2.addRow([`Subject :- REF NO. : ${refNo}`]);
  sheet2.addRow([]);
  formatTopDetails(sheet2, [1, 2, 3, 4]);

  const absHeaders = [
    "Sr. No", "Description", "Unit", "W.O. Qty", "Rate (₹)",
    "Previous Qty", "This Bill Qty", "Cumulative Qty",
    "Previous Amount (₹)", "This Bill Amount (₹)", "Cumulative Amount (₹)"
  ];
  const hRow = sheet2.addRow(absHeaders);
  formatHeaderRow(hRow);

  const previousSupplyWork = lines.find((l: any) => l.isSupplyLabour)?.previousAmount || 0;
  const totalSupplyWork = lines.find((l: any) => l.isSupplyLabour)?.currentAmount ?? (supplyEntries || []).reduce((sum: number, se: any) => sum + (se.totalAmount || 0), 0);

  towers.forEach((tower: any, idx: number) => {
    const prevA = (tower.workItems || []).reduce((s: number, i: any) => s + (i.previousAmt || 0), 0);
    const currA = (tower.workItems || []).reduce((s: number, i: any) => s + (i.currentAmt || 0), 0);
    
    const r = sheet2.addRow([
      idx + 1,
      `${tower.name} Reinforcement Work Done.`,
      "Sft.",
      tower.approxArea || 0,
      tower.contractRate || 0,
      (tower.contractRate && tower.contractRate > 0) ? (prevA / tower.contractRate) : 0,
      (tower.contractRate && tower.contractRate > 0) ? (currA / tower.contractRate) : 0,
      (tower.contractRate && tower.contractRate > 0) ? ((prevA + currA) / tower.contractRate) : 0,
      prevA,
      currA,
      prevA + currA,
    ]);

    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(4).numFmt = "#,##0";
    r.getCell(5).numFmt = "₹ #,##0.00";
    r.getCell(6).numFmt = "#,##0.00";
    r.getCell(7).numFmt = "#,##0.00";
    r.getCell(8).numFmt = "#,##0.00";
    r.getCell(9).numFmt = "₹ #,##0.00";
    r.getCell(10).numFmt = "₹ #,##0.00";
    r.getCell(11).numFmt = "₹ #,##0.00";

    r.getCell(7).font = { color: { argb: "006100" }, bold: true }; 
    r.getCell(10).font = { color: { argb: "006100" }, bold: true };
    r.getCell(11).font = { bold: true };

    r.eachCell((cell) => { 
      cell.border = thinBorder; 
      if (!cell.alignment) cell.alignment = { vertical: "middle" }; 
    });
  });

  if (previousSupplyWork > 0 || totalSupplyWork > 0) {
    const r = sheet2.addRow([
      towers.length + 1,
      "Extra Labour Supply Billed",
      "Nos/Hrs",
      "-",
      "-",
      "-",
      "-",
      "-",
      previousSupplyWork,
      totalSupplyWork,
      previousSupplyWork + totalSupplyWork,
    ]);
    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
    
    r.getCell(9).numFmt = "₹ #,##0.00";
    r.getCell(10).numFmt = "₹ #,##0.00";
    r.getCell(10).font = { color: { argb: "006100" }, bold: true }; 
    r.getCell(11).numFmt = "₹ #,##0.00";
    r.getCell(11).font = { bold: true };

    r.eachCell((cell) => { 
      cell.border = thinBorder; 
      if (!cell.alignment) cell.alignment = { vertical: "middle" }; 
    });
  }

  const totPrevAmt = towers.reduce((sum: number, b: any) => sum + (b.workItems || []).reduce((ws: number, item: any) => ws + (item.previousAmt || 0), 0), 0) + previousSupplyWork;
  const totCurrAmt = towers.reduce((sum: number, b: any) => sum + (b.workItems || []).reduce((ws: number, item: any) => ws + (item.currentAmt || 0), 0), 0) + totalSupplyWork;
  const totCumAmt = totPrevAmt + totCurrAmt;

  const totalRow = sheet2.addRow(["", "Total Amount", "", "", "", "", "", "", totPrevAmt, totCurrAmt, totCumAmt]);
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => { cell.fill = subHeaderFill; cell.border = thinBorder; });
  totalRow.getCell(9).numFmt = "₹ #,##0.00";
  totalRow.getCell(10).numFmt = "₹ #,##0.00";
  totalRow.getCell(11).numFmt = "₹ #,##0.00";

  const retAmt = totCurrAmt * (retPct / 100);
  const tdsAmt = totCurrAmt * (tdsPct / 100);
  const balAmt = totCurrAmt - retAmt - tdsAmt;

  const cgstAmt = totCurrAmt * (cgstPct / 100);
  const sgstAmt = totCurrAmt * (sgstPct / 100);

  const rCgst2 = sheet2.addRow(["", `ADD CGST @ ${cgstPct}%`, "", "", "", "", "", "", totPrevAmt * (cgstPct / 100), cgstAmt, (totPrevAmt * (cgstPct / 100)) + cgstAmt]);
  rCgst2.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
  rCgst2.getCell(9).numFmt = "₹ #,##0.00"; rCgst2.getCell(10).numFmt = "₹ #,##0.00"; rCgst2.getCell(11).numFmt = "₹ #,##0.00";
  rCgst2.eachCell(cell => { cell.border = thinBorder; });

  const rSgst2 = sheet2.addRow(["", `ADD SGST @ ${sgstPct}%`, "", "", "", "", "", "", totPrevAmt * (sgstPct / 100), sgstAmt, (totPrevAmt * (sgstPct / 100)) + sgstAmt]);
  rSgst2.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
  rSgst2.getCell(9).numFmt = "₹ #,##0.00"; rSgst2.getCell(10).numFmt = "₹ #,##0.00"; rSgst2.getCell(11).numFmt = "₹ #,##0.00";
  rSgst2.eachCell(cell => { cell.border = thinBorder; });

  const rRet = sheet2.addRow(["", `LESS RETENTION @ ${retPct}%`, "", "", "", "", "", "", 0, retAmt, retAmt]);
  rRet.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
  rRet.getCell(2).font = { color: { argb: "9C0006" } };
  rRet.getCell(9).numFmt = "₹ #,##0.00"; rRet.getCell(10).numFmt = "₹ #,##0.00"; rRet.getCell(10).font = { color: { argb: "9C0006" } }; rRet.getCell(11).numFmt = "₹ #,##0.00"; rRet.getCell(11).font = { color: { argb: "9C0006" } };
  rRet.eachCell(cell => { cell.border = thinBorder; });

  const rTds = sheet2.addRow(["", `LESS TDS @ ${tdsPct}%`, "", "", "", "", "", "", 0, tdsAmt, tdsAmt]);
  rTds.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
  rTds.getCell(2).font = { color: { argb: "9C0006" } };
  rTds.getCell(9).numFmt = "₹ #,##0.00"; rTds.getCell(10).numFmt = "₹ #,##0.00"; rTds.getCell(10).font = { color: { argb: "9C0006" } }; rTds.getCell(11).numFmt = "₹ #,##0.00"; rTds.getCell(11).font = { color: { argb: "9C0006" } };
  rTds.eachCell(cell => { cell.border = thinBorder; });

  const finalBalRow = sheet2.addRow(["", "Net Payable Balance", "", "", "", "", "", "", totPrevAmt, balAmt, totPrevAmt + balAmt]);
  finalBalRow.font = { bold: true, size: 11, color: { argb: "1F4E79" } };
  finalBalRow.eachCell((cell) => { cell.fill = highlightFill; cell.border = thinBorder; });
  finalBalRow.getCell(9).numFmt = "₹ #,##0.00";
  finalBalRow.getCell(10).numFmt = "₹ #,##0.00";
  finalBalRow.getCell(11).numFmt = "₹ #,##0.00";

  finalizeSheet(sheet2);

  // ==========================================
  // SHEET 3, 4... TOWER SHEETS
  // ==========================================
  for (const tower of towers) {
    const sheetName = (tower.name || "Tower").slice(0, 30);
    const towerSheet = workbook.addWorksheet(sheetName);
    towerSheet.columns = [
      { width: 8 },  // Sr. No
      { width: 45 }, // Particulars
      { width: 10 }, // Unit
      { width: 18 }, // Prev Qty (%)
      { width: 18 }, // Curr Qty (%)
      { width: 18 }, // Cum Qty (%)
      { width: 20 }, // Prev Amt
      { width: 20 }, // Curr Amt
      { width: 20 }, // Cum Amt
    ];
    towerSheet.addRow([`To, ${clientName}`, "", "", "", "", "", "", "", `Date : ${billDate}`]);
    towerSheet.addRow([`Invoice No. ${billNo}`, "", "", "", "", "", "", "", `W. O. No. :- ${workOrderNo}`]);
    towerSheet.addRow([`Name Of Project :- ${projectName}`]);
    towerSheet.addRow([`Subject :- REF NO. : ${refNo}`]);
    towerSheet.addRow([`BUA Building - ${tower.name.toUpperCase()}`]);
    formatTopDetails(towerSheet, [1, 2, 3, 4, 5]);
    const approxArea = tower.approxArea || 0;
    const contractRate = tower.contractRate || 0;
    const totalTowerVal = approxArea * contractRate;
    const buaRow = towerSheet.addRow(["CIVIL WORK", "Sft", approxArea, "@", contractRate, "", totalTowerVal]);
    buaRow.font = { bold: true };
    buaRow.getCell(7).numFmt = "₹ #,##0.00";
    towerSheet.addRow([]);

    const tHeaders = [
      "Sr. No.", "Particulars of Item", "Unit",
      "Previous Qty (%)", "This Bill Qty (%)", "Cumulative Qty (%)",
      "Previous Amount (₹)", "This Bill Amount (₹)", "Cumulative Amount (₹)"
    ];
    const thRow = towerSheet.addRow(tHeaders);
    formatHeaderRow(thRow);

    const items = tower.workItems || [];
    let tPrevTotal = 0;
    let tCurrTotal = 0;

    items.forEach((item: any, i: number) => {
      const isQty = tower.calculationMethod === "QUANTITY" || item.unit === "Sft";
      const itemRate = item.rate || tower.contractRate || 0;

      const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : (item.previousPct > 0 ? (item.partAmount * item.previousPct / 100) : 0);
      const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : (item.currentPct > 0 ? (item.partAmount * item.currentPct / 100) : 0);
      const cumA = item.cumulativeAmt ?? (prevA + currA);

      let prevQ = item.previousPct ?? item.previousQty ?? 0;
      if (isQty && prevA > 0 && itemRate > 0) {
        prevQ = Math.round(prevA / itemRate);
      }

      let currQ = item.currentPct ?? item.currentQty ?? 0;
      if (isQty && currQ === 0 && currA > 0 && itemRate > 0) {
        currQ = Math.round(currA / itemRate);
      }

      const cumQ = isQty ? (prevQ + currQ) : (item.cumulativePct ?? (prevQ + currQ));

      tPrevTotal += prevA;
      tCurrTotal += currA;

      const r = towerSheet.addRow([
        i + 1, item.name, item.unit || "%",
        prevQ, currQ, cumQ,
        prevA, currA, cumA
      ]);

      r.getCell(1).alignment = { horizontal: "center" };
      r.getCell(3).alignment = { horizontal: "center" };
      r.getCell(7).numFmt = "₹ #,##0.00";
      r.getCell(8).numFmt = "₹ #,##0.00";
      r.getCell(9).numFmt = "₹ #,##0.00";
      r.eachCell((cell) => { cell.border = thinBorder; });
    });

    const tTotRow = towerSheet.addRow(["", "TOTAL AMOUNT", "", "", "", "", tPrevTotal, tCurrTotal, tPrevTotal + tCurrTotal]);
    tTotRow.font = { bold: true };
    tTotRow.eachCell((cell) => { cell.fill = subHeaderFill; cell.border = thinBorder; });
    tTotRow.getCell(7).numFmt = "₹ #,##0.00";
    tTotRow.getCell(8).numFmt = "₹ #,##0.00";
    tTotRow.getCell(9).numFmt = "₹ #,##0.00";

    finalizeSheet(towerSheet);
  }

  // ==========================================
  // SHEET 5: SUPPLY LABOUR SHEET
  // ==========================================
  const supplySheet = workbook.addWorksheet("Supply Sheet");
  supplySheet.columns = [
    { width: 15 }, // Date
    { width: 15 }, // Challan No.
    { width: 40 }, // Description
    { width: 12 }, // Fitter Count
    { width: 10 }, // Hours
    { width: 15 }, // Total Fitter Hours
    { width: 12 }, // Fitter Helper
    { width: 10 }, // Hours
    { width: 15 }, // Total Helper Hours
    { width: 20 }, // Amount
  ];
  supplySheet.addRow([`To, ${clientName}`, "", "", "", "", "", "", "", `Date : ${billDate}`]);
  supplySheet.addRow([`Invoice No. ${billNo}`, "", "", "", "", "", "", "", `W. O. No. :- ${workOrderNo}`]);
  supplySheet.addRow([`Name Of Project :- ${projectName}`]);
  supplySheet.addRow([`Labour's Supply - ${billDate}`]);
  supplySheet.addRow([`Contractor : RCR ENTERPRISES`]);
  supplySheet.addRow([]);
  formatTopDetails(supplySheet, [1, 2, 3, 4, 5]);

  const sHeaders = [
    "Date", "Challan No.", "Description Contract basis work",
    "Fitter Count", "Hours", "Total Fitter Hours",
    "Fitter Helper", "Hours", "Total Helper Hours", "Amount (₹)"
  ];
  const shRow = supplySheet.addRow(sHeaders);
  formatHeaderRow(shRow);

  let totalFitterHours = 0;
  let totalHelperHours = 0;
  let totalSupplyAmount = 0;

  supplyEntries.forEach((se: any) => {
    const fHrs = (se.fitterQty || 0) * (se.fitterHours || 0);
    const hHrs = (se.helperQty || 0) * (se.helperHours || 0);
    totalFitterHours += fHrs;
    totalHelperHours += hHrs;
    totalSupplyAmount += se.totalAmount || 0;

    const r = supplySheet.addRow([
      se.date ? new Date(se.date).toLocaleDateString("en-IN") : "-",
      se.challanNo || "-",
      se.description,
      se.fitterQty || 0,
      se.fitterHours || 0,
      fHrs,
      se.helperQty || 0,
      se.helperHours || 0,
      hHrs,
      se.totalAmount || 0
    ]);

    r.getCell(1).alignment = { horizontal: "center" };
    r.getCell(2).alignment = { horizontal: "center" };
    r.getCell(10).numFmt = "₹ #,##0.00";
    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  supplySheet.addRow([]);
  const sTotHrsRow = supplySheet.addRow(["", "", "Total Hours", "", "", totalFitterHours, "", "", totalHelperHours, ""]);
  sTotHrsRow.font = { bold: true };
  sTotHrsRow.eachCell((cell) => { cell.fill = subHeaderFill; cell.border = thinBorder; });

  const fitterDays = Math.round((totalFitterHours / 8) * 100) / 100;
  const helperDays = Math.round((totalHelperHours / 8) * 100) / 100;
  const sDaysRow = supplySheet.addRow(["", "", "Total Days (Nos = Hrs / 8)", "", "", fitterDays, "", "", helperDays, ""]);
  sDaysRow.eachCell((cell) => { cell.border = thinBorder; });

  const fitterTotalAmt = fitterDays * 1100;
  const helperTotalAmt = helperDays * 800;

  const sRateRow = supplySheet.addRow(["", "", "Rate (₹)", "", "", 1100, "", "", 800, ""]);
  sRateRow.font = { bold: true };
  sRateRow.eachCell((cell) => { cell.border = thinBorder; });

  const sFinalRow = supplySheet.addRow(["", "", "TOTAL SUPPLY AMOUNT (₹)", "", "", fitterTotalAmt, "", "", helperTotalAmt, totalSupplyAmount]);
  sFinalRow.font = { bold: true, size: 11, color: { argb: "1F4E79" } };
  sFinalRow.eachCell((cell) => { cell.fill = highlightFill; cell.border = thinBorder; });
  sFinalRow.getCell(6).numFmt = "₹ #,##0.00";
  sFinalRow.getCell(9).numFmt = "₹ #,##0.00";
  sFinalRow.getCell(10).numFmt = "₹ #,##0.00";

  finalizeSheet(supplySheet);

  // ==========================================
  // SHEET 6: BALANCE SHEET & CLIENT LEDGER
  // ==========================================
  const balSheet = workbook.addWorksheet("Balance sheet");
  balSheet.columns = [
    { width: 8 },  // Sr. No
    { width: 15 }, // Date
    { width: 45 }, // RA Bill Ref / Description
    { width: 20 }, // Bill Amount (Gross)
    { width: 18 }, // Retention
    { width: 20 }, // Net Bill Amount
    { width: 25 }, // Account Credited / Recd
    { width: 18 }, // TDS Deducted
    { width: 25 }, // Cumulative Recd / Advance
    { width: 20 }, // Running Balance
    { width: 20 }, // GST Amount
    { width: 22 }, // Balance with GST
  ];
  const bHeaders = [
    "Sr. No.", "Date", "RA Bill Ref / Description", "Bill Amount (Gross)",
    `Retention (${retPct}%)`, "Net Bill Amount", "Account Credited / Recd",
    "1% TDS Deducted", "Cumulative Recd / Advance", "Running Balance", "GST Amount (18%)", "Balance with GST"
  ];
  const bhRow = balSheet.addRow(bHeaders);
  formatHeaderRow(bhRow);

  const allBills = site.bills || [];
  const allPayments = payments || [];
  const ledger: any[] = [];

  allBills.forEach((b: any) => {
    const gross = (b.lines || []).reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
    const bRetPct = b.retentionPct ?? retPct;
    const bTdsPct = b.tdsPct ?? tdsPct;
    const bCgst = b.cgstPct ?? cgstPct;
    const bSgst = b.sgstPct ?? sgstPct;

    const bRetAmt = gross * (bRetPct / 100);
    const bNetAmt = gross - bRetAmt;
    const bTdsAmt = gross * (bTdsPct / 100);
    const bGstAmt = gross * ((bCgst + bSgst) / 100);

    ledger.push({
      type: "BILL",
      date: new Date(b.billDate || b.createdAt),
      refName: `BILL NO.${b.billNo || "01"} (${b.periodLabel || site.projectName || "Site"})`,
      grossAmount: gross,
      retentionAmt: bRetAmt,
      netBilledAmt: bNetAmt,
      accountCredited: "—",
      paymentRecd: 0,
      tdsAmt: bTdsAmt,
      gstAmt: bGstAmt,
    });
  });

  allPayments.forEach((p: any) => {
    ledger.push({
      type: "PAYMENT",
      date: new Date(p.date || p.createdAt),
      refName: p.remarks || `CLIENT PAYMENT (${p.mode || "NEFT"})`,
      grossAmount: 0,
      retentionAmt: 0,
      netBilledAmt: 0,
      accountCredited: p.accountCredited || p.mode || "BANK",
      paymentRecd: p.amount || 0,
      tdsAmt: 0,
      gstAmt: 0,
    });
  });

  ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runCumNetBilled = 0;
  let runCumRecd = 0;
  let runCumTds = 0;
  let runCumGst = 0;

  ledger.forEach((item, idx) => {
    if (item.type === "BILL") {
      runCumNetBilled += item.netBilledAmt;
      runCumTds += item.tdsAmt;
      runCumGst += item.gstAmt;
    } else {
      runCumRecd += item.paymentRecd;
    }

    const cumAdv = runCumRecd + runCumTds;
    const runBal = runCumNetBilled - cumAdv;
    const balWithGst = runBal + runCumGst;

    const r = balSheet.addRow([
      idx + 1,
      item.date ? item.date.toLocaleDateString("en-IN") : "-",
      item.refName,
      item.type === "BILL" ? item.grossAmount : "-",
      item.type === "BILL" ? item.retentionAmt : "-",
      item.type === "BILL" ? item.netBilledAmt : "-",
      item.type === "PAYMENT" ? `${item.paymentRecd} (${item.accountCredited})` : "-",
      item.type === "BILL" ? item.tdsAmt : "-",
      cumAdv,
      runBal,
      item.type === "BILL" ? item.gstAmt : "-",
      balWithGst,
    ]);

    r.getCell(1).alignment = { horizontal: "center" };
    r.getCell(2).alignment = { horizontal: "center" };

    if (item.type === "BILL") {
      r.getCell(4).numFmt = "₹ #,##0.00";
      r.getCell(5).numFmt = "₹ #,##0.00";
      r.getCell(6).numFmt = "₹ #,##0.00";
      r.getCell(8).numFmt = "₹ #,##0.00";
      r.getCell(11).numFmt = "₹ #,##0.00";
    }

    r.getCell(9).numFmt = "₹ #,##0.00";
    r.getCell(10).numFmt = "₹ #,##0.00";
    r.getCell(12).numFmt = "₹ #,##0.00";

    // Format colors for clear ideas
    if (item.type === "BILL") {
      r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
      r.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DDEBF7' } }; // Light blue for Net Billed
    }
    
    r.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } }; // Light green for Credited
    r.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6E0B4' } }; // Darker green for Cumulative Recd

    // Format Running Balance cell color
    if (runBal > 0) {
      r.getCell(10).font = { color: { argb: "9C0006" }, bold: true }; // Soft Red text
      r.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } }; // Soft Red bg
      r.getCell(12).font = { color: { argb: "9C0006" }, bold: true };
      r.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } }; 
    } else {
      r.getCell(10).font = { color: { argb: "006100" }, bold: true }; // Soft Green text
      r.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6E0B4' } }; // Soft Green bg
      r.getCell(12).font = { color: { argb: "006100" }, bold: true };
      r.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6E0B4' } };
    }

    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  finalizeSheet(balSheet);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
