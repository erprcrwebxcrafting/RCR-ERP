import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCheck, IndianRupee, MapPin, Mail, Phone, Building2 } from "lucide-react";
import Link from "next/link";
import { SupervisorForm } from "./supervisor-form";
import { EditSupervisorForm } from "./edit-supervisor-form";
export default async function SupervisorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";

  const supervisors = await prisma.user.findMany({
    where: { 
      role: "SUPERVISOR",
      ...(q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ]
      } : {})
    },
    include: { assignedSites: { include: { site: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Calculate KPIs
  const totalSupervisors = supervisors.length;
  const totalSalaryLiability = (supervisors as any[]).reduce((sum: number, s: any) => sum + (s.monthlySalary || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Supervisors Dashboard</h1>
          <p className="text-muted-foreground">Manage your site supervisors and view their assignments.</p>
        </div>
        <SupervisorForm />
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-muted/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Supervisors</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalSupervisors}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Monthly Salary Liability</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">₹{totalSalaryLiability.toLocaleString("en-IN")}</div></CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border border-border/50 bg-muted/10">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="q" placeholder="Search by name, email, or phone number..." defaultValue={q} className="pl-9 w-full" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="submit" className="w-full sm:w-auto">Search</Button>
            {q && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href="/admin/supervisors">Clear</a>
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Supervisors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(supervisors as any[]).map((s: any) => (
          <Card key={s.id} className="flex flex-col group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {s.name}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1.5 font-medium">
                    <IndianRupee className="h-3.5 w-3.5 mr-1 text-green-600" />
                    {s.monthlySalary ? <span className="text-green-700">₹{s.monthlySalary.toLocaleString("en-IN")}/mo</span> : "Salary Not Set"}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4 pb-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2 opacity-70" />
                  {s.email}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2 opacity-70" />
                  {s.phone || "No phone number"}
                </div>
              </div>
              
              <div className="pt-2 border-t border-dashed">
                <div className="text-xs uppercase font-semibold text-muted-foreground mb-2 flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" /> Assigned Sites ({s.assignedSites.length})
                </div>
                {s.assignedSites.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {s.assignedSites.map((a: any) => (
                      <span key={a.id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400">
                        {a.site.projectName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No active site assignments</div>
                )}
              </div>
            </CardContent>
            <div className="p-4 pt-0 flex gap-2">
              <Button asChild className="flex-1" variant="outline">
                <Link href={`/admin/supervisors/${s.id}`}>
                  View Ledger & History →
                </Link>
              </Button>
              <EditSupervisorForm supervisor={s} />
            </div>
          </Card>
        ))}
        {supervisors.length === 0 && (
          <div className="col-span-full py-16 text-center border rounded-xl bg-muted/10 border-dashed">
            <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No supervisors found</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">You haven't added any supervisors to the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
