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

  const retPct = runningBill?.retentionPct || 2;
  const tdsPct = runningBill?.tdsPct || 1;
  const retAmt = totCurrAmt * (retPct / 100);
  const tdsAmt = totCurrAmt * (tdsPct / 100);
  const balAmt = totCurrAmt - retAmt - tdsAmt;

  sheet2.addRow(["", `ADD CGST @${runningBill?.cgstPct || 9}%`, "", "", "", "", "", "", totPrevAmt * 0.09, cgst, (totPrevAmt * 0.09) + cgst]);
  sheet2.addRow(["", `ADD SGST @${runningBill?.sgstPct || 9}%`, "", "", "", "", "", "", totPrevAmt * 0.09, sgst, (totPrevAmt * 0.09) + sgst]);
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
    towerSheet.addRow([`BUA Building - ${tower.name.toUpperCase()}`]);
    const approxArea = tower.approxArea || 0;
    const contractRate = tower.contractRate || 0;
    const totalTowerVal = approxArea * contractRate;
    const buaRow = towerSheet.addRow(["CIVIL WORK", "Sft", approxArea, "@", contractRate, "", totalTowerVal]);
    buaRow.font = { bold: true };
    towerSheet.addRow([]);

    const tHeaders = [
      "Sr. No.", "Particulars of Item", "Unit",
      "Previous Qty", "This Bill Qty", "Cumulative Qty",
      "Previous Amount", "This Bill Amount", "Cumulative Amount"
    ];
    const thRow = towerSheet.addRow(tHeaders);
    thRow.font = { bold: true };

    const items = tower.workItems || [];
    let tPrevTotal = 0;
    let tCurrTotal = 0;

    items.forEach((item: any, i: number) => {
      const prevQ = item.previousQty || 0;
      const currQ = item.currentQty || 0;
      const cumQ = prevQ + currQ;
      const prevA = prevQ * item.rate;
      const currA = currQ * item.rate;
      const cumA = prevA + currA;

      tPrevTotal += prevA;
      tCurrTotal += currA;

      towerSheet.addRow([
        i + 1, item.name, item.unit,
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
  supplySheet.addRow([`Labour's Supply - ${billDate}`]);
  supplySheet.addRow([`Contractor : RCR ENTERPRISES`]);
  supplySheet.addRow([]);

  const sHeaders = [
    "Date", "Challan No.", "Description Contract basis work",
    "Fitter Count", "Fitter Hours", "Total Fitter Hours",
    "Helper Count", "Helper Hours", "Total Helper Hours", "Amount (₹)"
  ];
  const shRow = supplySheet.addRow(sHeaders);
  shRow.font = { bold: true };

  let totalFitterHours = 0;
  let totalHelperHours = 0;
  let totalSupplyAmount = 0;

  supplyEntries.forEach((se: any) => {
    const fHrs = se.fitterQty * se.fitterHours;
    const hHrs = se.helperQty * se.helperHours;
    totalFitterHours += fHrs;
    totalHelperHours += hHrs;
    totalSupplyAmount += se.totalAmount || 0;

    supplySheet.addRow([
      se.date ? new Date(se.date).toLocaleDateString("en-IN") : "-",
      se.challanNo || "-",
      se.description,
      se.fitterQty, se.fitterHours, fHrs,
      se.helperQty, se.helperHours, hHrs,
      se.totalAmount
    ]);
  });

  supplySheet.addRow([]);
  const sSumRow = supplySheet.addRow(["", "", "TOTAL SUPPLY AMOUNT", "", "", totalFitterHours, "", "", totalHelperHours, totalSupplyAmount]);
  sSumRow.font = { bold: true };

  // ==========================================
  // SHEET 6: BALANCE SHEET
  // ==========================================
  const balSheet = workbook.addWorksheet("Balance sheet");
  const bHeaders = [
    "Sr. No.", "Date", "RA Bill Ref / Description", "Bill Amount",
    "Retention 2%", "Net Bill Amount", "Payment Received Date",
    "Payment Mode", "Account Credited", "Amount Received",
    "1% TDS Deducted", "Outstanding Balance"
  ];
  const bhRow = balSheet.addRow(bHeaders);
  bhRow.font = { bold: true };

  let runningBalance = totCurrAmt;

  payments.forEach((pay: any, idx: number) => {
    runningBalance -= (pay.amount || 0);
    balSheet.addRow([
      idx + 1,
      pay.date ? new Date(pay.date).toLocaleDateString("en-IN") : "-",
      pay.remarks || "Payment Received",
      "", "", "",
      pay.date ? new Date(pay.date).toLocaleDateString("en-IN") : "-",
      pay.mode || "CASH",
      pay.accountCredited || "-",
      pay.amount,
      "",
      runningBalance
    ]);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
