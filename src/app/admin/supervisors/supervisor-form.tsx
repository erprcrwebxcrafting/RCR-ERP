"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { createSupervisor } from "./actions";

export function SupervisorForm() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createSupervisor(formData);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Supervisor
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl z-50 max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">New Supervisor</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input name="name" required placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input name="email" type="email" required placeholder="john@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input name="phone" placeholder="9876543210" />
            </div>
            <div className="space-y-1">
              <Label>Monthly Salary (₹)</Label>
              <Input name="monthlySalary" type="number" placeholder="e.g. 30000" />
            </div>
            <div className="space-y-1">
              <Label>Temporary Password</Label>
              <Input name="password" placeholder="supervisor123" />
            </div>
            <Button type="submit" className="w-full mt-2">
              Create Account
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
