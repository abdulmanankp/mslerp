import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCoordinators, useCreateCoordinator, useUpdateCoordinator, useDeleteCoordinator, useZones, useDistricts, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { Search, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Coordinator, ZoneName, CoordinatorType } from "@/types";

export default function Coordinators() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: coordinators = [], isLoading: cL } = useCoordinators();
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const createMut = useCreateCoordinator();
  const updateMut = useUpdateCoordinator();
  const deleteMut = useDeleteCoordinator();

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEducation, setFormEducation] = useState("");
  const [formZone, setFormZone] = useState<ZoneName | "">("");
  const [formDistrictId, setFormDistrictId] = useState("");
  const [formJoiningDate, setFormJoiningDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Expired">("Active");
  const [formCoordinatorType, setFormCoordinatorType] = useState<CoordinatorType>("District");

  if (cL || zL || dL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const filtered = coordinators.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (zoneFilter !== "all" && c.zone !== zoneFilter) return false;
    return true;
  });

  const zoneDistricts = formZone ? districts.filter(d => d.zone === formZone) : [];

  const resetForm = () => {
    setFormName(""); setFormPhone(""); setFormAddress(""); setFormEducation("");
    setFormZone(""); setFormDistrictId(""); setFormJoiningDate(""); setFormEndDate("");
    setFormStatus("Active"); setFormCoordinatorType("District"); setEditingCoordinator(null);
  };

  const openAddDialog = () => { resetForm(); setDialogOpen(true); };

  const openEditDialog = (c: Coordinator) => {
    setEditingCoordinator(c);
    setFormName(c.name); setFormPhone(c.phone); setFormAddress(c.address);
    setFormEducation(c.education || ""); setFormZone(c.zone); setFormDistrictId(c.districtId || "");
    setFormJoiningDate(c.joiningDate); setFormEndDate(c.endDate || ""); setFormStatus(c.status);
    setFormCoordinatorType(c.coordinatorType || "District");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPhone || !formZone || !formJoiningDate) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (formCoordinatorType === "District" && !formDistrictId) {
      toast({ title: "Missing district", description: "Please select a district for District Coordinator.", variant: "destructive" });
      return;
    }
    const district = formDistrictId ? districts.find(d => d.id === formDistrictId) : undefined;
    const payload = {
      name: formName, phone: formPhone, address: formAddress,
      education: formEducation || undefined, coordinatorType: formCoordinatorType,
      zone: formZone as ZoneName,
      districtId: formCoordinatorType === "District" ? formDistrictId : undefined,
      districtName: formCoordinatorType === "District" ? (district?.name || "") : undefined,
      joiningDate: formJoiningDate, endDate: formEndDate || undefined, status: formStatus,
      totalActivities: 0, attendanceRate: 0,
    };

    try {
      if (editingCoordinator) {
        await updateMut.mutateAsync({ id: editingCoordinator.id, ...payload });
        toast({ title: "Coordinator updated", description: `${formName} has been updated successfully.` });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: "Coordinator added", description: `${formName} has been added successfully.` });
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const coord = coordinators.find(c => c.id === deletingId);
    try {
      await deleteMut.mutateAsync(deletingId);
      toast({ title: "Coordinator deleted", description: `${coord?.name} has been removed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleToggleStatus = async (c: Coordinator) => {
    const newStatus = c.status === "Active" ? "Expired" : "Active";
    try {
      await updateMut.mutateAsync({
        id: c.id, status: newStatus,
        endDate: newStatus === "Expired" ? new Date().toISOString().split("T")[0] : undefined,
      });
      toast({ title: `Coordinator ${newStatus.toLowerCase()}`, description: `${c.name} is now ${newStatus}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const activeCount = coordinators.filter(c => c.status === "Active").length;
  const expiredCount = coordinators.filter(c => c.status === "Expired").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Coordinators</h1>
            <p className="text-muted-foreground text-sm mt-1">{coordinators.length} total · {activeCount} active · {expiredCount} expired</p>
          </div>
          <Button className="gap-2" onClick={openAddDialog}><Plus className="h-4 w-4" /> Add Coordinator</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or phone..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                 <TableRow>
                   <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Type</TableHead><TableHead>Zone</TableHead><TableHead>District</TableHead>
                   <TableHead>Joined</TableHead><TableHead>End Date</TableHead>
                   <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {filtered.length === 0 ? (
                   <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No coordinators found</TableCell></TableRow>
                 ) : filtered.map(c => (
                   <TableRow key={c.id}>
                     <TableCell className="font-medium">{c.name}</TableCell>
                     <TableCell className="text-sm"><Badge variant={c.coordinatorType === "Zonal" ? "default" : "outline"} className="text-[10px]">{c.coordinatorType || "District"}</Badge></TableCell>
                     <TableCell className="text-muted-foreground text-sm">{c.zone}</TableCell>
                     <TableCell className="text-sm">{c.districtName || "—"}</TableCell>
                     <TableCell className="text-sm">{c.phone}</TableCell>
                     <TableCell className="text-sm">{c.joiningDate}</TableCell>
                     <TableCell className="text-sm">{c.endDate || "—"}</TableCell>
                     <TableCell><Badge variant={c.status === "Active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleStatus(c)} title={c.status === "Active" ? "Mark Expired" : "Reactivate"}>
                          {c.status === "Active" ? <UserX className="h-3.5 w-3.5 text-muted-foreground" /> : <UserCheck className="h-3.5 w-3.5 text-primary" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(c)} title="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => { setDeletingId(c.id); setDeleteDialogOpen(true); }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoordinator ? "Edit Coordinator" : "Add New Coordinator"}</DialogTitle>
            <DialogDescription>{editingCoordinator ? "Update the coordinator's information below." : "Fill in the details to add a new coordinator."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" /></div>
              <div className="space-y-1.5"><Label>Phone *</Label><Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="03xx-xxxxxxx" /></div>
            </div>
            <div className="space-y-1.5"><Label>Address</Label><Input value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="Full address" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Education</Label><Input value={formEducation} onChange={e => setFormEducation(e.target.value)} placeholder="e.g. BS Computer Science" /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as "Active" | "Expired")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Expired">Expired</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Zone *</Label>
                <Select value={formZone} onValueChange={(v) => { setFormZone(v as ZoneName); setFormDistrictId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                  <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>District *</Label>
                <Select value={formDistrictId} onValueChange={setFormDistrictId} disabled={!formZone}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>{zoneDistricts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Joining Date *</Label><Input type="date" value={formJoiningDate} onChange={e => setFormJoiningDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : editingCoordinator ? "Update" : "Add Coordinator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coordinator?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The coordinator will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
