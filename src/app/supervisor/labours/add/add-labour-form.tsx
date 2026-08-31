"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, CreditCard, Building2, HardHat, Save } from "lucide-react";
import { toast } from "sonner";
import { validatePhone, validateAadhar, validateIFSC, validatePositiveNumber } from "@/lib/validations";
import { saveSupervisorLabour } from "./actions";
import { AadharUpload } from "@/components/ui/aadhar-upload";

interface AddLabourFormProps {
  availableSites: Array<{
    id: string;
    projectName: string;
    labourCategories: Array<{ id: string; name: string; dailyWage: number }>;
  }>;
}

export function AddLabourForm({ availableSites }: AddLabourFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSiteId, setSelectedSiteId] = useState<string>(availableSites[0]?.id || "");

  const selectedSite = availableSites.find((s) => s.id === selectedSiteId) || availableSites[0];
  const categories = selectedSite?.labourCategories || [];

  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [dailyWage, setDailyWage] = useState<string>("");
  const [aadharUrl, setAadharUrl] = useState<string | null>(null);

  const handleCategoryChange = (catName: string) => {
    setSelectedCategoryName(catName);
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const aadharNumber = (formData.get("aadharNumber") as string)?.trim();
    const ifscCode = (formData.get("ifscCode") as string)?.trim();
    const categoryName = (formData.get("labourCategoryName") as string)?.trim();
    const wageInput = (formData.get("wageInput") as string)?.trim();

    // Client-side validations
    if (!name || name.length < 2) {
      toast.error("Full name is required (minimum 2 characters).");
      return;
    }

    if (!selectedSiteId) {
      toast.error("Please select a construction site.");
      return;
    }

    if (!categoryName) {
      toast.error("Please select a labour trade / category.");
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

    if (wageInput) {
      const wageCheck = validatePositiveNumber(wageInput, "Wage/Salary");
      if (!wageCheck.valid) {
        toast.error(wageCheck.error);
        return;
      }
    }

    startTransition(async () => {
      try {
        let val = parseFloat(wageInput || "0");
        if (selectedCategoryName === "Fitter Foreman") {
          val = val / 30; // Divide monthly salary by 30 to store daily wage
        }
        formData.set("dailyWage", val.toString());

        await saveSupervisorLabour(formData);
        toast.success("Labourer registered successfully!", {
          description: `${name} has been added to ${selectedSite?.projectName}.`,
        });
        router.push("/supervisor/labours");
      } catch (err: any) {
        toast.error("Failed to add labourer", {
          description: err?.message || "Please check the entered fields and retry.",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-slate-200 dark:border-slate-800/60 shadow-xl overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
        <CardContent className="p-6 md:p-10 space-y-10">
          {/* 1. Basic Info */}
          <div>
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <User className="h-5 w-5" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Phone Number (10 Digits)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Residential Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Village, District, State"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadharNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Aadhar Number (12 Digits) *
                </Label>
                <Input
                  id="aadharNumber"
                  name="aadharNumber"
                  required
                  maxLength={14}
                  placeholder="e.g. 1234 5678 9012"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm font-mono"
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 12) val = val.slice(0, 12);
                    e.target.value = val.replace(/(\d{4})(?=\d)/g, "$1 ");
                  }}
                />
                <input type="hidden" name="aadharCardUrl" value={aadharUrl || ""} />
                <div className="pt-2">
                  <AadharUpload type="labour" id={`temp-${Date.now()}`} onUploadSuccess={setAadharUrl} currentUrl={aadharUrl} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Date of Joining
                </Label>
                <Input
                  id="joiningDate"
                  name="joiningDate"
                  type="date"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>

          {/* 2. Bank Details */}
          <div>
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              Bank Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Account Number
                </Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  placeholder="Account Number"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  IFSC Code (11 Chars)
                </Label>
                <Input
                  id="ifscCode"
                  name="ifscCode"
                  maxLength={11}
                  placeholder="e.g. SBIN0001234"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm uppercase font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankBranch" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Bank Branch Name
                </Label>
                <Input
                  id="bankBranch"
                  name="bankBranch"
                  placeholder="Branch Name"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* 3. Site & Rate */}
          <div>
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 text-blue-600 dark:text-blue-400 flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              Site Assignment & Daily Hajari Rate
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="siteId" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assign to Site *
                </Label>
                <select
                  id="siteId"
                  name="siteId"
                  required
                  value={selectedSiteId}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                >
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      {s.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="labourCategoryName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Trade / Category *
                </Label>
                <select
                  id="labourCategoryName"
                  name="labourCategoryName"
                  required
                  value={selectedCategoryName}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                >
                  <option value="">Select Category...</option>
                  <option value="Fitter Foreman" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Fitter Foreman</option>
                  <option value="Fitter" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Fitter</option>
                  <option value="Helper" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Helper</option>
                  <option value="Mason" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Mason</option>
                  <option value="Carpenter" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Carpenter</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyWage" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {selectedCategoryName === "Fitter Foreman" ? "Monthly Salary (₹) *" : "Hajri / Daily Wage (₹) *"}
                </Label>
                <Input
                  id="dailyWage"
                  name="wageInput"
                  type="number"
                  required
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  placeholder={selectedCategoryName === "Fitter Foreman" ? "e.g. 45000" : "e.g. 850"}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm font-mono font-bold"
                />
                <input type="hidden" name="dailyWage" id="actualDailyWage" value="" />
                {selectedCategoryName === "Fitter Foreman" && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    * This will be automatically divided by 30 to store the daily Hajri rate in the system.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-700 font-bold w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-xl shadow-indigo-900/20 gap-2 border-0 w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Registering Labourer..." : "Save & Register Labourer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
