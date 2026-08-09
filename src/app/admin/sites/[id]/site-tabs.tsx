"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  addBuildingAction, addWorkItemAction, addLabourCategoryAction,
  addLabourerAction, assignSupervisorAction, unassignSupervisorAction, recordPaymentAction,
  calculateLabourPaymentAction, approveLabourEntryAction,
  uploadDocumentAction, deleteDocumentAction
} from "./actions";
import { QuotationSendButtons } from "./quotations/send-buttons";
import { deleteQuotationAction } from "../../quotations/actions";
import { 
  Building2, Hammer, Users, Banknote, UserCheck, Receipt, FileText, Upload, 
  MapPin, Percent, FileCheck, CircleDollarSign, CalendarDays, Contact2, Trash2
} from "lucide-react";

const tabTrigger =
  "px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground transition-colors";

export function SiteTabs({ site, allSupervisors }: { site: any; allSupervisors: any[] }) {
  const assignedIds = new Set(site.supervisors.map((s: any) => s.supervisorId));
  const availableSupervisors = allSupervisors.filter((s) => !assignedIds.has(s.id));

  return (
    <Tabs.Root defaultValue="overview">
      <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-border">
        <Tabs.Trigger className={tabTrigger} value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="buildings">Buildings</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="workitems">Work Items</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="attendance">Attendance</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="labours">Labours</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="labourpayment">Labour Payment</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="supervisors">Supervisors</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="bills">Bills</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="quotations">Quotations</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="reports">Reports</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="documents">Documents</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="payments">Payments</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview" className="space-y-6 mt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Client</CardTitle>
              <Contact2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{site.client.name}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">GST No.</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{site.gstNo || "—"}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Retention</CardTitle>
              <Percent className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{site.retentionPct}%</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Work Order No.</CardTitle>
              <FileCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{site.workOrderNo || "—"}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Buildings</CardTitle>
              <Building2 className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{site.buildings.length}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Work Items</CardTitle>
              <Hammer className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{site.workItems.length}</div></CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{site.address || "No address provided."}</CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Remarks</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{site.remarks || "No remarks."}</CardContent>
          </Card>
        </div>
      </Tabs.Content>

      <Tabs.Content value="buildings" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Building</CardTitle>
            <p className="text-sm text-muted-foreground">Define buildings or phases within this site (e.g. Tower A, Block B).</p>
          </CardHeader>
          <CardContent>
            <form action={addBuildingAction.bind(null, site.id)} className="flex flex-col sm:flex-row gap-3">
              <Input name="name" placeholder="Building name" className="max-w-md" required />
              <Button type="submit" className="w-full sm:w-auto">Add Building</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Building Name</TH></TR></THead>
            <TBody>
              {site.buildings.map((b: any) => <TR key={b.id} className="hover:bg-muted/30"><TD className="font-medium">{b.name}</TD></TR>)}
              {site.buildings.length === 0 && <TR><TD className="py-8 text-center text-muted-foreground">No buildings defined yet.</TD></TR>}
            </TBody>
          </Table>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="workitems" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Work Item</CardTitle>
            <p className="text-sm text-muted-foreground">Define items from the BOQ (e.g. Excavation, Concrete) with rates for billing.</p>
          </CardHeader>
          <CardContent>
            <form action={addWorkItemAction.bind(null, site.id)} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 w-full sm:w-auto flex-1 max-w-xs">
                <label className="text-xs text-muted-foreground font-medium">Work Item Name *</label>
                <Input name="name" placeholder="e.g. 15th Slab Concrete" required />
              </div>
              <div className="space-y-1 w-full sm:w-24">
                <label className="text-xs text-muted-foreground font-medium">Unit *</label>
                <Input name="unit" placeholder="Sft" defaultValue="Sft" required />
              </div>
              <div className="space-y-1 w-full sm:w-32">
                <label className="text-xs text-muted-foreground font-medium">Rate (₹) *</label>
                <Input name="rate" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Add Work Item</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Work Item</TH><TH>Unit</TH><TH>Rate</TH><TH>Approx. W.O. Qty</TH></TR></THead>
            <TBody>
              {site.workItems.map((w: any) => (
                <TR key={w.id} className="hover:bg-muted/30">
                  <TD className="font-medium">{w.name}</TD>
                  <TD><Badge variant="secondary" className="font-normal">{w.unit}</Badge></TD>
                  <TD className="text-green-700 dark:text-green-500 font-medium">{formatINR(w.rate)}</TD>
                  <TD className="text-muted-foreground">{w.buWork ?? "—"}</TD>
                </TR>
              ))}
              {site.workItems.length === 0 && <TR><TD colSpan={4} className="py-8 text-center text-muted-foreground">No work items defined yet.</TD></TR>}
            </TBody>
          </Table>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="attendance" className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Site Attendance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">View the daily attendance marked by the supervisors for this site.</p>
            <Link href={`/admin/attendance?siteId=${site.id}`}>
              <Button>View Full Attendance Log →</Button>
            </Link>
          </CardContent>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="labours" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Labour Category</CardTitle>
            <p className="text-sm text-muted-foreground">Define roles and standard 1 Hajari Rates (e.g. Mason, Helper).</p>
          </CardHeader>
          <CardContent>
            <form action={addLabourCategoryAction.bind(null, site.id)} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 w-full sm:w-auto flex-1 max-w-xs">
                <label className="text-xs text-muted-foreground font-medium">Category Name *</label>
                <Input name="name" placeholder="e.g. Mason" required />
              </div>
              <div className="space-y-1 w-full sm:w-32">
                <label className="text-xs text-muted-foreground font-medium">1 Hajari Rate (₹) *</label>
                <Input name="dailyWage" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="space-y-1 w-full sm:w-32">
                <label className="text-xs text-muted-foreground font-medium">OT Rate/Hr (₹) *</label>
                <Input name="overtimeRate" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Add Category</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden mb-6">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Category</TH><TH>1 Hajari Rate</TH><TH>Overtime Rate</TH><TH>Labourers</TH></TR></THead>
            <TBody>
              {site.labourCategories.map((l: any) => (
                <TR key={l.id} className="hover:bg-muted/30">
                  <TD className="font-medium">{l.name}</TD>
                  <TD className="text-green-700 dark:text-green-500 font-medium">{formatINR(l.dailyWage)}</TD>
                  <TD className="text-orange-600 dark:text-orange-400 font-medium">{formatINR(l.overtimeRate)}</TD>
                  <TD><Badge variant="secondary">{l.labours.length}</Badge></TD>
                </TR>
              ))}
              {site.labourCategories.length === 0 && <TR><TD colSpan={4} className="py-8 text-center text-muted-foreground">No labour categories defined yet.</TD></TR>}
            </TBody>
          </Table>
        </Card>

        <div>
          <h3 className="mb-4 text-xl font-semibold tracking-tight">Assigned Labourers</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {site.labourCategories.map((l: any) => (
              <Card key={l.id} className="flex flex-col">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-base text-primary">{l.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-4 pb-4 space-y-4">
                  {l.labours.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {l.labours.map((p: any) => (
                        <Badge key={p.id} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                          <UserCheck className="h-3 w-3 mr-1" /> {p.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No labourers assigned to this category.</p>
                  )}
                  <form action={addLabourerAction.bind(null, site.id, l.id)} className="mt-4 flex gap-2 border-t pt-4 border-dashed">
                    <Input name="name" placeholder="Name" className="flex-1" required />
                    <Input name="phone" placeholder="Phone (opt)" className="w-32" />
                    <Button type="submit" size="sm" variant="secondary">Add</Button>
                  </form>
                </CardContent>
              </Card>
            ))}
            {site.labourCategories.length === 0 && (
              <div className="col-span-full py-12 text-center border rounded-xl bg-muted/10 border-dashed">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">Create a labour category first to add labourers.</p>
              </div>
            )}
          </div>
        </div>
      </Tabs.Content>

      <Tabs.Content value="labourpayment" className="space-y-6 mt-4">
        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-blue-600" /> Calculate Labour Payment
            </CardTitle>
            <p className="text-sm text-muted-foreground">Sums attendance (Hajari count) × 1 Hajari Rate for each labourer in the selected period.</p>
          </CardHeader>
          <CardContent>
            <form action={calculateLabourPaymentAction.bind(null, site.id)} className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5 flex-1 max-w-[200px]">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Period Start</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input name="periodStart" type="date" required className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5 flex-1 max-w-[200px]">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Period End</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input name="periodEnd" type="date" required className="pl-9" />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto">Run Calculation</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Labourer</TH><TH>Period</TH><TH>Present Days</TH><TH>OT Hrs</TH><TH>Gross Amount</TH><TH>Status</TH><TH></TH></TR></THead>
            <TBody>
              {(site.labourEntries || []).map((e: any) => (
                <TR key={e.id} className="hover:bg-muted/30">
                  <TD className="font-medium">{e.labour?.name}</TD>
                  <TD className="text-muted-foreground text-sm">{formatDate(e.periodStart)} – {formatDate(e.periodEnd)}</TD>
                  <TD>{e.presentDays}</TD>
                  <TD>{e.overtimeHrs}</TD>
                  <TD className="font-semibold">{formatINR(e.grossAmount)}</TD>
                  <TD>
                    <Badge variant={e.approved ? "default" : "secondary"} className={e.approved ? "bg-green-600 hover:bg-green-700" : ""}>
                      {e.approved ? "Approved" : "Pending"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    {!e.approved && (
                      <form action={approveLabourEntryAction.bind(null, site.id, e.id)}>
                        <Button type="submit" size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/50">Approve</Button>
                      </form>
                    )}
                  </TD>
                </TR>
              ))}
              {(!site.labourEntries || site.labourEntries.length === 0) && (
                <TR><TD colSpan={7} className="py-8 text-center text-muted-foreground">No labour payment runs yet — calculate one above.</TD></TR>
              )}
            </TBody>
          </Table>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="supervisors" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assigned Supervisors</CardTitle>
            <p className="text-sm text-muted-foreground">Manage which supervisors have access to and responsibility for this site.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-3">
                {site.supervisors.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 pl-3 pr-1 py-1 text-sm font-medium text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
                    <UserCheck className="h-4 w-4" />
                    {s.supervisor.name}
                    <form action={unassignSupervisorAction.bind(null, site.id, s.supervisorId)}>
                      <button className="ml-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-blue-200/50 text-blue-500 hover:text-blue-700 dark:hover:bg-blue-800/50 dark:hover:text-blue-200 transition-colors">×</button>
                    </form>
                  </div>
                ))}
                {site.supervisors.length === 0 && <p className="text-sm text-muted-foreground italic">No supervisor assigned yet.</p>}
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium mb-3">Assign New Supervisor</h4>
              <form action={assignSupervisorAction.bind(null, site.id)} className="flex flex-col sm:flex-row gap-3">
                <select name="supervisorId" className="h-10 w-full max-w-xs rounded-md border border-input bg-card px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                  <option value="">Select a supervisor…</option>
                  {availableSupervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Button type="submit" className="w-full sm:w-auto">Assign Supervisor</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="bills" className="space-y-6 mt-4">
        <Card className="border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600" /> Running Bills
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Running bills are automatically generated from database records — never entered manually.</p>
            </div>
            <Link href={`/admin/sites/${site.id}/bills/new`}><Button className="shrink-0 bg-indigo-600 hover:bg-indigo-700">Generate Running Bill</Button></Link>
          </CardHeader>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Bill No.</TH><TH>Date</TH><TH>Status</TH><TH></TH></TR></THead>
            <TBody>
              {site.bills.map((b: any) => (
                <TR key={b.id} className="hover:bg-muted/30">
                  <TD className="font-medium">{b.billNo}</TD>
                  <TD>{formatDate(b.billDate)}</TD>
                  <TD><Badge variant="secondary">{b.status}</Badge></TD>
                  <TD className="text-right"><Link className="text-primary underline-offset-4 hover:underline text-sm font-medium" href={`/admin/sites/${site.id}/bills/${b.id}`}>Open →</Link></TD>
                </TR>
              ))}
              {site.bills.length === 0 && <TR><TD colSpan={4} className="py-8 text-center text-muted-foreground">No bills generated yet.</TD></TR>}
            </TBody>
          </Table>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="quotations" className="space-y-6 mt-4">
        <Card className="border-purple-200 bg-purple-50/30 dark:border-purple-900/50 dark:bg-purple-950/20">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" /> Quotations
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Generate a client-facing quotation PDF from this site's work items.</p>
            </div>
            <Link href={`/admin/sites/${site.id}/quotations/new`}><Button className="shrink-0 bg-purple-600 hover:bg-purple-700">New Quotation</Button></Link>
          </CardHeader>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Quotation No.</TH><TH>Date</TH><TH>Status</TH><TH></TH></TR></THead>
            <TBody>
              {site.quotations.map((q: any) => (
                <TR key={q.id} className="hover:bg-muted/30">
                  <TD className="font-medium">{q.quotationNo}</TD>
                  <TD>{formatDate(q.date)}</TD>
                  <TD><Badge variant="secondary">{q.status}</Badge></TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      {q.status === "DRAFT" && (
                        <Link className="text-primary underline-offset-4 hover:underline text-sm font-medium" href={`/admin/quotations/${q.id}/edit`}>
                          Edit
                        </Link>
                      )}
                      <a className="text-primary underline-offset-4 hover:underline text-sm font-medium" href={`/api/quotations/${q.id}/pdf`} target="_blank">Preview PDF</a>
                      <QuotationSendButtons 
                        quotationId={q.id} 
                        clientId={site.clientId}
                        clientEmail={site.client.email || ""}
                        clientPhone={site.client.phone || ""}
                      />
                      <form action={deleteQuotationAction.bind(null, q.id)}>
                        <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TD>
                </TR>
              ))}
              {site.quotations.length === 0 && <TR><TD colSpan={4} className="py-8 text-center text-muted-foreground">No quotations generated yet.</TD></TR>}
            </TBody>
          </Table>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="reports" className="space-y-6 mt-4">
        <Card className="border-teal-200 bg-teal-50/30 dark:border-teal-900/50 dark:bg-teal-950/20">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" /> Site Reports
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">View comprehensive financial and operational reports for this specific project.</p>
            </div>
            <Link href={`/admin/reports?siteId=${site.id}`}><Button className="shrink-0 bg-teal-600 hover:bg-teal-700">Open Reports Dashboard →</Button></Link>
          </CardHeader>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="payments" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Record Client Payment</CardTitle>
            <p className="text-sm text-muted-foreground">Log payments received from the client for this site.</p>
          </CardHeader>
          <CardContent>
            <form action={recordPaymentAction.bind(null, site.id)} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 w-full sm:w-32">
                <label className="text-xs text-muted-foreground font-medium">Amount (₹) *</label>
                <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="space-y-1 w-full sm:w-32">
                <label className="text-xs text-muted-foreground font-medium">Mode *</label>
                <select name="mode" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" required>
                  <option value="CASH">Cash</option><option value="NEFT">NEFT</option>
                  <option value="ONLINE">Online</option><option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div className="space-y-1 w-full sm:w-auto flex-1 max-w-xs">
                <label className="text-xs text-muted-foreground font-medium">Account Credited</label>
                <Input name="accountCredited" placeholder="e.g. HDFC Bank" />
              </div>
              <div className="space-y-1 w-full sm:w-auto flex-1 max-w-xs">
                <label className="text-xs text-muted-foreground font-medium">Remarks</label>
                <Input name="remarks" placeholder="Optional notes" />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Record Payment</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Date</TH><TH>Amount</TH><TH>Mode</TH><TH>Account Credited</TH><TH>Remarks</TH></TR></THead>
            <TBody>
              {site.payments.map((p: any) => (
                <TR key={p.id} className="hover:bg-muted/30">
                  <TD>{formatDate(p.date)}</TD>
                  <TD className="text-green-700 dark:text-green-500 font-medium">{formatINR(p.amount)}</TD>
                  <TD><Badge variant="outline">{p.mode}</Badge></TD>
                  <TD className="text-muted-foreground">{p.accountCredited || "—"}</TD>
                  <TD className="text-muted-foreground text-sm">{p.remarks || "—"}</TD>
                </TR>
              ))}
              {site.payments.length === 0 && <TR><TD colSpan={5} className="py-8 text-center text-muted-foreground">No payments recorded yet.</TD></TR>}
            </TBody>
          </Table>
        </Card>
      </Tabs.Content>

      <Tabs.Content value="documents" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Document</CardTitle>
            <p className="text-sm text-muted-foreground">Store site drawings, contracts, and progress photos.</p>
          </CardHeader>
          <CardContent>
            <form action={uploadDocumentAction.bind(null, site.id)} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="space-y-1 w-full sm:w-1/3">
                <label className="text-xs text-muted-foreground font-medium">Document Name *</label>
                <Input name="name" placeholder="e.g. Approved Plan" required />
              </div>
              <div className="space-y-1 w-full flex-1">
                <label className="text-xs text-muted-foreground font-medium">File *</label>
                <Input name="file" type="file" required className="cursor-pointer file:cursor-pointer file:text-primary file:font-medium file:bg-primary/10 file:border-0 file:rounded-md file:px-4 file:py-1 hover:file:bg-primary/20 transition-colors" />
              </div>
              <Button type="submit" className="w-full sm:w-auto gap-2">
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <THead className="bg-muted/50"><TR><TH>Document Name</TH><TH>Uploaded At</TH><TH className="text-right">Actions</TH></TR></THead>
            <TBody>
              {site.documents?.map((d: any) => (
                <TR key={d.id} className="hover:bg-muted/30">
                  <TD className="font-medium">
                    <a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <FileText className="h-4 w-4" /> {d.name}
                    </a>
                  </TD>
                  <TD className="text-muted-foreground">{formatDate(d.createdAt)}</TD>
                  <TD className="text-right">
                    <form action={deleteDocumentAction.bind(null, site.id, d.id, d.publicId)}>
                      <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive hover:bg-destructive/10">Delete</Button>
                    </form>
                  </TD>
                </TR>
              ))}
              {(!site.documents || site.documents.length === 0) && (
                <TR><TD colSpan={3} className="py-8 text-center text-muted-foreground">No documents uploaded yet.</TD></TR>
              )}
            </TBody>
          </Table>
        </Card>
      </Tabs.Content>
    </Tabs.Root>
  );
}
