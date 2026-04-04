import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useCreateMarkaziTeamProfile,
  useDeleteMarkaziTeamProfile,
  useMarkaziTeamProfiles,
  useUpdateMarkaziTeamProfile,
  LoadingSkeleton,
} from "@/hooks/useFirebaseData";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MarkaziTeamProfile } from "@/types";

export default function MarkaziTeam() {
  const { toast } = useToast();
  const { data: profiles = [], isLoading } = useMarkaziTeamProfiles();
  const createMut = useCreateMarkaziTeamProfile();
  const updateMut = useUpdateMarkaziTeamProfile();
  const deleteMut = useDeleteMarkaziTeamProfile();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MarkaziTeamProfile | null>(null);

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("Media Coordinator");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  if (isLoading) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.designation.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setName("");
    setDesignation("Media Coordinator");
    setStatus("Active");
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (row: MarkaziTeamProfile) => {
    setEditing(row);
    setName(row.name);
    setDesignation(row.designation);
    setStatus(row.status);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !designation.trim()) {
      toast({ title: "Missing fields", description: "Please enter coordinator name and designation.", variant: "destructive" });
      return;
    }

    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, name: name.trim(), designation: designation.trim(), status });
        toast({ title: "Updated", description: "Markazi team profile updated." });
      } else {
        await createMut.mutateAsync({ name: name.trim(), designation: designation.trim(), status });
        toast({ title: "Added", description: "Markazi team profile created." });
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast({ title: "Deleted", description: "Markazi team profile removed." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete profile.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Markazi Team</h1>
            <p className="text-muted-foreground text-sm mt-1">Create markazi coordinator profiles (name + designation).</p>
          </div>
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Markazi Profile</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or designation..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No markazi profiles found</TableCell></TableRow>
                )}
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell><Badge variant={row.status === "Active" ? "default" : "secondary"} className="text-[10px]">{row.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(row.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={(value) => { if (!value) resetForm(); setOpen(value); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Markazi Profile" : "Add Markazi Profile"}</DialogTitle>
            <DialogDescription>Only name and designation are required.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Coordinator Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Abdul Manan" />
            </div>

            <div className="space-y-1.5">
              <Label>Designation *</Label>
              <Select value={designation} onValueChange={setDesignation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Media Coordinator">Media Coordinator</SelectItem>
                  <SelectItem value="Content Coordinator">Content Coordinator</SelectItem>
                  <SelectItem value="Website Coordinator">Website Coordinator</SelectItem>
                  <SelectItem value="Social Media Coordinator">Social Media Coordinator</SelectItem>
                  <SelectItem value="Department Coordinator">Department Coordinator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "Active" | "Inactive")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{createMut.isPending || updateMut.isPending ? "Saving..." : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
