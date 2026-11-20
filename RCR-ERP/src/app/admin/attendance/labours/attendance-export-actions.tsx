"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, FolderArchive } from "lucide-react";
import { triggerRcrDownload } from "@/components/rcr-download-modal";

interface AttendanceExportActionsProps {
  siteId?: string;
  exportUrlParams: string;
  startDateStr: string;
}

export function AttendanceExportActions({
  siteId,
  exportUrlParams,
  startDateStr,
}: AttendanceExportActionsProps) {
  const handleExcelExport = () => {
    if (!siteId) return;
    triggerRcrDownload({
      url: `/api/attendance/export?format=excel&${exportUrlParams}`,
      defaultFilename: "Attendance_Ledger.xlsx",
      fileType: "excel",
      title: "Creating Excel Ledger...",
    });
  };

  const handlePdfExport = () => {
    if (!siteId) return;
    triggerRcrDownload({
      url: `/api/attendance/export?format=pdf&${exportUrlParams}`,
      defaultFilename: "Attendance_Ledger.pdf",
      fileType: "pdf",
      title: "Creating PDF Ledger...",
    });
  };

  const handleBulkCardsCombined = () => {
    if (!siteId) return;
    triggerRcrDownload({
      url: `/api/attendance/export-bulk-site?siteId=${siteId}&month=${startDateStr}&format=pdf`,
      defaultFilename: "Bulk_Attendance_Cards.pdf",
      fileType: "card",
      title: "Generating Bulk Attendance Cards (1 PDF)...",
    });
  };

  const handleBulkCardsZip = () => {
    if (!siteId) return;
    triggerRcrDownload({
      url: `/api/attendance/export-bulk-site?siteId=${siteId}&month=${startDateStr}&format=zip`,
      defaultFilename: "Individual_Attendance_Cards.zip",
      fileType: "zip",
      title: "Packaging Individual Cards (ZIP)...",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={!siteId}
        onClick={handleExcelExport}
        className={
          !siteId
            ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-4"
            : "border-transparent bg-white hover:bg-white/90 text-emerald-600 shadow-xl shadow-emerald-900/10 transition-all font-bold h-10 rounded-xl px-4 active:scale-95"
        }
      >
        <FileSpreadsheet className={`w-4 h-4 mr-1.5 ${!siteId ? "text-white/70" : ""}`} /> Excel Ledger
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!siteId}
        onClick={handlePdfExport}
        className={
          !siteId
            ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-4"
            : "border-transparent bg-white hover:bg-white/90 text-rose-600 shadow-xl shadow-rose-900/10 transition-all font-bold h-10 rounded-xl px-4 active:scale-95"
        }
      >
        <FileText className={`w-4 h-4 mr-1.5 ${!siteId ? "text-white/70" : ""}`} /> PDF Ledger
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!siteId}
        onClick={handleBulkCardsCombined}
        title="Download all workers cards merged into a single PDF file"
        className={
          !siteId
            ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-4"
            : "border-transparent bg-white hover:bg-white/90 text-indigo-600 shadow-xl shadow-indigo-900/10 transition-all font-bold h-10 rounded-xl px-4 active:scale-95"
        }
      >
        <FileText className={`w-4 h-4 mr-1.5 ${!siteId ? "text-white/70" : ""}`} /> Cards (Ek Sath PDF)
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!siteId}
        onClick={handleBulkCardsZip}
        title="Download separate PDF card for each worker packaged in a ZIP file"
        className={
          !siteId
            ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-4"
            : "border-transparent bg-white hover:bg-white/90 text-purple-600 shadow-xl shadow-purple-900/10 transition-all font-bold h-10 rounded-xl px-4 active:scale-95"
        }
      >
        <FolderArchive className={`w-4 h-4 mr-1.5 ${!siteId ? "text-white/70" : ""}`} /> Cards (Alag-Alag ZIP)
      </Button>
    </div>
  );
}
