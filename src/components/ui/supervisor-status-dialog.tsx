"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SupervisorStatusDialogProps {
  id: string;
  active: boolean;
  entityName: string;
  onToggle: (id: string, active: boolean, effectiveDate: string, reason?: string) => Promise<void>;
  size?: "sm" | "md";
}

export function SupervisorStatusDialog({ id, active, entityName, onToggle, size = "md" }: SupervisorStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

  const newActive = !active;
  const isSmall = size === "sm";

  const handleSave = () => {
    if (!effectiveDate) {
      alert("Effective Date is required.");
      return;
    }

    startTransition(async () => {
      try {
        await onToggle(id, newActive, effectiveDate, reason);
        setOpen(false);
        setReason("");
      } catch (error: any) {
        alert(error.message || "Failed to update status");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className={`flex items-center gap-${isSmall ? "2" : "3"}`}>
        <DialogTrigger asChild>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={`${active ? "Deactivate" : "Activate"} ${entityName}`}
            className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              isSmall ? "h-5 w-9" : "h-6 w-11"
            } ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
          >
            <span
              className={`pointer-events-none inline-block rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                isSmall ? "h-4 w-4" : "h-5 w-5"
              } ${active ? (isSmall ? "translate-x-4" : "translate-x-5") : "translate-x-0"}`}
            />
          </button>
        </DialogTrigger>
        <span
          className={`font-semibold select-none ${isSmall ? "text-xs" : "text-sm"} ${
            active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{newActive ? "Activate" : "Deactivate"} Supervisor</DialogTitle>
            <DialogDescription>
              {newActive
                ? `You are about to activate ${entityName}. They will appear on attendance lists from the effective date.`
                : `You are about to deactivate ${entityName}. They will be hidden from attendance lists from the effective date.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="effectiveDate">Effective Date <span className="text-red-500">*</span></Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            {!newActive && (
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Why is this supervisor going inactive?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending} className={newActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}>
              {isPending ? "Saving..." : (newActive ? "Activate" : "Deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
