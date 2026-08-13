"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { addBuildingAction, updateBuildingHeaderAction } from "../actions";
import { addTowerWorkItemAction, updateTowerWorkProgressAction, deleteTowerWorkItemAction } from "../bill-actions";
import { Building2, Hammer, Plus, Save, Trash2, Layers, Edit2, CheckCircle2, Percent } from "lucide-react";

export function TowerWorkManager({ site }: { site: any }) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    site.buildings[0]?.id || ""
  );
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBuilding = site.buildings.find((b: any) => b.id === selectedBuildingId) || site.buildings[0];

  // Local state for editing progress quantities/percentages and part amounts
  const [progressState, setProgressState] = useState<Record<string, { name: string; previousQty: number; currentQty: number; previousPct: number; currentPct: number; cumulativePct: number; partAmount: number; previousAmt: number; currentAmt: number; cumulativeAmt: number }>>(() => {
    const initialState: Record<string, { name: string; previousQty: number; currentQty: number; previousPct: number; currentPct: number; cumulativePct: number; partAmount: number; previousAmt: number; currentAmt: number; cumulativeAmt: number }> = {};
    site.buildings.forEach((b: any) => {
      b.workItems?.forEach((item: any) => {
        initialState[item.id] = {
          name: item.name || "",
          previousQty: item.previousQty || 0,
          currentQty: item.currentQty || 0,
          previousPct: item.previousPct || 0,
          currentPct: item.currentPct || 0,
          cumulativePct: item.cumulativePct || 0,
          partAmount: item.partAmount || 0,
          previousAmt: item.previousAmt || 0,
          currentAmt: item.currentAmt || 0,
          cumulativeAmt: item.cumulativeAmt || 0,
        };
      });
    });
    return initialState;
  });

  const handleFieldChange = (itemId: string, field: string, value: string | number) => {
    setProgressState((prev) => {
      const currentItem = prev[itemId] || {};
      let updatedValue = typeof value === "number" && value < 0 ? 0 : value;
      
      // Enforce max 100% combined
      if (field === "currentPct" && typeof updatedValue === "number") {
        const prevPct = currentItem.previousPct || 0;
        if (updatedValue + prevPct > 100) updatedValue = 100 - prevPct;
      }
      if (field === "previousPct" && typeof updatedValue === "number") {
        const currPct = currentItem.currentPct || 0;
        if (updatedValue + currPct > 100) updatedValue = 100 - currPct;
      }
      
      let newState = {
        ...currentItem,
        [field]: updatedValue,
      };

      // Auto-calculate dependent fields if relevant fields change
      if (["partAmount", "previousPct", "currentPct"].includes(field)) {
        const partAmt = newState.partAmount || 0;
        const prevPct = newState.previousPct || 0;
        const currPct = newState.currentPct || 0;

        newState.previousAmt = (prevPct / 100) * partAmt;
        newState.currentAmt = (currPct / 100) * partAmt;
        newState.cumulativePct = prevPct + currPct;
        newState.cumulativeAmt = newState.previousAmt + newState.currentAmt;
      }

      return {
        ...prev,
        [itemId]: newState,
      };
    });
  };

  const handleSaveProgress = async () => {
    if (!selectedBuilding) return;
    
    // Validation check for Part Amounts matching Total Contract Value
    const approxArea = selectedBuilding.approxArea || 0;
    const contractRate = selectedBuilding.contractRate || 0;
    const totalContractValue = approxArea * contractRate;
    const sumPartAmounts = (selectedBuilding.workItems || []).reduce(
      (sum: number, item: any) => sum + (progressState[item.id]?.partAmount || 0),
      0
    );

    if (totalContractValue > 0 && Math.abs(totalContractValue - sumPartAmounts) > 1) {
      const msg = `⚠️ WARNING!\n\nSum of Stage Part Amounts (₹${sumPartAmounts.toLocaleString('en-IN')}) DOES NOT MATCH the Total Tower Contract Value (₹${totalContractValue.toLocaleString('en-IN')}).\n\nThey should be exactly equal (na kam, na jyada).\n\nDo you still want to save?`;
      if (!confirm(msg)) {
        return; // User cancelled
      }
    }

    setIsSaving(true);
    const itemsToUpdate = (selectedBuilding.workItems || []).map((item: any) => {
      const state = progressState[item.id];
      return {
        id: item.id,
        name: state?.name ?? item.name,
        previousQty: state?.previousQty ?? (item.previousQty || 0),
        currentQty: state?.currentQty ?? (item.currentQty || 0),
        previousPct: state?.previousPct ?? (item.previousPct || 0),
        currentPct: state?.currentPct ?? (item.currentPct || 0),
        cumulativePct: state?.cumulativePct ?? (item.cumulativePct || 0),
        partAmount: state?.partAmount ?? (item.partAmount || 0),
        previousAmt: state?.previousAmt ?? (item.previousAmt || 0),
        currentAmt: state?.currentAmt ?? (item.currentAmt || 0),
        cumulativeAmt: state?.cumulativeAmt ?? (item.cumulativeAmt || 0),
      };
    });

    await updateTowerWorkProgressAction(site.id, itemsToUpdate);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Tower / Building Tabs Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {site.buildings.map((b: any) => (
            <Button
              key={b.id}
              variant={b.id === selectedBuildingId ? "default" : "outline"}
              onClick={() => {
                setSelectedBuildingId(b.id);
                setIsEditingHeader(false);
              }}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              {b.name}
              <Badge variant="secondary" className="ml-1 text-xs">
                {b.workItems?.length || 0} items
              </Badge>
            </Button>
          ))}
          <Button variant="outline" onClick={() => setIsAddingBuilding(!isAddingBuilding)} className="gap-1 border-dashed">
            <Plus className="h-4 w-4" /> Add Tower / Wing
          </Button>
        </div>

        {selectedBuilding && (
          <Button onClick={handleSaveProgress} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Tower Progress"}
          </Button>
        )}
      </div>

      {/* Add New Tower Form */}
      {isAddingBuilding && (
        <Card className="bg-muted/40 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Add New Tower / Wing with BUA Area & Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                await addBuildingAction(site.id, formData);
                setIsAddingBuilding(false);
              }}
              className="grid gap-4 md:grid-cols-4 items-end"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tower / Wing Name *</label>
                <Input name="name" placeholder="e.g. Tower S2 Wing, S3 Wing" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Approx BUA Area (Sft / Sq)</label>
                <Input name="approxArea" type="number" step="0.01" placeholder="e.g. 184464 or 314554" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Contract Rate (₹ / Sft)</label>
                <Input name="contractRate" type="number" step="0.01" placeholder="e.g. 49.60 or 53.00" />
              </div>
              <div>
                <Button type="submit" className="w-full">Create Tower</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedBuilding ? (
        (() => {
          const approxArea = selectedBuilding.approxArea || 0;
          const contractRate = selectedBuilding.contractRate || 0;
          const totalContractValue = approxArea * contractRate;

          const sumPartAmounts = (selectedBuilding.workItems || []).reduce(
            (sum: number, item: any) => sum + (progressState[item.id]?.partAmount || 0),
            0
          );
          
          const isAddingAllowed = totalContractValue > 0 && sumPartAmounts < totalContractValue;

          return (
            <div className="space-y-6">
              {/* TOWER CONTRACT VALUE HEADER CARD */}
              <Card className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-indigo-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4 border-b border-indigo-500/20 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-400" />
                        <h2 className="text-xl font-bold tracking-tight">{selectedBuilding.name}</h2>
                        <Badge variant="outline" className="text-indigo-300 border-indigo-400/40">
                          CIVIL WORK (BUA)
                        </Badge>
                      </div>
                      <p className="text-xs text-indigo-200/80 mt-1">
                        Overall Tower Built-up Area (Sft/Sq) & Contract Rate (Exact PDF Format Matching)
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingHeader(!isEditingHeader)}
                      className="gap-1 border-indigo-400/40 text-indigo-200 hover:bg-indigo-500/20"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      {isEditingHeader ? "Close Edit" : "Edit BUA Area & Rate"}
                    </Button>
                  </div>

                  {/* Header Edit Form */}
                  {isEditingHeader ? (
                    <form
                      action={async (formData) => {
                        await updateBuildingHeaderAction(site.id, selectedBuilding.id, formData);
                        setIsEditingHeader(false);
                      }}
                      className="grid gap-3 md:grid-cols-3 bg-white/10 p-4 rounded-lg items-end mb-4 border border-indigo-400/30"
                    >
                      <div>
                        <label className="text-xs font-medium text-indigo-200 block mb-1">Approximate BUA Area (Sft / Sq) *</label>
                        <Input name="approxArea" type="number" step="0.01" defaultValue={approxArea} onFocus={(e) => e.target.select()} required className="bg-slate-900 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-indigo-200 block mb-1">Contract Rate (₹ / Sft) *</label>
                        <Input name="contractRate" type="number" step="0.01" defaultValue={contractRate} onFocus={(e) => e.target.select()} required className="bg-slate-900 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                      <div>
                        <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600">
                          Save Header Values
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {/* Summary Metric Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-white/5 p-3.5 rounded-lg border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 font-medium">Approximate Area (BUA)</p>
                      <p className="text-2xl font-bold font-mono mt-1">{approxArea.toLocaleString()} <span className="text-sm font-normal text-indigo-300">Sft</span></p>
                    </div>

                    <div className="bg-white/5 p-3.5 rounded-lg border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 font-medium">Contract Rate (@ ₹)</p>
                      <p className="text-2xl font-bold font-mono mt-1">₹{contractRate} <span className="text-sm font-normal text-indigo-300">/ Sft</span></p>
                    </div>

                    <div className="bg-indigo-500/20 p-3.5 rounded-lg border border-indigo-400/40">
                      <p className="text-xs text-indigo-200 font-medium">Total Tower Contract Value</p>
                      <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{formatINR(totalContractValue)}</p>
                    </div>

                    <div className="bg-white/5 p-3.5 rounded-lg border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 font-medium">Sum of Stage Part Amounts</p>
                      <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{formatINR(sumPartAmounts)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          {/* Selected Tower Work Items Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  {selectedBuilding.name} - Work Items & Expense Tracker (Matching PDF Format)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Track allocated stage Part Amounts (₹), Previous Work Done (%), This Bill Work Done (%), and Cumulative Amounts.
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setIsAddingItem(!isAddingItem)} 
                disabled={!isAddingAllowed}
                title={!isAddingAllowed ? "Total contract value reached or not set. Please increase BUA Area/Rate to add more items." : ""}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Add Work Item / Stage
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Work Item Form */}
              {isAddingItem && (
                <form
                  action={async (formData) => {
                    const newPartAmt = parseFloat((formData.get("partAmount") as string) || "0");
                    if (sumPartAmounts + newPartAmt > totalContractValue + 1) {
                        alert(`❌ Cannot add item!\n\nAdding ₹${newPartAmt.toLocaleString('en-IN')} will exceed the Total Tower Contract Value.\nMaximum allowed: ₹${(totalContractValue - sumPartAmounts).toLocaleString('en-IN')}`);
                        return;
                    }
                    await addTowerWorkItemAction(site.id, selectedBuilding.id, formData);
                    setIsAddingItem(false);
                  }}
                  className="p-4 bg-muted/40 rounded-lg grid gap-3 md:grid-cols-3 items-end mb-4 border"
                >
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Stage / Floor Particulars *</label>
                    <Input name="name" placeholder="e.g. 40th Terrace Slab, 16th Slab" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Part Amount (₹)</label>
                    <Input name="partAmount" type="number" step="0.01" placeholder="e.g. 50000" onFocus={(e) => e.target.select()} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddingItem(false)}>Cancel</Button>
                    <Button type="submit">Save Stage Item</Button>
                  </div>
                </form>
              )}

              {/* Work Items Table */}
              {selectedBuilding.workItems?.length > 0 ? (
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <THead className="bg-muted/50">
                      <TR>
                        <TH className="w-12">#</TH>
                        <TH>Particulars of Item</TH>
                        <TH className="text-right">Part Amount (₹)</TH>
                        <TH className="text-center">Previous Qty (%)</TH>
                        <TH className="text-center">This Bill Qty (%)</TH>
                        <TH className="text-center">Cumulative Qty (%)</TH>
                        <TH className="text-right">Previous Amt (₹)</TH>
                        <TH className="text-right">This Bill Amt (₹)</TH>
                        <TH className="text-right">Cumulative Amt (₹)</TH>
                        <TH className="text-right w-16">Actions</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {selectedBuilding.workItems.map((item: any, idx: number) => {
                        const state = progressState[item.id] || {};
                        const partAmt = state.partAmount || 0;
                        const prevPct = state.previousPct || 0;
                        const currPct = state.currentPct || 0;
                        const cumPct = state.cumulativePct || 0;
                        const prevA = state.previousAmt || 0;
                        const currA = state.currentAmt || 0;
                        const cumA = state.cumulativeAmt || 0;
                        const name = state.name || "";

                        return (
                          <TR key={item.id}>
                            <TD className="font-mono text-xs">{idx + 1}</TD>
                            <TD>
                              <Input
                                value={name}
                                onChange={(e) => handleFieldChange(item.id, "name", e.target.value)}
                                className="h-8 text-xs font-medium min-w-[150px]"
                              />
                            </TD>
                            <TD className="text-right">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={partAmt}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/^0+(?=\d)/, '');
                                  if (val === '') val = '0';
                                  handleFieldChange(item.id, "partAmount", parseFloat(val));
                                }}
                                className="w-28 h-8 font-mono text-xs text-right font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </TD>
                            <TD className="text-center">
                              {(() => {
                                const isBilledPrev = (item.previousPct || 0) > 0 || (item.previousAmt || 0) > 0;
                                return (
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <div className="flex items-center justify-center gap-1">
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={prevPct}
                                        disabled={isBilledPrev}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                          let val = e.target.value.replace(/^0+(?=\d)/, '');
                                          if (val === '') val = '0';
                                          handleFieldChange(item.id, "previousPct", parseFloat(val));
                                        }}
                                        className="w-16 h-8 font-mono text-xs text-center disabled:bg-muted/70 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                    {isBilledPrev && (
                                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
                                        🔒 Billed
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </TD>
                            <TD className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={currPct}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/^0+(?=\d)/, '');
                                    if (val === '') val = '0';
                                    handleFieldChange(item.id, "currentPct", parseFloat(val));
                                  }}
                                  className="w-16 h-8 font-mono text-xs text-center bg-emerald-500/10 border-emerald-500/30 font-bold text-emerald-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-xs text-emerald-600 font-bold">%</span>
                              </div>
                            </TD>
                            <TD className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="1"
                                  value={cumPct}
                                  disabled
                                  className="w-16 h-8 font-mono text-xs text-center font-semibold bg-muted/50 cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-xs font-semibold">%</span>
                              </div>
                            </TD>
                            <TD className="text-right">
                              <Input
                                type="text"
                                value={prevA ? prevA.toLocaleString('en-IN') : '0'}
                                disabled
                                className="w-28 h-8 font-mono text-xs text-right bg-muted/50 cursor-not-allowed"
                              />
                            </TD>
                            <TD className="text-right">
                              <Input
                                type="text"
                                value={currA ? currA.toLocaleString('en-IN') : '0'}
                                disabled
                                className="w-28 h-8 font-mono text-xs text-right font-bold text-emerald-600 bg-emerald-500/5 border-emerald-500/30 cursor-not-allowed"
                              />
                            </TD>
                            <TD className="text-right">
                              <Input
                                type="text"
                                value={cumA ? cumA.toLocaleString('en-IN') : '0'}
                                disabled
                                className="w-28 h-8 font-mono text-xs text-right font-bold bg-muted/50 cursor-not-allowed"
                              />
                            </TD>
                            <TD className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (confirm(`Delete ${name}?`)) {
                                    await deleteTowerWorkItemAction(site.id, item.id);
                                  }
                                }}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TD>
                          </TR>
                        );
                      })}

                      {/* Total Summary Row */}
                      {(() => {
                        const items = selectedBuilding.workItems;
                        let totPartA = 0;
                        let totPrevPct = 0;
                        let totCurrPct = 0;
                        let totCumPct = 0;
                        let totPrevA = 0;
                        let totCurrA = 0;
                        let totCumA = 0;
                        items.forEach((item: any) => {
                          const state = progressState[item.id] || {};
                          totPartA += state.partAmount || 0;
                          totPrevPct += state.previousPct || 0;
                          totCurrPct += state.currentPct || 0;
                          totCumPct += state.cumulativePct || 0;
                          totPrevA += state.previousAmt || 0;
                          totCurrA += state.currentAmt || 0;
                          totCumA += state.cumulativeAmt || 0;
                        });

                        return (
                          <TR className="bg-muted/80 font-bold border-t-2">
                            <TD colSpan={2} className="text-right uppercase tracking-wider text-xs">TOTAL AMOUNT ({selectedBuilding.name})</TD>
                            <TD className="font-mono text-right text-blue-500">{formatINR(totPartA)}</TD>
                            <TD className="text-center font-mono text-xs">{totPrevPct}%</TD>
                            <TD className="text-center font-mono text-xs text-emerald-500 font-bold">{totCurrPct}%</TD>
                            <TD className="text-center font-mono text-xs">{totCumPct}%</TD>
                            <TD className="font-mono text-right">{formatINR(totPrevA)}</TD>
                            <TD className="font-mono text-emerald-500 text-right">{formatINR(totCurrA)}</TD>
                            <TD className="font-mono text-right">{formatINR(totCumA)}</TD>
                            <TD></TD>
                          </TR>
                        );
                      })()}
                    </TBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Hammer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No stage items added for this tower yet. Click "Add Work Item / Stage" to add floor stages.
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          );
        })()
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No Towers or Buildings Created</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first tower (e.g. S2 Wing, S3 Wing) with its BUA Area & Rate to start tracking.
            </p>
            <Button onClick={() => setIsAddingBuilding(true)}>Add Tower / Wing</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
