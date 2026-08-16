"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, User, Mail, Phone, Lock, IndianRupee, MapPin, CreditCard, Building2, Calendar, Landmark, Hash, ChevronDown } from "lucide-react";
import { createSupervisor } from "./actions";

type SiteOption = { id: string; projectName: string };

export function SupervisorForm({ allSites = [] }: { allSites?: SiteOption[] }) {
  const [open, setOpen] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    // Append selected site IDs
    selectedSites.forEach((id) => formData.append("siteIds[]", id));
    await createSupervisor(formData);
    setSelectedSites([]);
    setOpen(false);
  }

  function toggleSite(siteId: string) {
    setSelectedSites((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  }

  const inputClass = "h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20";
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-900/20 rounded-xl h-10 px-5 font-bold transition-all hover:-translate-y-0.5 border-0">
          <Plus className="h-4 w-4" /> Add Supervisor
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-all" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-2xl z-[101] max-h-[90vh] overflow-y-auto">
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between sticky top-0 z-10">
            <div>
              <Dialog.Title className="text-xl font-bold tracking-tight">New Supervisor</Dialog.Title>
              <p className="text-blue-100 text-xs font-medium mt-1">Create a new site supervisor account</p>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          <form action={handleSubmit} className="p-6 space-y-6">
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <User className="h-4 w-4 text-blue-500" /> Personal Details
              </h3>
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <User className="h-3.5 w-3.5 text-blue-500" /> Name *
                </Label>
                <Input name="name" required placeholder="Full Name" className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email *
                </Label>
                <Input name="email" type="email" required placeholder="john@example.com" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone
                  </Label>
                  <Input name="phone" placeholder="9876543210" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Calendar className="h-3.5 w-3.5 text-orange-500" /> Date of Joining
                  </Label>
                  <Input name="dateOfJoining" type="date" className={inputClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <MapPin className="h-3.5 w-3.5 text-rose-500" /> Address
                </Label>
                <Input name="address" placeholder="Full address" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <CreditCard className="h-3.5 w-3.5 text-violet-500" /> Aadhar Number
                  </Label>
                  <Input name="aadharNumber" placeholder="1234 5678 9012" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <IndianRupee className="h-3.5 w-3.5 text-rose-500" /> Monthly Salary
                  </Label>
                  <Input name="monthlySalary" type="number" placeholder="e.g. 30000" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Landmark className="h-4 w-4 text-emerald-500" /> Bank Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Hash className="h-3.5 w-3.5 text-blue-500" /> Account Number
                  </Label>
                  <Input name="accountNumber" placeholder="Account No." className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Hash className="h-3.5 w-3.5 text-indigo-500" /> IFSC Code
                  </Label>
                  <Input name="ifscCode" placeholder="e.g. ICIC0001234" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Landmark className="h-3.5 w-3.5 text-emerald-500" /> Bank Name
                  </Label>
                  <Input name="bankName" placeholder="e.g. ICICI Bank" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Bank Branch
                  </Label>
                  <Input name="bankBranch" placeholder="Branch name" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Site Assignment Section */}
            {allSites.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Building2 className="h-4 w-4 text-indigo-500" /> Assign to Sites
                </h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm transition-all cursor-pointer"
                  >
                    <span className={selectedSites.length > 0 ? "" : "text-slate-400"}>
                      {selectedSites.length > 0
                        ? `${selectedSites.length} site${selectedSites.length > 1 ? "s" : ""} selected`
                        : "Select sites to assign..."}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${siteDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {siteDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-48 overflow-y-auto">
                      {allSites.map((site) => (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => toggleSite(site.id)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            selectedSites.includes(site.id) ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            selectedSites.includes(site.id) ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"
                          }`}>
                            {selectedSites.includes(site.id) && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {site.projectName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedSites.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSites.map((siteId) => {
                      const site = allSites.find((s) => s.id === siteId);
                      return (
                        <span key={siteId} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <Building2 className="h-3 w-3" />
                          {site?.projectName}
                          <button type="button" onClick={() => toggleSite(siteId)} className="ml-0.5 hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Password Section */}
            <div className="space-y-1.5">
              <Label className={labelClass}>
                <Lock className="h-3.5 w-3.5 text-purple-500" /> Temporary Password
              </Label>
              <Input name="password" placeholder="supervisor123" className={inputClass} />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                Create Account
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
