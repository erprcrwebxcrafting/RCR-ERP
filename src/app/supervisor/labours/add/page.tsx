import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveSupervisorLabour } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, HardHat, ArrowLeft, Building2, User, CreditCard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AddLabourPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string;
  if (!userId) redirect("/login");

  const assigned = await prisma.siteSupervisor.findMany({
    where: { supervisorId: userId },
    include: { site: { include: { labourCategories: true } } },
  });

  if (assigned.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-10 animate-in fade-in duration-500">
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 mb-6">
          <Building2 className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-800 dark:text-slate-100">No Sites Assigned</h2>
        <p className="text-slate-500 font-medium max-w-md text-center">You must be assigned to an active construction site to add labourers.</p>
      </div>
    );
  }

  // Flatten out the available sites and their categories
  const availableSites = assigned.map(a => a.site);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto pb-12">
      <Link href="/supervisor/labours" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
        <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-100 mr-2 transition-colors">
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
        </div>
        Back to Directory
      </Link>

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-4 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
            <Users className="h-3.5 w-3.5" />
            Add New Labourer
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Register Labourer</h1>
          <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
            Add a new labourer to your assigned site. Please fill out all relevant details including bank information and Hajari rate.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-white/5 opacity-50 pointer-events-none">
          <HardHat className="h-64 w-64" />
        </div>
      </div>

      <form action={saveSupervisorLabour}>
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
                  <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</Label>
                  <Input id="name" name="name" required placeholder="Enter full name" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</Label>
                  <Input id="phone" name="phone" placeholder="e.g. +91 9876543210" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</Label>
                  <Input id="address" name="address" placeholder="Full residential address" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aadhar Number</Label>
                  <Input id="aadharNumber" name="aadharNumber" placeholder="12-digit Aadhar number" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Joining</Label>
                  <Input id="joiningDate" name="joiningDate" type="date" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm transition-all" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
            </div>

            {/* 2. Bank Details */}
            <div>
              <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Number</Label>
                  <Input id="accountNumber" name="accountNumber" placeholder="Bank Account No." className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode" className="text-xs font-bold text-slate-500 uppercase tracking-wider">IFSC Code</Label>
                  <Input id="ifscCode" name="ifscCode" placeholder="e.g. SBIN0001234" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm transition-all uppercase" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankBranch" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Branch</Label>
                  <Input id="bankBranch" name="bankBranch" placeholder="Branch Name" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm transition-all" />
                </div>
              </div>
            </div>

            {/* 3. Site & Rate */}
            <div>
              <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 text-blue-600 dark:text-blue-400 flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                Assignment & Rate
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteId" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign to Site *</Label>
                  <select
                    id="siteId"
                    name="siteId"
                    required
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm transition-all cursor-pointer"
                  >
                    {availableSites.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {s.projectName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="labourCategoryId" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</Label>
                  <select
                    id="labourCategoryId"
                    name="labourCategoryId"
                    required
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm transition-all cursor-pointer"
                  >
                    {/* Just listing all categories from all assigned sites for simplicity, grouped by site ideally but flattened works if names are unique */}
                    {availableSites.flatMap(s => s.labourCategories).map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyWage" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hajari Rate (₹) *</Label>
                  <Input id="dailyWage" name="dailyWage" type="number" step="1" required placeholder="Rate for 1 Hajari" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Button type="submit" size="lg" className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-900/20 transition-all font-bold hover:-translate-y-0.5 border-0 gap-2 h-12 px-8 rounded-xl">
                <Users className="h-5 w-5" />
                Register Labourer
              </Button>
            </div>
            
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
