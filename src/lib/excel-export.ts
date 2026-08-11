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

  // ==========================================
  // SHEET 1: TAX INVOICE
  // ==========================================
  const sheet1 = workbook.addWorksheet("Sheet1");
  sheet1.columns = [
    { header: "Sr. No.", key: "sr", width: 10 },
    { header: "Description", key: "desc", width: 50 },
    { header: "Amount (₹)", key: "amount", width: 20 },
  ];

  sheet1.mergeCells("A1:C1");
  sheet1.getCell("A1").value = "TAX INVOICE";
  sheet1.getCell("A1").font = { bold: true, size: 16 };
  sheet1.getCell("A1").alignment = { horizontal: "center" };

  sheet1.addRow(["To,", "", `Date : ${billDate}`]);
  sheet1.addRow([clientName.toUpperCase(), "", `Invoice No. ${billNo}`]);
  if (site.address) sheet1.addRow([`ADD :- ${site.address}`]);
  if (site.gstNo) sheet1.addRow([`GST No. : ${site.gstNo}`]);
  sheet1.addRow([]);

  sheet1.addRow([`Name of Work: Reinforcement Work`]);
  sheet1.addRow([`Name Of Project : ${projectName}`]);
  sheet1.addRow([`Subject :- REF NO. : ${refNo}`]);
  sheet1.addRow([]);

  // Calculate bill total amounts
  const lines = runningBill?.lines || [];
  const currentTotal = lines.reduce((sum: number, l: any) => sum + (l.currentAmount || 0), 0);
  const cgst = currentTotal * ((runningBill?.cgstPct || 9) / 100);
  const sgst = currentTotal * ((runningBill?.sgstPct || 9) / 100);
  const netPayable = currentTotal + cgst + sgst;

  const invoiceHeaderRow = sheet1.addRow(["Sr. No.", "Description", "Amount (₹)"]);
  invoiceHeaderRow.font = { bold: true };

  sheet1.addRow([1, `${projectName} Work done Amount`, currentTotal]);
  sheet1.addRow(["", "Taxable Amount", currentTotal]);
  sheet1.addRow(["", `Add CGST@${runningBill?.cgstPct || 9}%`, cgst]);
  sheet1.addRow(["", `Add SGST@${runningBill?.sgstPct || 9}%`, sgst]);
  const netRow = sheet1.addRow(["", "Net Payable Amount", netPayable]);
  netRow.font = { bold: true };

  sheet1.addRow([]);
  sheet1.addRow(["NAME :- RCR ENTERPRISES", "", "FOR RCR ENTERPRISES"]);
  sheet1.addRow(["A/C :- 088405500559"]);
  sheet1.addRow(["IFSC :- ICIC0000884", "", "AUTHORISED SIGNATORY"]);

  // ==========================================
  // SHEET 2: ABSTRACT SUMMARY
  // ==========================================
  const sheet2 = workbook.addWorksheet("Sheet2");
  sheet2.addRow([`To, ${clientName}`, "", "", "", "", "", "", "", "", `Date : ${billDate}`]);
  sheet2.addRow([`Invoice No. ${billNo}`, "", "", "", "", "", "", "", "", `W. O. No. :- ${workOrderNo}`]);
  sheet2.addRow([`Name Of Project :- ${projectName}`]);
  sheet2.addRow([`Subject :- REF NO. : ${refNo}`]);
  sheet2.addRow([]);

  const absHeaders = [
    "Sr. No", "Description", "Unit", "W.O. Qty", "Rate",
    "Previous Qty", "This Bill Qty", "Cumulative Qty",
    "Previous Amount", "This Bill Amount", "Cumulative Amount"
  ];
  const hRow = sheet2.addRow(absHeaders);
  hRow.font = { bold: true };

  lines.forEach((line: any, idx: number) => {
    sheet2.addRow([
      idx + 1,
      line.description,
      line.unit,
      line.woQty || "-",
      line.rate,
      line.previousQty || 0,
      line.currentQty || 0,
      (line.previousQty || 0) + (line.currentQty || 0),
      line.previousAmount || 0,
      line.currentAmount || 0,
      (line.previousAmount || 0) + (line.currentAmount || 0),
    ]);
  });

  const totPrevAmt = lines.reduce((s: number, l: any) => s + (l.previousAmount || 0), 0);
  const totCurrAmt = lines.reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
  const totCumAmt = totPrevAmt + totCurrAmt;

  const totalRow = sheet2.addRow(["", "Total Amount", "", "", "", "", "", "", totPrevAmt, totCurrAmt, totCumAmt]);
  totalRow.font = { bold: true };

  const retPct = runningBill?.retentionPct ?? site.retentionPct ?? 2;
  const tdsPct = runningBill?.tdsPct ?? site.tdsPct ?? 1;
  const cgstPct = runningBill?.cgstPct ?? site.cgstPct ?? 9;
  const sgstPct = runningBill?.sgstPct ?? site.sgstPct ?? 9;

  const retAmt = totCurrAmt * (retPct / 100);
  const tdsAmt = totCurrAmt * (tdsPct / 100);
  const balAmt = totCurrAmt - retAmt - tdsAmt;

  const cgstAmt = totCurrAmt * (cgstPct / 100);
  const sgstAmt = totCurrAmt * (sgstPct / 100);

  sheet2.addRow(["", `ADD CGST @${cgstPct}%`, "", "", "", "", "", "", totPrevAmt * (cgstPct / 100), cgstAmt, (totPrevAmt * (cgstPct / 100)) + cgstAmt]);
  sheet2.addRow(["", `ADD SGST @${sgstPct}%`, "", "", "", "", "", "", totPrevAmt * (sgstPct / 100), sgstAmt, (totPrevAmt * (sgstPct / 100)) + sgstAmt]);
  sheet2.addRow(["", `LESS RETENTION @${retPct}%`, "", "", "", "", "", "", 0, retAmt, retAmt]);
  sheet2.addRow(["", `LESS TDS @${tdsPct}%`, "", "", "", "", "", "", 0, tdsAmt, tdsAmt]);
  const finalBalRow = sheet2.addRow(["", "Net Payable Balance", "", "", "", "", "", "", totPrevAmt, balAmt, totPrevAmt + balAmt]);
  finalBalRow.font = { bold: true };


  // ==========================================
  // SHEET 3, 4... TOWER SHEETS
  // ==========================================
  for (const tower of towers) {
    const sheetName = (tower.name || "Tower").slice(0, 30);
    const towerSheet = workbook.addWorksheet(sheetName);
    towerSheet.addRow([`To, ${clientName}`, "", "", "", "", "", "", "", `Date : ${billDate}`]);
    towerSheet.addRow([`Invoice No. ${billNo}`, "", "", "", "", "", "", "", `W. O. No. :- ${workOrderNo}`]);
    towerSheet.addRow([`Name Of Project :- ${projectName}`]);
    towerSheet.addRow([`Subject :- REF NO. : ${refNo}`]);
    towerSheet.addRow([`BUA Building - ${tower.name.toUpperCase()}`]);
    const approxArea = tower.approxArea || 0;
    const contractRate = tower.contractRate || 0;
    const totalTowerVal = approxArea * contractRate;
    const buaRow = towerSheet.addRow(["CIVIL WORK", "Sft", approxArea, "@", contractRate, "", totalTowerVal]);
    buaRow.font = { bold: true };
    towerSheet.addRow([]);

    const tHeaders = [
      "Sr. No.", "Particulars of Item", "Unit",
      "Previous Qty (%)", "This Bill Qty (%)", "Cumulative Qty (%)",
      "Previous Amount (₹)", "This Bill Amount (₹)", "Cumulative Amount (₹)"
    ];
    const thRow = towerSheet.addRow(tHeaders);
    thRow.font = { bold: true };

    const items = tower.workItems || [];
    let tPrevTotal = 0;
    let tCurrTotal = 0;

    items.forEach((item: any, i: number) => {
      const prevQ = item.previousPct ?? item.previousQty ?? 0;
      const currQ = item.currentPct ?? item.currentQty ?? 0;
      const cumQ = item.cumulativePct ?? (prevQ + currQ);

      const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : (prevQ > 0 ? (item.partAmount * prevQ / 100) : 0);
      const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : (currQ > 0 ? (item.partAmount * currQ / 100) : 0);
      const cumA = item.cumulativeAmt ?? (prevA + currA);

      tPrevTotal += prevA;
      tCurrTotal += currA;

      towerSheet.addRow([
        i + 1, item.name, item.unit || "%",
        prevQ, currQ, cumQ,
        prevA, currA, cumA
      ]);
    });

    const tTotRow = towerSheet.addRow(["", "TOTAL AMOUNT", "", "", "", "", tPrevTotal, tCurrTotal, tPrevTotal + tCurrTotal]);
    tTotRow.font = { bold: true };
  }

  // ==========================================
  // SHEET 5: SUPPLY LABOUR SHEET
  // ==========================================
  const supplySheet = workbook.addWorksheet("supply");
  supplySheet.addRow([`To, ${clientName}`, "", "", "", "", "", "", "", `Date : ${billDate}`]);
  supplySheet.addRow([`Invoice No. ${billNo}`, "", "", "", "", "", "", "", `W. O. No. :- ${workOrderNo}`]);
  supplySheet.addRow([`Name Of Project :- ${projectName}`]);
  supplySheet.addRow([`Labour's Supply - ${billDate}`]);
  supplySheet.addRow([`Contractor : RCR ENTERPRISES`]);
  supplySheet.addRow([]);

  const sHeaders = [
    "Date", "Challan No.", "Description Contract basis work",
    "Fitter Count", "Hours", "Total Fitter Hours",
    "Fitter Helper", "Hours", "Total Helper Hours", "Amount (₹)"
  ];
  const shRow = supplySheet.addRow(sHeaders);
  shRow.font = { bold: true };

  let totalFitterHours = 0;
  let totalHelperHours = 0;
  let totalSupplyAmount = 0;

  supplyEntries.forEach((se: any) => {
    const fHrs = (se.fitterQty || 0) * (se.fitterHours || 0);
    const hHrs = (se.helperQty || 0) * (se.helperHours || 0);
    totalFitterHours += fHrs;
    totalHelperHours += hHrs;
    totalSupplyAmount += se.totalAmount || 0;

    supplySheet.addRow([
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
  });

  supplySheet.addRow([]);
  const sTotHrsRow = supplySheet.addRow(["", "", "Total Hours", "", "", totalFitterHours, "", "", totalHelperHours, ""]);
  sTotHrsRow.font = { bold: true };

  const fitterDays = Math.round((totalFitterHours / 8) * 100) / 100;
  const helperDays = Math.round((totalHelperHours / 8) * 100) / 100;
  supplySheet.addRow(["", "", "Total Days (Nos = Hrs / 8)", "", "", fitterDays, "", "", helperDays, ""]);

  const fitterTotalAmt = fitterDays * 1100;
  const helperTotalAmt = helperDays * 800;

  const sRateRow = supplySheet.addRow(["", "", "Rate (₹)", "", "", 1100, "", "", 800, ""]);
  sRateRow.font = { bold: true };

  const sFinalRow = supplySheet.addRow(["", "", "TOTAL SUPPLY AMOUNT (₹)", "", "", fitterTotalAmt, "", "", helperTotalAmt, totalSupplyAmount]);
  sFinalRow.font = { bold: true };

  // ==========================================
  // SHEET 6: BALANCE SHEET
  // ==========================================
  const balSheet = workbook.addWorksheet("Balance sheet");
  const bHeaders = [
    "Sr. No.", "Date", "RA Bill Ref / Description", "Bill Amount (Gross)",
    `Retention (${retPct}%)`, "Net Bill Amount", "Account Credited / Recd",
    "1% TDS Deducted", "Cumulative Recd / Advance", "Running Balance", "GST Amount (18%)", "Balance with GST"
  ];
  const bhRow = balSheet.addRow(bHeaders);
  bhRow.font = { bold: true };

  // Build unified chronological ledger (Bills + Payments)
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

  ledger.forEach((item, idx) => {
    if (item.type === "BILL") {
      runCumNetBilled += item.netBilledAmt;
      runCumTds += item.tdsAmt;
    } else {
      runCumRecd += item.paymentRecd;
    }

    const cumAdv = runCumRecd + runCumTds;
    const runBal = runCumNetBilled - runCumRecd;
    const balWithGst = runBal + item.gstAmt;

    balSheet.addRow([
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
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

