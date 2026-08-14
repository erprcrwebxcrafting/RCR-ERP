"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "./actions";
import { Plus, X, Building2, User, Phone, Mail, Receipt, MapPin } from "lucide-react";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createClient(formData);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-900/20 rounded-xl h-10 px-5 font-bold transition-all hover:-translate-y-0.5 border-0">
          <Plus className="h-4 w-4" /> New Client
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-all" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-2xl overflow-hidden">
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
            <div>
              <Dialog.Title className="text-xl font-bold tracking-tight">Add New Client</Dialog.Title>
              <p className="text-blue-100 text-xs font-medium mt-1">Register a new client profile</p>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-500" /> Client Name *
              </Label>
              <Input id="name" name="name" required placeholder="e.g. NEO ITURKAA" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPerson" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-500" /> Contact Person
              </Label>
              <Input id="contactPerson" name="contactPerson" placeholder="e.g. Rahul Sharma" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone
                </Label>
                <Input id="phone" name="phone" placeholder="+91 XXXXX XXXXX" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-rose-500" /> Email
                </Label>
                <Input id="email" name="email" type="email" multiple placeholder="client@example.com" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gstNo" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-amber-500" /> GST No.
              </Label>
              <Input id="gstNo" name="gstNo" placeholder="e.g. 27AAAAA0000A1Z5" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 uppercase" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-purple-500" /> Address
              </Label>
              <Input id="address" name="address" placeholder="Full registered address" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20" />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                Create Client
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
