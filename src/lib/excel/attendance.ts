import ExcelJS from "exceljs";
import { format, addDays } from "date-fns";
import fs from "fs";
import path from "path";

export async function generateAttendanceExcel(attendances: any[], siteName: string, startDateStr: string, endDateStr: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance Sheet");

  // Add Logo
  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoId = workbook.addImage({
      buffer: logoBuffer as any,
      extension: "png",
    });
    sheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 100, height: 40 },
    });
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

  // Map to group attendances by labour
  const labourMap = new Map<string, any>();
  attendances.forEach(a => {
    if (!labourMap.has(a.labourId)) {
      labourMap.set(a.labourId, {
        id: a.labourId,
        name: a.labour.name,
        category: a.labour.labourCategory.name,
        dailyWage: a.hajariRate || a.labour.dailyWage || 0,
        attendanceByDate: {},
        totalHajari: 0,
        totalOT: 0,
        totalEarned: 0,
      });
    }

    const worker = labourMap.get(a.labourId);
    const dateKey = format(new Date(a.date), "yyyy-MM-dd");
    
    // Store record for this date
    worker.attendanceByDate[dateKey] = {
      hajari: a.hajari,
      ot: a.overtimeHrs,
      remarks: a.remarks
    };

    worker.totalHajari += a.hajari || 0;
    worker.totalOT += a.overtimeHrs || 0;
    worker.totalEarned += (a.hajari > 0 ? a.hajari * worker.dailyWage : 0);
  });

  const sortedWorkers = Array.from(labourMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const totalCols = 3 + dates.length + 2; // Name, Category, Rate, ...Dates..., Total Hajari, Total Earned
  const lastColLetter = sheet.getColumn(totalCols).letter;

  // Title rows
  sheet.mergeCells(`A1:${lastColLetter}1`);
  const compTitleCell = sheet.getCell("A1");
  compTitleCell.value = `RCR Enterprises`;
  compTitleCell.font = { size: 24, bold: true, color: { argb: "FF0B2447" } };
  compTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 40;

  sheet.mergeCells(`A2:${lastColLetter}2`);
  const titleCell = sheet.getCell("A2");
  titleCell.value = `Attendance Report - ${siteName}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells(`A3:${lastColLetter}3`);
  const subtitleCell = sheet.getCell("A3");
  subtitleCell.value = `Period: ${format(start, "dd MMM yyyy")} to ${format(end, "dd MMM yyyy")}`;
  subtitleCell.font = { size: 11, italic: true };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 20;

  sheet.addRow([]);

  // Headers (Days and Days of Week)
  const daysOfWeekRow = ["Labour Name", "Category", "Rate"];
  const daysRow = ["", "", ""];

  dates.forEach(d => {
    daysOfWeekRow.push(format(d, "EEE")); // e.g. Mon, Tue
    daysRow.push(format(d, "dd")); // e.g. 01, 02
  });

  daysOfWeekRow.push("Total Hajari", "Total Earned");
  daysRow.push("", "");

  const headerRow1 = sheet.addRow(daysOfWeekRow);
  const headerRow2 = sheet.addRow(daysRow);

  // Style Headers
  [headerRow1, headerRow2].forEach(row => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.eachCell((cell, colNumber) => {
      // Different color for weekends? Let's just use standard for now
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });
  });
  
  // Merge the empty cells in the double header for better look
  sheet.mergeCells("A5:A6");
  sheet.mergeCells("B5:B6");
  sheet.mergeCells("C5:C6");
  sheet.mergeCells(`${sheet.getColumn(totalCols - 1).letter}5:${sheet.getColumn(totalCols - 1).letter}6`);
  sheet.mergeCells(`${sheet.getColumn(totalCols).letter}5:${sheet.getColumn(totalCols).letter}6`);

  // Freeze panes (Freeze Name, Category, Rate, and headers)
  sheet.views = [{ state: "frozen", ySplit: 6, xSplit: 3 }];

  // Data Rows
  sortedWorkers.forEach(worker => {
    const rowData = [worker.name, worker.category, `₹${worker.dailyWage}`];

    dates.forEach(d => {
      const dateKey = format(d, "yyyy-MM-dd");
      const record = worker.attendanceByDate[dateKey];
      
      if (record) {
        if (record.hajari > 0) {
          rowData.push(record.hajari); // e.g. 1, 0.5
        } else {
          rowData.push("A");
        }
      } else {
        rowData.push("-");
      }
    });

    rowData.push(worker.totalHajari);
    rowData.push(`₹${worker.totalEarned}`);

    const row = sheet.addRow(rowData);

    row.eachCell((cell, colNum) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        left: { style: "thin", color: { argb: "FFE0E0E0" } },
        bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
        right: { style: "thin", color: { argb: "FFE0E0E0" } }
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      
      if (colNum === 1 || colNum === 2) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }

      // Color code present/absent
      if (colNum > 3 && colNum <= 3 + dates.length) {
        if (cell.value === "A") {
          cell.font = { color: { argb: "FFFF0000" }, bold: true }; // Red
        } else if (typeof cell.value === "number") {
          cell.font = { color: { argb: "FF008000" }, bold: true }; // Green
        }
      }
    });
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    let maxLength = 0;
    if (column.eachCell) {
      column.eachCell({ includeEmpty: true }, cell => {
        // Don't calculate width based on the very first few title rows which span multiple columns
        if (cell.row && Number(cell.row) > 4) {
          const columnLength = cell.value ? cell.value.toString().length : 5;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        }
      });
    }
    // Set width, with a minimum of 5 and max of 40
    column.width = Math.min(Math.max(maxLength + 2, 5), 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

