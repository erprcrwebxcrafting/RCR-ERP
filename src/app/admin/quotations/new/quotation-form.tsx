"use client";

import { useState, useTransition } from "react";
import { createIndependentQuotation } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Building2, UserCircle2, Mail, Phone, FileText, AlignLeft, ShieldAlert, Send } from "lucide-react";
import { toast } from "sonner";
import { validatePhone, validateEmail } from "@/lib/validations";

type Client = { id: string; name: string };

export function QuotationForm({
  clients, defaultTerms, defaultExclusions, action, initialData
}: { 
  clients: Client[]; defaultTerms: string; defaultExclusions: string;
  action: (formData: FormData) => void;
  initialData?: any;
}) {
  const [items, setItems] = useState<{ description: string; unit: string; rate: string | number }[]>(
    initialData?.items ? initialData.items : [{ description: "", unit: "Sft", rate: "" }]
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = (formData.get("clientId") as string)?.trim();
    const newClientName = (formData.get("newClientName") as string)?.trim();
    const projectName = (formData.get("projectName") as string)?.trim();
    const subject = (formData.get("subject") as string)?.trim();
    const clientPhone = (formData.get("clientPhone") as string)?.trim();
    const clientEmail = (formData.get("clientEmail") as string)?.trim();

    if (!clientId && !newClientName) {
      toast.error("Please select an existing client or enter a new client name.");
      return;
    }

    if (!projectName || projectName.length < 2) {
      toast.error("Project name is required (minimum 2 characters).");
      return;
    }

    if (!subject || subject.length < 3) {
      toast.error("Quotation subject is required.");
      return;
    }

    const phoneCheck = validatePhone(clientPhone);
    if (!phoneCheck.valid) {
      toast.error(phoneCheck.error);
      return;
    }

    const emailCheck = validateEmail(clientEmail, false);
    if (!emailCheck.valid) {
      toast.error(emailCheck.error);
      return;
    }

    const validItems = items.filter((it) => it.description.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one line item with description and rate.");
      return;
    }

    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Quotation generated successfully!");
      } catch (err: any) {
        toast.error("Failed to generate quotation", {
          description: err?.message || "Please check inputs and retry.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-t-4 border-t-indigo-500 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" /> Client & Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 px-6 pb-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground"><UserCircle2 className="w-4 h-4"/> Select Existing Client</Label>
              <select name="clientId" defaultValue={initialData?.clientId || ""} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all shadow-sm">
                <option value="">-- Choose Existing --</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground"><Plus className="w-4 h-4"/> Or New Client Name</Label>
              <Input name="newClientName" placeholder="Type new client name here" className="h-11 bg-background shadow-sm focus-visible:ring-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-4 h-4"/> Client Email (Optional)</Label>
              <Input name="clientEmail" type="email" multiple placeholder="client@example.com" className="h-11 bg-background shadow-sm focus-visible:ring-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-4 h-4"/> Client Phone (Optional)</Label>
              <Input name="clientPhone" placeholder="+91 99999 99999" className="h-11 bg-background shadow-sm focus-visible:ring-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground font-semibold">Project Name <span className="text-destructive">*</span></Label>
              <Input name="projectName" defaultValue={initialData?.projectName || ""} required placeholder="e.g. Skyline Towers" className="h-11 bg-background shadow-sm border-indigo-200 focus-visible:ring-indigo-500 transition-all" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5 text-foreground font-semibold">Quotation Subject <span className="text-destructive">*</span></Label>
              <Input name="subject" defaultValue={initialData?.subject || ""} required placeholder="Quotation for Reinforcement Work (Labour Basis)" className="h-11 bg-background shadow-sm border-indigo-200 focus-visible:ring-indigo-500 transition-all text-base" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-amber-500 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" /> Rate Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-12 gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-3">Rate</div>
          </div>
          {items.map((it: any, i: number) => (
            <div key={i} className="grid grid-cols-12 gap-3 group relative items-center">
              <Input className="col-span-6 h-11 bg-background shadow-sm transition-all focus-visible:ring-amber-500" name="itemDescription[]" placeholder="e.g. Concrete Pouring" value={it.description}
                onChange={(e) => setItems((arr: any[]) => arr.map((x: any, idx: number) => (idx === i ? { ...x, description: e.target.value } : x)))} />
              <Input className="col-span-2 h-11 bg-background shadow-sm transition-all focus-visible:ring-amber-500" name="itemUnit[]" placeholder="Sft" value={it.unit}
                onChange={(e) => setItems((arr: any[]) => arr.map((x: any, idx: number) => (idx === i ? { ...x, unit: e.target.value } : x)))} />
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-3 text-muted-foreground font-medium">₹</span>
                <Input className="h-11 pl-7 bg-background shadow-sm transition-all focus-visible:ring-amber-500 font-semibold text-amber-700 dark:text-amber-500" name="itemRate[]" type="number" step="0.01" placeholder="0.00" value={it.rate}
                  onChange={(e) => setItems((arr: any[]) => arr.map((x: any, idx: number) => (idx === i ? { ...x, rate: e.target.value } : x)))} />
              </div>
              <Button type="button" variant="ghost" size="icon" className="col-span-1 h-11 w-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setItems((arr: any[]) => arr.filter((_: any, idx: number) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="mt-2 w-full border-dashed border-2 hover:border-amber-500 hover:text-amber-600 transition-colors gap-2 h-11" onClick={() => setItems((arr: any[]) => [...arr, { description: "", unit: "Sft", rate: "" }])}>
            <Plus className="h-4 w-4" /> Add Another Item
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-t-4 border-t-emerald-500 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-emerald-500" /> Terms & Conditions
            </CardTitle>
            <p className="text-xs text-muted-foreground pt-1">One condition per line. These appear at the bottom of the PDF.</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <textarea name="terms" defaultValue={initialData?.terms || defaultTerms} rows={12} className="w-full rounded-md border border-input bg-background p-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all resize-none leading-relaxed" />
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Exclusions
            </CardTitle>
            <p className="text-xs text-muted-foreground pt-1">One exclusion per line. These clarify what is NOT in scope.</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <textarea name="exclusions" defaultValue={initialData?.exclusions || defaultExclusions} rows={12} className="w-full rounded-md border border-input bg-background p-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-all resize-none leading-relaxed" />
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" disabled={isPending} size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105">
          {isPending ? "Generating..." : (initialData ? "Save Changes" : "Create Quotation")}
        </Button>
      </div>
    </form>
  );
}
