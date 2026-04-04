import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGoals, useZones, useDistricts, useActivities, useCreateGoal, useUpdateGoal, useDeleteGoal, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Goal } from "@/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Goals() {
  const [monthFilter, setMonthFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [goalMonth, setGoalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [districtId, setDistrictId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState("");
  const [goalStatus, setGoalStatus] = useState<Goal["status"]>("Pending");
  const [completedNumber, setCompletedNumber] = useState("");

  const { data: goals = [], isLoading: gL } = useGoals();
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: activities = [], isLoading: aL } = useActivities();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();

  if (gL || zL || dL || aL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const filtered = goals.filter(g => {
    if (monthFilter !== "all" && g.month !== monthFilter) return false;
    if (zoneFilter !== "all" && g.zone !== zoneFilter) return false;
    return true;
  });

  const months = [...new Set(goals.map(g => g.month))];

  const handleAssignGoal = async () => {
    const district = districts.find((d) => d.id === districtId);
    const activity = activities.find((a) => a.id === activityId);
    const target = Number(targetNumber);

    if (!district || !activity || !goalMonth || !Number.isFinite(target) || target <= 0) {
      toast({ title: "Missing fields", description: "Select district, activity, month and valid target number.", variant: "destructive" });
      return;
    }

    try {
      await createGoal.mutateAsync({
        month: goalMonth,
        zone: district.zone,
        districtId: district.id,
        districtName: district.name,
        activityId: activity.id,
        activityName: activity.name,
        targetNumber: target,
        completedNumber: 0,
        notes: notes.trim() || undefined,
        status: "Pending",
      });

      setOpen(false);
      setDistrictId("");
      setActivityId("");
      setTargetNumber("");
      setNotes("");
      setGoalStatus("Pending");
      setCompletedNumber("");
      toast({ title: "Goal assigned", description: "Goal is now linked for meeting reports and analytics." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign goal.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    }
  };

  const openEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setGoalMonth(goal.month);
    setDistrictId(goal.districtId);
    setActivityId(goal.activityId);
    setTargetNumber(String(goal.targetNumber || ""));
    setCompletedNumber(String(goal.completedNumber ?? ""));
    setNotes(goal.notes || "");
    setGoalStatus((goal.status || "Pending") as Goal["status"]);
    setEditOpen(true);
  };

  const handleUpdateGoal = async () => {
    const district = districts.find((d) => d.id === districtId);
    const activity = activities.find((a) => a.id === activityId);
    const target = Number(targetNumber);
    const completed = completedNumber === "" ? undefined : Number(completedNumber);

    if (!editingGoalId || !district || !activity || !goalMonth || !Number.isFinite(target) || target <= 0) {
      toast({ title: "Missing fields", description: "Please complete required fields.", variant: "destructive" });
      return;
    }

    try {
      await updateGoal.mutateAsync({
        id: editingGoalId,
        month: goalMonth,
        zone: district.zone,
        districtId: district.id,
        districtName: district.name,
        activityId: activity.id,
        activityName: activity.name,
        targetNumber: target,
        completedNumber: Number.isFinite(completed as number) ? completed : undefined,
        status: goalStatus,
        notes: notes.trim() || undefined,
      });

      setEditOpen(false);
      setEditingGoalId("");
      toast({ title: "Goal updated", description: "Goal updated successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update goal.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    const ok = window.confirm(`Delete goal for '${goal.activityName}' in '${goal.districtName}'?`);
    if (!ok) return;
    try {
      await deleteGoal.mutateAsync(goal.id);
      toast({ title: "Goal deleted", description: "Goal removed successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete goal.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Goals</h1>
            <p className="text-muted-foreground text-sm mt-1">Assign monthly activity goals to districts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Assign Goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Goal</DialogTitle>
                <DialogDescription>Create monthly goal linked with district, meeting report, and analytics.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Month</Label>
                  <Input type="month" value={goalMonth} onChange={(e) => setGoalMonth(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">District</Label>
                  <Select value={districtId} onValueChange={setDistrictId}>
                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Activity</Label>
                  <Select value={activityId} onValueChange={setActivityId}>
                    <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                    <SelectContent>
                      {activities.filter((activity) => activity.status === "Active").map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Target Number</Label>
                  <Input type="number" min={1} value={targetNumber} onChange={(e) => setTargetNumber(e.target.value)} placeholder="e.g. 20" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Notes (Optional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes" />
                </div>

                <Button className="w-full" onClick={handleAssignGoal} disabled={createGoal.isPending}>
                  {createGoal.isPending ? "Saving..." : "Save Goal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead><TableHead>District</TableHead><TableHead>Zone</TableHead>
                  <TableHead>Month</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.activityName}</TableCell>
                    <TableCell>{g.districtName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{g.zone}</TableCell>
                    <TableCell>{g.month}</TableCell>
                    <TableCell className="font-mono">{g.targetNumber}</TableCell>
                    <TableCell className="font-mono">{g.completedNumber ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGoal(g)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No goals found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
              <DialogDescription>Update goal details and progress.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Month</Label>
                <Input type="month" value={goalMonth} onChange={(e) => setGoalMonth(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">District</Label>
                <Select value={districtId} onValueChange={setDistrictId}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Activity</Label>
                <Select value={activityId} onValueChange={setActivityId}>
                  <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                  <SelectContent>
                    {activities.map((activity) => (
                      <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Target Number</Label>
                  <Input type="number" min={1} value={targetNumber} onChange={(e) => setTargetNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Completed Number</Label>
                  <Input type="number" min={0} value={completedNumber} onChange={(e) => setCompletedNumber(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={goalStatus || "Pending"} onValueChange={(value) => setGoalStatus(value as Goal["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partially Completed">Partially Completed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Not Completed">Not Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>

              <Button className="w-full" onClick={handleUpdateGoal} disabled={updateGoal.isPending}>
                {updateGoal.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
