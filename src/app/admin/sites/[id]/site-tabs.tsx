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
  unassignSupervisorAction, calculateLabourPaymentAction, approveLabourEntryAction,
  uploadDocumentAction, deleteDocumentAction
} from "./actions";
import { TowerWorkManager } from "./components/tower-work-manager";
import { SupplyLabourManager } from "./components/supply-labour-manager";
import { RABillViewer } from "./components/ra-bill-viewer";
import { SiteBalanceSheet } from "./components/site-balance-sheet";
import { 
  Building2, Hammer, Users, Banknote, UserCheck, Receipt, FileText, Upload, 
  MapPin, Percent, FileCheck, CircleDollarSign, CalendarDays, Contact2, Trash2, HardHat
} from "lucide-react";

const tabTrigger =
  "px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground transition-colors";

export function SiteTabs({ site, allSupervisors }: { site: any; allSupervisors: any[] }) {
  const assignedIds = new Set(site.supervisors.map((s: any) => s.supervisorId));
  const availableSupervisors = allSupervisors.filter((s) => !assignedIds.has(s.id));

  // Compute stats for overview
  const totalTowerWork = site.buildings.reduce((sum: number, b: any) => {
    return sum + (b.workItems || []).reduce((ws: number, item: any) => ws + ((item.currentQty || 0) * item.rate), 0);
  }, 0);
  const totalSupplyWork = (site.supplyLabourEntries || []).reduce((sum: number, se: any) => sum + (se.totalAmount || 0), 0);
  const grossBilledTotal = totalTowerWork + totalSupplyWork;
  const totalReceived = (site.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const outstandingBal = grossBilledTotal - totalReceived;

  return (
    <Tabs.Root defaultValue="towers">
      <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-border">
        <Tabs.Trigger className={tabTrigger} value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="towers">Towers & Work Items</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="supply">Extra Supply Labours</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="bills">RA Bills & Invoices</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="balance">Balance Sheet & Payments</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="internallabours">Internal Site Labours</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="supervisors">Supervisors</Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="documents">Documents</Tabs.Trigger>
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
            <CardContent><div className="text-xl font-bold text-emerald-500">{formatINR(grossBilledTotal)}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payments Received</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{formatINR(totalReceived)}</div></CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
              <Banknote className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent><div className="text-xl font-bold text-amber-500">{formatINR(outstandingBal)}</div></CardContent>
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
            {/* Labour Categories */}
            <form
              action={async (formData) => {
                await addLabourCategoryAction(site.id, formData);
              }}
              className="p-4 bg-muted/40 rounded-lg flex items-end gap-3 flex-wrap border"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Category Name *</label>
                <Input name="name" placeholder="e.g. Fitter, Helper, Mason" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Daily Wage (₹)</label>
                <Input name="dailyWage" type="number" defaultValue="800" />
              </div>
              <Button type="submit">Add Category</Button>
            </form>

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

      {/* SUPERVISORS TAB */}
      <Tabs.Content value="supervisors" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Assigned Site Supervisors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async (formData) => {
                await assignSupervisorAction(site.id, formData);
              }}
              className="flex items-center gap-3"
            >
              <select name="supervisorId" className="h-9 rounded-md border bg-background px-3 text-xs max-w-xs">
                {availableSupervisors.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
              <Button type="submit">Assign Supervisor</Button>
            </form>

            <div className="space-y-2 border rounded-md p-3">
              {site.supervisors.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                  <div>
                    <p className="font-semibold">{s.supervisor.name}</p>
                    <p className="text-xs text-muted-foreground">{s.supervisor.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await unassignSupervisorAction(site.id, s.supervisorId);
                    }}
                    className="text-destructive"
                  >
                    Unassign
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Tabs.Content>

      {/* DOCUMENTS TAB */}
      <Tabs.Content value="documents" className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Site Work Orders & Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async (formData) => {
                await uploadDocumentAction(site.id, formData);
              }}
              className="flex items-center gap-3"
            >
              <Input name="name" placeholder="Document Name (e.g. Work Order.pdf)" required className="max-w-xs" />
              <Input name="file" type="file" required className="max-w-xs" />
              <Button type="submit" className="gap-2"><Upload className="h-4 w-4" /> Upload Document</Button>
            </form>

            <div className="space-y-2 border rounded-md p-3">
              {(site.documents || []).map((doc: any) => (
                <div key={doc.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                  <div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                      {doc.name}
                    </a>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Delete ${doc.name}?`)) {
                        await deleteDocumentAction(site.id, doc.id, doc.publicId);
                      }
                    }}
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Tabs.Content>
    </Tabs.Root>
  );
}
