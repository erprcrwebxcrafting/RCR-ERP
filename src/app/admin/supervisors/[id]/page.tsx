import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SupervisorPaymentForm } from "./payment-form";
import { EditSupervisorForm } from "../edit-supervisor-form";
export default async function SupervisorLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supervisor = await prisma.user.findUnique({
    where: { id: resolvedParams.id, role: "SUPERVISOR" },
    include: {
      supervisorPayments: { orderBy: { date: "desc" } },
      assignedSites: { include: { site: true } },
      supervisorTransfers: { include: { fromSite: true, toSite: true }, orderBy: { transferDate: "desc" } },
    } as any,
  });

  const sv = supervisor as any;
  if (!sv) return notFound();

  const monthlySalary = sv.monthlySalary || 0;
  
  // Calculate months worked based on createdAt
  const startDate = new Date(sv.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // E.g., if they worked 45 days, it's ~1.5 months
  const monthsWorked = diffDays / 30.44; 
  
  const totalEarned = monthlySalary > 0 ? (monthsWorked * monthlySalary) : 0;
  
  const totalPaid = sv.supervisorPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const balance = totalEarned - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/supervisors" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ledger: {sv.name}</h1>
            <p className="text-muted-foreground">
              Supervisor • {sv.assignedSites.map((a: any) => a.site.projectName).join(", ") || "No sites assigned"}
            </p>
          </div>
        </div>
        <EditSupervisorForm supervisor={sv} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{monthlySalary.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">Fixed Pay / Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalEarned.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">Based on ~{monthsWorked.toFixed(1)} months worked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPaid.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">Across {sv.supervisorPayments.length} transactions</p>
          </CardContent>
        </Card>
        <Card className={balance > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-red-600" : ""}`}>
              ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Amount to be cleared</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Payment History</h2>
            <SupervisorPaymentForm supervisorId={sv.id} />
          </div>
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Amount</TH>
                  <TH>Details</TH>
                </TR>
              </THead>
              <TBody>
                {sv.supervisorPayments.map((p: any) => (
                  <TR key={p.id}>
                    <TD>{formatDate(p.date)}</TD>
                    <TD className="font-medium text-red-600">- ₹{p.amount.toLocaleString("en-IN")}</TD>
                    <TD>
                      <div className="text-sm">{p.reason || "Payout"}</div>
                      {p.transactionId && <div className="text-xs text-muted-foreground">Tx: {p.transactionId}</div>}
                    </TD>
                  </TR>
                ))}
                {sv.supervisorPayments.length === 0 && (
                  <TR>
                    <TD colSpan={3} className="py-8 text-center text-muted-foreground">
                      No payments recorded yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </Card>
        </div>

        {/* Transfer History Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Transfer History</h2>
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>From Site</TH>
                  <TH>To Site</TH>
                  <TH>Labours Transferred</TH>
                </TR>
              </THead>
              <TBody>
                {sv.supervisorTransfers?.map((t: any) => (
                  <TR key={t.id}>
                    <TD>{formatDate(t.transferDate)}</TD>
                    <TD>{t.fromSite?.projectName || "—"}</TD>
                    <TD>{t.toSite.projectName}</TD>
                    <TD>{t.laboursTransferred} labours</TD>
                  </TR>
                ))}
                {(!sv.supervisorTransfers || sv.supervisorTransfers.length === 0) && (
                  <TR>
                    <TD colSpan={4} className="py-8 text-center text-muted-foreground">
                      No transfers recorded.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
