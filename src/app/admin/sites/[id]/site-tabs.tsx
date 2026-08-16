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
  addLabourCategoryAction, addLabourerAction, assignSupervisorAction,
  unassignSupervisorAction, calculateLabourPaymentAction, approveLabourEntryAction
} from "./actions";
import { TowerWorkManager } from "./components/tower-work-manager";
import { SupplyLabourManager } from "./components/supply-labour-manager";
import { RABillViewer } from "./components/ra-bill-viewer";
import { SiteBalanceSheet } from "./components/site-balance-sheet";
import { 
  Building2, Hammer, Users, Banknote, UserCheck, Receipt, FileText, 
  MapPin, Percent, FileCheck, CircleDollarSign, CalendarDays, Contact2, Trash2, HardHat
} from "lucide-react";

const tabTrigger =
  "px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground transition-colors";

export function SiteTabs({ site, allSupervisors }: { site: any; allSupervisors: any[] }) {
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
    <Tabs.Root defaultValue="towers">
      <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-border">
        <Tabs.Trigger className={tabTrigger} value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="towers">Towers & Work Items</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="supply">Extra Supply Labours</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="bills">RA Bills & Invoices</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="balance">Balance Sheet & Payments</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="internallabours">Internal Site Labours</Tabs.Trigger>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
              <Receipt className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold text-emerald-500">{formatINR(totalGrossBilled)}</div></CardContent>
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
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Address & Project Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="font-semibold">Address:</span> {site.address || "No address provided."}</p>
              <p><span className="font-semibold">GST No:</span> {site.gstNo || "—"}</p>
              <p><span className="font-semibold">Work Order No:</span> {site.workOrderNo || "—"}</p>
              <p><span className="font-semibold">Retention:</span> {site.retentionPct}%</p>
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
                  <div key={s.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-200/60 dark:border-slate-800 last:border-0">
                    <div>
                      <Link href={`/admin/supervisors/${s.supervisor.id}`} className="font-semibold hover:text-blue-600 transition-colors">
                        {s.supervisor.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{s.supervisor.email} {s.supervisor.phone ? `• ${s.supervisor.phone}` : ""}</p>
                    </div>
                    <form action={unassignSupervisorAction.bind(null, site.id, s.supervisorId)}>
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
                <HardHat className="h-5 w-5 text-indigo-500" />
                Internal Site Labour Roster & Categories
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage site contractor workforce (Fitters, Helpers, Masons) and daily supervisor attendance.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {site.labourCategories.map((c: any) => (
                <Card key={c.id} className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">{c.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">Daily Wage: ₹{c.dailyWage} | Labours: {c.labours?.length || 0}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {c.labours?.map((l: any) => (
                        <div key={l.id} className="flex justify-between items-center text-xs py-1 border-b">
                          <span>{l.name}</span>
                          <span className="font-mono text-muted-foreground">{l.phone || "No phone"}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </Tabs.Content>



    </Tabs.Root>
  );
}
