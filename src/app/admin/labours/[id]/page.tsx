import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "@/app/admin/labours/[id]/payment-form";
import Link from "next/link";
import { ArrowLeft, User, Phone, Calendar, CreditCard, Building, WalletCards } from "lucide-react";
import { LabourForm } from "../labour-form";
import { LabourCalendar } from "./labour-calendar";

export default async function LabourLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const labourRaw = await prisma.labour.findUnique({
    where: { id: resolvedParams.id },
    include: {
      site: true,
      labourCategory: true,
      attendances: { orderBy: { date: "desc" }, take: 30 },
      payments: { orderBy: { date: "desc" } },
      transferHistory: { include: { fromSite: true, toSite: true }, orderBy: { transferDate: "desc" } },
    } as any,
  });

  const labour = labourRaw as any;

  if (!labour) return notFound();

  const sites = await prisma.site.findMany({
    where: { active: true },
    include: {
      labourCategories: true,
      supervisors: { include: { supervisor: true } },
    }
  });

  const dailyWage = labour.dailyWage || 0;
  const overtimeRate = labour.overtimeRate || 0;

  // Calculate totals from ALL attendance, not just the recent 30 fetched above
  const allAttendance = await prisma.attendance.findMany({ where: { labourId: labour.id } });
  
  let totalEarned = 0;
  let presentDays = 0; // Total Hajaris

  for (const a of allAttendance as any[]) {
    if (a.hajari > 0) {
      const appliedRate = a.hajariRate || dailyWage;
      totalEarned += a.hajari * appliedRate;
      presentDays += a.hajari;
    }
  }

  const totalPaid = labour.payments.reduce((sum: any, p: any) => sum + p.amount, 0);
  const balance = totalEarned - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/labours" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ledger: {labour.name}</h1>
          <p className="text-muted-foreground">
            {labour.site.projectName} — {labour.labourCategory.name}
          </p>
        </div>
      </div>

      <Card className="bg-muted/30 border-muted-foreground/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {labour.name}
                    <Badge variant={labour.active ? "default" : "destructive"} className="text-[10px] uppercase">
                      {labour.active ? "Active" : "Inactive"}
                    </Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building className="h-3 w-3" /> {labour.site.projectName} — {labour.labourCategory.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone</div>
                  <div className="font-medium">{labour.phone || "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Joined Date</div>
                  <div className="font-medium">{labour.joiningDate ? formatDate(labour.joiningDate) : "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> Aadhar</div>
                  <div className="font-medium">{labour.aadharNumber || "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5"><WalletCards className="h-3 w-3" /> Bank Name</div>
                  <div className="font-medium">{labour.bankName || "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5"> Account No.</div>
                  <div className="font-medium">{labour.accountNumber || "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5"> IFSC Code</div>
                  <div className="font-medium">{labour.ifscCode || "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1.5"> Bank Branch</div>
                  <div className="font-medium">{labour.bankBranch || "—"}</div>
                </div>
                <div className="space-y-1 col-span-2 md:col-span-4 border-t border-border/50 pt-3 mt-1">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">Address</div>
                  <div className="font-medium">{labour.address || "—"}</div>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
               <LabourForm sites={sites as any} labour={labour} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hajari Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dailyWage}</div>
            <p className="text-xs text-muted-foreground">Per Hajari</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalEarned.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">From {presentDays} Hajaris</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPaid.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">Across {labour.payments.length} transactions</p>
          </CardContent>
        </Card>
        <Card className={balance > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-red-600" : ""}`}>
              ₹{balance.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">Amount to be cleared</p>
          </CardContent>
        </Card>
      </div>

      <LabourCalendar attendances={allAttendance as any} payments={labour.payments} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payouts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Payment History</h2>
            <PaymentForm labourId={labour.id} />
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
                {labour.payments.map((p: any) => (
                  <TR key={p.id}>
                    <TD>{formatDate(p.date)}</TD>
                    <TD className="font-medium text-red-600">- ₹{p.amount.toLocaleString("en-IN")}</TD>
                    <TD>
                      <div className="text-sm">{p.reason || "Payout"}</div>
                      {p.transactionId && <div className="text-xs text-muted-foreground">Tx: {p.transactionId}</div>}
                    </TD>
                  </TR>
                ))}
                {labour.payments.length === 0 && (
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

        {/* Recent Attendance Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Recent Attendance</h2>
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Status</TH>
                  <TH>Earned</TH>
                </TR>
              </THead>
              <TBody>
                {labour.attendances.map((a: any) => {
                  const appliedRate = a.hajariRate || dailyWage;
                  const dayEarned = (a.hajari || 0) * appliedRate;

                  return (
                    <TR key={a.id}>
                      <TD>{formatDate(a.date)}</TD>
                      <TD>
                        <Badge variant={a.hajari > 0 ? "secondary" : "destructive"}>
                          {a.hajari > 0 ? `${a.hajari} Hajari` : "Absent"}
                        </Badge>
                      </TD>
                      <TD className="text-green-600 font-medium">
                        {dayEarned > 0 ? `+ ₹${dayEarned}` : "—"}
                      </TD>
                    </TR>
                  );
                })}
                {labour.attendances.length === 0 && (
                  <TR>
                    <TD colSpan={3} className="py-8 text-center text-muted-foreground">
                      No attendance marked yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </Card>
        </div>
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
                <TH>Wage Change</TH>
              </TR>
            </THead>
            <TBody>
              {labour.transferHistory?.map((t: any) => (
                <TR key={t.id}>
                  <TD>{formatDate(t.transferDate)}</TD>
                  <TD>{t.fromSite?.projectName || "—"}</TD>
                  <TD>{t.toSite.projectName}</TD>
                  <TD>
                    <div className="text-sm">
                      ₹{t.previousDailyWage} → ₹{t.newDailyWage}
                    </div>
                  </TD>
                </TR>
              ))}
              {(!labour.transferHistory || labour.transferHistory.length === 0) && (
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
  );
}
