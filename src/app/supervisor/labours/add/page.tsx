import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveSupervisorLabour } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, HardHat, ArrowLeft, Building2 } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold">No Sites Assigned</h2>
        <p className="text-muted-foreground mt-2">You must be assigned to a site to add labourers.</p>
      </div>
    );
  }

  // Flatten out the available sites and their categories
  const availableSites = assigned.map(a => a.site);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-12">
      <Link href="/supervisor/labours" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Back to Directory
      </Link>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background border border-indigo-500/10 p-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-1 mb-4 text-sm font-medium text-indigo-500 dark:text-indigo-400">
            <Users className="h-4 w-4" />
            Add New Labourer
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Register Labourer</h1>
          <p className="text-muted-foreground max-w-xl">
            Add a new labourer to your assigned site. Please fill out all relevant details including bank information and Hajari rate.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mt-12 -mr-12 text-indigo-500/5">
          <HardHat className="h-64 w-64" />
        </div>
      </div>

      <form action={saveSupervisorLabour}>
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-8">
            
            {/* 1. Basic Info */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-indigo-600/80 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" required placeholder="Enter full name" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" placeholder="e.g. +91 9876543210" className="h-11" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" placeholder="Full residential address" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number</Label>
                  <Input id="aadharNumber" name="aadharNumber" placeholder="12-digit Aadhar number" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Date of Joining</Label>
                  <Input id="joiningDate" name="joiningDate" type="date" className="h-11" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
            </div>

            {/* 2. Bank Details */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-indigo-600/80">
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input id="accountNumber" name="accountNumber" placeholder="Bank Account No." className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input id="ifscCode" name="ifscCode" placeholder="e.g. SBIN0001234" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Bank Branch</Label>
                  <Input id="bankBranch" name="bankBranch" placeholder="Branch Name" className="h-11" />
                </div>
              </div>
            </div>

            {/* 3. Site & Rate */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-indigo-600/80 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assignment & Rate
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteId">Assign to Site *</Label>
                  <select
                    id="siteId"
                    name="siteId"
                    required
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {availableSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.projectName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="labourCategoryId">Category *</Label>
                  <select
                    id="labourCategoryId"
                    name="labourCategoryId"
                    required
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {/* Just listing all categories from all assigned sites for simplicity, grouped by site ideally but flattened works if names are unique */}
                    {availableSites.flatMap(s => s.labourCategories).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyWage">Hajari Rate (₹) *</Label>
                  <Input id="dailyWage" name="dailyWage" type="number" step="1" required placeholder="Rate for 1 Hajari" className="h-11" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" size="lg" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 gap-2 h-12 px-8">
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
