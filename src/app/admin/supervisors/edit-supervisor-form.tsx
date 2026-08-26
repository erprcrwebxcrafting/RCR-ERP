"use client";
import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Edit, X, User, Mail, Phone, IndianRupee, MapPin, CreditCard, Building2, Calendar, Landmark, Hash, Lock, ChevronDown, Save } from "lucide-react";
import { updateSupervisor } from "./actions";
import { toast } from "sonner";
import { validatePhone, validateAadhar, validateIFSC, validateEmail, validatePositiveNumber } from "@/lib/validations";
import { AadharUpload } from "@/components/ui/aadhar-upload";

type SiteOption = { id: string; projectName: string };

export function EditSupervisorForm({ supervisor, allSites = [] }: { supervisor: any; allSites?: SiteOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentSiteIds = (supervisor.assignedSites || []).map((a: any) => a.siteId || a.site?.id);
  const [selectedSites, setSelectedSites] = useState<string[]>(currentSiteIds);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  
  const initialSalaryStr = supervisor.monthlySalary?.toString() || "";
  const [currentSalaryInput, setCurrentSalaryInput] = useState(initialSalaryStr);
  const showEffectiveDate = currentSalaryInput !== initialSalaryStr;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const aadharNumber = (formData.get("aadharNumber") as string)?.trim();
    const ifscCode = (formData.get("ifscCode") as string)?.trim();
    const salaryStr = (formData.get("monthlySalary") as string)?.trim();
    const newPassword = (formData.get("password") as string)?.trim();

    if (!name || name.length < 2) {
      toast.error("Supervisor name is required (minimum 2 characters).");
      return;
    }

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.valid) {
      toast.error(emailCheck.error);
      return;
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      toast.error(phoneCheck.error);
      return;
    }

    const aadharCheck = validateAadhar(aadharNumber);
    if (!aadharCheck.valid) {
      toast.error(aadharCheck.error);
      return;
    }

    const ifscCheck = validateIFSC(ifscCode);
    if (!ifscCheck.valid) {
      toast.error(ifscCheck.error);
      return;
    }

    if (salaryStr) {
      const salaryCheck = validatePositiveNumber(salaryStr, "Monthly Salary", true);
      if (!salaryCheck.valid) {
        toast.error(salaryCheck.error);
        return;
      }
    }

    // If admin is setting a new password, validate its strength
    if (newPassword) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        toast.error("Weak Password", {
          description: "Must be at least 8 characters with uppercase, lowercase, a number, and a special character (!@#$...)."
        });
        return;
      }
    }

    // Site IDs are automatically included via hidden inputs

    startTransition(async () => {
      try {
        await updateSupervisor(supervisor.id, formData);
        toast.success("Supervisor details updated successfully!", {
          description: `Changes to ${name} have been saved.`,
        });
        setOpen(false);
      } catch (err: any) {
        toast.error("Failed to update supervisor", {
          description: err?.message || "Please check inputs and retry.",
        });
      }
    });
  }

  function toggleSite(siteId: string) {
    setSelectedSites((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  }

  function handleOpenChange(val: boolean) {
    if (val) {
      setSelectedSites(currentSiteIds);
    }
    setOpen(val);
    setSiteDropdownOpen(false);
  }

  const inputClass = "h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm";
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
          <Edit className="h-4 w-4" /> Edit
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-2xl z-[101] max-h-[90vh] overflow-y-auto">
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between sticky top-0 z-10">
            <div>
              <Dialog.Title className="text-xl font-bold tracking-tight">Edit Supervisor</Dialog.Title>
              <p className="text-blue-100 text-xs font-medium mt-1">Update {supervisor.name}&apos;s details</p>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <User className="h-4 w-4 text-blue-500" /> Personal Details
              </h3>
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <User className="h-3.5 w-3.5 text-blue-500" /> Name *
                </Label>
                <Input name="name" required defaultValue={supervisor.name} placeholder="Full Name" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email *
                </Label>
                <Input name="email" type="email" required defaultValue={supervisor.email} placeholder="john@example.com" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone (10 Digits)
                  </Label>
                  <Input name="phone" maxLength={10} defaultValue={supervisor.phone || ""} placeholder="9876543210" className={`${inputClass} font-mono`} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Calendar className="h-3.5 w-3.5 text-orange-500" /> Date of Joining
                  </Label>
                  <Input
                    name="dateOfJoining"
                    type="date"
                    defaultValue={supervisor.dateOfJoining ? new Date(supervisor.dateOfJoining).toISOString().split("T")[0] : ""}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  <MapPin className="h-3.5 w-3.5 text-rose-500" /> Address
                </Label>
                <Input name="address" defaultValue={supervisor.address || ""} placeholder="Full address" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <CreditCard className="h-3.5 w-3.5 text-violet-500" /> Aadhar Number (12 Digits)
                  </Label>
                  <Input name="aadharNumber" maxLength={12} defaultValue={supervisor.aadharNumber || ""} placeholder="1234 5678 9012" className={`${inputClass} font-mono`} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <IndianRupee className="h-3.5 w-3.5 text-rose-500" /> Monthly Salary (₹)
                  </Label>
                  <Input name="monthlySalary" type="number" value={currentSalaryInput} onChange={(e) => setCurrentSalaryInput(e.target.value)} placeholder="e.g. 30000" className={`${inputClass} font-mono font-bold`} />
                </div>
              </div>

              <div className="pt-2">
                <AadharUpload 
                  type="supervisor" 
                  id={supervisor.id} 
                  currentUrl={supervisor.aadharCardUrl} 
                />
              </div>
              
              {showEffectiveDate && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Rate Effective Date <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
                    <Input name="effectiveDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="pl-10 h-11 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    * Past attendances from this date onwards will be automatically updated to the new rate.
                  </p>
                </div>
              )}
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
                  <Input name="accountNumber" defaultValue={supervisor.accountNumber || ""} placeholder="Account No." className={`${inputClass} font-mono`} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Hash className="h-3.5 w-3.5 text-indigo-500" /> IFSC Code (11 Chars)
                  </Label>
                  <Input name="ifscCode" maxLength={11} defaultValue={supervisor.ifscCode || ""} placeholder="e.g. ICIC0001234" className={`${inputClass} font-mono uppercase`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <Landmark className="h-3.5 w-3.5 text-emerald-500" /> Bank Name
                  </Label>
                  <Input name="bankName" defaultValue={supervisor.bankName || ""} placeholder="e.g. ICICI Bank" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Bank Branch
                  </Label>
                  <Input name="bankBranch" defaultValue={supervisor.bankBranch || ""} placeholder="Branch name" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Site Assignment Section */}
            {allSites.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-500" /> Assign to Sites
                  </h3>
                  {selectedSites.length > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                      {selectedSites.length} Selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {allSites.map((site) => {
                    const isSelected = selectedSites.includes(site.id);
                    return (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => toggleSite(site.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600/10 border-blue-500/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30 font-semibold"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs truncate">{site.projectName}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedSites.map((siteId) => (
                  <input key={siteId} type="hidden" name="siteIds[]" value={siteId} />
                ))}
              </div>
            )}

            {/* Password Reset Section */}
            <div className="space-y-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-4">
              <Label className={labelClass}>
                <Lock className="h-3.5 w-3.5 text-amber-600" /> Reset Login Password (optional)
              </Label>
              <PasswordInput 
                name="password" 
                placeholder="Leave blank to keep current password" 
                className={inputClass} 
              />
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
                Only fill this if you want to reset the supervisor's login password.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-slate-200 dark:border-slate-700 font-semibold">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 gap-2">
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
