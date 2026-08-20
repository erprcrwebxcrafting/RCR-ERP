import ExcelJS from "exceljs";
import { format } from "date-fns";
import fs from "fs";
import path from "path";

export async function generateSupervisorAttendanceExcel(attendances: any[], siteName: string, periodStr: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Supervisor Attendance");

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
  sheet.mergeCells("A1:G1");
  const compTitleCell = sheet.getCell("A1");
  compTitleCell.value = `RCR Enterprises`;
  compTitleCell.font = { size: 24, bold: true, color: { argb: "FF0B2447" } };
  compTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 40;

  sheet.mergeCells("A2:G2");
  const titleCell = sheet.getCell("A2");
  titleCell.value = `Supervisor Attendance Report - ${siteName}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells("A3:G3");
  const subtitleCell = sheet.getCell("A3");
  subtitleCell.value = `Period: ${periodStr}`;
  subtitleCell.font = { size: 11, italic: true };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 20;

  sheet.addRow([]);

  // Headers
  const headerRow = sheet.addRow(["Date", "Supervisor Name", "Email", "Status", "Daily Rate", "Total Earned", "Remarks"]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6366F1" } }; // Indigo-500
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
    const row = sheet.addRow([
      format(new Date(a.date), "dd MMM yyyy"),
      a.supervisor.name,
      a.supervisor.email,
      a.status === "PRESENT" ? "Present" : a.status === "HALF_DAY" ? "Half Day" : "Absent",
      a.dailyRate > 0 ? `₹${a.dailyRate}` : "-",
      a.earnedAmount > 0 ? `₹${a.earnedAmount}` : "-",
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

    const statusCell = row.getCell(4);
    statusCell.alignment = { horizontal: "center", vertical: "middle" };
    statusCell.font = { bold: true };
    if (a.status === "PRESENT") {
      statusCell.font.color = { argb: "FF059669" }; // Emerald
    } else if (a.status === "HALF_DAY") {
      statusCell.font.color = { argb: "FFD97706" }; // Amber
    } else {
      statusCell.font.color = { argb: "FFE11D48" }; // Rose
    }
  });

  // Set column widths
  sheet.getColumn(1).width = 15;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 30;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 15;
  sheet.getColumn(7).width = 30;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
