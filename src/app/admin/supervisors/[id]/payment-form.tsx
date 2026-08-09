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
} from "@/components/ui/dialog";
import { recordSupervisorPayment } from "./actions";
import { useState } from "react";
import { IndianRupee } from "lucide-react";

export function SupervisorPaymentForm({ supervisorId }: { supervisorId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IndianRupee className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment for Supervisor</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await recordSupervisorPayment(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="supervisorId" value={supervisorId} />
          
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input name="amount" type="number" required placeholder="e.g. 5000" />
          </div>
          
          <div className="space-y-2">
            <Label>Reason / Note</Label>
            <Input name="reason" placeholder="e.g. Monthly Advance, Fuel" />
          </div>

          <div className="space-y-2">
            <Label>Transaction ID (Optional)</Label>
            <Input name="transactionId" placeholder="UPI / NEFT Ref No." />
          </div>

          <Button type="submit" className="w-full">
            Save Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
