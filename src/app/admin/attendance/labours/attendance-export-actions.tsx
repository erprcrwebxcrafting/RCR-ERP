"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useRcrDownload } from "@/components/rcr-download-modal";

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
  const { downloadFile, DownloadModal } = useRcrDownload();

  const handleExcelExport = () => {
    if (!siteId) return;
    downloadFile({
      url: `/api/attendance/export?format=excel&${exportUrlParams}`,
      defaultFilename: "Attendance_Ledger.xlsx",
      fileType: "excel",
      title: "Creating Excel Ledger...",
    });
  };

  const handlePdfExport = () => {
    if (!siteId) return;
    downloadFile({
      url: `/api/attendance/export?format=pdf&${exportUrlParams}`,
      defaultFilename: "Attendance_Ledger.pdf",
      fileType: "pdf",
      title: "Creating PDF Ledger...",
    });
  };

  const handleBulkCardsExport = () => {
    if (!siteId) return;
    downloadFile({
      url: `/api/attendance/export-bulk-site?siteId=${siteId}&month=${startDateStr}`,
      defaultFilename: "Bulk_Attendance_Cards.pdf",
      fileType: "card",
      title: "Generating Bulk Attendance Cards...",
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!siteId}
          onClick={handleExcelExport}
          className={
            !siteId
              ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-5"
              : "border-transparent bg-white hover:bg-white/90 text-emerald-600 shadow-xl shadow-emerald-900/10 transition-all font-bold h-10 rounded-xl px-5 active:scale-95"
          }
        >
          <FileSpreadsheet className={`w-4 h-4 mr-2 ${!siteId ? "text-white/70" : ""}`} /> Excel Ledger
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!siteId}
          onClick={handlePdfExport}
          className={
            !siteId
              ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-5"
              : "border-transparent bg-white hover:bg-white/90 text-rose-600 shadow-xl shadow-rose-900/10 transition-all font-bold h-10 rounded-xl px-5 active:scale-95"
          }
        >
          <FileText className={`w-4 h-4 mr-2 ${!siteId ? "text-white/70" : ""}`} /> PDF Ledger
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!siteId}
          onClick={handleBulkCardsExport}
          className={
            !siteId
              ? "cursor-not-allowed pointer-events-none bg-white/20 border-white/30 text-white shadow-none font-medium h-10 rounded-xl px-5"
              : "border-transparent bg-white hover:bg-white/90 text-indigo-600 shadow-xl shadow-indigo-900/10 transition-all font-bold h-10 rounded-xl px-5 active:scale-95"
          }
        >
          <FileText className={`w-4 h-4 mr-2 ${!siteId ? "text-white/70" : ""}`} /> Bulk Cards (PDF)
        </Button>
      </div>

      <DownloadModal />
    </>
  );
}
