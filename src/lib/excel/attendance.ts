import ExcelJS from "exceljs";
import { format, addDays } from "date-fns";
import fs from "fs";
import path from "path";

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
  monthlyLedger?: Record<string, Record<string, { hajari: number; earned: number; paid: number }>>;
}

export async function generateAttendanceExcel(
  dataOrAttendances: any[] | AttendanceExportData,
  legacySiteName?: string,
  legacyStartDate?: string,
  legacyEndDate?: string
): Promise<Buffer> {
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
  
  const monthlyLedger = (dataOrAttendances as any).monthlyLedger || {};

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RCR ERP System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Attendance & Payment Ledger");

  // Add Company Logo if available
  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoId = workbook.addImage({
        buffer: logoBuffer as any,
        extension: "png",
      });
      sheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 95, height: 40 },
      });
    }
  } catch (err) {
    console.error("Could not load logo for Excel", err);
  }

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
        totalEarned: 0,
        totalPaid: 0,
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
    worker.totalPaid += (p.amount || 0);
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

  // Layout calculation
  // Columns:
  // 1: Name, 2: Category, 3: Rate
  // 4 .. (4 + dates.length - 1): Date columns
  // After dates: Total Hajari, Total OT, Prev. Balance, Curr. Earned, Total Earned, Advance Paid, Net Balance
  const totalCols = 3 + dates.length + 6;
  const lastColLetter = sheet.getColumn(totalCols).letter;

  // Row 1: Company Title
  sheet.mergeCells(`A1:${lastColLetter}1`);
  const compTitleCell = sheet.getCell("A1");
  compTitleCell.value = `RCR Enterprises`;
  compTitleCell.font = { size: 20, bold: true, color: { argb: "FF0B2447" } };
  compTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 36;

  // Row 2: Subtitle
  sheet.mergeCells(`A2:${lastColLetter}2`);
  const titleCell = sheet.getCell("A2");
  titleCell.value = `Labour Attendance & Payment Ledger — ${siteName}`;
  titleCell.font = { size: 13, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 22;

  // Row 3: Period & Timestamp
  sheet.mergeCells(`A3:${lastColLetter}3`);
  const subtitleCell = sheet.getCell("A3");
  subtitleCell.value = `Period: ${format(start, "dd MMM yyyy")} to ${format(end, "dd MMM yyyy")} | Generated: ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`;
  subtitleCell.font = { size: 10, italic: true, color: { argb: "FF475569" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 18;

  // Row 4: Blank spacing
  sheet.addRow([]);
  sheet.getRow(4).height = 8;

  // Rows 5 & 6: Executive KPI Summary Cards
  const kpiLabels = [
    "TOTAL WORKERS",
    "TOTAL HAJARIS",
    "TOTAL OVERTIME",
    "WAGES EARNED (ALL TIME)",
    "ADVANCE PAID (ALL TIME)",
    "NET BALANCE DUE"
  ];
  const kpiValues = [
    `${sortedWorkers.length}`,
    `${grandTotalHajari.toFixed(1)}`,
    `${grandTotalOT.toFixed(1)} hrs`,
    `₹${Math.round(grandTotalEarned).toLocaleString("en-IN")}`,
    `₹${Math.round(grandTotalPaid).toLocaleString("en-IN")}`,
    `₹${Math.round(grandTotalBalance).toLocaleString("en-IN")}`
  ];

  let grandPrevBalance = 0;
  sortedWorkers.forEach(w => grandPrevBalance += (w.openingEarned - w.openingPaid));

  // Distribute KPI cards across available columns
  const kpiRow1 = sheet.addRow(kpiLabels);
  const kpiRow2 = sheet.addRow(kpiValues);
  sheet.getRow(5).height = 18;
  sheet.getRow(6).height = 26;

  kpiRow1.eachCell((cell, colNum) => {
    if (colNum <= 6) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      cell.font = { size: 8, bold: true, color: { argb: "FF475569" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, left: { style: "thin", color: { argb: "FFCBD5E1" } }, right: { style: "thin", color: { argb: "FFCBD5E1" } } };
    }
  });

  kpiRow2.eachCell((cell, colNum) => {
    if (colNum <= 6) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      let textColor = "FF0F172A";
      if (colNum === 4) textColor = "FF1E3A8A"; // Wages
      if (colNum === 5) textColor = "FFC00000"; // Advance Paid
      if (colNum === 6) textColor = "FF047857"; // Net Balance
      cell.font = { size: 12, bold: true, color: { argb: textColor } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { bottom: { style: "medium", color: { argb: "FF94A3B8" } }, left: { style: "thin", color: { argb: "FFCBD5E1" } }, right: { style: "thin", color: { argb: "FFCBD5E1" } } };
    }
  });

  // Row 7: Blank separator
  sheet.addRow([]);
  sheet.getRow(7).height = 10;

  // Rows 8 & 9: Table Header (Days of week + Date numbers + Summary Columns)
  const headerRow1Values = ["Labour Name", "Category", "Rate (₹)"];
  const headerRow2Values = ["", "", ""];

  dates.forEach(d => {
    headerRow1Values.push(format(d, "EEE")); // e.g. Mon, Tue
    headerRow2Values.push(format(d, "dd"));  // e.g. 01, 02
  });

  headerRow1Values.push("Total Hajari", "Total OT", "Prev. Balance", "Curr. Earned", "Total Earned", "Total Paid", "Net Balance");
  headerRow2Values.push("", "", "", "", "", "", "");

  const headerRow1 = sheet.addRow(headerRow1Values);
  const headerRow2 = sheet.addRow(headerRow2Values);
  sheet.getRow(8).height = 20;
  sheet.getRow(9).height = 20;

  // Style Header Rows
  [headerRow1, headerRow2].forEach(row => {
    row.eachCell((cell, colNum) => {
      let bgColor = "FF2563EB"; // Blue for general headers
      if (colNum > 3 + dates.length) {
        bgColor = "FF1E40AF"; // Darker blue for summary columns
      }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFFFFFFF" } },
        left: { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFFFF" } }
      };
    });
  });

  // Merge the empty cells in the two-tier header
  sheet.mergeCells("A8:A9");
  sheet.mergeCells("B8:B9");
  sheet.mergeCells("C8:C9");
  
  // Merge summary columns across row 8 and 9
  for (let c = totalCols - 5; c <= totalCols; c++) {
    const colLetter = sheet.getColumn(c).letter;
    sheet.mergeCells(`${colLetter}8:${colLetter}9`);
  }

  // Freeze panes (Freeze Name, Category, Rate, and headers)
  sheet.views = [{ state: "frozen", ySplit: 9, xSplit: 3 }];

  // Collect all unique month keys across all labourers and sort them
  const allMonthsSet = new Set<string>();
  for (const w of sortedWorkers) {
    if (monthlyLedger[w.id]) {
      Object.keys(monthlyLedger[w.id]).forEach(mk => allMonthsSet.add(mk));
    }
  }
  const allMonths = Array.from(allMonthsSet).sort();

  // Render Worker Rows
  sortedWorkers.forEach((worker, workerIdx) => {
    const ledger = monthlyLedger[worker.id] || {};
    let notePrevBal = "Month-wise Balance Breakdown:\n";
    let noteEarned = "Month-wise Earned:\n";
    let notePaid = "Month-wise Paid:\n";
    let noteNet = `Calculation:\nTotal Earned: ₹${Math.round(worker.allTimeEarned)}\n- Total Paid: ₹${Math.round(worker.allTimePaid)}\n= Net Balance: ₹${Math.round(worker.netBalance)}\n\nCumulative Net Balance:\n`;

    let cumBal = 0;
    let hasData = false;
    allMonths.forEach(mStr => {
      const e = ledger[mStr]?.earned || 0;
      const p = ledger[mStr]?.paid || 0;
      const mBal = e - p;
      cumBal += mBal;
      if (e > 0 || p > 0 || cumBal !== 0) {
        hasData = true;
        const [y, m] = mStr.split("-");
        const mName = format(new Date(parseInt(y), parseInt(m) - 1, 1), "MMM yyyy");
        notePrevBal += `${mName}: ₹${mBal}\n`;
        noteEarned += `${mName}: ₹${e}\n`;
        notePaid += `${mName}: ₹${p}\n`;
        noteNet += `${mName}: ₹${cumBal}\n`;
      }
    });

    if (!hasData) {
      notePrevBal += "No data";
      noteEarned += "No data";
      notePaid += "No data";
      noteNet += "No data";
    }

    const rowValues: any[] = [
      worker.name,
      worker.category,
      worker.dailyWage > 0 ? worker.dailyWage : "—"
    ];

    dates.forEach(d => {
      const dateKey = format(d, "yyyy-MM-dd");
      const att = worker.attendanceByDate[dateKey];
      const paid = worker.paymentsByDate[dateKey] || 0;
      const hasHajari = att && att.hajari > 0;
      const isAbsent = att && att.hajari === 0;

      if (hasHajari && paid > 0) {
        rowValues.push({
          richText: [
            { text: `${att.hajari}\n`, font: { bold: true, color: { argb: "FF047857" }, size: 9 } },
            { text: `₹${paid}`, font: { bold: true, color: { argb: "FFDC2626" }, size: 8 } }
          ]
        });
      } else if (hasHajari && paid === 0) {
        rowValues.push(att.hajari);
      } else if (isAbsent && paid > 0) {
        rowValues.push({
          richText: [
            { text: "A\n", font: { bold: true, color: { argb: "FFDC2626" }, size: 9 } },
            { text: `₹${paid}`, font: { bold: true, color: { argb: "FFDC2626" }, size: 8 } }
          ]
        });
      } else if (isAbsent && paid === 0) {
        rowValues.push("A");
      } else if (!att && paid > 0) {
        rowValues.push({
          richText: [
            { text: "—\n", font: { color: { argb: "FF94A3B8" }, size: 9 } },
            { text: `₹${paid}`, font: { bold: true, color: { argb: "FFDC2626" }, size: 8 } }
          ]
        });
      } else {
        rowValues.push("—");
      }
    });

    rowValues.push(worker.totalHajari > 0 ? worker.totalHajari : 0);
    rowValues.push(worker.totalOT > 0 ? worker.totalOT : "—");
    rowValues.push(`₹${Math.round(worker.openingEarned - worker.openingPaid).toLocaleString("en-IN")}`);
    rowValues.push(`₹${Math.round(worker.totalEarned).toLocaleString("en-IN")}`);
    rowValues.push(`₹${Math.round(worker.allTimeEarned).toLocaleString("en-IN")}`);
    rowValues.push(worker.allTimePaid > 0 ? `₹${Math.round(worker.allTimePaid).toLocaleString("en-IN")}` : "₹0");
    rowValues.push(`₹${Math.round(worker.netBalance).toLocaleString("en-IN")}`);

    const row = sheet.addRow(rowValues);
    row.height = 26; // Ample height for 2-line cells (Hajari + Payment)

    const isZebra = workerIdx % 2 === 1;
    const zebraBg = isZebra ? "FFF8FAFC" : "FFFFFFFF";

    row.eachCell((cell, colNum) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: zebraBg } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

      // Name & Category align left
      if (colNum === 1 || colNum === 2) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.font = { bold: colNum === 1, size: 9, color: { argb: "FF0F172A" } };
      }

      // Single values color coding for dates
      if (colNum > 3 && colNum <= 3 + dates.length) {
        if (cell.value === "A") {
          cell.font = { color: { argb: "FFDC2626" }, bold: true, size: 9 };
        } else if (typeof cell.value === "number") {
          cell.font = { color: { argb: "FF047857" }, bold: true, size: 9 };
        } else if (cell.value === "—") {
          cell.font = { color: { argb: "FF94A3B8" }, size: 9 };
        }
      }

      // Summary columns styling
      if (colNum === totalCols - 6) { // Total Hajari
        cell.font = { bold: true, color: { argb: "FF047857" }, size: 9 };
      } else if (colNum === totalCols - 5) { // Total OT
        cell.font = { bold: true, color: { argb: "FF475569" }, size: 9 };
      } else if (colNum === totalCols - 4) { // Prev Balance
        const pb = worker.openingEarned - worker.openingPaid;
        cell.font = { bold: true, color: { argb: pb > 0 ? "FF047857" : (pb < 0 ? "FFDC2626" : "FF0F172A") }, size: 9 };
        if (hasData) cell.note = { texts: [{ font: { size: 9, color: { argb: "FF0B2447" } }, text: notePrevBal }], margins: { insetmode: 'auto' } } as any;
      } else if (colNum === totalCols - 3) { // Curr Earned
        cell.font = { bold: true, color: { argb: "FF1E3A8A" }, size: 9 };
      } else if (colNum === totalCols - 2) { // Total Earned
        cell.font = { bold: true, color: { argb: "FF0B2447" }, size: 9 };
        if (hasData) cell.note = { texts: [{ font: { size: 9, color: { argb: "FF0B2447" } }, text: noteEarned }], margins: { insetmode: 'auto' } } as any;
      } else if (colNum === totalCols - 1) { // Advance Paid
        cell.font = { bold: true, color: { argb: worker.allTimePaid > 0 ? "FFDC2626" : "FF64748B" }, size: 9 };
        if (hasData) cell.note = { texts: [{ font: { size: 9, color: { argb: "FF0B2447" } }, text: notePaid }], margins: { insetmode: 'auto' } } as any;
      } else if (colNum === totalCols) { // Net Balance
        cell.font = { bold: true, color: { argb: worker.netBalance > 0 ? "FF047857" : (worker.netBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 9 };
        if (hasData) cell.note = { texts: [{ font: { size: 9, color: { argb: "FF0B2447" } }, text: noteNet }], margins: { insetmode: 'auto' } } as any;
      }
    });
  });

  // GRAND TOTAL / SUMMARY ROW
  const grandTotalRowValues: any[] = [
    "TOTAL / SUMMARY",
    `${sortedWorkers.length} Workers`,
    "—"
  ];

  dates.forEach(d => {
    const dateKey = format(d, "yyyy-MM-dd");
    const day = dailyTotals[dateKey];
    if (day.hajari > 0 && day.paid > 0) {
      grandTotalRowValues.push({
        richText: [
          { text: `${day.hajari}\n`, font: { bold: true, color: { argb: "FF0B2447" }, size: 9 } },
          { text: `₹${day.paid}`, font: { bold: true, color: { argb: "FFDC2626" }, size: 8 } }
        ]
      });
    } else if (day.hajari > 0) {
      grandTotalRowValues.push(day.hajari);
    } else if (day.paid > 0) {
      grandTotalRowValues.push(`₹${day.paid}`);
    } else {
      grandTotalRowValues.push("—");
    }
  });

  grandTotalRowValues.push(grandTotalHajari);
  grandTotalRowValues.push(grandTotalOT > 0 ? grandTotalOT : "—");
  grandTotalRowValues.push(`₹${Math.round(grandPrevBalance).toLocaleString("en-IN")}`);
  grandTotalRowValues.push(`₹${Math.round(grandCurrEarned).toLocaleString("en-IN")}`);
  grandTotalRowValues.push(`₹${Math.round(grandTotalEarned).toLocaleString("en-IN")}`);
  grandTotalRowValues.push(`₹${Math.round(grandTotalPaid).toLocaleString("en-IN")}`);
  grandTotalRowValues.push(`₹${Math.round(grandTotalBalance).toLocaleString("en-IN")}`);

  const totalRow = sheet.addRow(grandTotalRowValues);
  totalRow.height = 30;

  totalRow.eachCell((cell, colNum) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.font = { bold: true, color: { argb: "FF0F172A" }, size: 9.5 };
    cell.border = {
      top: { style: "medium", color: { argb: "FF475569" } },
      bottom: { style: "double", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } }
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

    if (colNum === 1 || colNum === 2) {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.font = { bold: true, color: { argb: "FF0B2447" }, size: 10 };
    }

    if (colNum === totalCols - 6) { // Total Hajari
      cell.font = { bold: true, color: { argb: "FF047857" }, size: 10 };
    } else if (colNum === totalCols - 4) { // Prev Balance
      cell.font = { bold: true, color: { argb: grandPrevBalance > 0 ? "FF047857" : (grandPrevBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 10 };
    } else if (colNum === totalCols - 3) { // Curr Earned
      cell.font = { bold: true, color: { argb: "FF1E3A8A" }, size: 10 };
    } else if (colNum === totalCols - 2) { // Total Earned
      cell.font = { bold: true, color: { argb: "FF0B2447" }, size: 10 };
    } else if (colNum === totalCols - 1) { // Advance Paid
      cell.font = { bold: true, color: { argb: "FFDC2626" }, size: 10 };
    } else if (colNum === totalCols) { // Net Balance
      cell.font = { bold: true, color: { argb: grandTotalBalance > 0 ? "FF047857" : (grandTotalBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 10.5 };
    }
  });

  // Footer Legend
  const legendRowIdx = totalRow.number + 2;
  sheet.mergeCells(`A${legendRowIdx}:${lastColLetter}${legendRowIdx}`);
  const legendCell = sheet.getCell(`A${legendRowIdx}`);
  legendCell.value = `Legend: Green numbers indicate Hajari attendance (1 = Full Day, 0.5 = Half Day) | Red numbers below date indicate Advance / Payment taken (e.g. ₹500) | A = Absent | Net Balance = Gross Wages Earned - Total Advance Paid`;
  legendCell.font = { size: 8.5, italic: true, color: { argb: "FF64748B" } };
  legendCell.alignment = { horizontal: "left", vertical: "middle" };

  // Auto-fit Column Widths based on content
  sheet.columns.forEach((column, colIdx) => {
    let maxLength = 0;
    const colNum = colIdx + 1;

    // Minimum width constraints
    let minWidth = 8;
    if (colNum === 1) minWidth = 18; // Labour Name
    else if (colNum === 2) minWidth = 14; // Category
    else if (colNum === 3) minWidth = 10; // Rate
    else if (colNum === totalCols - 5) minWidth = 12; // Total Hajari
    else if (colNum === totalCols - 4) minWidth = 10; // Total OT
    else if (colNum === totalCols - 3) minWidth = 14; // Curr Earned
    else if (colNum === totalCols - 2) minWidth = 14; // Total Earned
    else if (colNum === totalCols - 1) minWidth = 14; // Advance Paid
    else if (colNum === totalCols) minWidth = 15; // Net Balance

    // Calculate maximum content length in this column
    if (column.eachCell) {
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const rowNum = Number(cell.row);
        // Ignore long merged title rows and legend row
        if (rowNum < 8 || rowNum >= legendRowIdx) return;
        
        let textLength = 0;
        if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
          // If rich text with newlines (like our Hajari + Payment cells), find the longest line
          const fullText = (cell.value as any).richText.map((rt: any) => rt.text).join("");
          const lines = fullText.split("\n");
          textLength = Math.max(...lines.map((l: string) => l.trim().length));
        } else if (cell.value) {
          textLength = cell.value.toString().trim().length;
        }
        
        if (textLength > maxLength) {
          maxLength = textLength;
        }
      });
    }

    // Set width to max content length + padding, constrained between minWidth and 40
    column.width = Math.min(40, Math.max(minWidth, maxLength + 2.5));
  });

  // --- ADD MONTHLY LEDGER SUMMARY SHEET ---
  const ledgerSheet = workbook.addWorksheet("Monthly Ledger Summary");
  
  ledgerSheet.mergeCells("A1:M1");
  const lsTitleCell = ledgerSheet.getCell("A1");
  lsTitleCell.value = `Labour Monthly Ledger Summary — ${siteName}`;
  lsTitleCell.font = { size: 16, bold: true, color: { argb: "FF0B2447" } };
  lsTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ledgerSheet.getRow(1).height = 30;

  ledgerSheet.mergeCells("A2:M2");
  const lsSubCell = ledgerSheet.getCell("A2");
  lsSubCell.value = `Generated: ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`;
  lsSubCell.font = { size: 10, italic: true, color: { argb: "FF475569" } };
  lsSubCell.alignment = { horizontal: "center", vertical: "middle" };
  ledgerSheet.getRow(2).height = 18;
  
  ledgerSheet.addRow([]);



  // Create Header Rows
  const headR1 = ["Labour Name", "Category"];
  const headR2 = ["", ""];
  
  allMonths.forEach(mStr => {
    // mStr is like "2026-03"
    const [y, m] = mStr.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    headR1.push(format(d, "MMM yyyy"), "", "", ""); // span 4 columns
    headR2.push("Hajari", "Earned", "Paid", "Balance");
  });
  
  headR1.push("Total Earned", "Total Paid", "Net Balance");
  headR2.push("", "", "");

  const hRow1 = ledgerSheet.addRow(headR1);
  const hRow2 = ledgerSheet.addRow(headR2);
  ledgerSheet.getRow(4).height = 22;
  ledgerSheet.getRow(5).height = 20;

  // Merge headers
  ledgerSheet.mergeCells("A4:A5");
  ledgerSheet.mergeCells("B4:B5");
  let colIdx = 3;
  allMonths.forEach(() => {
    ledgerSheet.mergeCells(4, colIdx, 4, colIdx + 3);
    colIdx += 4;
  });
  ledgerSheet.mergeCells(4, colIdx, 5, colIdx);
  ledgerSheet.mergeCells(4, colIdx + 1, 5, colIdx + 1);
  ledgerSheet.mergeCells(4, colIdx + 2, 5, colIdx + 2);

  // Style Headers
  [hRow1, hRow2].forEach(row => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin", color: { argb: "FFFFFFFF" } }, left: { style: "thin", color: { argb: "FFFFFFFF" } }, bottom: { style: "thin", color: { argb: "FFFFFFFF" } }, right: { style: "thin", color: { argb: "FFFFFFFF" } } };
    });
  });

  // Render Rows
  sortedWorkers.forEach((worker, workerIdx) => {
    const rVals: any[] = [worker.name, worker.category];
    const ledger: any = monthlyLedger[worker.id] || {};
    
    let cumulativeBalance = 0;

    allMonths.forEach(mStr => {
      const h = ledger[mStr]?.hajari || 0;
      const e = ledger[mStr]?.earned || 0;
      const p = ledger[mStr]?.paid || 0;
      cumulativeBalance += (e - p);

      rVals.push(h > 0 ? h : "—");
      rVals.push(e > 0 ? `₹${e}` : "—");
      rVals.push(p > 0 ? `₹${p}` : "—");
      rVals.push(`₹${Math.round(cumulativeBalance).toLocaleString("en-IN")}`);
    });
    
    rVals.push(`₹${Math.round(worker.allTimeEarned).toLocaleString("en-IN")}`);
    rVals.push(worker.allTimePaid > 0 ? `₹${Math.round(worker.allTimePaid).toLocaleString("en-IN")}` : "₹0");
    rVals.push(`₹${Math.round(worker.netBalance).toLocaleString("en-IN")}`);
    
    const row = ledgerSheet.addRow(rVals);
    row.height = 22;
    const isZebra = workerIdx % 2 === 1;
    row.eachCell((cell, cNum) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isZebra ? "FFF8FAFC" : "FFFFFFFF" } };
      cell.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      if (cNum === 1 || cNum === 2) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.font = { bold: cNum === 1, size: 9 };
      }
      if (cNum > 2 && cNum <= 2 + (allMonths.length * 4)) {
        if (cell.value !== "—") {
          const colType = (cNum - 3) % 4; // 0: Hajari, 1: Earned, 2: Paid, 3: Balance
          const mIdx = Math.floor((cNum - 3) / 4);
          const mStr = allMonths[mIdx];
          const monthLedger = ledger[mStr];

          if (colType === 0) {
            cell.font = { color: { argb: "FF0F172A" }, size: 9 }; // Hajari
              const groups: Record<string, number[]> = {};
              monthLedger.attDetails.forEach((detail: string) => {
                const parts = detail.split(": ");
                if (parts.length === 2) {
                  const day = parseInt(parts[0].split("-")[0]);
                  const hajari = parts[1];
                  if (!groups[hajari]) groups[hajari] = [];
                  groups[hajari].push(day);
                }
              });
              const groupedAttDetails = Object.entries(groups).map(([hajari, daysArr]) => {
                const days = daysArr.sort((a, b) => a - b);
                let result = [];
                let start = days[0];
                let prev = days[0];
                for (let i = 1; i < days.length; i++) {
                  if (days[i] === prev + 1) {
                    prev = days[i];
                  } else {
                    result.push(start === prev ? `${start}` : `${start}-${prev}`);
                    start = days[i];
                    prev = days[i];
                  }
                }
                result.push(start === prev ? `${start}` : `${start}-${prev}`);
                return `H: ${hajari} -> ${result.join(", ")}`;
              });
              cell.note = { 
                texts: [{ font: { size: 9, color: { argb: "FF0B2447" } }, text: "Attendance Details:\n" + groupedAttDetails.join("  |  ") }],
                margins: { insetmode: 'auto' }
              } as any;
          }
          if (colType === 1) cell.font = { color: { argb: "FF1E3A8A" }, size: 9 }; // Earned
          if (colType === 2) {
            cell.font = { color: { argb: "FFDC2626" }, size: 9 }; // Paid
            if (monthLedger?.paidDetails?.length > 0) {
              cell.note = { 
                texts: [{ font: { size: 9, color: { argb: "FF991B1B" } }, text: "Payment Details:\n" + monthLedger.paidDetails.join("  |  ") }],
                margins: { insetmode: 'auto' }
              } as any;
            }
          }
          if (colType === 3) {
            // Balance
            const balVal = parseInt(String(cell.value).replace(/[^0-9-]/g, "")) || 0;
            cell.font = { bold: true, color: { argb: balVal > 0 ? "FF047857" : (balVal < 0 ? "FFDC2626" : "FF0F172A") }, size: 9 };
          }
        } else {
          cell.font = { color: { argb: "FF94A3B8" }, size: 9 };
        }
      }
      if (cNum === headR1.length - 2) cell.font = { bold: true, color: { argb: "FF0B2447" }, size: 9 }; // Total Earned
      if (cNum === headR1.length - 1) cell.font = { bold: true, color: { argb: worker.allTimePaid > 0 ? "FFDC2626" : "FF64748B" }, size: 9 }; // Total Paid
      if (cNum === headR1.length) cell.font = { bold: true, color: { argb: worker.netBalance > 0 ? "FF047857" : (worker.netBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 9 }; // Net Balance
    });
  });

  // Auto fit for ledger sheet
  ledgerSheet.columns.forEach((column, colIdx) => {
    let minWidth = 12;
    if (colIdx === 0) minWidth = 18;
    if (colIdx === 1) minWidth = 14;
    column.width = minWidth;
  });

  // --- DETAILED BREAKDOWN SHEET ---
  const detailSheet = workbook.addWorksheet("Detailed Breakdown");
  
  detailSheet.addRow([`Detailed Breakdown \u2014 ${siteName}`]);
  detailSheet.addRow([`Generated: ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`]);
  detailSheet.addRow([]); // empty line
  
  const dHeadRow = detailSheet.addRow(["Date", "Record Type", "Details", "Amount"]);
  dHeadRow.eachCell(c => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    c.alignment = { horizontal: "center" };
  });

  const detailRows: any[] = [];

  attendances.forEach(a => {
    if (!a.date) return;
    const worker = sortedWorkers.find(w => w.id === a.labourId);
    if (!worker) return;
    const rate = a.hajariRate || a.labour?.dailyWage || 0;
    const earned = a.earnedAmount !== undefined && a.earnedAmount !== null ? a.earnedAmount : (a.hajari || 0) * rate;
    detailRows.push({
      date: new Date(a.date),
      labourName: worker.name,
      category: worker.category,
      type: "Attendance",
      details: `${a.hajari} Hajari`,
      amount: earned
    });
  });

  const allPayments = [...payments, ...postPayments];
  allPayments.forEach(p => {
    if (!p.date) return;
    const worker = sortedWorkers.find(w => w.id === p.labourId);
    if (!worker) return;
    detailRows.push({
      date: new Date(p.date),
      labourName: worker.name,
      category: worker.category,
      type: "Payment",
      details: "Paid",
      amount: p.amount
    });
  });

  detailRows.sort((a, b) => {
    if (a.labourName !== b.labourName) return a.labourName.localeCompare(b.labourName);
    return a.date.getTime() - b.date.getTime();
  });

  let currentLabourName = "";
  
  detailRows.forEach(row => {
    if (row.labourName !== currentLabourName) {
      if (currentLabourName !== "") {
        const sep = detailSheet.addRow([]);
        sep.eachCell(c => c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } } });
      }
      currentLabourName = row.labourName;
      
      const groupRow = detailSheet.addRow([`👨‍🔧 ${row.labourName}  (${row.category || 'N/A'})`]);
      detailSheet.mergeCells(groupRow.number, 1, groupRow.number, 4);
      groupRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      groupRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
      groupRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    }

    const r = detailSheet.addRow([
      format(row.date, "dd-MMM-yyyy"),
      row.type,
      row.details,
      row.amount > 0 ? `₹${row.amount}` : "0"
    ]);

    r.getCell(2).font = { color: { argb: row.type === "Attendance" ? "FF1E3A8A" : "FFDC2626" }, bold: true, size: 9 };
    r.getCell(4).font = { color: { argb: row.type === "Attendance" ? "FF1E3A8A" : "FFDC2626" }, bold: true, size: 9 };
    r.eachCell((c, cNum) => {
      if (typeof cNum === "number" && cNum !== 2 && cNum !== 4) c.font = { size: 9 };
      c.alignment = { vertical: "middle", horizontal: "center" };
    });
  });

  detailSheet.getColumn(1).width = 18;
  detailSheet.getColumn(2).width = 18;
  detailSheet.getColumn(3).width = 15;
  detailSheet.getColumn(4).width = 15;


  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
