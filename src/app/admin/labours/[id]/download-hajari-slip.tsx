"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Share2, Download, CalendarRange } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function DownloadHajariSlip({ labourId }: { labourId: string }) {
  const [generatingAction, setGeneratingAction] = useState<"download" | "share" | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First of month
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const handleAction = async (actionType: "download" | "share") => {
    setGeneratingAction(actionType);
    
    try {
      const url = `/api/labours/${labourId}/export-hajari-pdf?from=${fromDate}&to=${toDate}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to generate slip");
      }

      const blob = await response.blob();
      const filename = "Hajari_Statement.pdf";

      if (actionType === "share") {
        const file = new File([blob], filename, { type: "application/pdf" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Hajari Statement",
            text: "Please find your Hajari statement attached.",
          });
        } else {
          // Fallback
          downloadBlob(blob, filename);
        }
      } else {
        downloadBlob(blob, filename);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to generate hajari slip:", error);
      alert(error instanceof Error ? error.message : "Failed to generate slip");
    } finally {
      setGeneratingAction(null);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow"
        >
          <CalendarRange className="h-4 w-4 mr-2" />
          Hajari Slip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Hajari Statement</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="from" className="text-right">From</Label>
            <Input
              id="from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to" className="text-right">To</Label>
            <Input
              id="to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleAction("download")} disabled={!!generatingAction}>
            {generatingAction === "download" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download
          </Button>
          <Button onClick={() => handleAction("share")} disabled={!!generatingAction}>
            {generatingAction === "share" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
