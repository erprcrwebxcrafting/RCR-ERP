"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { generateHajariSlipHTML } from "./hajari-slip-template";

export function DownloadHajariSlip({ data }: { data: any }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    setIsGenerating(true);
    
    try {
      const htmlContent = generateHajariSlipHTML(data);
      
      // Create a hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Wait for styles and fonts to load, then print
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          // Clean up after print dialog closes
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      } else {
        throw new Error("Could not access iframe document");
      }
    } catch (error) {
      console.error("Failed to generate hajari slip:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow" 
      onClick={handleDownload} 
      disabled={isGenerating}
    >
      {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
      Download Hajari Slip
    </Button>
  );
}
