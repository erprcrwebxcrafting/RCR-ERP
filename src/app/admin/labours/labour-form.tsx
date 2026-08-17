"use client";
import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLabour } from "./actions";
import { Plus, X, Pencil, User, Phone, MapPin, FileText, Building, WalletCards, CreditCard, Calendar, IndianRupee, Briefcase, Save } from "lucide-react";
import { toast } from "sonner";
import { validatePhone, validateAadhar, validateIFSC, validatePositiveNumber } from "@/lib/validations";

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
  const [isPending, startTransition] = useTransition();
  const [selectedSiteId, setSelectedSiteId] = useState(labour?.siteId || "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const siteId = (formData.get("siteId") as string)?.trim();
    const categoryId = (formData.get("labourCategoryId") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const aadhar = (formData.get("aadharNumber") as string)?.trim();
    const ifsc = (formData.get("ifscCode") as string)?.trim();
    const dailyWage = (formData.get("dailyWage") as string)?.trim();

    if (!name || name.length < 2) {
      toast.error("Labourer full name is required (minimum 2 characters).");
      return;
    }

    if (!siteId) {
      toast.error("Please select a construction site.");
      return;
    }

    if (!categoryId) {
      toast.error("Please select a labour category / trade.");
      return;
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      toast.error(phoneCheck.error);
      return;
    }

    const aadharCheck = validateAadhar(aadhar);
    if (!aadharCheck.valid) {
      toast.error(aadharCheck.error);
      return;
    }

    const ifscCheck = validateIFSC(ifsc);
    if (!ifscCheck.valid) {
      toast.error(ifscCheck.error);
      return;
    }

    if (dailyWage) {
      const wageCheck = validatePositiveNumber(dailyWage, "Daily Wage", true);
      if (!wageCheck.valid) {
        toast.error(wageCheck.error);
        return;
      }
    }

    startTransition(async () => {
      try {
        await saveLabour(formData);
        toast.success(labour ? "Labourer details updated successfully!" : "Labourer registered successfully!", {
          description: `${name} has been saved.`,
        });
        setOpen(false);
      } catch (err: any) {
        toast.error("Failed to save labourer", {
          description: err?.message || "Please check inputs and retry.",
        });
      }
    });
  }

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {labour ? (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5 px-4 h-11">
            <Plus className="h-5 w-5 mr-2" /> Add Labour
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white dark:bg-slate-900 shadow-2xl z-[101] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          
          <div className="p-6 sm:p-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Dialog.Title className="text-2xl font-bold text-slate-900 dark:text-white">
                    {labour ? "Edit Labour" : "Add Labour"}
                  </Dialog.Title>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {labour ? "Update the details for this labourer." : "Enter details to onboard a new labourer."}
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {labour && <input type="hidden" name="id" value={labour.id} />}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Full Name <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input name="name" required defaultValue={labour?.name} placeholder="e.g. Ramesh Kumar" className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Phone (10 Digits)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input name="phone" maxLength={10} defaultValue={labour?.phone} placeholder="9876543210" className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input name="address" defaultValue={labour?.address} placeholder="Full residential address" className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Aadhar Number (12 Digits)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input name="aadharNumber" maxLength={12} defaultValue={labour?.aadharNumber} placeholder="12-digit UID" className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Joining Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      name="joiningDate"
                      type="date"
                      defaultValue={labour?.joiningDate ? new Date(labour.joiningDate).toISOString().split("T")[0] : ""}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Panel */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-emerald-500" /> Bank Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Bank Name</Label>
                    <Input name="bankName" defaultValue={labour?.bankName} placeholder="e.g. SBI" className="h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Account Number</Label>
                    <Input name="accountNumber" defaultValue={labour?.accountNumber} placeholder="A/C Number" className="h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">IFSC Code (11 Chars)</Label>
                    <Input name="ifscCode" maxLength={11} defaultValue={labour?.ifscCode} placeholder="e.g. SBIN0001234" className="h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Bank Branch</Label>
                    <Input name="bankBranch" defaultValue={labour?.bankBranch} placeholder="Branch Name" className="h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                  </div>
                </div>
              </div>

              {/* Assignment Details Panel */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-blue-500" /> Site & Assignment
                </h3>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Assigned Site <span className="text-rose-500">*</span></Label>
                  <select
                    name="siteId"
                    required
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="">Select a Site...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Labour Category <span className="text-rose-500">*</span></Label>
                    <select
                      name="labourCategoryId"
                      required
                      defaultValue={labour?.labourCategoryId || ""}
                      className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="">Select Category...</option>
                      {selectedSite?.labourCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Reporting Supervisor</Label>
                    <select
                      name="supervisorId"
                      defaultValue={labour?.supervisorId || ""}
                      className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="">No Supervisor (Direct)</option>
                      {selectedSite?.supervisors.map((s) => (
                        <option key={s.supervisor.id} value={s.supervisor.id}>
                          {s.supervisor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Hajari Rate (₹) / Daily Wage</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
                    <Input name="dailyWage" type="number" step="0.01" defaultValue={labour?.dailyWage} placeholder="e.g. 800" className="pl-10 h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-bold text-emerald-600 dark:text-emerald-400 font-mono" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-1/3 h-12 rounded-xl font-semibold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" className="w-full sm:w-2/3 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 gap-2" disabled={isPending}>
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : (labour ? "Save Changes" : "Create Labour")}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
