"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Pickaxe, Phone, FileText, FileDown, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabourStatusDialog } from "@/components/ui/labour-status-dialog";
import { deleteLabour, toggleLabourActive } from "./actions";
import { LabourForm } from "./labour-form";

export function SiteLaboursTable({ site, allSites, allSupervisors }: { site: any, allSites: any, allSupervisors: any }) {
  const [search, setSearch] = useState("");
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(currentMonthStr);

  const filteredLabours = site.labours.filter((l: any) => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || (l.phone && l.phone.includes(search));
    
    if (!month) return matchesSearch;
    
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1;
    const endDate = new Date(year, monthIndex + 1, 1);
    const joinDate = new Date(l.joiningDate || l.createdAt);
    
    const matchesMonth = joinDate.getTime() < endDate.getTime();
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search labourers in this site..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-9 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
          />
        </div>
        <div className="w-full sm:w-auto">
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
            className="h-9 w-full sm:w-48 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <THead className="bg-slate-50/80 dark:bg-slate-900/80">
            <TR>
              <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Name & Details</TH>
              <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Category & Wage</TH>
              <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Contact & Info</TH>
              <TH className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Status</TH>
              <TH className="w-[120px] text-right font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredLabours.map((l: any) => (
              <TR key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <TD className="align-top">
                  <Link href={`/admin/labours/${l.id}`} className="font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {l.name}
                  </Link>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Joined: <span className="text-slate-700 dark:text-slate-300">{new Date(l.joiningDate || l.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </TD>
                <TD className="align-top">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold mb-1 border border-amber-200 dark:border-amber-500/20">
                    <Pickaxe className="h-3 w-3" />
                    {l.labourCategory.name}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex flex-col gap-0.5 mt-1">
                    <span className="text-emerald-600 dark:text-emerald-500">
                      ₹{l.labourCategory.name === "Fitter Foreman" 
                        ? Math.round((l.dailyWage ?? l.labourCategory.dailyWage) * 30).toLocaleString("en-IN") + "/month" 
                        : (l.dailyWage ?? l.labourCategory.dailyWage) + "/hajri"}
                    </span>
                    {l.overtimeRate && <span>₹{l.overtimeRate}/hr OT</span>}
                  </div>
                </TD>
                <TD className="align-top">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {l.phone || "No Phone"}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    {l.aadharNumber && <div className="flex items-center gap-1"><FileText className="h-3 w-3" /> <span className="font-medium text-slate-600 dark:text-slate-400">Aadhar:</span> {l.aadharNumber}</div>}
                    {l.bankName && (
                      <div className="leading-tight mt-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{l.bankName}</span>
                        <div className="mt-0.5 text-[11px]">
                          {l.accountNumber ? `A/C: ${l.accountNumber}` : ""}
                          {l.ifscCode ? ` • IFSC: ${l.ifscCode}` : ""}
                        </div>
                      </div>
                    )}
                  </div>
                </TD>
                <TD className="align-top pt-4">
                  <LabourStatusDialog
                    id={l.id}
                    active={l.active}
                    entityName={l.name}
                    onToggle={toggleLabourActive}
                    size="sm"
                  />
                </TD>
                <TD className="align-top text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                      <a href={`/admin/labours/${l.id}`} title="View Ledger">
                        <FileDown className="h-4 w-4" />
                      </a>
                    </Button>
                    <LabourForm sites={allSites} supervisors={allSupervisors} labour={l} />
                    <form
                      action={async () => {
                        await deleteLabour(l.id);
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </TD>
              </TR>
            ))}
            {filteredLabours.length === 0 && (
              <TR>
                <TD colSpan={5} className="py-12 text-center">
                  <div className="inline-flex flex-col items-center justify-center">
                    <Users className="h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No labourers found matching your search.</p>
                  </div>
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
