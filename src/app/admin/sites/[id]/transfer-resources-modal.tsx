"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { transferLabourAction, transferSupervisorAction } from "../transfer-actions";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function TransferResourcesModal({
  siteId,
  allSites,
  currentLabours,
  currentSupervisors,
}: {
  siteId: string;
  allSites: any[];
  currentLabours: any[];
  currentSupervisors: any[];
}) {
  const [open, setOpen] = useState(false);
  const [transferType, setTransferType] = useState<"LABOUR" | "SUPERVISOR">("LABOUR");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const otherSites = allSites.filter(s => s.id !== siteId);

  // Labour transfer state
  const [selectedLabourId, setSelectedLabourId] = useState("");
  const [labourTargetSiteId, setLabourTargetSiteId] = useState("");
  const [labourTargetCategoryId, setLabourTargetCategoryId] = useState("");
  const [labourTargetSupervisorId, setLabourTargetSupervisorId] = useState("");
  const [newDailyWage, setNewDailyWage] = useState("");
  const [newOvertimeRate, setNewOvertimeRate] = useState("");

  // Supervisor transfer state
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [supervisorTargetSiteId, setSupervisorTargetSiteId] = useState("");
  const [selectedLaboursToTransfer, setSelectedLaboursToTransfer] = useState<{
    labourId: string;
    toLabourCategoryId: string;
  }[]>([]);

  const handleLabourTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabourId || !labourTargetSiteId || !labourTargetCategoryId) return;

    setLoading(true);
    const res = await transferLabourAction({
      labourId: selectedLabourId,
      fromSiteId: siteId,
      toSiteId: labourTargetSiteId,
      toLabourCategoryId: labourTargetCategoryId,
      toSupervisorId: labourTargetSupervisorId || undefined,
      newDailyWage: newDailyWage ? parseFloat(newDailyWage) : undefined,
      newOvertimeRate: newOvertimeRate ? parseFloat(newOvertimeRate) : undefined,
    });

    setLoading(false);
    if (res.success) {
      toast.success("Worker transferred successfully!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Transfer failed", { description: res.error });
    }
  };

  const handleSupervisorTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisorId || !supervisorTargetSiteId) return;

    setLoading(true);
    const res = await transferSupervisorAction({
      supervisorId: selectedSupervisorId,
      fromSiteId: siteId,
      toSiteId: supervisorTargetSiteId,
      laboursToTransfer: selectedLaboursToTransfer.map(lt => ({
        labourId: lt.labourId,
        toLabourCategoryId: lt.toLabourCategoryId,
      })),
    });

    setLoading(false);
    if (res.success) {
      toast.success("Supervisor and team transferred successfully!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Transfer failed", { description: res.error });
    }
  };

  const selectedTargetSite = otherSites.find(s => s.id === (transferType === "LABOUR" ? labourTargetSiteId : supervisorTargetSiteId));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 shrink-0">
          <ArrowRightLeft className="h-4 w-4" /> Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transfer Resources</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4 border-b pb-4">
          <Button 
            variant={transferType === "LABOUR" ? "default" : "secondary"} 
            onClick={() => setTransferType("LABOUR")}
          >
            Transfer Labour
          </Button>
          <Button 
            variant={transferType === "SUPERVISOR" ? "default" : "secondary"} 
            onClick={() => setTransferType("SUPERVISOR")}
          >
            Transfer Supervisor & Labours
          </Button>
        </div>

        {transferType === "LABOUR" && (
          <form onSubmit={handleLabourTransfer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Select Labour *</label>
                <select 
                  className="w-full h-10 rounded-md border bg-background text-foreground px-3" 
                  value={selectedLabourId} 
                  onChange={e => {
                    setSelectedLabourId(e.target.value);
                    const l = currentLabours.find(x => x.id === e.target.value);
                    if (l) {
                      setNewDailyWage(l.dailyWage?.toString() || "");
                      setNewOvertimeRate(l.overtimeRate?.toString() || "");
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {currentLabours.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">To Site *</label>
                <select 
                  className="w-full h-10 rounded-md border bg-background text-foreground px-3" 
                  value={labourTargetSiteId} 
                  onChange={e => {
                    setLabourTargetSiteId(e.target.value);
                    setLabourTargetCategoryId("");
                    setLabourTargetSupervisorId("");
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {otherSites.map(s => (
                    <option key={s.id} value={s.id}>{s.projectName}</option>
                  ))}
                </select>
              </div>

              {labourTargetSiteId && selectedTargetSite && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">New Labour Category *</label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background text-foreground px-3" 
                      value={labourTargetCategoryId} 
                      onChange={e => setLabourTargetCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select...</option>
                      {selectedTargetSite.labourCategories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Assign Supervisor (Optional)</label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background text-foreground px-3" 
                      value={labourTargetSupervisorId} 
                      onChange={e => setLabourTargetSupervisorId(e.target.value)}
                    >
                      <option value="">None</option>
                      {selectedTargetSite.supervisors.map((s: any) => (
                        <option key={s.supervisorId} value={s.supervisorId}>{s.supervisor.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">New 1 Hajari Rate (₹)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={newDailyWage} 
                  onChange={e => setNewDailyWage(e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">New OT Rate (₹)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={newOvertimeRate} 
                  onChange={e => setNewOvertimeRate(e.target.value)} 
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Transferring..." : "Transfer Labour"}
            </Button>
          </form>
        )}

        {transferType === "SUPERVISOR" && (
          <form onSubmit={handleSupervisorTransfer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Select Supervisor *</label>
                <select 
                  className="w-full h-10 rounded-md border bg-background text-foreground px-3" 
                  value={selectedSupervisorId} 
                  onChange={e => setSelectedSupervisorId(e.target.value)}
                  required
                >
                  <option value="">Select...</option>
                  {currentSupervisors.map((s, idx) => (
                    <option key={`${s.supervisorId}-${idx}`} value={s.supervisorId}>{s.supervisor.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">To Site *</label>
                <select 
                  className="w-full h-10 rounded-md border bg-background text-foreground px-3" 
                  value={supervisorTargetSiteId} 
                  onChange={e => setSupervisorTargetSiteId(e.target.value)}
                  required
                >
                  <option value="">Select...</option>
                  {otherSites.map(s => (
                    <option key={s.id} value={s.id}>{s.projectName}</option>
                  ))}
                </select>
              </div>
            </div>

            {supervisorTargetSiteId && selectedTargetSite && (
              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium">Select Labours to Transfer with Supervisor</label>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                  {currentLabours.map(l => {
                    const isSelected = selectedLaboursToTransfer.some(x => x.labourId === l.id);
                    return (
                      <div key={l.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLaboursToTransfer([...selectedLaboursToTransfer, { labourId: l.id, toLabourCategoryId: "" }]);
                            } else {
                              setSelectedLaboursToTransfer(selectedLaboursToTransfer.filter(x => x.labourId !== l.id));
                            }
                          }}
                        />
                        <span className="flex-1 text-sm font-medium">{l.name}</span>
                        {isSelected && (
                          <select
                            className="text-sm border rounded p-1 w-48 bg-background text-foreground"
                            required
                            value={selectedLaboursToTransfer.find(x => x.labourId === l.id)?.toLabourCategoryId || ""}
                            onChange={(e) => {
                              setSelectedLaboursToTransfer(prev => 
                                prev.map(x => x.labourId === l.id ? { ...x, toLabourCategoryId: e.target.value } : x)
                              );
                            }}
                          >
                            <option value="">Select Category...</option>
                            {selectedTargetSite.labourCategories.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                  {currentLabours.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">No labours available on this site.</p>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Transferring..." : "Transfer Supervisor"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
