import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Shield, Download, Bell, Globe } from "lucide-react";

export default function Settings() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetRole, setTargetRole] = useState("Viewer");
  const [savingRole, setSavingRole] = useState(false);

  const canManageUsers = userRole === "admin" || userRole === "moderator";

  const handleAssignRole = async () => {
    if (!targetUserId.trim()) {
      toast({ title: "User ID required", description: "Enter the user's UUID from Supabase Auth." });
      return;
    }

    setSavingRole(true);
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        userId: targetUserId.trim(),
        designation: targetRole,
      },
    });
    setSavingRole(false);

    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Role assigned", description: `Role '${targetRole}' saved successfully.` });
    setTargetUserId("");
  };

  const handleCreateUserWithRole = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast({ title: "Email & password required", description: "Enter email and password for new user." });
      return;
    }

    setSavingRole(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        email: newUserEmail.trim(),
        password: newUserPassword,
        designation: targetRole,
      },
    });
    setSavingRole(false);

    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "User created",
      description: `Created ${data?.email || newUserEmail} with role '${targetRole}'.`,
    });
    setNewUserEmail("");
    setNewUserPassword("");
  };

  return (
    <AppLayout>
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage system settings & configuration</p>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Organization Name</Label>
              <Input defaultValue="MSL Pakistan" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Admin Email</Label>
              <Input defaultValue="admin@msl.pk" type="email" />
            </div>
            <Button size="sm">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive email on new meeting reports</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Task Reminders</p>
                <p className="text-xs text-muted-foreground">Get reminded before task deadlines</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "Super Admin",
                "President",
                "Zone Coordinator",
                "District Coordinator",
                "University Coordinator",
                "Madadgar Team Coordinator",
                "Department Head",
                "Viewer",
              ].map(role => (
                <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Assign access role to a specific user.</p>

            <div className="mt-4 space-y-3 p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-1">
                <Label className="text-xs">Create New User (Email)</Label>
                <Input
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  type="email"
                  placeholder="user@msl.pk"
                  disabled={!canManageUsers}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <Input
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  type="password"
                  placeholder="Minimum 6 characters"
                  disabled={!canManageUsers}
                />
              </div>

              <Button size="sm" onClick={handleCreateUserWithRole} disabled={!canManageUsers || savingRole}>
                {savingRole ? "Saving..." : "Create User + Assign Role"}
              </Button>

              <Separator />

              <div className="space-y-1">
                <Label className="text-xs">User ID (Supabase Auth UUID)</Label>
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. 6e4f6ef0-2b3e-4fd2-a65f-bf8f8d4c06ab"
                  disabled={!canManageUsers}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Select value={targetRole} onValueChange={setTargetRole} disabled={!canManageUsers}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                    <SelectItem value="President">President</SelectItem>
                    <SelectItem value="Zone Coordinator">Zone Coordinator</SelectItem>
                    <SelectItem value="District Coordinator">District Coordinator</SelectItem>
                    <SelectItem value="University Coordinator">University Coordinator</SelectItem>
                    <SelectItem value="Madadgar Team Coordinator">Madadgar Team Coordinator</SelectItem>
                    <SelectItem value="Department Head">Department Head</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" onClick={handleAssignRole} disabled={!canManageUsers || savingRole}>
                {savingRole ? "Saving..." : "Assign Role to Existing User"}
              </Button>

              {!canManageUsers && (
                <p className="text-xs text-muted-foreground">Only admin or moderator can manage user roles.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="h-4 w-4" /> Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Export reports in various formats</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">Export PDF</Button>
              <Button variant="outline" size="sm">Export Excel</Button>
              <Button variant="outline" size="sm">Export CSV</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
