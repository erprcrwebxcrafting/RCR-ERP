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
  const transferHistory: any[] = (dataOrAttendances as any).transferHistory || [];

  // Build transfer notes per worker
  const transferNotes: Record<string, string> = {};
  for (const t of transferHistory) {
    const note = transferNotes[t.labourId] || "";
    const dateStr = t.transferDate ? format(new Date(t.transferDate), "dd-MMM-yyyy") : "";
    const from = t.fromSite?.projectName || "New Joining";
    const to = t.toSite?.projectName || "Unknown";
    const wageChange = (t.previousDailyWage && t.newDailyWage && t.previousDailyWage !== t.newDailyWage)
      ? ` | Wage: ₹${t.previousDailyWage} → ₹${t.newDailyWage}`
      : "";
    transferNotes[t.labourId] = (note ? note + "\n" : "") + `${dateStr}: ${from} → ${to}${wageChange}`;
  }

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
        dailyWage: a.hajariRate || a.labour?.dailyWage || a.labour?.labourCategory?.dailyWage || 0,
        baseDailyWage: a.labour?.dailyWage || a.labour?.labourCategory?.dailyWage || 0,
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
        dailyWage: l.dailyWage || l.labourCategory?.dailyWage || 0,
        baseDailyWage: l.dailyWage || l.labourCategory?.dailyWage || 0,
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
        dailyWage: p.labour?.dailyWage || p.labour?.labourCategory?.dailyWage || 0,
        baseDailyWage: p.labour?.dailyWage || p.labour?.labourCategory?.dailyWage || 0,
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
        dailyWage: p.labour?.dailyWage || p.labour?.labourCategory?.dailyWage || 0,
        baseDailyWage: p.labour?.dailyWage || p.labour?.labourCategory?.dailyWage || 0,
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
  }).sort((a, b) => {
    const aHasAttendance = (a.totalHajari || 0) > 0 ? 1 : 0;
    const bHasAttendance = (b.totalHajari || 0) > 0 ? 1 : 0;
    
    if (aHasAttendance !== bHasAttendance) {
      return bHasAttendance - aHasAttendance;
    }
    
    return a.name.localeCompare(b.name);
  });

  // Compute Grand Totals
  let grandTotalHajari = 0;
  let grandTotalOT = 0;

  let sumPrevAdvance = 0;
  let sumPrevPending = 0;
  let sumCurrEarned = 0;
  let sumGrossPayable = 0;
  let sumAdvanceDeducted = 0;
  let sumNetBalance = 0;
  let sumTotalPayable = 0;
  let sumTotalAdvance = 0;

  let grandTotalEarned = 0; // All time earned (for KPI)
  let grandTotalPaid = 0; // All time paid (for KPI)

  sortedWorkers.forEach(w => {
    grandTotalHajari += w.totalHajari;
    grandTotalOT += w.totalOT;
    
    grandTotalEarned += w.allTimeEarned;
    grandTotalPaid += w.allTimePaid;

    const openingBalance = w.openingEarned - w.openingPaid;
    const prevAdvance = openingBalance < 0 ? Math.abs(openingBalance) : 0;
    const prevPending = openingBalance > 0 ? openingBalance : 0;
    
    const grossPayable = prevPending + w.totalEarned;
    const advanceDeducted = prevAdvance + w.totalPaid;

    sumPrevAdvance += prevAdvance;
    sumPrevPending += prevPending;
    sumCurrEarned += w.totalEarned;
    sumGrossPayable += grossPayable;
    sumAdvanceDeducted += advanceDeducted;
    sumNetBalance += w.netBalance;
    if (w.netBalance > 0) sumTotalPayable += w.netBalance;
    if (w.netBalance < 0) sumTotalAdvance += Math.abs(w.netBalance);
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
  // After dates: Total Hajari, Total OT, Prev Advance, Prev Pending, Curr Earned, Gross Payable, Total Advance Deducted, Net Balance
  const totalCols = 3 + dates.length + 8;
  const lastColLetter = sheet.getColumn(totalCols).letter;

  // Row 1, 2, 3: Company Title & Subtitles
  sheet.mergeCells(`B1:C1`);
  const compTitleCell = sheet.getCell("B1");
  compTitleCell.value = `RCR Enterprises`;
  compTitleCell.font = { size: 14, bold: true, color: { argb: "FF0B2447" } };
  compTitleCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  sheet.getRow(1).height = 20;

  sheet.mergeCells(`B2:C2`);
  const titleCell = sheet.getCell("B2");
  titleCell.value = `Labour Attendance Ledger\n${siteName}`;
  titleCell.font = { size: 10, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  sheet.getRow(2).height = 32;

  sheet.mergeCells(`B3:C3`);
  const subtitleCell = sheet.getCell("B3");
  subtitleCell.value = `Period: ${format(start, "dd MMM yy")} to ${format(end, "dd MMM yy")}`;
  subtitleCell.font = { size: 9, italic: true, color: { argb: "FF475569" } };
  subtitleCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  sheet.getRow(3).height = 24;

  // KPIs in Rows 1 to 3 (Columns 4 to 9)
  const kpiLabels = [
    "TOTAL WORKERS", "TOTAL HAJARIS", "TOTAL OVERTIME",
    "WAGES EARNED", "ADVANCE PAID", "NET BALANCE"
  ];
  
  // Calculate Totals for KPIs
  const kpiValues = [
    `${sortedWorkers.length}`,
    `${grandTotalHajari.toFixed(1)}`,
    `${grandTotalOT.toFixed(1)} hrs`,
    `₹${Math.round(grandTotalEarned).toLocaleString("en-IN")}`,
    `₹${Math.round(grandTotalPaid).toLocaleString("en-IN")}`,
    `₹${Math.round(sumNetBalance).toLocaleString("en-IN")}`
  ];

  const kpiLayout = [
    { row: 1, labelIdx: 0, valIdx: 3 }, // Workers, Wages
    { row: 2, labelIdx: 1, valIdx: 4 }, // Hajaris, Advance
    { row: 3, labelIdx: 2, valIdx: 5 }  // Overtime, Net Balance
  ];

  kpiLayout.forEach(layout => {
    const r = layout.row;
    
    // Left KPI (Label in 4-5, Value in 6)
    sheet.mergeCells(r, 4, r, 5);
    const leftLabel = sheet.getCell(r, 4);
    leftLabel.value = kpiLabels[layout.labelIdx];
    leftLabel.font = { size: 8, bold: true, color: { argb: "FF475569" } };
    leftLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    leftLabel.alignment = { horizontal: "right", vertical: "middle" };
    leftLabel.border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, left: { style: "thin", color: { argb: "FFCBD5E1" } }, bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };

    const leftVal = sheet.getCell(r, 6);
    leftVal.value = kpiValues[layout.labelIdx];
    leftVal.font = { size: 10, bold: true, color: { argb: "FF0F172A" } };
    leftVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    leftVal.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    leftVal.border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, right: { style: "thin", color: { argb: "FFCBD5E1" } }, bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };

    // Right KPI (Label in 7-8, Value in 9)
    sheet.mergeCells(r, 7, r, 8);
    const rightLabel = sheet.getCell(r, 7);
    rightLabel.value = kpiLabels[layout.valIdx];
    rightLabel.font = { size: 8, bold: true, color: { argb: "FF475569" } };
    rightLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    rightLabel.alignment = { horizontal: "right", vertical: "middle" };
    rightLabel.border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, left: { style: "thin", color: { argb: "FFCBD5E1" } }, bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };

    const rightVal = sheet.getCell(r, 9);
    rightVal.value = kpiValues[layout.valIdx];
    
    let textColor = "FF0F172A";
    if (layout.valIdx === 3) textColor = "FF1E3A8A"; // Wages
    if (layout.valIdx === 4) textColor = "FFC00000"; // Advance Paid
    if (layout.valIdx === 5) textColor = "FF047857"; // Net Balance
    
    rightVal.font = { size: 10, bold: true, color: { argb: textColor } };
    rightVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    rightVal.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    rightVal.border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, right: { style: "thin", color: { argb: "FFCBD5E1" } }, bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
  });

  // Table Headers
  const headerRow1Values = ["Labour Name", "Category", "Rate (₹)"];
  const headerRow2Values = ["", "", ""];

  dates.forEach(d => {
    headerRow1Values.push(format(d, "EEE"));
    headerRow2Values.push(format(d, "dd"));
  });

  headerRow1Values.push("Total\nHajari", "Total\nOT", "Prev.\nAdvance", "Prev.\nPending", "Curr.\nEarned", "Gross\nPayable", "Adv.\nDeducted", "Net\nBalance");
  headerRow2Values.push("", "", "", "", "", "", "", "");

  const headerRow1 = sheet.addRow(headerRow1Values); // Row 4
  const headerRow2 = sheet.addRow(headerRow2Values); // Row 5
  // Row height will auto-fit based on content

  // Style Header Rows
  [headerRow1, headerRow2].forEach(row => {
    row.eachCell((cell, colNum) => {
      let bgColor = "FF2563EB";
      if (colNum > 3 + dates.length && colNum <= totalCols) {
        bgColor = "FF1E40AF";
      }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 8.5 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFFFFFFF" } },
        left: { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFFFF" } }
      };
    });
  });

  // Merge headers
  sheet.mergeCells("A4:A5");
  sheet.mergeCells("B4:B5");
  sheet.mergeCells("C4:C5");
  
  for (let c = totalCols - 7; c <= totalCols; c++) {
    const colLetter = sheet.getColumn(c).letter;
    sheet.mergeCells(`${colLetter}4:${colLetter}5`);
  }

  // Freeze panes
  sheet.views = [{ state: "frozen", ySplit: 5, xSplit: 3 }];

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

    const isMonthlyCategory = worker.category.toLowerCase().includes("supervisor") || worker.category.toLowerCase().includes("foreman");
    const displayRate = isMonthlyCategory 
      ? `₹${Math.round(worker.baseDailyWage * 30).toLocaleString("en-IN")}/mo`
      : (worker.dailyWage > 0 ? worker.dailyWage : "—");

    const workerDisplayName = transferNotes[worker.id] ? `${worker.name} (T)` : worker.name;

    const rowValues: any[] = [
      workerDisplayName,
      worker.category,
      displayRate
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

    const openingBalance = worker.openingEarned - worker.openingPaid;
    const prevAdvance = openingBalance < 0 ? Math.abs(openingBalance) : 0;
    const prevPending = openingBalance > 0 ? openingBalance : 0;
    const currEarned = worker.totalEarned;
    const paidInPeriod = worker.totalPaid;
    
    const grossPayable = prevPending + currEarned;
    const advanceDeducted = prevAdvance + paidInPeriod;

    rowValues.push(worker.totalHajari > 0 ? worker.totalHajari : 0);
    rowValues.push(worker.totalOT > 0 ? worker.totalOT : "—");
    rowValues.push(prevAdvance > 0 ? `₹${Math.round(prevAdvance).toLocaleString("en-IN")}` : "—");
    rowValues.push(prevPending > 0 ? `₹${Math.round(prevPending).toLocaleString("en-IN")}` : "—");
    rowValues.push(`₹${Math.round(currEarned).toLocaleString("en-IN")}`);
    rowValues.push(`₹${Math.round(grossPayable).toLocaleString("en-IN")}`);
    rowValues.push(advanceDeducted > 0 ? `₹${Math.round(advanceDeducted).toLocaleString("en-IN")}` : "₹0");
    rowValues.push(`₹${Math.round(worker.netBalance).toLocaleString("en-IN")}`);

    const row = sheet.addRow(rowValues);
    // Row height will auto-fit based on content

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
        // Add transfer note on name cell
        if (colNum === 1 && transferNotes[worker.id]) {
          cell.note = `🔄 Transfer History:\n${transferNotes[worker.id]}`;
          cell.font = { bold: true, size: 9, color: { argb: "FF1E40AF" } }; // Blue to indicate transfer
        }
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

        const dateIndex = colNum - 4;
        if (dateIndex >= 0 && dateIndex < dates.length) {
          const d = dates[dateIndex];
          const dateKey = format(d, "yyyy-MM-dd");
          const att = worker.attendanceByDate[dateKey];
          if (att && att.remarks) {
            cell.note = att.remarks;
          }
        }
      }

      // Summary columns styling
      if (colNum === totalCols - 7) { // Total Hajari
        cell.font = { bold: true, color: { argb: "FF047857" }, size: 9 };
      } else if (colNum === totalCols - 6) { // Total OT
        cell.font = { bold: true, color: { argb: "FF475569" }, size: 9 };
      } else if (colNum === totalCols - 5) { // Prev Advance
        cell.font = { bold: true, color: { argb: "FFDC2626" }, size: 9 };
        cell.note = notePrevBal;
      } else if (colNum === totalCols - 4) { // Prev Pending
        cell.font = { bold: true, color: { argb: "FF047857" }, size: 9 };
        cell.note = notePrevBal;
      } else if (colNum === totalCols - 3) { // Curr Earned
        cell.font = { bold: true, color: { argb: "FF1E3A8A" }, size: 9 };
      } else if (colNum === totalCols - 2) { // Gross Payable
        cell.font = { bold: true, color: { argb: "FF047857" }, size: 9 };
        cell.note = noteEarned;
      } else if (colNum === totalCols - 1) { // Total Advance Deducted
        cell.font = { bold: true, color: { argb: advanceDeducted > 0 ? "FFDC2626" : "FF64748B" }, size: 9 };
        cell.note = notePaid;
      } else if (colNum === totalCols) { // Net Balance
        cell.font = { bold: true, color: { argb: worker.netBalance > 0 ? "FF047857" : (worker.netBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 9 };
        cell.note = noteNet;
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
  
  grandTotalRowValues.push(sumPrevAdvance > 0 ? `₹${Math.round(sumPrevAdvance).toLocaleString("en-IN")}` : "—");
  grandTotalRowValues.push(sumPrevPending > 0 ? `₹${Math.round(sumPrevPending).toLocaleString("en-IN")}` : "—");
  grandTotalRowValues.push(`₹${Math.round(sumCurrEarned).toLocaleString("en-IN")}`);
  grandTotalRowValues.push(`₹${Math.round(sumGrossPayable).toLocaleString("en-IN")}`);
  grandTotalRowValues.push(`₹${Math.round(sumAdvanceDeducted).toLocaleString("en-IN")}`);
  grandTotalRowValues.push({
    richText: [
      { text: `P: ₹${Math.round(sumTotalPayable).toLocaleString("en-IN")}\n`, font: { bold: true, color: { argb: "FF047857" }, size: 9 } },
      { text: `A: ₹${Math.round(sumTotalAdvance).toLocaleString("en-IN")}\n`, font: { bold: true, color: { argb: "FFDC2626" }, size: 9 } },
      { text: `Net: ₹${Math.round(sumNetBalance).toLocaleString("en-IN")}`, font: { bold: true, color: { argb: sumNetBalance > 0 ? "FF047857" : (sumNetBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 9 } }
    ]
  });

  const totalRow = sheet.addRow(grandTotalRowValues);
  // Row height will auto-fit based on content

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

    if (colNum === totalCols - 7) { // Total Hajari
      cell.font = { bold: true, color: { argb: "FF047857" }, size: 10 };
    } else if (colNum === totalCols - 5) { // Prev Advance
      cell.font = { bold: true, color: { argb: "FFDC2626" }, size: 10 };
    } else if (colNum === totalCols - 4) { // Prev Pending
      cell.font = { bold: true, color: { argb: "FF047857" }, size: 10 };
    } else if (colNum === totalCols - 3) { // Curr Earned
      cell.font = { bold: true, color: { argb: "FF1E3A8A" }, size: 10 };
    } else if (colNum === totalCols - 2) { // Gross Payable
      cell.font = { bold: true, color: { argb: "FF047857" }, size: 10 };
    } else if (colNum === totalCols - 1) { // Advance Deducted
      cell.font = { bold: true, color: { argb: "FFDC2626" }, size: 10 };
    } else if (colNum === totalCols) { // Net Balance
      cell.font = { bold: true, color: { argb: sumNetBalance > 0 ? "FF047857" : (sumNetBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 10.5 };
    }
  });

  // Footer Legend and Detailed Explanation Note
  let legendRowIdx = totalRow.number + 2;
  
  const explanations = [
    "REPORT CALCULATION EXPLANATION (20 to 20 Payment Cycle):",
    "1. Hajari (Attendance): Is sheet mein dikh rahi Date Range (e.g., 1 to 31) ke dauran ki gayi hajari hi calculate hoti hai.",
    "2. Payments (Advance Deducted): Payments hamesha 21 tareekh se lekar agle mahine ki 20 tareekh tak jodi jati hain. Is report me dikh rahi total advance deduction usi settlement cycle ki hai.",
    "3. First Month Rule: Agar yeh site ka pehla mahina hai, toh payments site start date se lekar agle mahine ki 20 tareekh tak jodi jati hain.",
    "4. Pichla Hisaab (Prev. Advance/Pending): Is calculation cycle se pehle ka jitna bhi balance hai, wo automatically pichle mahine ke 'Prev Pending' ya 'Prev Advance' me shamil ho jata hai.",
    "5. Final Formula: Net Balance = (Pichla Pending + Is mahine ki kamayi) - (Pichla Advance + Is mahine ki payment).",
    "",
    "Legend: Green = Hajari (1 = Full, 0.5 = Half) | Red = Payment / Advance | A = Absent"
  ];

  explanations.forEach((text, idx) => {
    sheet.mergeCells(`A${legendRowIdx + idx}:${lastColLetter}${legendRowIdx + idx}`);
    const cell = sheet.getCell(`A${legendRowIdx + idx}`);
    cell.value = text;
    cell.font = { 
      size: idx === 0 ? 9 : 8.5, 
      bold: idx === 0,
      italic: idx > 0, 
      color: { argb: idx === 0 ? "FF0F172A" : "FF475569" } 
    };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(legendRowIdx + idx).height = 16;
  });

  legendRowIdx += explanations.length;

  // Auto-fit Column Widths based on content
  for (let colNum = 1; colNum <= totalCols; colNum++) {
    const column = sheet.getColumn(colNum);
    let maxLength = 0;

    // Absolute minimum widths (ultra tight)
    let minWidth = 3.5; 
    if (colNum === 1) minWidth = 10; // Labour Name
    else if (colNum === 2) minWidth = 8;  // Category
    else if (colNum === 3) minWidth = 6;  // Rate
    else if (colNum > 3 && colNum <= 3 + dates.length) minWidth = 3.5; // Dates
    else minWidth = 6; // Summary columns will expand purely on content length

    // Calculate maximum content length in this column
    if (column.eachCell) {
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const rowNum = Number(cell.row);
        // Ignore KPI cards and legend row
        if (rowNum < 4 || rowNum >= legendRowIdx) return;
        
        let textLength = 0;
        if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
          // If rich text with newlines (like our Hajari + Payment cells), find the longest line
          const fullText = (cell.value as any).richText.map((rt: any) => rt.text).join("");
          const lines = fullText.split("\n");
          textLength = Math.max(...lines.map((l: string) => l.trim().length));
        } else if (cell.value) {
          const lines = cell.value.toString().split("\n");
          textLength = Math.max(...lines.map((l: string) => l.trim().length));
        }
        
        if (textLength > maxLength) {
          maxLength = textLength;
        }
      });
    }

    // Ultra-tight padding: just 0.8 chars extra. Constrain max width to 30 to prevent anomalies.
    column.width = Math.min(30, Math.max(minWidth, maxLength + 0.8));
  }

  // --- ADD MONTHLY LEDGER SUMMARY SHEET ---
  const ledgerSheet = workbook.addWorksheet("Monthly Ledger Summary");
  
  ledgerSheet.mergeCells("A1:M1");
  const lsTitleCell = ledgerSheet.getCell("A1");
  lsTitleCell.value = `Labour Monthly Ledger Summary — ${siteName}`;
  lsTitleCell.font = { size: 16, bold: true, color: { argb: "FF0B2447" } };
  lsTitleCell.alignment = { horizontal: "left", vertical: "middle" };
  ledgerSheet.getRow(1).height = 28;

  ledgerSheet.mergeCells("A2:M2");
  const lsSubCell = ledgerSheet.getCell("A2");
  lsSubCell.value = `Generated: ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`;
  lsSubCell.font = { size: 10, italic: true, color: { argb: "FF475569" } };
  lsSubCell.alignment = { horizontal: "left", vertical: "middle" };
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

  // Freeze: Lock Name + Category columns (col 1-2) and header rows (rows 1-5)
  ledgerSheet.views = [{ state: "frozen", ySplit: 5, xSplit: 2 }];

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

  // To calculate grand totals
  const monthlyTotals: Record<string, { h: number; e: number; p: number; b: number }> = {};
  allMonths.forEach(mStr => monthlyTotals[mStr] = { h: 0, e: 0, p: 0, b: 0 });
  let ledgerGrandTotalEarned = 0;
  let ledgerGrandTotalPaid = 0;
  let ledgerGrandNetBalance = 0;

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

      monthlyTotals[mStr].h += h;
      monthlyTotals[mStr].e += e;
      monthlyTotals[mStr].p += p;
      monthlyTotals[mStr].b += cumulativeBalance;

      rVals.push(h > 0 ? h : "—");
      rVals.push(e > 0 ? `₹${e}` : "—");
      rVals.push(p > 0 ? `₹${p}` : "—");
      rVals.push(`₹${Math.round(cumulativeBalance).toLocaleString("en-IN")}`);
    });
    
    ledgerGrandTotalEarned += worker.allTimeEarned;
    ledgerGrandTotalPaid += worker.allTimePaid;
    ledgerGrandNetBalance += worker.netBalance;

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

  // Render Grand Total Row
  const ledgerTotalVals: any[] = ["TOTAL / SUMMARY", `${sortedWorkers.length} Workers`];
  allMonths.forEach(mStr => {
    const mt = monthlyTotals[mStr];
    ledgerTotalVals.push(mt.h > 0 ? mt.h : "—");
    ledgerTotalVals.push(`₹${Math.round(mt.e).toLocaleString("en-IN")}`);
    ledgerTotalVals.push(`₹${Math.round(mt.p).toLocaleString("en-IN")}`);
    ledgerTotalVals.push(`₹${Math.round(mt.b).toLocaleString("en-IN")}`);
  });
  ledgerTotalVals.push(`₹${Math.round(ledgerGrandTotalEarned).toLocaleString("en-IN")}`);
  ledgerTotalVals.push(`₹${Math.round(ledgerGrandTotalPaid).toLocaleString("en-IN")}`);
  ledgerTotalVals.push(`₹${Math.round(ledgerGrandNetBalance).toLocaleString("en-IN")}`);

  const lTotalRow = ledgerSheet.addRow(ledgerTotalVals);
  lTotalRow.height = 24;
  lTotalRow.eachCell((cell, cNum) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.font = { bold: true, color: { argb: "FF0F172A" }, size: 9.5 };
    cell.border = { top: { style: "medium", color: { argb: "FF475569" } }, bottom: { style: "double", color: { argb: "FF0F172A" } }, left: { style: "thin", color: { argb: "FFCBD5E1" } }, right: { style: "thin", color: { argb: "FFCBD5E1" } } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    
    if (cNum === 1 || cNum === 2) {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.font = { bold: true, color: { argb: "FF0B2447" }, size: 10 };
    }
    if (cNum > 2 && cNum <= 2 + (allMonths.length * 4)) {
      const colType = (cNum - 3) % 4; // 0: Hajari, 1: Earned, 2: Paid, 3: Balance
      if (colType === 0) cell.font = { bold: true, color: { argb: "FF0F172A" }, size: 9.5 };
      if (colType === 1) cell.font = { bold: true, color: { argb: "FF1E3A8A" }, size: 9.5 };
      if (colType === 2) cell.font = { bold: true, color: { argb: "FFDC2626" }, size: 9.5 };
      if (colType === 3) {
        const balVal = parseInt(String(cell.value).replace(/[^0-9-]/g, "")) || 0;
        cell.font = { bold: true, color: { argb: balVal > 0 ? "FF047857" : (balVal < 0 ? "FFDC2626" : "FF0F172A") }, size: 9.5 };
      }
    }
    if (cNum === headR1.length - 2) cell.font = { bold: true, color: { argb: "FF0B2447" }, size: 9.5 };
    if (cNum === headR1.length - 1) cell.font = { bold: true, color: { argb: "FFDC2626" }, size: 9.5 };
    if (cNum === headR1.length) cell.font = { bold: true, color: { argb: ledgerGrandNetBalance > 0 ? "FF047857" : (ledgerGrandNetBalance < 0 ? "FFDC2626" : "FF0F172A") }, size: 9.5 };
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

  // Freeze header row
  detailSheet.views = [{ state: "frozen", ySplit: 4, xSplit: 0 }];

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
