"use client";
import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, X, User2, Building2, Phone, Mail, FileText, MapPin, AlignLeft, Save } from "lucide-react";
import { updateClient } from "./actions";
import { toast } from "sonner";
import { validatePhone, validateGST, validateEmail } from "@/lib/validations";

export function EditClientForm({ client }: { client: any }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const gstNo = (formData.get("gstNo") as string)?.trim();

    if (!name || name.length < 2) {
      toast.error("Client name is required (minimum 2 characters).");
      return;
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      toast.error(phoneCheck.error);
      return;
    }

    const emailCheck = validateEmail(email, false);
    if (!emailCheck.valid) {
      toast.error(emailCheck.error);
      return;
    }

    const gstCheck = validateGST(gstNo);
    if (!gstCheck.valid) {
      toast.error(gstCheck.error);
      return;
    }

    startTransition(async () => {
      try {
        await updateClient(client.id, formData);
        toast.success("Client details updated successfully!", {
          description: `Changes to ${name} have been saved.`,
        });
        setOpen(false);
      } catch (err: any) {
        toast.error("Failed to update client", {
          description: err?.message || "Please check inputs and retry.",
        });
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5">
          <Edit className="h-4 w-4 mr-2" /> Edit Client
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white dark:bg-slate-900 shadow-2xl z-50 max-h-[90vh] overflow-y-auto overflow-x-hidden p-0">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          
          <div className="p-6 sm:p-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <User2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Dialog.Title className="text-2xl font-bold text-slate-900 dark:text-white">Edit Client</Dialog.Title>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Update details and contact info for this client.
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Company / Client Name <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input name="name" required defaultValue={client.name} className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Contact Person</Label>
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input name="contactPerson" defaultValue={client.contactPerson || ""} className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input name="phone" maxLength={10} defaultValue={client.phone || ""} className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input id="email" name="email" type="email" defaultValue={client.email || ""} placeholder="client@example.com" className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">GST Number</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input name="gstNo" maxLength={15} defaultValue={client.gstNo || ""} className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono uppercase" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Textarea name="address" defaultValue={client.address || ""} rows={3} className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Remarks / Internal Notes</Label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Textarea name="remarks" defaultValue={client.remarks || ""} rows={2} className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-slate-200 dark:border-slate-700 font-semibold">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 gap-2">
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
