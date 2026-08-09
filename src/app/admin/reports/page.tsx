import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import * as Tabs from "@radix-ui/react-tabs";
import { Badge } from "@/components/ui/badge";

const tabTrigger = "px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground transition-colors";

export default async function ReportsPage() {
  const attendances = await prisma.attendance.findMany({ include: { site: true, labour: true }, orderBy: { date: "desc" }, take: 100 });
  const labourEntries = await prisma.labourEntry.findMany({ include: { site: true, labour: true }, orderBy: { periodStart: "desc" } });
  const bills = await prisma.runningBill.findMany({ include: { site: true, lines: true }, orderBy: { billDate: "desc" } });
  const payments = await prisma.payment.findMany({ include: { site: true }, orderBy: { date: "desc" } });
  const clients = await prisma.client.findMany({ include: { sites: true } });
  const sites = await prisma.site.findMany({ include: { client: true, payments: true, bills: { include: { lines: true } } } });

  const siteReports = sites.map(s => {
    const totalBilled = s.bills.reduce((sum, b) => sum + b.lines.reduce((s2, l) => s2 + l.currentAmount, 0), 0);
    const totalPaid = s.payments.reduce((sum, p) => sum + p.amount, 0);
    return { ...s, totalBilled, totalPaid, outstanding: totalBilled - totalPaid };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Comprehensive detailed reports across all modules.</p>
      </div>

      <Tabs.Root defaultValue="attendance">
        <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-border">
          <Tabs.Trigger className={tabTrigger} value="attendance">Attendance Report</Tabs.Trigger>
          <Tabs.Trigger className={tabTrigger} value="labour">Labour Payment Report</Tabs.Trigger>
          <Tabs.Trigger className={tabTrigger} value="bills">Running Bill Report</Tabs.Trigger>
          <Tabs.Trigger className={tabTrigger} value="outstanding">Outstanding / Site Report</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="attendance" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Recent Attendance (Last 100)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead><TR><TH>Date</TH><TH>Site</TH><TH>Labourer</TH><TH>Status</TH><TH>Overtime</TH></TR></THead>
                <TBody>
                  {attendances.map(a => (
                    <TR key={a.id}><TD>{formatDate(a.date)}</TD><TD>{a.site.projectName}</TD><TD>{a.labour.name}</TD><TD><Badge variant="outline">{a.status}</Badge></TD><TD>{a.overtimeHrs} hrs</TD></TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="labour" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Labour Payment Runs</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead><TR><TH>Period</TH><TH>Site</TH><TH>Labourer</TH><TH>Days</TH><TH>Amount</TH><TH>Status</TH></TR></THead>
                <TBody>
                  {labourEntries.map(e => (
                    <TR key={e.id}><TD>{formatDate(e.periodStart)} - {formatDate(e.periodEnd)}</TD><TD>{e.site.projectName}</TD><TD>{e.labour.name}</TD><TD>{e.presentDays}</TD><TD>{formatINR(e.grossAmount)}</TD><TD><Badge variant={e.approved ? "secondary" : "outline"}>{e.approved ? "Approved" : "Pending"}</Badge></TD></TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="bills" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>All Generated Bills</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead><TR><TH>Date</TH><TH>Bill No</TH><TH>Site</TH><TH>Status</TH><TH>Amount</TH></TR></THead>
                <TBody>
                  {bills.map(b => (
                    <TR key={b.id}>
                      <TD>{formatDate(b.billDate)}</TD><TD>{b.billNo}</TD><TD>{b.site.projectName}</TD><TD><Badge variant="secondary">{b.status}</Badge></TD>
                      <TD>{formatINR(b.lines.reduce((s, l) => s + l.currentAmount, 0))}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="outstanding" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Site-wise Outstanding Balance</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead><TR><TH>Client</TH><TH>Site</TH><TH>Total Billed</TH><TH>Total Received</TH><TH>Outstanding Balance</TH></TR></THead>
                <TBody>
                  {siteReports.map(s => (
                    <TR key={s.id}><TD>{s.client.name}</TD><TD>{s.projectName}</TD><TD>{formatINR(s.totalBilled)}</TD><TD>{formatINR(s.totalPaid)}</TD><TD className="font-semibold text-destructive">{formatINR(s.outstanding)}</TD></TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
