import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTasks, useCreateTask, useDistricts, useMarkaziTeamProfiles, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assignmentScope, setAssignmentScope] = useState<"District" | "Markazi">("District");
  const [districtId, setDistrictId] = useState("");
  const [markaziId, setMarkaziId] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [status, setStatus] = useState<"Pending" | "In Progress" | "Completed" | "Delayed">("Pending");
  const [deadline, setDeadline] = useState("");

  const { data: tasks = [], isLoading } = useTasks();
  const { data: districts = [] } = useDistricts();
  const { data: markaziProfiles = [] } = useMarkaziTeamProfiles();
  const createTask = useCreateTask();

  if (isLoading) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const priorityColor = (p: string) => {
    switch (p) { case "Critical": case "High": return "destructive" as const; default: return "secondary" as const; }
  };

  const handleCreateTask = async () => {
    if (!title.trim() || !deadline) {
      toast({ title: "Missing fields", description: "Please enter task title and deadline.", variant: "destructive" });
      return;
    }

    if (assignmentScope === "District" && !districtId) {
      toast({ title: "Missing district", description: "Please select district for district task.", variant: "destructive" });
      return;
    }

    if (assignmentScope === "Markazi" && !markaziId) {
      toast({ title: "Missing Markazi profile", description: "Please select a Markazi coordinator.", variant: "destructive" });
      return;
    }

    const selectedDistrict = districts.find((d) => d.id === districtId);
    const selectedMarkazi = markaziProfiles.find((m) => m.id === markaziId);

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        districtId: assignmentScope === "District" ? selectedDistrict?.id : undefined,
        districtName: assignmentScope === "District" ? selectedDistrict?.name : undefined,
        zone: assignmentScope === "District" ? selectedDistrict?.zone : undefined,
        assignmentScope,
        markaziCoordinatorId: assignmentScope === "Markazi" ? selectedMarkazi?.id : undefined,
        markaziCoordinatorName: assignmentScope === "Markazi" ? selectedMarkazi?.name : undefined,
        markaziDesignation: assignmentScope === "Markazi" ? selectedMarkazi?.designation : undefined,
        startDate: new Date().toISOString().slice(0, 10),
        deadline,
        priority,
        status,
      });
      toast({ title: "Task created", description: "Task assigned successfully." });
      setCreateOpen(false);
      setTitle("");
      setDistrictId("");
      setMarkaziId("");
      setPriority("Medium");
      setStatus("Pending");
      setDeadline("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create task.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} tasks</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add Task</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead><TableHead>Assigned To</TableHead><TableHead>District</TableHead><TableHead>Zone</TableHead>
                  <TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-sm">{t.assignmentScope === "Markazi" ? `${t.markaziCoordinatorName || "Markazi"} (${t.markaziDesignation || ""})` : "District"}</TableCell>
                    <TableCell className="text-sm">{t.districtName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{t.zone || "—"}</TableCell>
                    <TableCell><Badge variant={priorityColor(t.priority)} className="text-[10px]">{t.priority}</Badge></TableCell>
                    <TableCell className="text-sm">{t.deadline}</TableCell>
                    <TableCell><Badge variant={t.status === "Completed" ? "default" : "outline"} className="text-[10px]">{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tasks found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>Assign task to district or Markazi team.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>Task Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Assign To</Label>
                  <Select value={assignmentScope} onValueChange={(v) => setAssignmentScope(v as "District" | "Markazi")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="District">District</SelectItem>
                      <SelectItem value="Markazi">Markazi Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Deadline *</Label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>

              {assignmentScope === "District" ? (
                <div className="space-y-1.5">
                  <Label>District *</Label>
                  <Select value={districtId} onValueChange={setDistrictId}>
                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Markazi Coordinator *</Label>
                  <Select value={markaziId} onValueChange={setMarkaziId}>
                    <SelectTrigger><SelectValue placeholder="Select markazi coordinator" /></SelectTrigger>
                    <SelectContent>
                      {markaziProfiles.filter((m) => m.status === "Active").map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} - {m.designation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as "Low" | "Medium" | "High" | "Critical")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as "Pending" | "In Progress" | "Completed" | "Delayed")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask} disabled={createTask.isPending}>{createTask.isPending ? "Saving..." : "Create Task"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
