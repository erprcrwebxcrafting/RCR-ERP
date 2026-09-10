"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { recordSupervisorPayment } from "./actions";
import { useState, useTransition } from "react";
import { IndianRupee, Calendar, Search, Hash, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { validatePositiveNumber } from "@/lib/validations";

export function SupervisorPaymentForm({ supervisorId, initialData }: { supervisorId: string, initialData?: any }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amountStr = (formData.get("amount") as string)?.trim();
    const dateStr = (formData.get("date") as string)?.trim();

    const amtCheck = validatePositiveNumber(amountStr, "Payment Amount");
    if (!amtCheck.valid) {
      toast.error(amtCheck.error);
      return;
    }

    if (!dateStr) {
      toast.error("Please select a valid payment date.");
      return;
    }

    startTransition(async () => {
      try {
        await recordSupervisorPayment(formData);
        toast.success(`Advance payout ${isEditing ? 'updated' : 'recorded'} successfully!`, {
          description: `₹${Number(amountStr).toLocaleString("en-IN")} advance ${isEditing ? 'updated' : 'recorded'} for supervisor.`,
        });
        setOpen(false);
      } catch (err: any) {
        toast.error(`Failed to ${isEditing ? 'update' : 'record'} payout`, {
          description: err?.message || "Please check inputs and retry.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </Button>
        ) : (
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
            <Plus className="h-4 w-4" /> Record Advance Payout
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <div className="p-6">
          <DialogHeader className="mb-6 space-y-3 text-left">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-1">
              <IndianRupee className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                {isEditing ? "Edit Advance Payment" : "Record Advance Payment"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {isEditing ? "Update the details of the advance payout." : "Enter the details of the advance payout made to this supervisor."}
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="supervisorId" value={supervisorId} />
            {isEditing && <input type="hidden" name="id" value={initialData.id} />}
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input name="date" type="date" required defaultValue={today} className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Amount (₹) *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input name="amount" type="number" required placeholder="e.g. 5000" className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono font-bold" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Reason / Note</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input name="reason" placeholder="e.g. Monthly Advance, Site Expense" className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Transaction ID / Ref</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-400 normal-case tracking-normal">Optional</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input name="transactionId" placeholder="UPI / NEFT Ref No." className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono text-sm" />
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 mt-2 gap-2">
              <Save className="h-4 w-4" />
              {isPending ? "Recording Payment..." : "Save Payment"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
