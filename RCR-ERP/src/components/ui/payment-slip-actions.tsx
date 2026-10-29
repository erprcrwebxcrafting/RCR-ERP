"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2, CalendarRange, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PaymentSlipProps {
  entityId: string;
  entityType: "LABOUR" | "SUPERVISOR";
  paymentId?: string; // If provided, it's a single slip button
  variant?: "icon" | "button" | "statement";
}

export function PaymentSlipAction({ entityId, entityType, paymentId, variant = "icon" }: PaymentSlipProps) {
  const [generatingAction, setGeneratingAction] = useState<"download" | "share" | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAllTime, setIsAllTime] = useState(false);
  
  // For statement
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First of month
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const handleAction = async (actionType: "download" | "share", isStatement = false) => {
    setGeneratingAction(actionType);
    const toastId = toast.loading(`Generating ${isStatement ? "Payment Statement" : "Payment Receipt"}... Please wait.`);
    try {
      const type = isStatement ? "STATEMENT" : "SINGLE";
      let baseParams = `entityId=${entityId}&entityType=${entityType}&type=${type}`;
      
      if (isStatement) {
        if (isAllTime) {
          baseParams += `&allTime=true&to=${toDate}`;
        } else {
          baseParams += `&from=${fromDate}&to=${toDate}`;
        }
      } else if (paymentId) {
        baseParams += `&paymentId=${paymentId}`;
      }

      const generatePdfClientSide = async () => {
        const response = await fetch(`/api/payments/export-pdf?${baseParams}&format=json`);
        if (!response.ok) {
          const err = await response.text();
          throw new Error(err || "Failed to generate slip data");
        }

        const json = await response.json();
        const { pdfData, filename } = json;

        const { pdf } = await import("@react-pdf/renderer");
        const PaymentSlipDocument = (await import("@/lib/pdf/payment-slip")).default;

        const blob = await pdf(<PaymentSlipDocument data={pdfData} />).toBlob();
        return { blob, filename };
      };

      let result: { blob: Blob; filename: string } | null = null;
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("CLIENT_TIMEOUT")), 8000)
        );
        result = await Promise.race([generatePdfClientSide(), timeoutPromise]);
      } catch (err: any) {
        if (actionType === "download") {
          console.warn("Client PDF generation timed out or failed, falling back to direct server download URL:", err);
          window.location.href = `/api/payments/export-pdf?${baseParams}`;
          toast.success("Download started!", { id: toastId });
          setIsOpen(false);
          return;
        }
        throw err;
      }

      if (result) {
        const { blob, filename } = result;
        if (actionType === "share") {
          const file = new File([blob], filename, { type: "application/pdf" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            toast.dismiss(toastId);
            try {
              await navigator.share({
                files: [file],
                title: isStatement ? "Payment Statement" : "Payment Receipt",
                text: "Please find the payment slip attached.",
              });
            } catch (shareErr: any) {
              if (shareErr.name === "AbortError") return;
              downloadBlob(blob, filename);
              toast.success("Downloaded successfully (Share unavailable)", { id: toastId });
            }
          } else {
            downloadBlob(blob, filename);
            toast.success("Downloaded successfully", { id: toastId });
          }
        } else {
          downloadBlob(blob, filename);
          toast.success("Downloaded successfully", { id: toastId });
        }
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Action failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate slip", { id: toastId });
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

  if (variant === "statement") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
            <CalendarRange className="h-4 w-4 mr-2" />
            Statement
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-500/10 dark:bg-slate-950 p-6">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-indigo-950 dark:text-indigo-100">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              Payment Statement
            </DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Select a date range or choose complete history to generate a detailed ledger of hajari, earnings, and payments.
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center space-x-2 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
              <input
                type="checkbox"
                id="allTime"
                checked={isAllTime}
                onChange={(e) => setIsAllTime(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <Label htmlFor="allTime" className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 cursor-pointer">
                All-Time Statement (From Joining / Shuru Se Ab Tak)
              </Label>
            </div>

            <div className={`space-y-2 transition-opacity ${isAllTime ? 'opacity-40 pointer-events-none' : ''}`}>
              <Label htmlFor="from" className="text-sm font-semibold text-slate-700 dark:text-slate-300">From Date</Label>
              <Input
                id="from"
                type="date"
                value={fromDate}
                disabled={isAllTime}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to" className="text-sm font-semibold text-slate-700 dark:text-slate-300">To Date</Label>
              <Input
                id="to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 h-11"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button 
              variant="outline" 
              onClick={() => handleAction("download", true)} 
              disabled={!!generatingAction}
              className="flex-1 h-11 hover:bg-slate-50 dark:hover:bg-slate-900 dark:text-slate-200 dark:border-slate-700 font-medium"
            >
              {generatingAction === "download" ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-500" /> : <Download className="h-4 w-4 mr-2 text-slate-500" />}
              Download PDF
            </Button>
            <Button 
              onClick={() => handleAction("share", true)} 
              disabled={!!generatingAction}
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all font-medium"
            >
              {generatingAction === "share" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
              Share Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Single slip variants
  return (
    <div className="flex gap-1 items-center">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        title="Download Slip"
        onClick={() => handleAction("download")}
        disabled={!!generatingAction}
      >
        {generatingAction === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        title="Share Slip"
        onClick={() => handleAction("share")}
        disabled={!!generatingAction}
      >
        {generatingAction === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
