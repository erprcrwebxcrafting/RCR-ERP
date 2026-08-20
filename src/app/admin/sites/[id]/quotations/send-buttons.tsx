"use client";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { updateContactAndSendEmailAction, updateContactAndSendWhatsAppAction } from "./actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function QuotationSendButtons({ quotationId, clientId, clientEmail, clientPhone }: { quotationId: string, clientId: string, clientEmail: string, clientPhone: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const [editEmail, setEditEmail] = useState(clientEmail || "");
  const [editPhone, setEditPhone] = useState(clientPhone || "");

  const handleSend = async (type: "EMAIL" | "WHATSAPP") => {
    setLoading(true);
    const toastId = toast.loading(type === "EMAIL" ? "Sending quotation via email..." : "Opening WhatsApp dispatch...");
    try {
      const res = type === "EMAIL" 
        ? await updateContactAndSendEmailAction(quotationId, clientId, editEmail)
        : await updateContactAndSendWhatsAppAction(quotationId, clientId, editPhone);

      if (res?.error) {
        toast.error("Failed to send quotation", { id: toastId, description: res.error });
      } else {
        toast.success(type === "EMAIL" ? "Quotation PDF emailed successfully!" : "WhatsApp dispatch prepared!", { id: toastId });
        setEmailModalOpen(false);
        setWhatsappModalOpen(false);
        if ((res as any).url) {
          window.open((res as any).url, "_blank");
        }
        router.refresh();
      }
    } catch (e: any) {
      toast.error("Failed to send", { id: toastId, description: e?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { setEditEmail(clientEmail || ""); setEmailModalOpen(true); }} disabled={loading}>
          <Mail className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-600" onClick={() => { setEditPhone(clientPhone || ""); setWhatsappModalOpen(true); }} disabled={loading}>
          <WhatsAppIcon className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Email Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client Email Address</Label>
              <Input 
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)} 
                placeholder="e.g. client@example.com" 
                multiple
              />
              <p className="text-xs text-muted-foreground">You can enter multiple emails separated by commas. Updating this will also save it to the client's profile.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailModalOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={() => handleSend("EMAIL")} disabled={loading}>Confirm & Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm WhatsApp Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client WhatsApp Number</Label>
              <Input 
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)} 
                placeholder="e.g. +91 9999999999" 
              />
              <p className="text-xs text-muted-foreground">Updating this will also save it to the client's profile.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappModalOpen(false)} disabled={loading}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleSend("WHATSAPP")} disabled={loading}>Confirm & Send WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
