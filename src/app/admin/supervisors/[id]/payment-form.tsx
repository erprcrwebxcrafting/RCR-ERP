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
import { IndianRupee, Calendar, Search, Hash, Save } from "lucide-react";
import { toast } from "sonner";
import { validatePositiveNumber } from "@/lib/validations";

export function SupervisorPaymentForm({ supervisorId }: { supervisorId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

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
      toast.error("Please select a payment date.");
      return;
    }

    startTransition(async () => {
      try {
        await recordSupervisorPayment(formData);
        toast.success("Supervisor advance payment recorded successfully!", {
          description: `₹${Number(amountStr).toLocaleString("en-IN")} payment saved.`,
        });
        setOpen(false);
      } catch (err: any) {
        toast.error("Failed to record payment", {
          description: err?.message || "Please check inputs and retry.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5">
          <IndianRupee className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <div className="p-6">
          <DialogHeader className="mb-6 space-y-3 text-left">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-1">
              <IndianRupee className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Record Advance Payment</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Enter the details of the advance payout made to this supervisor.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="supervisorId" value={supervisorId} />
            
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
