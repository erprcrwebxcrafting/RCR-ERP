"use client";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, FileArchive } from "lucide-react";
import { sendBillEmailAction, sendBillWhatsAppAction } from "./actions";

export function SendButtons({ billId }: { billId: string }) {
  return (
    <div className="flex gap-2 mt-2">
      <a href={`/api/bills/${billId}/zip`} target="_blank">
        <Button variant="outline" className="gap-2"><FileArchive className="h-4 w-4" /> Download ZIP</Button>
      </a>
      <form action={sendBillEmailAction.bind(null, billId)}>
        <Button variant="secondary" className="gap-2"><Mail className="h-4 w-4" /> Send Email</Button>
      </form>
      <form action={sendBillWhatsAppAction.bind(null, billId)}>
        <Button variant="secondary" className="gap-2 text-green-600 border-green-600"><MessageCircle className="h-4 w-4" /> Send WhatsApp</Button>
      </form>
    </div>
  );
}
