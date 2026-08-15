"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import {
  addSupplyLabourEntryAction,
  deleteSupplyLabourEntryAction,
  updateSupplyLabourEntriesAction,
} from "../bill-actions";
import {
  Users,
  Plus,
  Trash2,
  DollarSign,
  Save,
  CheckCircle2,
  Lock,
  Clock,
  Layers,
  Filter,
  CheckCircle,
  Loader2,
} from "lucide-react";

export function SupplyLabourManager({ site }: { site: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<"all" | "current" | "previous">("all");

  const rawEntries = site.supplyLabourEntries || [];
  const bills = site.bills || [];

  // Map runningBillId to Bill No for easy display
  const billMap = useMemo(() => {
    const map: Record<string, string> = {};
    bills.forEach((b: any) => {
      map[b.id] = b.billNo;
    });
    return map;
  }, [bills]);

  // Local state for editable table rows
  const [entriesState, setEntriesState] = useState<
    Record<
      string,
      {
        date: string;
        challanNo: string;
        description: string;
        fitterQty: number;
        fitterHours: number;
        fitterRate: number;
        helperQty: number;
        helperHours: number;
        helperRate: number;
        totalAmount: number;
      }
    >
  >(() => {
    const initialState: any = {};
    rawEntries.forEach((e: any) => {
      initialState[e.id] = {
        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "",
        challanNo: e.challanNo || "",
        description: e.description || "",
        fitterQty: e.fitterQty || 0,
        fitterHours: e.fitterHours || 0,
        fitterRate: e.fitterRate || 1100,
        helperQty: e.helperQty || 0,
        helperHours: e.helperHours || 0,
        helperRate: e.helperRate || 800,
        totalAmount: e.totalAmount || 0,
      };
    });
    return initialState;
  });

  // Sync state when site prop changes (e.g., after successful save)
  useEffect(() => {
    const newState: any = {};
    rawEntries.forEach((e: any) => {
      newState[e.id] = {
        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "",
        challanNo: e.challanNo || "",
        description: e.description || "",
        fitterQty: e.fitterQty || 0,
        fitterHours: e.fitterHours || 0,
        fitterRate: e.fitterRate || 1100,
        helperQty: e.helperQty || 0,
        helperHours: e.helperHours || 0,
        helperRate: e.helperRate || 800,
        totalAmount: e.totalAmount || 0,
      };
    });
    setEntriesState(newState);
  }, [site.supplyLabourEntries]);

  const handleFieldChange = (entryId: string, field: string, value: any) => {
    setEntriesState((prev) => {
      const current = prev[entryId] || {};
      const updated = { ...current, [field]: value };

      // Auto-recalculate totalAmount if quantities, hours or rates are edited
      if (
        field === "fitterQty" ||
        field === "fitterHours" ||
        field === "fitterRate" ||
        field === "helperQty" ||
        field === "helperHours" ||
        field === "helperRate"
      ) {
        const fQty = updated.fitterQty || 0;
        const fHrs = updated.fitterHours || 0;
        const fRate = updated.fitterRate || 1100;
        const fTotal = fHrs > 0 ? ((fQty * fHrs) / 8) * fRate : fQty * fRate;

        const hQty = updated.helperQty || 0;
        const hHrs = updated.helperHours || 0;
        const hRate = updated.helperRate || 800;
        const hTotal = hHrs > 0 ? ((hQty * hHrs) / 8) * hRate : hQty * hRate;

        updated.totalAmount = Math.round((fTotal + hTotal) * 100) / 100;
      }

      return {
        ...prev,
        [entryId]: updated,
      };
    });
  };

  const handleSaveAll = async () => {
    setErrorMessage(null);
    const unbilledOnly = rawEntries.filter((e: any) => !e.runningBillId);

    // 1. Frontend validation: Duplicate challan numbers
    const seenChallans = new Set<string>();
    for (const e of unbilledOnly) {
      const state = entriesState[e.id] || {};
      const ch = (state.challanNo || "").trim().toLowerCase();
      if (ch) {
        if (seenChallans.has(ch)) {
          setErrorMessage(`Duplicate Challan Error! Challan "${state.challanNo}" is entered more than once.`);
          return;
        }
        seenChallans.add(ch);
      }

      if ((state.fitterQty && state.fitterQty < 0) || (state.helperQty && state.helperQty < 0)) {
        setErrorMessage("Quantities cannot be negative.");
        return;
      }
      if ((state.fitterHours && state.fitterHours > 24) || (state.helperHours && state.helperHours > 24)) {
        setErrorMessage("Daily shift hours cannot exceed 24 hours per day.");
        return;
      }
    }

    setIsSaving(true);
    setSaveMessage("Saving...");
    try {
      const updates = unbilledOnly.map((e: any) => {
        const state = entriesState[e.id] || {};
        return {
          id: e.id,
          date: state.date,
          challanNo: state.challanNo,
          description: state.description,
          fitterQty: state.fitterQty,
          fitterHours: state.fitterHours,
          fitterRate: state.fitterRate,
          helperQty: state.helperQty,
          helperHours: state.helperHours,
          helperRate: state.helperRate,
          totalAmount: state.totalAmount,
        };
      });

      await updateSupplyLabourEntriesAction(site.id, updates);
      setSaveMessage("Saved successfully!");
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to save supply entries.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Split into unbilled (Current / This Bill) and billed (Previous Bills)
  const currentEntries = rawEntries.filter((e: any) => !e.runningBillId);
  const previousEntries = rawEntries.filter((e: any) => Boolean(e.runningBillId));

  // Current (This Bill) Stats
  let currentSupplyAmount = 0;
  let currentFitterHours = 0;
  let currentHelperHours = 0;

  currentEntries.forEach((e: any) => {
    const st = entriesState[e.id] || e;
    currentSupplyAmount += st.totalAmount || 0;
    currentFitterHours += (st.fitterQty || 0) * (st.fitterHours || 0);
    currentHelperHours += (st.helperQty || 0) * (st.helperHours || 0);
  });

  // Previous (Past Bills) Stats
  let prevSupplyAmount = 0;
  let prevFitterHours = 0;
  let prevHelperHours = 0;

  previousEntries.forEach((e: any) => {
    const st = entriesState[e.id] || e;
    prevSupplyAmount += st.totalAmount || 0;
    prevFitterHours += (st.fitterQty || 0) * (st.fitterHours || 0);
    prevHelperHours += (st.helperQty || 0) * (st.helperHours || 0);
  });

  // Cumulative Overall Stats
  const cumulativeSupplyAmount = currentSupplyAmount + prevSupplyAmount;
  const cumulativeFitterHours = currentFitterHours + prevFitterHours;
  const cumulativeHelperHours = currentHelperHours + prevHelperHours;

  const currentFitterDays = Math.round((currentFitterHours / 8) * 100) / 100;
  const currentHelperDays = Math.round((currentHelperHours / 8) * 100) / 100;
  const prevFitterDays = Math.round((prevFitterHours / 8) * 100) / 100;
  const prevHelperDays = Math.round((prevHelperHours / 8) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards: Clear Distinction between Current, Previous & Cumulative */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Current This Bill */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-400">
                🟡 Current Supply (This Bill)
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Unbilled / Pending for next RA Bill</p>
            </div>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatINR(currentSupplyAmount)}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t border-amber-500/20">
              <span>Fitters: <strong className="text-foreground">{currentFitterHours}h</strong> ({currentFitterDays}d)</span>
              <span>•</span>
              <span>Helpers: <strong className="text-foreground">{currentHelperHours}h</strong> ({currentHelperDays}d)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Previously Billed */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400">
                🔒 Previously Billed Supply
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Already billed & locked in past RA bills</p>
            </div>
            <Lock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatINR(prevSupplyAmount)}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t border-blue-500/20">
              <span>Fitters: <strong className="text-foreground">{prevFitterHours}h</strong> ({prevFitterDays}d)</span>
              <span>•</span>
              <span>Helpers: <strong className="text-foreground">{prevHelperHours}h</strong> ({prevHelperDays}d)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Overall Cumulative */}
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                📈 Cumulative Total Supply
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Overall total (Previous + Current)</p>
            </div>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(cumulativeSupplyAmount)}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t border-emerald-500/20">
              <span>Fitters: <strong className="text-foreground">{cumulativeFitterHours}h</strong></span>
              <span>•</span>
              <span>Helpers: <strong className="text-foreground">{cumulativeHelperHours}h</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Client Billed Supply Labours Log (Sheet `supply`)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track contract extra manpower. Unbilled entries are editable; previously billed entries are locked into past RA bills.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter View Selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border text-xs gap-1">
              <button
                type="button"
                onClick={() => setFilterView("all")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterView === "all"
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Challans ({rawEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterView("current")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  filterView === "current"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                This Bill Only ({currentEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterView("previous")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  filterView === "previous"
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Past Billed ({previousEntries.length})
              </button>
            </div>

            {currentEntries.length > 0 && (
              <div className="flex items-center gap-2">
                {saveMessage && (
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> {saveMessage}
                  </span>
                )}
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-9"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Progress...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Log Progress
                    </>
                  )}
                </Button>
              </div>
            )}

            <Button onClick={() => setIsAdding(!isAdding)} className="gap-1 h-9">
              <Plus className="h-4 w-4" /> Log Supply Labour
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-md text-xs font-bold flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}

          {/* Add Supply Entry Form */}
          {isAdding && (
            <form
              action={async (formData) => {
                setErrorMessage(null);
                const inputChallan = (formData.get("challanNo") as string || "").trim().toLowerCase();
                if (inputChallan) {
                  const exists = rawEntries.some((e: any) => (e.challanNo || "").trim().toLowerCase() === inputChallan);
                  if (exists) {
                    setErrorMessage(`Duplicate Challan Error! Challan "${formData.get("challanNo")}" already exists for this site.`);
                    return;
                  }
                }

                setIsSubmittingNew(true);
                try {
                  await addSupplyLabourEntryAction(site.id, formData);
                  setIsAdding(false);
                } catch (err: any) {
                  setErrorMessage(err?.message || "Failed to log supply entry.");
                } finally {
                  setIsSubmittingNew(false);
                }
              }}
              className="p-4 bg-muted/40 rounded-lg space-y-4 border mb-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  Log New Extra Supply Labour Challan
                </span>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                  Will be added to Current Bill
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Date *</label>
                  <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Challan No.</label>
                  <Input name="challanNo" placeholder="e.g. PDF-104" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Work Description *</label>
                  <Input name="description" placeholder="40th terrace slab pump line support extra fitter supply" required />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 bg-muted/60 p-3 rounded-md">
                <div className="md:col-span-3 font-semibold text-xs text-blue-500 uppercase tracking-wider">Fitter Details</div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Fitter Count (Nos)</label>
                  <Input name="fitterQty" type="number" step="0.01" placeholder="2" defaultValue="0" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Hours / Day</label>
                  <Input name="fitterHours" type="number" step="0.5" placeholder="8" defaultValue="8" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Fitter Rate (₹)</label>
                  <Input name="fitterRate" type="number" step="1" defaultValue="1100" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 bg-muted/60 p-3 rounded-md">
                <div className="md:col-span-3 font-semibold text-xs text-purple-500 uppercase tracking-wider">Fitter Helper Details</div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Helper Count (Nos)</label>
                  <Input name="helperQty" type="number" step="0.01" placeholder="1" defaultValue="0" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Hours / Day</label>
                  <Input name="helperHours" type="number" step="0.5" placeholder="8" defaultValue="8" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Helper Rate (₹)</label>
                  <Input name="helperRate" type="number" step="1" defaultValue="800" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmittingNew} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  {isSubmittingNew ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Entry...
                    </>
                  ) : (
                    "Save Supply Entry"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Supply Entries Table */}
          {rawEntries.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg shadow-sm">
              <Table>
                <THead className="bg-muted/60">
                  <TR>
                    <TH className="w-32">Date</TH>
                    <TH className="w-20">Challan</TH>
                    <TH className="min-w-[180px]">Work Description</TH>
                    <TH className="w-16 text-center">Fitter</TH>
                    <TH className="w-16 text-center">F. Hrs</TH>
                    <TH className="w-20 text-center">F. Rate</TH>
                    <TH className="w-16 text-center text-blue-500 font-bold">Tot F.Hrs</TH>
                    <TH className="w-24 text-right text-blue-500 font-bold">F. Amt (₹)</TH>
                    <TH className="w-16 text-center">Helper</TH>
                    <TH className="w-16 text-center">H. Hrs</TH>
                    <TH className="w-20 text-center">H. Rate</TH>
                    <TH className="w-16 text-center text-purple-500 font-bold">Tot H.Hrs</TH>
                    <TH className="w-24 text-right text-purple-500 font-bold">H. Amt (₹)</TH>
                    <TH className="w-24 text-right">Total Amt (₹)</TH>
                    <TH className="w-12 text-right">Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {/* ========================================================================= */}
                  {/* SECTION 1: CURRENT / UNBILLED ENTRIES (THIS BILL) */}
                  {/* ========================================================================= */}
                  {(filterView === "all" || filterView === "current") && (
                    <>
                      <TR className="bg-amber-500/15 border-t-2 border-b border-amber-500/30">
                        <TD colSpan={15} className="py-2 px-3 font-bold text-xs text-amber-700 dark:text-amber-400">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              🟡 CURRENT SUPPLY LABOUR ENTRIES (THIS BILL / PENDING) — {currentEntries.length} Challan(s)
                            </span>
                            <span className="font-mono text-xs font-black">
                              Subtotal: {formatINR(currentSupplyAmount)}
                            </span>
                          </div>
                        </TD>
                      </TR>

                      {currentEntries.length === 0 ? (
                        <TR>
                          <TD colSpan={15} className="text-center py-4 text-xs text-muted-foreground italic">
                            No unbilled supply labour entries logged for the current bill yet. Click "Log Supply Labour" to add new challan.
                          </TD>
                        </TR>
                      ) : (
                        currentEntries.map((e: any) => {
                          const st = entriesState[e.id] || {};
                          const fTotalHrs = (st.fitterQty || 0) * (st.fitterHours || 0);
                          const hTotalHrs = (st.helperQty || 0) * (st.helperHours || 0);
                          const fAmt = fTotalHrs > 0 ? (fTotalHrs / 8) * (st.fitterRate || 1100) : (st.fitterQty || 0) * (st.fitterRate || 1100);
                          const hAmt = hTotalHrs > 0 ? (hTotalHrs / 8) * (st.helperRate || 800) : (st.helperQty || 0) * (st.helperRate || 800);

                          return (
                            <TR key={e.id} className="hover:bg-amber-500/5 transition-colors">
                              {/* Date */}
                              <TD>
                                <div className="flex flex-col gap-1">
                                  <Input
                                    type="date"
                                    value={st.date || ""}
                                    onChange={(ev) => handleFieldChange(e.id, "date", ev.target.value)}
                                    className="h-8 text-xs font-mono w-32 border-amber-500/30"
                                  />
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 w-fit">
                                    🟡 This Bill
                                  </span>
                                </div>
                              </TD>
                              {/* Challan No */}
                              <TD>
                                <Input
                                  value={st.challanNo || ""}
                                  onChange={(ev) => handleFieldChange(e.id, "challanNo", ev.target.value)}
                                  className="h-8 text-xs font-mono font-semibold w-20"
                                  placeholder="Challan"
                                />
                              </TD>
                              {/* Description */}
                              <TD>
                                <Input
                                  value={st.description || ""}
                                  onChange={(ev) => handleFieldChange(e.id, "description", ev.target.value)}
                                  className="h-8 text-xs font-medium min-w-[180px]"
                                />
                              </TD>
                              {/* Fitter Qty */}
                              <TD>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={st.fitterQty}
                                  onChange={(ev) => handleFieldChange(e.id, "fitterQty", parseFloat(ev.target.value) || 0)}
                                  className="h-8 text-xs font-mono w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TD>
                              {/* Fitter Hours */}
                              <TD>
                                <Input
                                  type="number"
                                  step="0.5"
                                  value={st.fitterHours}
                                  onChange={(ev) => handleFieldChange(e.id, "fitterHours", parseFloat(ev.target.value) || 0)}
                                  className="h-8 text-xs font-mono w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TD>
                              {/* Fitter Rate */}
                              <TD>
                                <Input
                                  type="number"
                                  step="1"
                                  value={st.fitterRate}
                                  onChange={(ev) => handleFieldChange(e.id, "fitterRate", parseFloat(ev.target.value) || 0)}
                                  className="h-8 text-xs font-mono w-20 text-center text-blue-600 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TD>
                              {/* Calculated Fitter Total Hrs */}
                              <TD className="font-mono text-xs font-semibold text-blue-500 text-center align-middle">
                                {fTotalHrs}h
                              </TD>
                              {/* F. Amt (Calculated) */}
                              <TD className="text-right font-mono text-xs font-bold text-blue-600 align-middle">
                                {formatINR(fAmt)}
                              </TD>
                              {/* Helper Qty */}
                              <TD>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={st.helperQty}
                                  onChange={(ev) => handleFieldChange(e.id, "helperQty", parseFloat(ev.target.value) || 0)}
                                  className="h-8 text-xs font-mono w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TD>
                              {/* Helper Hours */}
                              <TD>
                                <Input
                                  type="number"
                                  step="0.5"
                                  value={st.helperHours}
                                  onChange={(ev) => handleFieldChange(e.id, "helperHours", parseFloat(ev.target.value) || 0)}
                                  className="h-8 text-xs font-mono w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TD>
                              {/* Helper Rate */}
                              <TD>
                                <Input
                                  type="number"
                                  step="1"
                                  value={st.helperRate}
                                  onChange={(ev) => handleFieldChange(e.id, "helperRate", parseFloat(ev.target.value) || 0)}
                                  className="h-8 text-xs font-mono w-20 text-center text-purple-600 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TD>
                              {/* Calculated Helper Total Hrs */}
                              <TD className="font-mono text-xs font-semibold text-purple-500 text-center align-middle">
                                {hTotalHrs}h
                              </TD>
                              {/* H. Amt (Calculated) */}
                              <TD className="text-right font-mono text-xs font-bold text-purple-600 align-middle">
                                {formatINR(hAmt)}
                              </TD>
                              {/* Total Amount */}
                              <TD className="text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400 align-middle">
                                {formatINR(st.totalAmount || 0)}
                              </TD>
                              {/* Actions */}
                              <TD className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => {
                                    if (confirm("Delete this supply entry?")) {
                                      await deleteSupplyLabourEntryAction(site.id, e.id);
                                    }
                                  }}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  title="Delete entry"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TD>
                            </TR>
                          );
                        })
                      )}

                      {/* Current Section Subtotal Summary Row */}
                      {currentEntries.length > 0 && (
                        <TR className="bg-amber-500/10 font-bold border-t border-b text-xs">
                          <TD colSpan={6} className="text-right uppercase text-amber-800 dark:text-amber-300">
                            🟡 SUB-TOTAL (CURRENT THIS BILL)
                          </TD>
                          <TD className="text-center font-mono text-blue-600">{currentFitterHours}h</TD>
                          <TD className="text-right font-mono text-blue-600">{formatINR((currentFitterHours / 8) * 1100)}</TD>
                          <TD colSpan={3}></TD>
                          <TD className="text-center font-mono text-purple-600">{currentHelperHours}h</TD>
                          <TD className="text-right font-mono text-purple-600">{formatINR((currentHelperHours / 8) * 800)}</TD>
                          <TD className="text-right font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                            {formatINR(currentSupplyAmount)}
                          </TD>
                          <TD></TD>
                        </TR>
                      )}
                    </>
                  )}

                  {/* ========================================================================= */}
                  {/* SECTION 2: PREVIOUSLY BILLED ENTRIES (PAST BILLS) */}
                  {/* ========================================================================= */}
                  {(filterView === "all" || filterView === "previous") && (
                    <>
                      <TR className="bg-blue-500/15 border-t-2 border-b border-blue-500/30">
                        <TD colSpan={15} className="py-2 px-3 font-bold text-xs text-blue-700 dark:text-blue-400">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              🔒 PREVIOUSLY BILLED ENTRIES (LOCKED IN PAST RA BILLS) — {previousEntries.length} Challan(s)
                            </span>
                            <span className="font-mono text-xs font-black">
                              Subtotal: {formatINR(prevSupplyAmount)}
                            </span>
                          </div>
                        </TD>
                      </TR>

                      {previousEntries.length === 0 ? (
                        <TR>
                          <TD colSpan={15} className="text-center py-4 text-xs text-muted-foreground italic">
                            No previously billed supply labour entries yet. Once you generate an RA Bill, billed entries will appear here.
                          </TD>
                        </TR>
                      ) : (
                        previousEntries.map((e: any) => {
                          const st = entriesState[e.id] || e;
                          const fTotalHrs = (st.fitterQty || 0) * (st.fitterHours || 0);
                          const hTotalHrs = (st.helperQty || 0) * (st.helperHours || 0);
                          const fAmt = fTotalHrs > 0 ? (fTotalHrs / 8) * (st.fitterRate || 1100) : (st.fitterQty || 0) * (st.fitterRate || 1100);
                          const hAmt = hTotalHrs > 0 ? (hTotalHrs / 8) * (st.helperRate || 800) : (st.helperQty || 0) * (st.helperRate || 800);
                          const billNo = billMap[e.runningBillId] || "Generated Bill";

                          return (
                            <TR key={e.id} className="bg-muted/20 hover:bg-muted/30 opacity-90 transition-colors">
                              {/* Date & Bill Badge */}
                              <TD>
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-mono font-medium">{formatDate(e.date)}</span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30 w-fit">
                                    <Lock className="h-2.5 w-2.5" /> Bill: {billNo}
                                  </span>
                                </div>
                              </TD>
                              {/* Challan No */}
                              <TD>
                                <span className="font-mono text-xs font-bold text-foreground">{st.challanNo || "—"}</span>
                              </TD>
                              {/* Description */}
                              <TD>
                                <span className="text-xs font-medium">{st.description}</span>
                              </TD>
                              {/* Fitter Qty */}
                              <TD className="text-center font-mono text-xs text-muted-foreground">{st.fitterQty}</TD>
                              {/* Fitter Hours */}
                              <TD className="text-center font-mono text-xs text-muted-foreground">{st.fitterHours}h</TD>
                              {/* Fitter Rate */}
                              <TD className="text-center font-mono text-xs text-blue-600">₹{st.fitterRate}</TD>
                              {/* Calculated Fitter Total Hrs */}
                              <TD className="font-mono text-xs font-semibold text-blue-500 text-center align-middle">
                                {fTotalHrs}h
                              </TD>
                              {/* F. Amt */}
                              <TD className="text-right font-mono text-xs font-bold text-blue-600 align-middle">
                                {formatINR(fAmt)}
                              </TD>
                              {/* Helper Qty */}
                              <TD className="text-center font-mono text-xs text-muted-foreground">{st.helperQty}</TD>
                              {/* Helper Hours */}
                              <TD className="text-center font-mono text-xs text-muted-foreground">{st.helperHours}h</TD>
                              {/* Helper Rate */}
                              <TD className="text-center font-mono text-xs text-purple-600">₹{st.helperRate}</TD>
                              {/* Calculated Helper Total Hrs */}
                              <TD className="font-mono text-xs font-semibold text-purple-500 text-center align-middle">
                                {hTotalHrs}h
                              </TD>
                              {/* H. Amt */}
                              <TD className="text-right font-mono text-xs font-bold text-purple-600 align-middle">
                                {formatINR(hAmt)}
                              </TD>
                              {/* Total Amount */}
                              <TD className="text-right font-mono text-xs font-bold text-blue-600 dark:text-blue-400 align-middle">
                                {formatINR(st.totalAmount || 0)}
                              </TD>
                              {/* Actions - Locked */}
                              <TD className="text-right">
                                <span className="text-[11px] text-muted-foreground" title="Billed entries are locked">
                                  🔒
                                </span>
                              </TD>
                            </TR>
                          );
                        })
                      )}

                      {/* Previous Section Subtotal Summary Row */}
                      {previousEntries.length > 0 && (
                        <TR className="bg-blue-500/10 font-bold border-t border-b text-xs">
                          <TD colSpan={6} className="text-right uppercase text-blue-800 dark:text-blue-300">
                            🔒 SUB-TOTAL (PREVIOUSLY BILLED)
                          </TD>
                          <TD className="text-center font-mono text-blue-600">{prevFitterHours}h</TD>
                          <TD className="text-right font-mono text-blue-600">{formatINR((prevFitterHours / 8) * 1100)}</TD>
                          <TD colSpan={3}></TD>
                          <TD className="text-center font-mono text-purple-600">{prevHelperHours}h</TD>
                          <TD className="text-right font-mono text-purple-600">{formatINR((prevHelperHours / 8) * 800)}</TD>
                          <TD className="text-right font-mono font-black text-blue-700 dark:text-blue-300 text-sm">
                            {formatINR(prevSupplyAmount)}
                          </TD>
                          <TD></TD>
                        </TR>
                      )}
                    </>
                  )}

                  {/* ========================================================================= */}
                  {/* GRAND CUMULATIVE TOTAL ROW */}
                  {/* ========================================================================= */}
                  <TR className="bg-emerald-500/15 font-bold border-t-2 border-emerald-500/40 text-sm">
                    <TD colSpan={6} className="text-right uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-extrabold">
                      GRAND CUMULATIVE TOTAL (ALL SUPPLY LABOURS)
                    </TD>
                    <TD className="text-center font-mono text-blue-600 font-bold">{cumulativeFitterHours}h</TD>
                    <TD className="text-right font-mono text-blue-600 font-bold">{formatINR((cumulativeFitterHours / 8) * 1100)}</TD>
                    <TD colSpan={3}></TD>
                    <TD className="text-center font-mono text-purple-600 font-bold">{cumulativeHelperHours}h</TD>
                    <TD className="text-right font-mono text-purple-600 font-bold">{formatINR((cumulativeHelperHours / 8) * 800)}</TD>
                    <TD className="font-mono text-emerald-600 dark:text-emerald-400 text-right text-base font-black">
                      {formatINR(cumulativeSupplyAmount)}
                    </TD>
                    <TD></TD>
                  </TR>
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No extra supply labour entries logged yet. Click "Log Supply Labour" to add challan entries.
            </div>
          )}

          {/* Visual Step-by-step Excel Formula Explanation Box */}
          {rawEntries.length > 0 && (
            <div className="p-4 bg-muted/30 border rounded-lg space-y-3 mt-4 text-xs font-mono">
              <div className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>Excel Step-by-Step Calculation Formula Breakdown</span>
                <Badge variant="outline" className="font-mono text-[10px]">1 Day = 8 Hours</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2 pt-1">
                {/* Current Bill Calculation Box */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-md space-y-1.5">
                  <span className="font-bold text-amber-600 uppercase text-[11px] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> 1. Current This Bill Calculation:
                  </span>
                  <p className="text-muted-foreground">
                    Fitters: {currentFitterHours}h ÷ 8 = <span className="font-bold text-foreground">{currentFitterDays} Nos</span> × ₹1,100 = <span className="font-bold text-blue-600">{formatINR((currentFitterHours / 8) * 1100)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Helpers: {currentHelperHours}h ÷ 8 = <span className="font-bold text-foreground">{currentHelperDays} Nos</span> × ₹800 = <span className="font-bold text-purple-600">{formatINR((currentHelperHours / 8) * 800)}</span>
                  </p>
                  <div className="pt-1 border-t border-amber-500/20 font-bold text-amber-700 dark:text-amber-300 flex justify-between">
                    <span>This Bill Total:</span>
                    <span>{formatINR(currentSupplyAmount)}</span>
                  </div>
                </div>

                {/* Previous Bills Calculation Box */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-md space-y-1.5">
                  <span className="font-bold text-blue-600 uppercase text-[11px] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> 2. Previously Billed Calculation:
                  </span>
                  <p className="text-muted-foreground">
                    Fitters: {prevFitterHours}h ÷ 8 = <span className="font-bold text-foreground">{prevFitterDays} Nos</span> × ₹1,100 = <span className="font-bold text-blue-600">{formatINR((prevFitterHours / 8) * 1100)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Helpers: {prevHelperHours}h ÷ 8 = <span className="font-bold text-foreground">{prevHelperDays} Nos</span> × ₹800 = <span className="font-bold text-purple-600">{formatINR((prevHelperHours / 8) * 800)}</span>
                  </p>
                  <div className="pt-1 border-t border-blue-500/20 font-bold text-blue-700 dark:text-blue-300 flex justify-between">
                    <span>Previous Billed Total:</span>
                    <span>{formatINR(prevSupplyAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                <span>Grand Cumulative Supply Total = Current ({formatINR(currentSupplyAmount)}) + Previous ({formatINR(prevSupplyAmount)})</span>
                <span className="text-base font-black">{formatINR(cumulativeSupplyAmount)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
