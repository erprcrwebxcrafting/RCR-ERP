"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLabour } from "./actions";
import { Plus, X, Pencil } from "lucide-react";

type SiteData = {
  id: string;
  projectName: string;
  labourCategories: { id: string; name: string }[];
  supervisors: { supervisor: { id: string; name: string } }[];
};

export function LabourForm({
  sites,
  labour = null,
}: {
  sites: SiteData[];
  labour?: any;
}) {
  const [open, setOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(labour?.siteId || "");

  async function handleSubmit(formData: FormData) {
    await saveLabour(formData);
    setOpen(false);
  }

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {labour ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Labour
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {labour ? "Edit Labour" : "Add Labour"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <form action={handleSubmit} className="space-y-4">
            {labour && <input type="hidden" name="id" value={labour.id} />}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required defaultValue={labour?.name} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={labour?.phone} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={labour?.address} placeholder="Full address" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="aadharNumber">Aadhar Number</Label>
              <Input id="aadharNumber" name="aadharNumber" defaultValue={labour?.aadharNumber} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" name="bankName" defaultValue={labour?.bankName} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" name="accountNumber" defaultValue={labour?.accountNumber} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input id="ifscCode" name="ifscCode" defaultValue={labour?.ifscCode} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bankBranch">Bank Branch</Label>
                <Input id="bankBranch" name="bankBranch" defaultValue={labour?.bankBranch} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input
                id="joiningDate"
                name="joiningDate"
                type="date"
                defaultValue={labour?.joiningDate ? new Date(labour.joiningDate).toISOString().split("T")[0] : ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="siteId">Site *</Label>
              <select
                id="siteId"
                name="siteId"
                required
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a Site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dailyWage">Hajari Rate (₹)</Label>
                <Input id="dailyWage" name="dailyWage" type="number" step="0.01" defaultValue={labour?.dailyWage} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="labourCategoryId">Category *</Label>
                <select
                  id="labourCategoryId"
                  name="labourCategoryId"
                  required
                  defaultValue={labour?.labourCategoryId || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Category...</option>
                  {selectedSite?.labourCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="supervisorId">Supervisor</Label>
                <select
                  id="supervisorId"
                  name="supervisorId"
                  defaultValue={labour?.supervisorId || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Supervisor...</option>
                  {selectedSite?.supervisors.map((s) => (
                    <option key={s.supervisor.id} value={s.supervisor.id}>
                      {s.supervisor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full">
              {labour ? "Save Changes" : "Create Labour"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
