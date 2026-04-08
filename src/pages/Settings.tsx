import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/integrations/firebase/client";
import { useDistricts } from "@/hooks/useFirebaseData";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ensureNotificationPermissions,
  getNotificationPermissionState,
  setReminderPreference,
} from "@/lib/mobileReminders";
import type { AppUserPermissions, UserRole } from "@/types";
import { Shield, Download, Bell, Globe, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const DEFAULT_PERMISSIONS: AppUserPermissions = {
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
  assignedDistrictIds: [],
};

export default function Settings() {
  const { userRole, user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const { data: districts = [] } = useDistricts();

  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("all");

  const [targetUserId, setTargetUserId] = useState("");
  const [targetRole, setTargetRole] = useState<UserRole>("Viewer");
  const [permissions, setPermissions] = useState<AppUserPermissions>(DEFAULT_PERMISSIONS);
  const [savingRole, setSavingRole] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true);

  const canManageUsers = userRole === "admin";

  useEffect(() => {
    const inferred = userProfile?.fullName || user?.displayName || user?.email?.split("@")[0] || "";
    setProfileName(inferred);
  }, [user, userProfile]);

  useEffect(() => {
    void (async () => {
      const granted = await getNotificationPermissionState();
      setTaskRemindersEnabled(granted);
    })();
  }, []);

  const avatarThemes = [
    "bg-[#f4c7b8] text-[#4a231a]",
    "bg-[#c8e6c9] text-[#103b1f]",
    "bg-[#d1c4e9] text-[#2b1a4a]",
    "bg-[#ffe0b2] text-[#4a2b11]",
    "bg-[#b3e5fc] text-[#08374d]",
    "bg-[#f8bbd0] text-[#4d1a2f]",
  ];
  const seedSource = userProfile?.email || user?.email || profileName || "User";
  const avatarTheme = avatarThemes[
    Array.from(seedSource).reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarThemes.length
  ];

  const handleProfileSave = async () => {
    if (!user?.uid) {
      toast({ title: "Not signed in", description: "Please sign in to update profile.", variant: "destructive" });
      return;
    }
    if (!profileName.trim()) {
      toast({ title: "Missing user name", description: "Please enter your user name.", variant: "destructive" });
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(user, { displayName: profileName.trim() });
      await setDoc(doc(firestore, "users", user.uid), {
        userId: user.uid,
        email: user.email || null,
        fullName: profileName.trim(),
        profilePhotoUrl: null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await refreshUserProfile();
      toast({ title: "Profile updated", description: "User name updated successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({ title: "Email not found", description: "No email is linked with this account.", variant: "destructive" });
      return;
    }

    setSendingReset(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, user.email);
      toast({ title: "Reset email sent", description: `Password reset email sent to ${user.email}.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    } finally {
      setSendingReset(false);
    }
  };

  const handleTaskReminderToggle = async (enabled: boolean) => {
    if (!enabled) {
      setReminderPreference(false);
      setTaskRemindersEnabled(false);
      toast({ title: "Task reminders disabled", description: "You can enable them again anytime." });
      return;
    }

    const granted = await ensureNotificationPermissions();
    if (!granted) {
      setTaskRemindersEnabled(false);
      toast({
        title: "Permission required",
        description: "Please allow notifications from app settings to enable reminders.",
        variant: "destructive",
      });
      return;
    }

    setReminderPreference(true);
    setTaskRemindersEnabled(true);
    toast({ title: "Task reminders enabled", description: "Upcoming task and schedule alerts are now active." });
  };

  const mapDesignationToAccessRole = (designation: UserRole): "admin" | "moderator" | "user" | "university_manager" => {
    if (designation === "Super Admin" || designation === "President") return "admin";
    if (designation === "University Coordinator") return "university_manager";
    if (designation === "Viewer") return "user";
    return "moderator";
  };

  const upsertUserAccess = async (userId: string, designation: UserRole) => {
    const accessRole = mapDesignationToAccessRole(designation);
    const now = new Date().toISOString();
    const assignedDistrictIds = selectedDistrictId === "all" ? [] : [selectedDistrictId];
    const isUniversityCoordinator = designation === "University Coordinator";
    const normalizedPermissions: AppUserPermissions = {
      ...permissions,
      appAccess: isUniversityCoordinator ? true : permissions.appAccess,
      canCreateUniversityMeetings: isUniversityCoordinator ? true : permissions.canCreateUniversityMeetings,
      canManageUniversityRecords: isUniversityCoordinator ? true : permissions.canManageUniversityRecords,
      canManageUniversityCampaigns: isUniversityCoordinator ? true : permissions.canManageUniversityCampaigns,
      canMonitorUniversityAnalytics: isUniversityCoordinator ? true : permissions.canMonitorUniversityAnalytics,
      canExportUniversityReports: isUniversityCoordinator ? true : permissions.canExportUniversityReports,
      assignedDistrictIds,
    };

    await setDoc(doc(firestore, "users", userId), {
      userId,
      email: newUserEmail.trim() || null,
      fullName: newUserFullName.trim() || null,
      phone: newUserPhone.trim() || null,
      designation,
      status: "Active",
      createdBy: user?.uid || null,
      updatedAt: now,
    }, { merge: true });

    await setDoc(doc(firestore, "user_roles", userId), {
      role: accessRole,
      userId,
      updatedAt: now,
    }, { merge: true });

    await setDoc(doc(firestore, "user_designations", userId), {
      designation,
      userId,
      updatedAt: now,
    }, { merge: true });

    await setDoc(doc(firestore, "user_permissions", userId), {
      ...normalizedPermissions,
      userId,
      updatedAt: now,
    }, { merge: true });
  };

  const handleAssignRole = async () => {
    if (!targetUserId.trim()) {
      toast({ title: "User ID required", description: "Enter the user's Firebase UID." });
      return;
    }

    setSavingRole(true);
    try {
      await upsertUserAccess(targetUserId.trim(), targetRole);
      toast({ title: "Access updated", description: `Role '${targetRole}' and permissions saved.` });
      setTargetUserId("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign role.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    } finally {
      setSavingRole(false);
    }
  };

  const handleCreateUserWithRole = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserFullName.trim()) {
      toast({ title: "Required fields", description: "Enter full name, email and password for new user." });
      return;
    }

    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId || !FIREBASE_CONFIG.appId) {
      toast({
        title: "Missing Firebase config",
        description: "Check VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_APP_ID in .env.",
        variant: "destructive",
      });
      return;
    }

    setSavingRole(true);
    try {
      const secondaryApp = initializeApp(FIREBASE_CONFIG, `settings-create-user-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);

      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUserEmail.trim(),
        newUserPassword,
      );

      const userId = cred.user.uid;
      if (!userId) {
        throw new Error("User created but no user id returned.");
      }

      await upsertUserAccess(userId, targetRole);
      await deleteApp(secondaryApp);

      toast({
        title: "User created",
        description: `Created ${cred.user.email || newUserEmail} with profile, role and permissions.`,
      });

      setNewUserFullName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setNewUserPassword("");
      setSelectedDistrictId("all");
      setPermissions(DEFAULT_PERMISSIONS);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user.";
      toast({ title: "Failed", description: message, variant: "destructive" });
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage system settings & configuration</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserRound className="h-4 w-4" /> Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-[#014f35]/15">
                <AvatarImage src={undefined} alt={profileName || "Profile"} />
                <AvatarFallback className={`${avatarTheme} font-semibold`}>
                  {(profileName || user?.email || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <p className="text-sm font-medium">Random Avatar</p>
                <p className="text-xs text-muted-foreground">Avatar is auto-generated from your account.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">User Name</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Enter user name" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleProfileSave} disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save User Name"}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePasswordReset} disabled={sendingReset || !user?.email}>
                {sendingReset ? "Sending..." : "Reset Password"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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
              <Switch checked={taskRemindersEnabled} onCheckedChange={handleTaskReminderToggle} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> User Roles & Permissions
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
            <p className="text-xs text-muted-foreground mt-3">Create users with full profile and define permissions.</p>

            <div className="mt-4 space-y-3 p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="e.g. Abdul Rehman"
                  disabled={!canManageUsers}
                />
              </div>

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
                <Label className="text-xs">Phone</Label>
                <Input
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  type="tel"
                  placeholder="e.g. 0300-0000000"
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

              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Select value={targetRole} onValueChange={(value) => setTargetRole(value as UserRole)} disabled={!canManageUsers}>
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

              <div className="space-y-1">
                <Label className="text-xs">District Permission Scope</Label>
                <Select value={selectedDistrictId} onValueChange={setSelectedDistrictId} disabled={!canManageUsers}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 rounded-md border p-3 bg-background">
                <p className="text-xs font-semibold">Permissions</p>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">App Access</Label>
                  <Switch checked={permissions.appAccess} onCheckedChange={(v) => setPermissions((p) => ({ ...p, appAccess: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Add District Data</Label>
                  <Switch checked={permissions.canAddDistrictData} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canAddDistrictData: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Edit District Data</Label>
                  <Switch checked={permissions.canEditDistrictData} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canEditDistrictData: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Create Meetings</Label>
                  <Switch checked={permissions.canCreateMeetings} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canCreateMeetings: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Manage Users</Label>
                  <Switch checked={permissions.canManageUsers} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canManageUsers: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Create University Meetings</Label>
                  <Switch checked={permissions.canCreateUniversityMeetings} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canCreateUniversityMeetings: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Manage University Records</Label>
                  <Switch checked={permissions.canManageUniversityRecords} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canManageUniversityRecords: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Manage University Campaigns</Label>
                  <Switch checked={permissions.canManageUniversityCampaigns} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canManageUniversityCampaigns: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Monitor University Analytics</Label>
                  <Switch checked={permissions.canMonitorUniversityAnalytics} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canMonitorUniversityAnalytics: v }))} disabled={!canManageUsers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Can Export University Reports</Label>
                  <Switch checked={permissions.canExportUniversityReports} onCheckedChange={(v) => setPermissions((p) => ({ ...p, canExportUniversityReports: v }))} disabled={!canManageUsers} />
                </div>
              </div>

              <Button size="sm" onClick={handleCreateUserWithRole} disabled={!canManageUsers || savingRole}>
                {savingRole ? "Saving..." : "Create User + Assign Role"}
              </Button>

              <Separator />

              <div className="space-y-1">
                <Label className="text-xs">User ID (Firebase UID)</Label>
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. hUu9x8y7z6A1B2C3D4E5"
                  disabled={!canManageUsers}
                />
              </div>

              <Button size="sm" onClick={handleAssignRole} disabled={!canManageUsers || savingRole}>
                {savingRole ? "Saving..." : "Update Existing User Access"}
              </Button>

              {!canManageUsers && (
                <p className="text-xs text-muted-foreground">Only admin can manage user roles and permissions.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
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
