import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Users as UsersIcon, Shield } from "lucide-react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { firestore } from "@/integrations/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";

type RoleKey = "admin" | "moderator" | "user" | "university_manager";

interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  designation: string;
  status: "Active" | "Inactive";
  role: RoleKey;
  permissions: {
    appAccess: boolean;
    canAddDistrictData: boolean;
    canEditDistrictData: boolean;
    canCreateMeetings: boolean;
    canManageUsers: boolean;
    canCreateUniversityMeetings: boolean;
    canManageUniversityRecords: boolean;
    canManageUniversityCampaigns: boolean;
    canMonitorUniversityAnalytics: boolean;
    canExportUniversityReports: boolean;
  };
}

const DEFAULT_PERMS = {
  appAccess: true,
  canAddDistrictData: false,
  canEditDistrictData: false,
  canCreateMeetings: false,
  canManageUsers: false,
  canCreateUniversityMeetings: false,
  canManageUniversityRecords: false,
  canManageUniversityCampaigns: false,
  canMonitorUniversityAnalytics: false,
  canExportUniversityReports: false,
};

export default function Users() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [items, setItems] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserListItem | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole === "admin";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersSnap, rolesSnap, permsSnap] = await Promise.all([
        getDocs(collection(firestore, "users")),
        getDocs(collection(firestore, "user_roles")),
        getDocs(collection(firestore, "user_permissions")),
      ]);

      const roleMap = new Map<string, RoleKey>();
      rolesSnap.docs.forEach((d) => {
        const role = (d.data().role || "user") as RoleKey;
        roleMap.set(d.id, role);
      });

      const permsMap = new Map<string, UserListItem["permissions"]>();
      permsSnap.docs.forEach((d) => {
        const p = d.data();
        permsMap.set(d.id, {
          appAccess: !!p.appAccess,
          canAddDistrictData: !!p.canAddDistrictData,
          canEditDistrictData: !!p.canEditDistrictData,
          canCreateMeetings: !!p.canCreateMeetings,
          canManageUsers: !!p.canManageUsers,
          canCreateUniversityMeetings: !!p.canCreateUniversityMeetings,
          canManageUniversityRecords: !!p.canManageUniversityRecords,
          canManageUniversityCampaigns: !!p.canManageUniversityCampaigns,
          canMonitorUniversityAnalytics: !!p.canMonitorUniversityAnalytics,
          canExportUniversityReports: !!p.canExportUniversityReports,
        });
      });

      const rows = usersSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email || "",
          fullName: data.fullName || "Unnamed",
          designation: data.designation || "Viewer",
          status: data.status === "Inactive" ? "Inactive" : "Active",
          role: roleMap.get(d.id) || "user",
          permissions: permsMap.get(d.id) || DEFAULT_PERMS,
        } as UserListItem;
      });

      setItems(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load users.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      [u.fullName, u.email, u.designation, u.role].join(" ").toLowerCase().includes(q),
    );
  }, [items, search]);

  const saveUserAccess = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await setDoc(doc(firestore, "users", selected.id), {
        fullName: selected.fullName,
        status: selected.status,
        designation: selected.designation,
        updatedAt: now,
      }, { merge: true });

      await setDoc(doc(firestore, "user_roles", selected.id), {
        role: selected.role,
        userId: selected.id,
        updatedAt: now,
      }, { merge: true });

      await setDoc(doc(firestore, "user_permissions", selected.id), {
        ...selected.permissions,
        userId: selected.id,
        updatedAt: now,
      }, { merge: true });

      toast({ title: "Saved", description: "User access updated successfully." });
      setSelected(null);
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save user access.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Only admin can view user management.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">Manage user profiles, roles and permissions</p>
          </div>
          <Badge variant="secondary" className="text-xs">{items.length} Users</Badge>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or role"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><UsersIcon className="h-4 w-4" /> All Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Loading users...</TableCell>
                  </TableRow>
                )}
                {!loading && filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-sm">{u.fullName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email || "-"}</TableCell>
                    <TableCell className="text-xs">{u.designation}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={u.status === "Active" ? "default" : "secondary"} className="text-[10px]">{u.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelected(u)}>Manage Access</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Edit User Access</DialogTitle>
                          </DialogHeader>

                          {selected?.id === u.id && (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Full Name</Label>
                                <Input value={selected.fullName} onChange={(e) => setSelected({ ...selected, fullName: e.target.value })} />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Role Key</Label>
                                <Select value={selected.role} onValueChange={(v) => setSelected({ ...selected, role: v as RoleKey })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">admin</SelectItem>
                                    <SelectItem value="moderator">moderator</SelectItem>
                                    <SelectItem value="university_manager">university_manager</SelectItem>
                                    <SelectItem value="user">user</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={selected.status} onValueChange={(v) => setSelected({ ...selected, status: v as "Active" | "Inactive" })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2 rounded-md border p-3 bg-muted/20">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">App Access</Label>
                                  <Switch checked={selected.permissions.appAccess} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, appAccess: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Add District Data</Label>
                                  <Switch checked={selected.permissions.canAddDistrictData} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canAddDistrictData: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Edit District Data</Label>
                                  <Switch checked={selected.permissions.canEditDistrictData} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canEditDistrictData: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Create Meetings</Label>
                                  <Switch checked={selected.permissions.canCreateMeetings} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canCreateMeetings: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Manage Users</Label>
                                  <Switch checked={selected.permissions.canManageUsers} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canManageUsers: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Create University Meetings</Label>
                                  <Switch checked={selected.permissions.canCreateUniversityMeetings} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canCreateUniversityMeetings: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Manage University Records</Label>
                                  <Switch checked={selected.permissions.canManageUniversityRecords} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canManageUniversityRecords: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Manage University Campaigns</Label>
                                  <Switch checked={selected.permissions.canManageUniversityCampaigns} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canManageUniversityCampaigns: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Monitor University Analytics</Label>
                                  <Switch checked={selected.permissions.canMonitorUniversityAnalytics} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canMonitorUniversityAnalytics: v } })} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Can Export University Reports</Label>
                                  <Switch checked={selected.permissions.canExportUniversityReports} onCheckedChange={(v) => setSelected({ ...selected, permissions: { ...selected.permissions, canExportUniversityReports: v } })} />
                                </div>
                              </div>

                              <Button className="w-full" onClick={saveUserAccess} disabled={saving}>
                                {saving ? "Saving..." : "Save Access Changes"}
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
