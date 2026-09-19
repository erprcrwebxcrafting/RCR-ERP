import ExcelJS from "exceljs";

export type BillLineData = {
  description: string;
  unit: string;
  woQty: number | null;
  rate: number;
  previousQty: number;
  currentQty: number;
  cumulativeQty: number;
  previousAmount: number;
  currentAmount: number;
  cumulativeAmount: number;
  buildingName?: string | null;
};

export type SupplyRow = {
  date: string;
  challanNo?: string;
  description: string;
  fitterCount: number;
  fitterHours: number;
  helperCount: number;
  helperHours: number;
};

export type PaymentRow = {
  date: string;
  accountCredited: string;
  amount: number;
};

export type RunningBillData = {
  companyName: string; // e.g. RCR ENTERPRISES
  clientName: string;
  clientAddress: string;
  clientPan?: string;
  clientGst?: string;
  workName: string; // e.g. "Reinforcement Work."
  projectLabel: string; // e.g. "BMC COLONY, BUILDING NO :- S3 VIKHROLI, MUMBAI"
  workOrderNo?: string;
  billNo: string;
  refNo?: string;
  billDate: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankIfsc: string;
  cgstPct: number;
  sgstPct: number;
  tdsPct: number;
  retentionPct: number;

  summaryLines: BillLineData[]; // Sheet2 rows (per building total + labour supply lines)
  buildingSheets: { buildingName: string; approxArea: number; unit: string; rate: number; lines: BillLineData[] }[];
  supplyRows: SupplyRow[];
  supplyMonthLabel: string;
  payments: PaymentRow[];
  thisBillGrossAmount: number;
};

function headerBlock(ws: ExcelJS.Worksheet, data: RunningBillData, startRow: number) {
  ws.getCell(`A${startRow}`).value = "To,";
  ws.getCell(`H${startRow}`).value = `Date : ${data.billDate}`;
  ws.getCell(`A${startRow + 1}`).value = data.clientName;
  ws.getCell(`A${startRow + 1}`).font = { bold: true };
  ws.getCell(`H${startRow + 1}`).value = `Invoice No. ${data.billNo}`;
  ws.getCell(`A${startRow + 2}`).value = `ADD :- ${data.clientAddress}`;
  ws.getCell(`A${startRow + 3}`).value = `Name Of Project :- ${data.projectLabel}`;
  ws.getCell(`A${startRow + 4}`).value = `Name of Work:- ${data.workName}`;
  ws.getCell(`A${startRow + 5}`).value = `Subject :- REF NO. : ${data.refNo || "1"}`;
  if (data.workOrderNo) ws.getCell(`A${startRow + 6}`).value = `W. O. No. :- ${data.workOrderNo}`;
  return startRow + 7;
}

