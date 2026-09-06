"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addLabourCategoryAction, addLabourerAction, assignSupervisorAction,
  unassignSupervisorAction, calculateLabourPaymentAction, approveLabourEntryAction
} from "./actions";
import { updateSiteTaxSettingsAction, updateSiteDetailsAction } from "../actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TowerWorkManager } from "./components/tower-work-manager";
import { SupplyLabourManager } from "./components/supply-labour-manager";
import { RABillViewer } from "./components/ra-bill-viewer";
import { SiteBalanceSheet } from "./components/site-balance-sheet";
import { SiteExpensesTracker } from "./components/site-expenses-tracker";
import { 
  Building2, Hammer, Users, Banknote, UserCheck, Receipt, FileText, 
  MapPin, Percent, FileCheck, CircleDollarSign, CalendarDays, Contact2, Trash2, HardHat, Edit2
} from "lucide-react";

const tabTrigger =
  "px-3 py-2 text-[13px] whitespace-nowrap font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground transition-colors";

export function SiteTabs({ site, allSupervisors }: { site: any; allSupervisors: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isEditingTaxes, setIsEditingTaxes] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const assignedIds = new Set(site.supervisors.map((s: any) => s.supervisorId));
  const availableSupervisors = allSupervisors.filter((s) => !assignedIds.has(s.id));

  // Compute stats for overview based on GENERATED BILLS (to sync with Balance Sheet)
  let totalGrossBilled = 0;
  let totalNetBilled = 0;
  let totalTdsDeducted = 0;
  let totalGstAmount = 0;

  (site.bills || []).forEach((b: any) => {
    const gross = (b.lines || []).reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
    const retPct = b.retentionPct ?? site.retentionPct ?? 2;
    const tdsPct = b.tdsPct ?? site.tdsPct ?? 1;
    const cgstPct = b.cgstPct ?? site.cgstPct ?? 9;
    const sgstPct = b.sgstPct ?? site.sgstPct ?? 9;

    const retAmt = gross * (retPct / 100);
    const netAmt = gross - retAmt;
    const tdsAmt = gross * (tdsPct / 100);
    const gstAmt = gross * ((cgstPct + sgstPct) / 100);

    totalGrossBilled += gross;
    totalNetBilled += netAmt;
    totalTdsDeducted += tdsAmt;
    totalGstAmount += gstAmt;
  });

  const totalReceived = (site.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const outstandingBal = (totalNetBilled + totalGstAmount) - (totalReceived + totalTdsDeducted);

  return (
    <>
      <Tabs.Root defaultValue="towers">
      <Tabs.List className="mb-6 flex overflow-x-auto scrollbar-hide gap-1 border-b border-border">
        <Tabs.Trigger className={tabTrigger} value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="towers">Towers & Work Items</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="supply">Extra Supply Labours</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="bills">RA Bills & Invoices</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="balance">Balance Sheet & Payments</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="internallabours">Internal Site Labours</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="expenses">Total Expenses</Tabs.Trigger>
      </Tabs.List>

      {/* OVERVIEW TAB */}
      <Tabs.Content value="overview" className="space-y-6 mt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Client</CardTitle>
              <Contact2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{site.client.name}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced (with GST)</CardTitle>
              <Receipt className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold text-emerald-500">{formatINR(totalGrossBilled + totalGstAmount)}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payments Received</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{formatINR(totalReceived)}</div></CardContent>
          </Card>
          <Card className={outstandingBal > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/10 border-emerald-500/30"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
              <Banknote className={`h-4 w-4 ${outstandingBal > 0 ? "text-rose-500" : "text-emerald-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${outstandingBal > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                {formatINR(outstandingBal)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {outstandingBal > 0 ? "🔴 Pending Dues from Client" : "🟢 Balance Cleared / Advance Received"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Address & Project Info</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsEditingDetails(true)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit Info
                </Button>
                {(site.bills?.length || 0) === 0 && !isEditingTaxes && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsEditingTaxes(true)}>
                    <Edit2 className="h-3 w-3 mr-1" /> Edit Taxes
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="font-semibold">Address:</span> {site.address || "No address provided."}</p>
              <p><span className="font-semibold">GST No:</span> {site.gstNo || "—"}</p>
              <p><span className="font-semibold">Work Order No:</span> {site.workOrderNo || "—"}</p>
              
              {isEditingTaxes ? (
                <form 
                  action={(formData) => {
                    startTransition(async () => {
                      try {
                        await updateSiteTaxSettingsAction(site.id, formData);
                        toast.success("Tax settings updated successfully!");
                        setIsEditingTaxes(false);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to update tax settings");
                      }
                    });
                  }}
                  className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Retention %</label>
                      <Input name="retentionPct" type="number" step="0.1" defaultValue={site.retentionPct ?? 2} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">CGST %</label>
                      <Input name="cgstPct" type="number" step="0.1" defaultValue={site.cgstPct ?? 9} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SGST %</label>
                      <Input name="sgstPct" type="number" step="0.1" defaultValue={site.sgstPct ?? 9} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">TDS %</label>
                      <Input name="tdsPct" type="number" step="0.1" defaultValue={site.tdsPct ?? 1} className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingTaxes(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="pt-1 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <p><span className="font-semibold text-slate-500">Retention:</span> {site.retentionPct}%</p>
                  <p><span className="font-semibold text-slate-500">CGST/SGST:</span> {site.cgstPct}% / {site.sgstPct}%</p>
                  <p><span className="font-semibold text-slate-500">TDS:</span> {site.tdsPct}%</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Towers & Supply Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="font-semibold">Towers / Wings:</span> {site.buildings.length} towers configured</p>
              <p><span className="font-semibold">Extra Supply Entries:</span> {site.supplyLabourEntries?.length || 0} challans recorded</p>
              <p><span className="font-semibold">RA Bills Generated:</span> {site.bills?.length || 0} bills</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Site Supervisors</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{site.supervisors.length} Assigned</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Assign Supervisor Dropdown Form */}
            {availableSupervisors.length > 0 && (
              <form action={assignSupervisorAction.bind(null, site.id)} className="flex gap-2">
                <select
                  name="supervisorId"
                  required
                  className="flex h-10 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm cursor-pointer"
                >
                  <option value="">Select supervisor to assign…</option>
                  {availableSupervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Assign
                </Button>
              </form>
            )}

            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
              {site.supervisors.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">No supervisors assigned to this site yet.</p>
              ) : (
                site.supervisors.map((s: any) => (
                  <div key={s.supervisor.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-200/60 dark:border-slate-800 last:border-0">
                    <div>
                      <Link href={`/admin/supervisors/${s.supervisor.id}`} className="font-semibold hover:text-blue-600 transition-colors">
                        {s.supervisor.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{s.supervisor.email} {s.supervisor.phone ? `• ${s.supervisor.phone}` : ""}</p>
                    </div>
                    <form action={unassignSupervisorAction.bind(null, site.id, s.supervisor.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </Tabs.Content>

      {/* TOWERS & WORK ITEMS TAB (SHEET 3 & 4) */}
      <Tabs.Content value="towers" className="mt-4">
        <TowerWorkManager site={site} />
      </Tabs.Content>

      {/* EXTRA SUPPLY LABOURS TAB (SUPPLY SHEET) */}
      <Tabs.Content value="supply" className="mt-4">
        <SupplyLabourManager site={site} />
      </Tabs.Content>

      {/* RA BILLS & INVOICES TAB (SHEET 1 TAX INVOICE & SHEET 2 ABSTRACT) */}
      <Tabs.Content value="bills" className="mt-4">
        <RABillViewer site={site} />
      </Tabs.Content>

      {/* BALANCE SHEET & PAYMENTS TAB (SHEET BALANCE SHEET) */}
      <Tabs.Content value="balance" className="mt-4">
        <SiteBalanceSheet site={site} />
      </Tabs.Content>

      {/* INTERNAL SITE LABOURS TAB */}
      <Tabs.Content value="internallabours" className="space-y-6 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Site Labours List
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View all labours on this site along with their total attendance and rates.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-200 dark:border-slate-800">
              <Table>
                <THead>
                  <TR>
                    <TH>Labour Name</TH>
                    <TH>Category</TH>
                    <TH>Supervisor</TH>
                    <TH>Rate (₹)</TH>
                    <TH>Total Hajri</TH>
                  </TR>
                </THead>
                <TBody>
                  {(() => {
                    const allLabours = site.labourCategories.flatMap((c: any) =>
                      (c.labours || []).map((l: any) => ({
                        id: l.id,
                        name: l.name,
                        categoryName: c.name,
                        supervisorName: l.supervisor?.name || "Unassigned",
                        rate: l.dailyWage ?? c.dailyWage,
                        totalHajri: (l.attendances || []).reduce((sum: number, a: any) => sum + (a.hajari || 0), 0)
                      }))
                    );

                    if (allLabours.length === 0) {
                      return (
                        <TR>
                          <TD colSpan={5} className="h-24 text-center text-muted-foreground">
                            No labours found on this site. Please add them from the Labours menu or transfer them here.
                          </TD>
                        </TR>
                      );
                    }

                    return allLabours.map((l: any) => (
                      <TR key={l.id}>
                        <TD className="font-medium">{l.name}</TD>
                        <TD>
                          <Badge variant="outline" className="font-normal text-xs">{l.categoryName}</Badge>
                        </TD>
                        <TD className="text-muted-foreground text-xs">{l.supervisorName}</TD>
                        <TD>{l.rate}</TD>
                        <TD className="font-semibold text-emerald-600">{l.totalHajri}</TD>
                      </TR>
                    ));
                  })()}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs.Content>

      {/* TOTAL EXPENSES TAB */}
      <Tabs.Content value="expenses" className="space-y-6 mt-4">
        <SiteExpensesTracker site={site} />
      </Tabs.Content>

    </Tabs.Root>

      {/* Edit Site Details Modal */}
      <Dialog open={isEditingDetails} onOpenChange={setIsEditingDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project Info</DialogTitle>
          </DialogHeader>
          <form
            action={(formData) => {
              startTransition(async () => {
                try {
                  await updateSiteDetailsAction(site.id, formData);
                  toast.success("Site details updated successfully!");
                  setIsEditingDetails(false);
                } catch (err: any) {
                  toast.error(err.message || "Failed to update details.");
                }
              });
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Project / Site Name *</label>
              <Input name="projectName" defaultValue={site.projectName} required placeholder="e.g. S2 Building Concrete Work" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Site Address</label>
              <Input name="address" defaultValue={site.address || ""} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Client GST No.</label>
                <Input name="gstNo" defaultValue={site.gstNo || ""} placeholder="27AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Work Order No.</label>
                <Input name="workOrderNo" defaultValue={site.workOrderNo || ""} placeholder="WO/2026/001" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
