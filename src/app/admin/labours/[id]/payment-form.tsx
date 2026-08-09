"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePayment } from "./actions";
import { Plus, X } from "lucide-react";

export function PaymentForm({ labourId }: { labourId: string }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await savePayment(formData);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Record Payout
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Record Payout</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="labourId" value={labourId} />
            
            <div className="space-y-1">
              <Label htmlFor="amount">Amount Paid (₹) *</Label>
              <Input id="amount" name="amount" type="number" step="1" required placeholder="e.g. 5000" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reason">Reason / Remarks</Label>
              <Input id="reason" name="reason" placeholder="e.g. Weekly Advance, Final Settlement" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="transactionId">Transaction / Ref ID</Label>
              <Input id="transactionId" name="transactionId" placeholder="e.g. UPI Ref #..." />
            </div>

            <Button type="submit" className="w-full">
              Save Payout
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
