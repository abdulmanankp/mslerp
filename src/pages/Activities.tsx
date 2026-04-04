import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Activity } from "@/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Activities() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState("");

  const { data: activities = [], isLoading } = useActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const { toast } = useToast();

  const openEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setName(activity.name);
    setDescription(activity.description || "");
    setCategory(activity.category || "General");
    setStatus(activity.status);
    setEditOpen(true);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("General");
    setStatus("Active");
  };

  const handleCreateActivity = async () => {
    if (!name.trim()) {
      toast({ title: "Missing activity name", description: "Please enter an activity name.", variant: "destructive" });
      return;
    }

    try {
      await createActivity.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category,
        status,
      });
      setOpen(false);
      resetForm();
      toast({ title: "Activity added", description: "Activity is now available in meeting reports and analytics." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create activity.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    }
  };

  const handleUpdateActivity = async () => {
    if (!editingId || !name.trim()) {
      toast({ title: "Missing fields", description: "Activity name is required.", variant: "destructive" });
      return;
    }
    try {
      await updateActivity.mutateAsync({
        id: editingId,
        name: name.trim(),
        description: description.trim(),
        category,
        status,
      });
      setEditOpen(false);
      setEditingId("");
      resetForm();
      toast({ title: "Activity updated", description: "Activity changes saved successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update activity.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    const ok = window.confirm(`Delete activity '${activity.name}'?`);
    if (!ok) return;
    try {
      await deleteActivity.mutateAsync(activity.id);
      toast({ title: "Activity deleted", description: "Activity removed successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete activity.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    }
  };

  if (isLoading) return <AppLayout><LoadingSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Activities</h1>
            <p className="text-muted-foreground text-sm mt-1">Define organizational activities</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Activity</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Activity</DialogTitle>
                <DialogDescription>Create activity and link it for meetings, goals, and analytics.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Activity Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quran Class" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief activity details" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="General" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as "Active" | "Inactive") }>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreateActivity} disabled={createActivity.isPending}>
                  {createActivity.isPending ? "Saving..." : "Save Activity"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{a.description}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{a.category}</Badge></TableCell>
                    <TableCell><Badge variant={a.status === "Active" ? "default" : "secondary"} className="text-[10px]">{a.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteActivity(a)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No activities defined yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
              <DialogDescription>Update activity details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Activity Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as "Active" | "Inactive") }>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleUpdateActivity} disabled={updateActivity.isPending}>
                {updateActivity.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
