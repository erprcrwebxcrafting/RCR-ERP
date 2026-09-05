import ExcelJS from "exceljs";
import { format, addDays } from "date-fns";
import fs from "fs";
import path from "path";

export interface AttendanceExportData {
  attendances: any[];
  payments?: any[];
  additionalLabours?: any[];
  openingBalances?: Record<string, number>;
  siteName: string;
  startDateStr: string;
  endDateStr: string;
}

export async function generateAttendanceExcel(
  dataOrAttendances: any[] | AttendanceExportData,
  legacySiteName?: string,
  legacyStartDate?: string,
  legacyEndDate?: string
): Promise<Buffer> {
  let attendances: any[] = [];
  let payments: any[] = [];
  let additionalLabours: any[] = [];
  let openingBalances: Record<string, number> = {};
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
    additionalLabours = dataOrAttendances.additionalLabours || [];
    openingBalances = dataOrAttendances.openingBalances || {};
    siteName = dataOrAttendances.siteName || "Site";
    startDateStr = dataOrAttendances.startDateStr || "";
    endDateStr = dataOrAttendances.endDateStr || "";
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
        dailyWage: a.hajariRate || a.labour?.dailyWage || 0,
        attendanceByDate: {},
        paymentsByDate: {},
        totalHajari: 0,
        totalOT: 0,
        totalEarned: 0,
        totalPaid: 0,
        openingBalance: openingBalances[a.labourId] || 0,
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
    worker.totalEarned += (a.hajari > 0 ? a.hajari * rate : 0);
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
        openingBalance: openingBalances[l.id] || 0,
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
        openingBalance: openingBalances[p.labourId] || 0,
      });
    }

    const worker = labourMap.get(p.labourId);
    const dateKey = format(new Date(p.date), "yyyy-MM-dd");
    worker.paymentsByDate[dateKey] = (worker.paymentsByDate[dateKey] || 0) + (p.amount || 0);
    worker.totalPaid += (p.amount || 0);
  });

  // Calculate Net Balances and sort alphabetically
  const sortedWorkers = Array.from(labourMap.values()).map(worker => {
    const netBalance = worker.openingBalance + worker.totalEarned - worker.totalPaid;
    return { ...worker, netBalance };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Compute Grand Totals
  let grandTotalHajari = 0;
  let grandTotalOT = 0;
  let grandTotalEarned = 0;
  let grandTotalPaid = 0;
  let grandTotalBalance = 0;

  sortedWorkers.forEach(w => {
    grandTotalHajari += w.totalHajari;
    grandTotalOT += w.totalOT;
    grandTotalEarned += w.totalEarned;
    grandTotalPaid += w.totalPaid;
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
  // After dates: Total Hajari, Total OT, Total Earned, Advance Paid, Net Balance
  const totalCols = 3 + dates.length + 5;
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
    "GROSS WAGES EARNED",
    "TOTAL ADVANCE PAID",
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

  headerRow1Values.push("Total Hajari", "Total OT", "Total Earned", "Advance Paid", "Net Balance");
  headerRow2Values.push("", "", "", "", "");

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
  for (let c = totalCols - 4; c <= totalCols; c++) {
    const colLetter = sheet.getColumn(c).letter;
    sheet.mergeCells(`${colLetter}8:${colLetter}9`);
  }

  // Freeze panes (Freeze Name, Category, Rate, and headers)
  sheet.views = [{ state: "frozen", ySplit: 9, xSplit: 3 }];

  // Render Worker Rows
  sortedWorkers.forEach((worker, workerIdx) => {
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
    rowValues.push(`₹${Math.round(worker.totalEarned).toLocaleString("en-IN")}`);
    rowValues.push(worker.totalPaid > 0 ? `₹${Math.round(worker.totalPaid).toLocaleString("en-IN")}` : "₹0");
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
      if (colNum === totalCols - 4) { // Total Hajari
        cell.font = { bold: true, color: { argb: "FF047857" }, size: 9 };
      } else if (colNum === totalCols - 2) { // Total Earned
        cell.font = { bold: true, color: { argb: "FF1E3A8A" }, size: 9 };
      } else if (colNum === totalCols - 1) { // Advance Paid
        cell.font = { bold: true, color: { argb: worker.totalPaid > 0 ? "FFDC2626" : "FF64748B" }, size: 9 };
      } else if (colNum === totalCols) { // Net Balance
        cell.font = { bold: true, color: { argb: worker.netBalance > 0 ? "FF047857" : "FF0F172A" }, size: 9 };
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

    if (colNum === totalCols - 4) { // Total Hajari
      cell.font = { bold: true, color: { argb: "FF047857" }, size: 10 };
    } else if (colNum === totalCols - 2) { // Total Earned
      cell.font = { bold: true, color: { argb: "FF1E3A8A" }, size: 10 };
    } else if (colNum === totalCols - 1) { // Advance Paid
      cell.font = { bold: true, color: { argb: "FFDC2626" }, size: 10 };
    } else if (colNum === totalCols) { // Net Balance
      cell.font = { bold: true, color: { argb: "FF047857" }, size: 10.5 };
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
    else if (colNum === totalCols - 4) minWidth = 12; // Total Hajari
    else if (colNum === totalCols - 3) minWidth = 10; // Total OT
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

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
