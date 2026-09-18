"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useRcrDownload } from "@/components/rcr-download-modal";

interface AllTimeCardsButtonProps {
  entityId: string;
  entityType: "LABOUR" | "SUPERVISOR";
  className?: string;
}

export function AllTimeCardsButton({
  entityId,
  entityType,
  className,
}: AllTimeCardsButtonProps) {
  const { downloadFile, DownloadModal } = useRcrDownload();

  const handleDownload = () => {
    downloadFile({
      url: `/api/attendance/export-bulk-labour?entityId=${entityId}&entityType=${entityType}`,
      defaultFilename: `${entityType === "LABOUR" ? "Labour" : "Supervisor"}_All_Time_Cards.pdf`,
      fileType: "card",
      title: "Generating All-Time Attendance Cards...",
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        className={
          className ||
          "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow active:scale-95"
        }
      >
        <FileText className="h-4 w-4 mr-2" /> All-Time Cards
      </Button>
      <DownloadModal />
    </>
  );
}
