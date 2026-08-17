"use client";
import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePayment } from "./actions";
import { Plus, X, IndianRupee, Calendar, FileText, Hash, Save } from "lucide-react";
import { toast } from "sonner";
import { validatePositiveNumber } from "@/lib/validations";

export function PaymentForm({ labourId }: { labourId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        await savePayment(formData);
        toast.success("Labour advance payment recorded successfully!", {
          description: `₹${Number(amountStr).toLocaleString("en-IN")} advance recorded.`,
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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
          <Plus className="h-4 w-4" /> Record Advance Payout
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl z-[101]">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-500" /> Record Payout
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="labourId" value={labourId} />
            
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Amount Paid (₹) *
              </Label>
              <Input id="amount" name="amount" type="number" required placeholder="e.g. 3000" className="h-11 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Date *
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="h-11 rounded-xl cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Reason / Remarks
              </Label>
              <Input id="reason" name="reason" placeholder="e.g. Weekly Advance, Festival Bonus" className="h-11 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transactionId" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Transaction / Ref ID
              </Label>
              <Input id="transactionId" name="transactionId" placeholder="UPI Ref / Cash Voucher #" className="h-11 rounded-xl font-mono text-sm" />
            </div>

            <Button type="submit" disabled={isPending} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 mt-2">
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Payout"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
