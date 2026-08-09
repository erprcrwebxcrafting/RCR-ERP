"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, X } from "lucide-react";
import { updateClient } from "./actions";

export function EditClientForm({ client }: { client: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await updateClient(client.id, formData);
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" /> Edit
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl z-50 max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Edit Client</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Company / Client Name *</Label>
              <Input name="name" required defaultValue={client.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Contact Person</Label>
                <Input name="contactPerson" defaultValue={client.contactPerson || ""} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={client.phone || ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" multiple defaultValue={client.email || ""} placeholder="client@example.com, boss@example.com" />
              </div>
              <div className="space-y-1">
                <Label>GST Number</Label>
                <Input name="gstNo" defaultValue={client.gstNo || ""} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Textarea name="address" defaultValue={client.address || ""} />
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea name="remarks" defaultValue={client.remarks || ""} />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
