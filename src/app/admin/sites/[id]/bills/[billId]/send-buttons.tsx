"use client";
import { Button } from "@/components/ui/button";
import { Mail, FileArchive } from "lucide-react";
import { sendBillEmailAction, sendBillWhatsAppAction } from "./actions";
import { toast } from "sonner";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons";

export function SendButtons({ billId }: { billId: string }) {
  const [loading, setLoading] = useState(false);

  const handleSend = async (type: "EMAIL" | "WHATSAPP") => {
    const toastId = toast.loading(type === "EMAIL" ? "Sending bill via email..." : "Preparing WhatsApp...");
    setLoading(true);
    try {
      const res = type === "EMAIL" ? await sendBillEmailAction(billId) : await sendBillWhatsAppAction(billId);
      
      if (res?.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(type === "EMAIL" ? "Bill emailed successfully!" : "WhatsApp ready!", { id: toastId });
        if (type === "WHATSAPP" && (res as any)?.url) {
          window.open((res as any).url, "_blank");
        }
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <a href={`/api/bills/${billId}/zip`} target="_blank">
        <Button variant="outline" className="gap-2"><FileArchive className="h-4 w-4" /> Download ZIP</Button>
      </a>
      <Button variant="secondary" className="gap-2" onClick={() => handleSend("EMAIL")} disabled={loading}>
        <Mail className="h-4 w-4" /> Send Email
      </Button>
      <Button variant="secondary" className="gap-2 text-green-600 border-green-600" onClick={() => handleSend("WHATSAPP")} disabled={loading}>
        <WhatsAppIcon className="h-4 w-4" /> Send WhatsApp
      </Button>
    </div>
  );
}
