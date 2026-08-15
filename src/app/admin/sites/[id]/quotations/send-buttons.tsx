"use client";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
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