export async function generateRunningBillWorkbook(data: RunningBillData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = data.companyName;
  wb.created = new Date();

  // ---------- Sheet 1: Tax Invoice ----------
  const inv = wb.addWorksheet("Tax Invoice");
  inv.columns = [{ width: 6 }, { width: 55 }, { width: 18 }];
  inv.getCell("A1").value = "TAX INVOICE";
  inv.getCell("A1").font = { bold: true, size: 14 };
  inv.mergeCells("A1:C1");

  let r = 3;
  inv.getCell(`A${r}`).value = "To, ";
  inv.getCell(`C${r}`).value = `Date : ${data.billDate}`;
  r++;
  inv.getCell(`A${r}`).value = data.clientName;
  inv.getCell(`A${r}`).font = { bold: true };
  inv.getCell(`C${r}`).value = `Invoice No. ${data.billNo}`;
  r++;
  inv.getCell(`A${r}`).value = `ADD :- ${data.clientAddress}`;
  r++;
  if (data.clientPan) { inv.getCell(`A${r}`).value = `Pan No. : ${data.clientPan}`; r++; }
  if (data.clientGst) { inv.getCell(`A${r}`).value = `GST No. : ${data.clientGst}`; r++; }
  inv.getCell(`A${r}`).value = `Name of Work:- ${data.workName}`;
  r++;
  inv.getCell(`A${r}`).value = `Name Of Project :- ${data.projectLabel}`;
  r++;
  inv.getCell(`A${r}`).value = `Subject :- REF NO. : ${data.refNo || "1"}`;
  r += 2;

  inv.getCell(`A${r}`).value = "Sr. No.";
  inv.getCell(`B${r}`).value = "Description";
  inv.getCell(`C${r}`).value = "Amount";
  inv.getRow(r).font = { bold: true };
  r++;

  const taxable = data.thisBillGrossAmount;
  inv.getCell(`A${r}`).value = 1;
  inv.getCell(`B${r}`).value = `${data.buildingSheets.map((b) => b.buildingName).join(" & ")} ${data.workName} Amount`;
  inv.getCell(`C${r}`).value = taxable;
  r++;
  inv.getCell(`B${r}`).value = "Taxable Amount";
  r++;
  const cgstAmt = (taxable * data.cgstPct) / 100;
  const sgstAmt = (taxable * data.sgstPct) / 100;
  inv.getCell(`B${r}`).value = `Add CGST@${data.cgstPct}%`;
  inv.getCell(`C${r}`).value = cgstAmt;
  r++;
  inv.getCell(`B${r}`).value = `Add SGST@${data.sgstPct}%`;
  inv.getCell(`C${r}`).value = sgstAmt;
  r++;
  inv.getCell(`B${r}`).value = "Net Payable Amount";
  inv.getCell(`B${r}`).font = { bold: true };
  inv.getCell(`C${r}`).value = taxable + cgstAmt + sgstAmt;
  inv.getCell(`C${r}`).font = { bold: true };
  r += 2;

  inv.getCell(`A${r}`).value = `  NAME :- ${data.companyName}`;
  inv.getCell(`C${r}`).value = `FOR ${data.companyName}`;
  r++;
  inv.getCell(`A${r}`).value = `     A/C :-           ${data.bankAccountNo}`;
  r++;
  inv.getCell(`A${r}`).value = `     IFSC :-          ${data.bankIfsc}`;
  r += 2;
  inv.getCell(`C${r}`).value = "AUTHORISED SIGNATORY";

  // ---------- Sheet 2: Running Bill Summary ----------
  const sum = wb.addWorksheet("Running Bill Summary");
  sum.columns = Array(11).fill({ width: 14 });
  sum.getColumn(2).width = 34;
  let sr = headerBlock(sum, data, 2);
  sr += 1;

  const headerRow1 = ["Sr. No", "Description", "Unit", "W.O.", "Rate", "Previous", "This Bill", "Cumulative", "Previous", "This Bill", "Previous"];
  const headerRow2 = ["", "", "", "Qty.", "", "Quantity", "Quantity", "Quantity", "Amount", "Amount", "Amount"];
  sum.getRow(sr).values = headerRow1;
  sum.getRow(sr).font = { bold: true };
  sum.getRow(sr + 1).values = headerRow2;
  sum.getRow(sr + 1).font = { bold: true };
  sr += 2;

  let totalPrevQty = 0, totalCurQty = 0, totalCumQty = 0;
  let totalPrevAmt = 0, totalCurAmt = 0, totalCumAmt = 0;

  data.summaryLines.forEach((line, i) => {
    sum.getRow(sr).values = [
      i + 1, line.description, line.unit, line.woQty ?? "", line.rate,
      line.previousQty, line.currentQty, line.cumulativeQty,
      line.previousAmount, line.currentAmount, line.cumulativeAmount,
    ];
    totalPrevQty += line.previousQty; totalCurQty += line.currentQty; totalCumQty += line.cumulativeQty;
    totalPrevAmt += line.previousAmount; totalCurAmt += line.currentAmount; totalCumAmt += line.cumulativeAmount;
    sr++;
  });

  sum.getRow(sr).values = ["", "Total Amount", "", "", "", "", "", "", totalPrevAmt, totalCurAmt, totalCumAmt];
  sum.getRow(sr).font = { bold: true };
  sr++;
  const cgstAmt2 = (totalCurAmt * data.cgstPct) / 100;
  const sgstAmt2 = (totalCurAmt * data.sgstPct) / 100;
  sum.getRow(sr).values = ["", `ADD CGST @${data.cgstPct}%`, "", "", "", "", "", "", "", cgstAmt2, ""]; sr++;
  sum.getRow(sr).values = ["", `ADD SGST @${data.sgstPct}%`, "", "", "", "", "", "", "", sgstAmt2, ""]; sr++;
  const retentionAmt = (totalCurAmt * data.retentionPct) / 100;
  sum.getRow(sr).values = ["", `LESS RETENTION@${data.retentionPct}%`, "", "", "", "", "", "", 0, retentionAmt, 0]; sr++;
  sr++;
  const grossAmt = totalCurAmt + cgstAmt2 + sgstAmt2 - retentionAmt;
  sum.getRow(sr).values = ["", "Gross Amount", "", "", "", "", "", "", 0, grossAmt, grossAmt];
  sum.getRow(sr).font = { bold: true };
  sr++;
  const tdsAmt = (grossAmt * data.tdsPct) / 100;
  sum.getRow(sr).values = ["", `TDS ${data.tdsPct}% Less amount`, "", "", "", "", "", "", "", tdsAmt, ""]; sr++;
  sum.getRow(sr).values = ["", "Balance", "", "", "", "", "", "", "", grossAmt - tdsAmt, ""];
  sum.getRow(sr).font = { bold: true };

  // ---------- Building-wise detail sheets ----------
  for (const b of data.buildingSheets) {
    const wsName = b.buildingName.slice(0, 31);
    const ws = wb.addWorksheet(wsName);
    ws.columns = Array(10).fill({ width: 14 });
    ws.getColumn(2).width = 34;
    let row = 2;
    ws.getCell(`B${row}`).value = data.clientName; ws.getCell(`B${row}`).font = { bold: true }; row++;
    ws.getCell(`B${row}`).value = `Name of Work:- ${data.workName}`; row++;
    ws.getCell(`B${row}`).value = `Subject :- REF NO. : ${data.refNo || "1"}`; row++;
    ws.getCell(`B${row}`).value = `BUA Building - ${b.buildingName}`; ws.getCell(`B${row}`).font = { bold: true }; row++;
    ws.getCell(`C${row}`).value = "Approximate Area"; row++;
    ws.getCell(`B${row}`).value = "CIVIL WORK";
    ws.getCell(`C${row}`).value = b.unit;
    ws.getCell(`D${row}`).value = b.approxArea;
    ws.getCell(`F${row}`).value = "@";
    ws.getCell(`G${row}`).value = b.rate;
    ws.getCell(`I${row}`).value = b.approxArea * b.rate;
    row++;

    ws.getRow(row).values = ["Sr.", "Particulars", "Part", "Price", "Work done", "", "", "Amount", "", ""];
    ws.getRow(row).font = { bold: true }; row++;
    ws.getRow(row).values = ["No.", "of item", "", "(Rate)", "", "", "", "", "", ""]; row++;
    ws.getRow(row).values = ["", data.workName.replace(/\.$/, ""), "", "", "Previous", "This Bill", "Cumulative", "Previous", "This Bill", "Cumulative"];
    ws.getRow(row).font = { bold: true }; row++;
    ws.getRow(row).values = ["", "Work", "", "", "Quantity", "Quantity", "Quantity", "Amount", "Amount", "Amount"];
    ws.getRow(row).font = { bold: true }; row++;

    let tPrevQ = 0, tCurQ = 0, tCumQ = 0, tPrevA = 0, tCurA = 0, tCumA = 0;
    b.lines.forEach((l, i) => {
      ws.getRow(row).values = [
        i + 1, l.description, l.woQty ?? "", l.rate,
        l.previousQty, l.currentQty, l.cumulativeQty,
        l.previousAmount, l.currentAmount, l.cumulativeAmount,
      ];
      tPrevQ += l.previousQty; tCurQ += l.currentQty; tCumQ += l.cumulativeQty;
      tPrevA += l.previousAmount; tCurA += l.currentAmount; tCumA += l.cumulativeAmount;
      row++;
    });
    ws.getRow(row).values = ["", "TOTAL AMOUNT", b.approxArea, "", tPrevQ, tCurQ, tCumQ, tPrevA, tCurA, tCumA];
    ws.getRow(row).font = { bold: true };
  }

  // ---------- Supply sheet ----------
  const sup = wb.addWorksheet("supply");
  sup.columns = Array(10).fill({ width: 13 });
  sup.getColumn(3).width = 40;
  sup.getCell("A1").value = data.clientName; sup.getCell("A1").font = { bold: true };
  sup.getCell("A2").value = `Labour's Supply ${data.supplyMonthLabel}`;
  sup.getCell("I2").value = `Date : ${data.billDate}`;
  sup.getCell("A3").value = `Contractor : - ${data.companyName}`;
  sup.getRow(4).values = ["Date", "Challan No.", "Description Contract basis work", "Fitter", "Hours", "Total Fitter Hours", "Fitter Helper", "Hours", "Total Labour Hours", "Remarks"];
  sup.getRow(4).font = { bold: true };

  let sRow = 5;
  let totalFitterHrs = 0, totalHelperHrs = 0;
  for (const s of data.supplyRows) {
    sup.getRow(sRow).values = [
      s.date, s.challanNo || "", s.description,
      s.fitterCount, s.fitterHours, s.fitterCount * s.fitterHours,
      s.helperCount, s.helperHours, s.helperCount * s.helperHours, "",
    ];
    totalFitterHrs += s.fitterCount * s.fitterHours;
    totalHelperHrs += s.helperCount * s.helperHours;
    sRow++;
  }
  sup.getRow(sRow).values = ["", "", "Total (Nos)", "", "", totalFitterHrs, "", "", totalHelperHrs, ""];
  sup.getRow(sRow).font = { bold: true };

  // ---------- Balance sheet ----------
  const bal = wb.addWorksheet("Balance sheet");
  bal.columns = Array(12).fill({ width: 13 });
  bal.getRow(1).values = ["SR. NO", "DATE", "RA BILLS", "BILL AMOUNT", `RETENTION ${data.retentionPct}%`, "AMOUNT", "ACCOUNT CREDITED", `${data.tdsPct}%TDS BALANCE`, "ADVANCE", "BALANCE", "GST AMOUNT", "BALANCE"];
  bal.getRow(1).font = { bold: true };
  let bRow = 2;
  let totalPayments = 0;
  data.payments.forEach((p, i) => {
    bal.getRow(bRow).values = [i + 1, p.date, "", "", "", p.accountCredited, p.amount, "", "", "", "", ""];
    totalPayments += p.amount;
    bRow++;
  });
  bal.getRow(bRow).values = ["", "", `${data.billDate} BILL NO.${data.billNo}`, "", "", "", "", "", "", "", "", ""];
  bRow++;
  const gstAmt = (data.thisBillGrossAmount * (data.cgstPct + data.sgstPct)) / 100;
  const tdsAmtB = (data.thisBillGrossAmount * data.tdsPct) / 100;
  bal.getRow(bRow).values = ["", "", "", data.thisBillGrossAmount, 0, data.thisBillGrossAmount, "", tdsAmtB, "", "", gstAmt, ""];
  bRow++;
  bal.getRow(bRow).values = [
    "", "TOTAL AMOUNT", "", data.thisBillGrossAmount, 0, data.thisBillGrossAmount,
    totalPayments, tdsAmtB, totalPayments + tdsAmtB, totalPayments + tdsAmtB - data.thisBillGrossAmount, gstAmt,
    totalPayments + tdsAmtB - data.thisBillGrossAmount - gstAmt,
  ];
  bal.getRow(bRow).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
