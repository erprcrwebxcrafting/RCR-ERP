"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2, CalendarRange, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    try {
      const type = isStatement ? "STATEMENT" : "SINGLE";
      let url = `/api/payments/export-pdf?entityId=${entityId}&entityType=${entityType}&type=${type}`;
      
      if (isStatement) {
        url += `&from=${fromDate}&to=${toDate}`;
      } else if (paymentId) {
        url += `&paymentId=${paymentId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to generate slip");
      }

      const blob = await response.blob();
      const filename = isStatement ? "Payment_Statement.pdf" : "Payment_Receipt.pdf";

      if (actionType === "share") {
        const file = new File([blob], filename, { type: "application/pdf" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: isStatement ? "Payment Statement" : "Payment Receipt",
            text: "Please find the payment slip attached.",
          });
        } else {
          // Fallback to download if share is not supported
          downloadBlob(blob, filename);
        }
      } else {
        downloadBlob(blob, filename);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error("Action failed:", error);
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

  if (variant === "statement") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
            <CalendarRange className="h-4 w-4 mr-2" />
            Statement
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Payment Statement</DialogTitle>
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
            <Button variant="outline" onClick={() => handleAction("download", true)} disabled={!!generatingAction}>
              {generatingAction === "download" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download
            </Button>
            <Button onClick={() => handleAction("share", true)} disabled={!!generatingAction}>
              {generatingAction === "share" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
              Share
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
