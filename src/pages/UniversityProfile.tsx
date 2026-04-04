import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useUniversities,
  useUniversityCoordinators,
  useUniversityGoals,
  useCreateUniversityGoal,
  useUpdateUniversityGoal,
  useDeleteUniversityGoal,
  useUniversityTasks,
  useUniversityMeetings,
  useUniversityMeetingRecords,
  useCreateUniversityMeeting,
  useActivities,
  useUniversityScenarios,
  LoadingSkeleton,
} from "@/hooks/useFirebaseData";
import { ArrowLeft, BarChart3, Calendar, ClipboardList, Eye, Pencil, Plus, Target, Trash2, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import type { UniversityGoal, UniversityScenario } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { exportUniversityCampaignAnalyticsExcel, exportUniversityCampaignAnalyticsPDF } from "@/lib/exportUtils";
import { useAuth } from "@/contexts/useAuth";

const DEFAULT_SCENARIOS: UniversityScenario[] = [
  {
    id: "admissions",
    name: "Admissions",
    description: "University admissions campaign",
    approachedLabel: "Students Approached",
    successfulLabel: "Successful Admissions",
    status: "Active",
    createdDate: new Date().toISOString(),
  },
  {
    id: "quran-class",
    name: "Quran Class Hostel",
    description: "Quran class and hostel initiative",
    approachedLabel: "Students Approached",
    successfulLabel: "Joined Quran Class",
    status: "Active",
    createdDate: new Date().toISOString(),
  },
  {
    id: "study-circle",
    name: "Study Circle",
    description: "Study circle campaign",
    approachedLabel: "Students Approached",
    successfulLabel: "Joined Study Circle",
    status: "Active",
    createdDate: new Date().toISOString(),
  },
  {
    id: "syllabus",
    name: "Syllabus",
    description: "Syllabus completion program",
    approachedLabel: "Students Approached",
    successfulLabel: "Completed Syllabus",
    status: "Active",
    createdDate: new Date().toISOString(),
  },
];

export default function UniversityProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole, userPermissions } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [meetingScope, setMeetingScope] = useState("All");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingMonth, setMeetingMonth] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignEditOpen, setCampaignEditOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState("");
  const [campaignMonth, setCampaignMonth] = useState(new Date().toISOString().slice(0, 7));
  const [campaignActivityId, setCampaignActivityId] = useState("");
  const [campaignTargetNumber, setCampaignTargetNumber] = useState("");
  const [campaignCompletedNumber, setCampaignCompletedNumber] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<UniversityGoal["status"]>("Pending");
  const [campaignScenarioId, setCampaignScenarioId] = useState("admissions");
  const [campaignCustomName, setCampaignCustomName] = useState("");
  const [campaignApproached, setCampaignApproached] = useState("");
  const [campaignSuccessful, setCampaignSuccessful] = useState("");
  const [campaignNotes, setCampaignNotes] = useState("");
  const [startedInMeetingId, setStartedInMeetingId] = useState<string>("none");
  const { toast } = useToast();

  const { data: universities = [], isLoading: uL } = useUniversities();
  const { data: coordinators = [], isLoading: cL } = useUniversityCoordinators();
  const { data: goals = [], isLoading: gL } = useUniversityGoals();
  const { data: tasks = [], isLoading: tL } = useUniversityTasks();
  const { data: meetings = [], isLoading: mL } = useUniversityMeetings();
  const { data: activities = [], isLoading: aL } = useActivities();
  const { data: customScenarios = [], isLoading: scL } = useUniversityScenarios();
  const { data: meetingRecords = [], isLoading: mrL } = useUniversityMeetingRecords();
  const createMeeting = useCreateUniversityMeeting();
  const createCampaign = useCreateUniversityGoal();
  const updateCampaign = useUpdateUniversityGoal();
  const deleteCampaign = useDeleteUniversityGoal();

  const isAdmin = userRole === "admin";
  const canCreateUniversityMeetings = isAdmin || !!userPermissions?.canCreateUniversityMeetings;
  const canManageUniversityCampaigns = isAdmin || !!userPermissions?.canManageUniversityCampaigns;
  const canMonitorUniversityAnalytics = isAdmin || !!userPermissions?.canMonitorUniversityAnalytics;
  const canExportUniversityReports = isAdmin || !!userPermissions?.canExportUniversityReports;

  if (uL || cL || gL || tL || mL || aL || scL || mrL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  // Combine default and custom scenarios
  const allScenarios: UniversityScenario[] = [
    ...DEFAULT_SCENARIOS,
    ...customScenarios.filter((s) => s.status === "Active"),
  ];

  const getScenarioById = (id: string): UniversityScenario | undefined => {
    return allScenarios.find((s) => s.id === id);
  };

  const getScenarioLabels = (scenarioId: string) => {
    const scenario = getScenarioById(scenarioId);
    return {
      approached: scenario?.approachedLabel || "Students Approached",
      successful: scenario?.successfulLabel || "Successful Outcomes",
    };
  };

  const university = universities.find((u) => u.id === id);
  if (!university) {
    return <AppLayout><div className="text-center py-20">University not found</div></AppLayout>;
  }

  const currentCoord = coordinators.find((c) => c.id === university.currentCoordinatorId);
  const universityGoals = goals.filter((g) => g.universityId === id);
  const universityTasks = tasks.filter((t) => t.universityId === id);
  const universityMeetings = meetings.filter((m) => m.universityIds.includes(id || ""));
  const universityRecords = meetingRecords.filter((r) => r.universityId === id);

  const totalTarget = universityGoals.reduce((sum, g) => sum + (g.targetNumber || 0), 0);
  const totalCompleted = universityGoals.reduce((sum, g) => sum + (g.completedNumber || 0), 0);
  const completedCampaigns = universityGoals.filter((g) => g.status === "Completed").length;
  const campaignPerformance = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
  const totalApproached = universityGoals.reduce((sum, g) => sum + (g.approachedStudents || 0), 0);
  const totalSuccessful = universityGoals.reduce((sum, g) => sum + (g.successfulStudents || 0), 0);
  const conversionRate = totalApproached > 0 ? Math.round((totalSuccessful / totalApproached) * 100) : 0;
  const completedReports = universityRecords.filter((r) => r.status === "Completed").length;

  const scenarioAnalytics = universityGoals.reduce((acc, goal) => {
    const key = goal.scenario === "Custom" ? (goal.customName || "Custom") : (goal.scenario || "Custom");
    const curr = acc.get(key) || { campaigns: 0, approached: 0, successful: 0, target: 0, completed: 0 };
    curr.campaigns += 1;
    curr.approached += goal.approachedStudents || 0;
    curr.successful += goal.successfulStudents || 0;
    curr.target += goal.targetNumber || 0;
    curr.completed += goal.completedNumber || 0;
    acc.set(key, curr);
    return acc;
  }, new Map<string, { campaigns: number; approached: number; successful: number; target: number; completed: number }>());
  const scenarioRows = Array.from(scenarioAnalytics.entries());

  const campaignsByMeeting = universityGoals.reduce((acc, g) => {
    if (!g.startedInMeetingId) return acc;
    const key = g.startedInMeetingId;
    const title = g.startedInMeetingTitle || "Meeting";
    const current = acc.get(key) || { title, count: 0, target: 0, completed: 0 };
    current.count += 1;
    current.target += g.targetNumber || 0;
    current.completed += g.completedNumber || 0;
    acc.set(key, current);
    return acc;
  }, new Map<string, { title: string; count: number; target: number; completed: number }>());

  const campaignByMeetingRows = Array.from(campaignsByMeeting.values());

  const handleCreateMeeting = async () => {
    if (!meetingTitle || !meetingMonth || !meetingDate) {
      toast({ title: "Missing fields", description: "Title, month and date are required.", variant: "destructive" });
      return;
    }
    const allIds = universities.map((u) => u.id);
    try {
      await createMeeting.mutateAsync({
        title: meetingTitle,
        month: meetingMonth,
        meetingDate,
        agenda: meetingAgenda,
        notes: meetingNotes,
        scope: meetingScope as "All" | "Selected",
        universityIds: meetingScope === "All" ? allIds : [university.id],
      });
      setCreateOpen(false);
      setMeetingTitle("");
      setMeetingMonth("");
      setMeetingDate("");
      setMeetingAgenda("");
      setMeetingNotes("");
      setMeetingScope("All");
      toast({ title: "Meeting created", description: "University meeting has been created." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create meeting.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const resetCampaignForm = () => {
    setCampaignMonth(new Date().toISOString().slice(0, 7));
    setCampaignActivityId("");
    setCampaignTargetNumber("");
    setCampaignCompletedNumber("");
    setCampaignStatus("Pending");
    setCampaignScenarioId("admissions");
    setCampaignCustomName("");
    setCampaignApproached("");
    setCampaignSuccessful("");
    setCampaignNotes("");
    setStartedInMeetingId("none");
    setEditingCampaignId("");
  };

  const handleCreateCampaign = async () => {
    const activity = activities.find((a) => a.id === campaignActivityId);
    const scenario = getScenarioById(campaignScenarioId);
    const target = Number(campaignTargetNumber);
    const completed = campaignCompletedNumber === "" ? 0 : Number(campaignCompletedNumber);
    const approached = campaignApproached === "" ? 0 : Number(campaignApproached);
    const successful = campaignSuccessful === "" ? 0 : Number(campaignSuccessful);
    const meeting = universityMeetings.find((m) => m.id === startedInMeetingId);

    if (!activity || !campaignMonth || !Number.isFinite(target) || target <= 0) {
      toast({ title: "Missing fields", description: "Activity, month and valid target are required.", variant: "destructive" });
      return;
    }

    try {
      await createCampaign.mutateAsync({
        month: campaignMonth,
        universityId: university.id,
        universityName: university.name,
        activityId: activity.id,
        activityName: activity.name,
        scenarioId: campaignScenarioId,
        scenarioName: scenario?.name,
        targetNumber: target,
        completedNumber: Number.isFinite(completed) ? completed : 0,
        approachedStudents: Number.isFinite(approached) ? approached : 0,
        successfulStudents: Number.isFinite(successful) ? successful : 0,
        notes: campaignNotes.trim() || undefined,
        status: campaignStatus,
        startedInMeetingId: startedInMeetingId !== "none" ? startedInMeetingId : undefined,
        startedInMeetingTitle: meeting?.title,
      });

      setCampaignOpen(false);
      resetCampaignForm();
      toast({ title: "Campaign created", description: "Campaign is now linked with live university analytics." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create campaign.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openEditCampaign = (goal: UniversityGoal) => {
    setEditingCampaignId(goal.id);
    setCampaignMonth(goal.month);
    setCampaignActivityId(goal.activityId);
    setCampaignTargetNumber(String(goal.targetNumber || ""));
    setCampaignCompletedNumber(String(goal.completedNumber ?? ""));
    setCampaignStatus((goal.status || "Pending") as UniversityGoal["status"]);
    setCampaignScenarioId(goal.scenarioId || "admissions");
    setCampaignCustomName(goal.customName || "");
    setCampaignApproached(String(goal.approachedStudents ?? ""));
    setCampaignSuccessful(String(goal.successfulStudents ?? ""));
    setCampaignNotes(goal.notes || "");
    setStartedInMeetingId(goal.startedInMeetingId || "none");
    setCampaignEditOpen(true);
  };

  const handleUpdateCampaign = async () => {
    const activity = activities.find((a) => a.id === campaignActivityId);
    const scenario = getScenarioById(campaignScenarioId);
    const target = Number(campaignTargetNumber);
    const completed = campaignCompletedNumber === "" ? undefined : Number(campaignCompletedNumber);
    const approached = campaignApproached === "" ? undefined : Number(campaignApproached);
    const successful = campaignSuccessful === "" ? undefined : Number(campaignSuccessful);
    const meeting = universityMeetings.find((m) => m.id === startedInMeetingId);

    if (!editingCampaignId || !activity || !campaignMonth || !Number.isFinite(target) || target <= 0) {
      toast({ title: "Missing fields", description: "Activity, month and valid target are required.", variant: "destructive" });
      return;
    }

    try {
      await updateCampaign.mutateAsync({
        id: editingCampaignId,
        month: campaignMonth,
        universityId: university.id,
        universityName: university.name,
        activityId: activity.id,
        activityName: activity.name,
        scenarioId: campaignScenarioId,
        scenarioName: scenario?.name,
        targetNumber: target,
        completedNumber: Number.isFinite(completed as number) ? completed : undefined,
        approachedStudents: Number.isFinite(approached as number) ? approached : undefined,
        successfulStudents: Number.isFinite(successful as number) ? successful : undefined,
        notes: campaignNotes.trim() || undefined,
        status: campaignStatus,
        startedInMeetingId: startedInMeetingId !== "none" ? startedInMeetingId : undefined,
        startedInMeetingTitle: startedInMeetingId !== "none" ? meeting?.title : undefined,
      });

      setCampaignEditOpen(false);
      resetCampaignForm();
      toast({ title: "Campaign updated", description: "Campaign updated successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update campaign.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDeleteCampaign = async (goal: UniversityGoal) => {
    const ok = window.confirm(`Delete campaign '${goal.activityName}'?`);
    if (!ok) return;

    try {
      await deleteCampaign.mutateAsync(goal.id);
      toast({ title: "Campaign deleted", description: "Campaign removed." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete campaign.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/universities")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{university.name}</h1>
            <p className="text-muted-foreground text-sm">{university.city}, {university.province}</p>
          </div>
          <Badge variant={university.status === "Active" ? "default" : "secondary"} className="text-xs">{university.status}</Badge>
        </div>

        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!canCreateUniversityMeetings}><Plus className="h-4 w-4" /> Create Meeting</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create University Meeting</DialogTitle>
                <DialogDescription>Create overall or specific university meeting.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1"><Label>Title</Label><Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="University Monthly Review" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Month</Label><Input type="month" value={meetingMonth} onChange={(e) => setMeetingMonth(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Date</Label><Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} /></div>
                </div>
                <div className="space-y-1"><Label>Scope</Label>
                  <Select value={meetingScope} onValueChange={setMeetingScope}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Pakistan Universities</SelectItem>
                      <SelectItem value="Selected">Specific Universities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {meetingScope === "Selected" && (
                  <div className="space-y-1">
                    <Label>University</Label>
                    <Input value={university.name} disabled />
                  </div>
                )}
                <div className="space-y-1"><Label>Agenda</Label><Textarea value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} rows={3} /></div>
                <div className="space-y-1"><Label>Notes</Label><Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} rows={2} /></div>
                <Button className="w-full" disabled={!canCreateUniversityMeetings || createMeeting.isPending} onClick={handleCreateMeeting}>{createMeeting.isPending ? "Creating..." : "Create Meeting"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Coordinator</p><p className="text-sm font-bold">{currentCoord?.name || "Unassigned"}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Meetings</p><p className="text-lg font-bold">{universityMeetings.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Campaigns</p><p className="text-lg font-bold">{universityGoals.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Tasks</p><p className="text-lg font-bold">{universityTasks.length}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="meetings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="meetings" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Meetings</TabsTrigger>
            <TabsTrigger value="coordinators" className="gap-1"><Users className="h-3.5 w-3.5" /> Coordinators</TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1"><Target className="h-3.5 w-3.5" /> Campaigns</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /> Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="meetings">
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Month</TableHead><TableHead>Date</TableHead><TableHead>Scope</TableHead><TableHead>Report</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {universityMeetings.map((m) => {
                    const record = universityRecords.find((r) => r.meetingId === m.id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{m.title}</TableCell>
                        <TableCell>{m.month}</TableCell>
                        <TableCell>{m.meetingDate}</TableCell>
                        <TableCell>{m.scope}</TableCell>
                        <TableCell><Badge variant={record?.status === "Completed" ? "default" : "outline"} className="text-[10px]">{record?.status || "Empty"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/university-meetings/${m.id}/report/${university.id}`)}>
                            <Eye className="h-3 w-3" /> {record?.status === "Completed" ? "View Report" : "Add Report"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {universityMeetings.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No meetings</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="coordinators">
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {coordinators.filter((c) => c.universityId === id).map((c) => (
                    <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.phone}</TableCell><TableCell>{c.status}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => exportUniversityCampaignAnalyticsPDF(university, universityGoals)}
                disabled={!canExportUniversityReports || universityGoals.length === 0}
              >
                Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => exportUniversityCampaignAnalyticsExcel(university, universityGoals)}
                disabled={!canExportUniversityReports || universityGoals.length === 0}
              >
                Export Excel
              </Button>
              <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={resetCampaignForm} disabled={!canManageUniversityCampaigns}><Plus className="h-4 w-4" /> Create Campaign</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create University Campaign</DialogTitle>
                    <DialogDescription>Set target, performance baseline and optional meeting linkage.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Month</Label><Input type="month" value={campaignMonth} onChange={(e) => setCampaignMonth(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Target Number</Label><Input type="number" min={1} value={campaignTargetNumber} onChange={(e) => setCampaignTargetNumber(e.target.value)} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Activity</Label>
                      <Select value={campaignActivityId} onValueChange={setCampaignActivityId}>
                        <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                        <SelectContent>{activities.filter((a) => a.status === "Active").map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Scenario</Label>
                      <Select value={campaignScenarioId} onValueChange={setCampaignScenarioId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{allScenarios.map((scenario) => <SelectItem key={scenario.id} value={scenario.id}>{scenario.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Completed Number</Label><Input type="number" min={0} value={campaignCompletedNumber} onChange={(e) => setCampaignCompletedNumber(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Status</Label>
                        <Select value={campaignStatus || "Pending"} onValueChange={(value) => setCampaignStatus(value as UniversityGoal["status"])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Partially Completed">Partially Completed</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Not Completed">Not Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{getScenarioLabels(campaignScenarioId).approached}</Label>
                        <Input type="number" min={0} value={campaignApproached} onChange={(e) => setCampaignApproached(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{getScenarioLabels(campaignScenarioId).successful}</Label>
                        <Input type="number" min={0} value={campaignSuccessful} onChange={(e) => setCampaignSuccessful(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Started In Meeting (Optional)</Label>
                      <Select value={startedInMeetingId} onValueChange={setStartedInMeetingId}>
                        <SelectTrigger><SelectValue placeholder="Select meeting" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not linked</SelectItem>
                          {universityMeetings.map((m) => <SelectItem key={m.id} value={m.id}>{m.title} ({m.month})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea rows={2} value={campaignNotes} onChange={(e) => setCampaignNotes(e.target.value)} /></div>
                    <Button className="w-full" onClick={handleCreateCampaign} disabled={!canManageUniversityCampaigns || createCampaign.isPending}>{createCampaign.isPending ? "Saving..." : "Save Campaign"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Activity</TableHead><TableHead>Scenario</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Approached</TableHead><TableHead>Successful</TableHead><TableHead>Conversion</TableHead><TableHead>Performance</TableHead><TableHead>Started In Meeting</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {universityGoals.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>{g.month}</TableCell>
                      <TableCell>{g.activityName}</TableCell>
                      <TableCell>{g.scenario === "Custom" ? g.customName : (g.scenario || "Custom")}</TableCell>
                      <TableCell className="font-mono">{g.targetNumber}</TableCell>
                      <TableCell className="font-mono">{g.completedNumber || 0}</TableCell>
                      <TableCell className="font-mono">{g.approachedStudents || 0}</TableCell>
                      <TableCell className="font-mono">{g.successfulStudents || 0}</TableCell>
                      <TableCell className="font-mono text-xs">{(g.approachedStudents || 0) > 0 ? Math.round(((g.successfulStudents || 0) / (g.approachedStudents || 1)) * 100) : 0}%</TableCell>
                      <TableCell className="font-mono text-xs">{g.targetNumber > 0 ? Math.round(((g.completedNumber || 0) / g.targetNumber) * 100) : 0}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{g.startedInMeetingTitle || "—"}</TableCell>
                      <TableCell><Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status || "Pending"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canManageUniversityCampaigns} onClick={() => openEditCampaign(g)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={!canManageUniversityCampaigns} onClick={() => handleDeleteCampaign(g)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {universityGoals.length === 0 && <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No campaigns</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {!canMonitorUniversityAnalytics && <Card><CardContent className="p-4 text-sm text-muted-foreground">You do not have permission to monitor university analytics.</CardContent></Card>}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Campaigns</p><p className="text-lg font-bold">{universityGoals.length}</p></CardContent></Card>
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Completed</p><p className="text-lg font-bold">{completedCampaigns}</p></CardContent></Card>
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Target Total</p><p className="text-lg font-bold font-mono">{totalTarget}</p></CardContent></Card>
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Achieved</p><p className="text-lg font-bold font-mono">{totalCompleted}</p></CardContent></Card>
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Approached</p><p className="text-lg font-bold font-mono">{totalApproached}</p></CardContent></Card>
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Successful</p><p className="text-lg font-bold font-mono">{totalSuccessful}</p></CardContent></Card>
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Conversion</p><p className="text-lg font-bold font-mono">{conversionRate}%</p></CardContent></Card>
              <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Performance</p><p className="text-lg font-bold font-mono">{campaignPerformance}%</p></CardContent></Card>
            </div>

            {canMonitorUniversityAnalytics && <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Reports Completed</p><p className="text-sm font-semibold mt-1">{completedReports} / {universityRecords.length} reports submitted</p></CardContent></Card>}

            {canMonitorUniversityAnalytics && <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Meeting</TableHead><TableHead>Campaigns Started</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Performance</TableHead></TableRow></TableHeader>
                <TableBody>
                  {campaignByMeetingRows.map((row, idx) => (
                    <TableRow key={`${row.title}_${idx}`}>
                      <TableCell className="font-medium text-sm">{row.title}</TableCell>
                      <TableCell className="font-mono">{row.count}</TableCell>
                      <TableCell className="font-mono">{row.target}</TableCell>
                      <TableCell className="font-mono">{row.completed}</TableCell>
                      <TableCell className="font-mono text-xs">{row.target > 0 ? Math.round((row.completed / row.target) * 100) : 0}%</TableCell>
                    </TableRow>
                  ))}
                  {campaignByMeetingRows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No meeting-linked campaigns yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>}

            {canMonitorUniversityAnalytics && <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Scenario</TableHead><TableHead>Campaigns</TableHead><TableHead>Approached</TableHead><TableHead>Successful</TableHead><TableHead>Conversion</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Performance</TableHead></TableRow></TableHeader>
                <TableBody>
                  {scenarioRows.map(([scenario, row]) => (
                    <TableRow key={scenario}>
                      <TableCell className="font-medium text-sm">{scenario}</TableCell>
                      <TableCell className="font-mono">{row.campaigns}</TableCell>
                      <TableCell className="font-mono">{row.approached}</TableCell>
                      <TableCell className="font-mono">{row.successful}</TableCell>
                      <TableCell className="font-mono text-xs">{row.approached > 0 ? Math.round((row.successful / row.approached) * 100) : 0}%</TableCell>
                      <TableCell className="font-mono">{row.target}</TableCell>
                      <TableCell className="font-mono">{row.completed}</TableCell>
                      <TableCell className="font-mono text-xs">{row.target > 0 ? Math.round((row.completed / row.target) * 100) : 0}%</TableCell>
                    </TableRow>
                  ))}
                  {scenarioRows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No scenario analytics yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>}
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Deadline</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {universityTasks.map((t) => (
                    <TableRow key={t.id}><TableCell>{t.title}</TableCell><TableCell>{t.deadline}</TableCell><TableCell>{t.priority}</TableCell><TableCell>{t.status}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        <Dialog open={campaignEditOpen} onOpenChange={setCampaignEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>Update campaign target, performance and linked meeting.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Month</Label><Input type="month" value={campaignMonth} onChange={(e) => setCampaignMonth(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Target Number</Label><Input type="number" min={1} value={campaignTargetNumber} onChange={(e) => setCampaignTargetNumber(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Activity</Label>
                <Select value={campaignActivityId} onValueChange={setCampaignActivityId}>
                  <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                  <SelectContent>{activities.filter((a) => a.status === "Active").map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Scenario</Label>
                <Select value={campaignScenarioId} onValueChange={setCampaignScenarioId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{allScenarios.map((scenario) => <SelectItem key={scenario.id} value={scenario.id}>{scenario.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Completed Number</Label><Input type="number" min={0} value={campaignCompletedNumber} onChange={(e) => setCampaignCompletedNumber(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Status</Label>
                  <Select value={campaignStatus || "Pending"} onValueChange={(value) => setCampaignStatus(value as UniversityGoal["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partially Completed">Partially Completed</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Not Completed">Not Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{getScenarioLabels(campaignScenarioId).approached}</Label>
                  <Input type="number" min={0} value={campaignApproached} onChange={(e) => setCampaignApproached(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{getScenarioLabels(campaignScenarioId).successful}</Label>
                  <Input type="number" min={0} value={campaignSuccessful} onChange={(e) => setCampaignSuccessful(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Started In Meeting (Optional)</Label>
                <Select value={startedInMeetingId} onValueChange={setStartedInMeetingId}>
                  <SelectTrigger><SelectValue placeholder="Select meeting" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not linked</SelectItem>
                    {universityMeetings.map((m) => <SelectItem key={m.id} value={m.id}>{m.title} ({m.month})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea rows={2} value={campaignNotes} onChange={(e) => setCampaignNotes(e.target.value)} /></div>
              <Button className="w-full" onClick={handleUpdateCampaign} disabled={!canManageUniversityCampaigns || updateCampaign.isPending}>{updateCampaign.isPending ? "Saving..." : "Save Changes"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
