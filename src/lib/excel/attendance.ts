import ExcelJS from "exceljs";
import { format } from "date-fns";
import fs from "fs";
import path from "path";

export async function generateAttendanceExcel(attendances: any[], siteName: string, startDate: string, endDate: string): Promise<Buffer> {
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

  // Title rows
  sheet.mergeCells("A1:I1");
  const compTitleCell = sheet.getCell("A1");
  compTitleCell.value = `RCR Enterprises`;
  compTitleCell.font = { size: 24, bold: true, color: { argb: "FF0B2447" } };
  compTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 40;

  sheet.mergeCells("A2:I2");
  const titleCell = sheet.getCell("A2");
  titleCell.value = `Attendance Report - ${siteName}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells("A3:I3");
  const subtitleCell = sheet.getCell("A3");
  subtitleCell.value = `Period: ${startDate} to ${endDate}`;
  subtitleCell.font = { size: 11, italic: true };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 20;

  sheet.addRow([]);

  // Headers
  const headerRow = sheet.addRow(["Date", "Building", "Category", "Labour Name", "Status", "OT Hrs", "Rate", "Total", "Remarks"]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" }
    };
  });

  // Freeze rows
  sheet.views = [{ state: "frozen", ySplit: 5 }];

  // Data
  attendances.forEach(a => {
    const appliedRate = a.hajariRate || a.labour.dailyWage || 0;
    const totalEarned = a.hajari > 0 ? a.hajari * appliedRate : 0;

    const row = sheet.addRow([
      format(new Date(a.date), "dd MMM yyyy"),
      a.building?.name || "General",
      a.labour.labourCategory.name,
      a.labour.name,
      a.hajari > 0 ? `${a.hajari} Hajari` : "Absent",
      a.overtimeHrs > 0 ? a.overtimeHrs : "",
      appliedRate > 0 ? `₹${appliedRate}` : "-",
      totalEarned > 0 ? `₹${totalEarned}` : "-",
      a.remarks || ""
    ]);

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        left: { style: "thin", color: { argb: "FFE0E0E0" } },
        bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
        right: { style: "thin", color: { argb: "FFE0E0E0" } }
      };
      cell.alignment = { vertical: "middle" };
    });

    // Color code status
    const statusCell = row.getCell(5);
    statusCell.alignment = { horizontal: "center", vertical: "middle" };
    statusCell.font = { bold: true };
    if (a.hajari > 0) {
      statusCell.font.color = { argb: "FF008000" }; // Green
    } else {
      statusCell.font.color = { argb: "FFFF0000" }; // Red
    }

    const otCell = row.getCell(6);
    otCell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Set column widths
  sheet.getColumn(1).width = 15;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 25;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 10;
  sheet.getColumn(7).width = 12;
  sheet.getColumn(8).width = 12;
  sheet.getColumn(9).width = 30;

  // --- SUMMARY SHEET ---
  const summarySheet = workbook.addWorksheet("Summary");
  
  // Add Logo to Summary
  try {
    const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoId = workbook.addImage({
      buffer: logoBuffer as any,
      extension: "png",
    });
    summarySheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 100, height: 40 },
    });
  } catch (err) {}

  summarySheet.mergeCells("A1:E1");
  const compSumTitle = summarySheet.getCell("A1");
  compSumTitle.value = `RCR Enterprises`;
  compSumTitle.font = { size: 24, bold: true, color: { argb: "FF0B2447" } };
  compSumTitle.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 40;

  summarySheet.mergeCells("A2:E2");
  const sumTitle = summarySheet.getCell("A2");
  sumTitle.value = `Payroll Summary - ${siteName}`;
  sumTitle.font = { size: 14, bold: true };
  sumTitle.alignment = { horizontal: "center", vertical: "middle" };

  summarySheet.mergeCells("A3:E3");
  const sumSubTitle = summarySheet.getCell("A3");
  sumSubTitle.value = `Period: ${startDate} to ${endDate}`;
  sumSubTitle.font = { size: 11, italic: true };
  sumSubTitle.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(3).height = 20;

  summarySheet.addRow([]);

  const sumHeader = summarySheet.addRow(["Labour Name", "Category", "Total Hajaris", "Total OT Hrs", "Total Earned"]);
  sumHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  sumHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });
  summarySheet.views = [{ state: "frozen", ySplit: 5 }];

  // Aggregate Data
  const summaryMap = new Map<string, any>();
  attendances.forEach(a => {
    if (!summaryMap.has(a.labourId)) {
      summaryMap.set(a.labourId, {
        name: a.labour.name,
        category: a.labour.labourCategory.name,
        hajaris: 0,
        otHrs: 0,
        totalEarned: 0
      });
    }
    const appliedRate = a.hajariRate || a.labour.dailyWage || 0;
    const totalEarned = a.hajari > 0 ? a.hajari * appliedRate : 0;
    
    const summary = summaryMap.get(a.labourId);
    summary.hajaris += a.hajari || 0;
    summary.otHrs += a.overtimeHrs || 0;
    summary.totalEarned += totalEarned;
  });

  const sortedSummary = Array.from(summaryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  sortedSummary.forEach(s => {
    const row = summarySheet.addRow([
      s.name,
      s.category,
      s.hajaris,
      s.otHrs,
      `₹${s.totalEarned}`
    ]);
    row.eachCell((cell) => {
      cell.border = { top: { style: "thin", color: { argb: "FFE0E0E0" } }, left: { style: "thin", color: { argb: "FFE0E0E0" } }, bottom: { style: "thin", color: { argb: "FFE0E0E0" } }, right: { style: "thin", color: { argb: "FFE0E0E0" } } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
  });

  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 20;
  summarySheet.getColumn(3).width = 15;
  summarySheet.getColumn(4).width = 15;
  summarySheet.getColumn(5).width = 18;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
