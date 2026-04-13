import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useActivities,
  useUniversityGoals,
  useCreateUniversityGoal,
  useUpdateUniversityGoal,
  useUniversityMeetingRecords,
  useUpdateUniversityMeetingRecord,
  useUniversityMeetings,
  useUniversities,
  useUniversityScenarios,
  LoadingSkeleton,
} from "@/hooks/useFirebaseData";
import { ArrowLeft, Eye, FileSpreadsheet, Plus, Save, Target, Trash2 } from "lucide-react";
import type { ActivityReport, CustomActivity, NextMonthTask, UniversityScenario } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { exportUniversityReportExcel, exportUniversityReportPDF } from "@/lib/exportUtils";
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

export default function UniversityMeetingReport() {
  const { meetingId, universityId } = useParams();
  const navigate = useNavigate();
  const { userRole, userPermissions } = useAuth();
  const { toast } = useToast();

  const { data: meetings = [], isLoading: mL } = useUniversityMeetings();
  const { data: universities = [], isLoading: uL } = useUniversities();
  const { data: records = [], isLoading: rL } = useUniversityMeetingRecords(meetingId);
  const { data: activities = [], isLoading: aL } = useActivities();
  const { data: campaigns = [], isLoading: cL } = useUniversityGoals();
  const { data: customScenarios = [], isLoading: scL } = useUniversityScenarios();

  const updateRecord = useUpdateUniversityMeetingRecord();
  const createCampaign = useCreateUniversityGoal();
  const updateCampaign = useUpdateUniversityGoal();

  const [editing, setEditing] = useState(false);
  const [attendance, setAttendance] = useState("");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [activityReports, setActivityReports] = useState<ActivityReport[]>([]);
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [nextMonthTasks, setNextMonthTasks] = useState<NextMonthTask[]>([]);

  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignActivityId, setCampaignActivityId] = useState("");
  const [campaignTarget, setCampaignTarget] = useState("");
  const [campaignScenarioId, setCampaignScenarioId] = useState("admissions");
  const [campaignNotes, setCampaignNotes] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkTaskActivityType, setBulkTaskActivityType] = useState("");
  const [bulkTaskTarget, setBulkTaskTarget] = useState("");
  const [bulkTaskDeadline, setBulkTaskDeadline] = useState("");
  const [bulkTaskNotes, setBulkTaskNotes] = useState("");
  const [campaignProgress, setCampaignProgress] = useState<Record<string, {
    baseCompleted: number;
    baseApproached: number;
    baseSuccessful: number;
    addCompleted: number;
    addApproached: number;
    addSuccessful: number;
    status: "Pending" | "Partially Completed" | "Completed";
  }>>({});

  const meeting = meetings.find((m) => m.id === meetingId);
  const university = universities.find((u) => u.id === universityId);
  const record = records.find((r) => r.meetingId === meetingId && r.universityId === universityId);

  useEffect(() => {
    if (!record) return;
    setAttendance(record.attendance || "");
    setAttendanceCount(record.attendanceCount || 0);
    setNotes(record.notes || "");
    setActivityReports(record.activityReports || []);
    setCustomActivities(record.customActivities || []);
    setNextMonthTasks(record.nextMonthTasks || []);
  }, [record]);

  const linkedCampaigns = campaigns.filter((g) => g.universityId === universityId && g.startedInMeetingId === meetingId);
  const ongoingCampaigns = campaigns.filter((g) => g.universityId === universityId && g.startedInMeetingId !== meetingId);

  useEffect(() => {
    const progressMap: Record<string, {
      baseCompleted: number;
      baseApproached: number;
      baseSuccessful: number;
      addCompleted: number;
      addApproached: number;
      addSuccessful: number;
      status: "Pending" | "Partially Completed" | "Completed";
    }> = {};
    ongoingCampaigns.forEach((campaign) => {
      progressMap[campaign.id] = {
        baseCompleted: campaign.completedNumber || 0,
        baseApproached: campaign.approachedStudents || 0,
        baseSuccessful: campaign.successfulStudents || 0,
        addCompleted: 0,
        addApproached: 0,
        addSuccessful: 0,
        status: campaign.status === "Not Completed" ? "Pending" : (campaign.status || "Pending"),
      };
    });
    setCampaignProgress(progressMap);
  }, [ongoingCampaigns]);

  useEffect(() => {
    setSelectedTaskIds((prev) => prev.filter((taskId) => nextMonthTasks.some((task) => task.id === taskId)));
  }, [nextMonthTasks]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>('button[data-quick-save="university-report"]')?.click();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>('button[data-quick-save-next="university-report"]')?.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isLoading = mL || uL || rL || aL || cL || scL;
  if (isLoading) return <AppLayout><LoadingSkeleton /></AppLayout>;

  if (!meeting || !university || !record) {
    return (
      <AppLayout>
        <div className="text-center py-20 space-y-2">
          <p className="text-muted-foreground">University meeting report not found</p>
          <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = record.status === "Completed";
  const isAdmin = userRole === "admin";
  const canManageUniversityRecords = isAdmin || !!userPermissions?.canManageUniversityRecords;
  const canManageUniversityCampaigns = isAdmin || !!userPermissions?.canManageUniversityCampaigns;
  const canExportUniversityReports = isAdmin || !!userPermissions?.canExportUniversityReports;
  const isEditable = canManageUniversityRecords && (editing || !isCompleted);
  const nextPendingUniversityId = meeting.universityIds.find((candidateUniversityId) => {
    if (candidateUniversityId === universityId) return false;
    const candidateRecord = records.find((entry) => entry.universityId === candidateUniversityId);
    return candidateRecord?.status !== "Completed";
  });

  // Combine default and custom scenarios
  const allScenarios: UniversityScenario[] = [
    ...DEFAULT_SCENARIOS,
    ...customScenarios.filter((s) => s.status === "Active"),
  ];

  const getScenarioById = (id: string): UniversityScenario | undefined => {
    return allScenarios.find((s) => s.id === id);
  };

  const totalCampaignTarget = linkedCampaigns.reduce((sum, row) => sum + (row.targetNumber || 0), 0);
  const totalCampaignCompleted = linkedCampaigns.reduce((sum, row) => sum + (row.completedNumber || 0), 0);
  const totalApproached = linkedCampaigns.reduce((sum, row) => sum + (row.approachedStudents || 0), 0);
  const totalSuccessful = linkedCampaigns.reduce((sum, row) => sum + (row.successfulStudents || 0), 0);
  const performance = totalCampaignTarget > 0 ? Math.round((totalCampaignCompleted / totalCampaignTarget) * 100) : 0;
  const conversion = totalApproached > 0 ? Math.round((totalSuccessful / totalApproached) * 100) : 0;

  const addActivityReport = (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    setActivityReports((prev) => [
      ...prev,
      { id: `uar_${Date.now()}`, activityId: activity.id, activityName: activity.name, completedQuantity: 0, description: "", notes: "" },
    ]);
  };

  const addCustomActivity = () => {
    setCustomActivities((prev) => [...prev, { id: `uca_${Date.now()}`, name: "", quantity: 0, description: "" }]);
  };

  const addNextMonthTask = () => {
    setNextMonthTasks((prev) => [
      ...prev,
      { id: `unt_${Date.now()}`, taskName: "", activityType: "", targetQuantity: 0, deadline: "", notes: "" },
    ]);
  };

  const toggleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((prev) => {
      if (checked) return prev.includes(taskId) ? prev : [...prev, taskId];
      return prev.filter((id) => id !== taskId);
    });
  };

  const selectMajorityTasks = () => {
    if (nextMonthTasks.length === 0) return;
    const majorityCount = Math.floor(nextMonthTasks.length / 2) + 1;
    setSelectedTaskIds(nextMonthTasks.slice(0, majorityCount).map((task) => task.id));
  };

  const applyBulkToSelectedTasks = () => {
    if (selectedTaskIds.length === 0) {
      toast({ title: "No tasks selected", description: "Select tasks first, then apply bulk values.", variant: "destructive" });
      return;
    }

    setNextMonthTasks((prev) => prev.map((task) => {
      if (!selectedTaskIds.includes(task.id)) return task;

      return {
        ...task,
        activityType: bulkTaskActivityType || task.activityType,
        targetQuantity: bulkTaskTarget !== "" ? Math.max(0, parseInt(bulkTaskTarget, 10) || 0) : task.targetQuantity,
        deadline: bulkTaskDeadline || task.deadline,
        notes: bulkTaskNotes || task.notes,
      };
    }));

    toast({ title: "Applied", description: `Bulk values applied to ${selectedTaskIds.length} selected task(s).` });
  };

  const updateCampaignProgress = (
    campaignId: string,
    field: "addCompleted" | "addApproached" | "addSuccessful" | "status",
    value: number | "Pending" | "Partially Completed" | "Completed",
  ) => {
    setCampaignProgress((prev) => ({
      ...prev,
      [campaignId]: {
        baseCompleted: prev[campaignId]?.baseCompleted || 0,
        baseApproached: prev[campaignId]?.baseApproached || 0,
        baseSuccessful: prev[campaignId]?.baseSuccessful || 0,
        addCompleted: field === "addCompleted" ? (value as number) : (prev[campaignId]?.addCompleted || 0),
        addApproached: field === "addApproached" ? (value as number) : (prev[campaignId]?.addApproached || 0),
        addSuccessful: field === "addSuccessful" ? (value as number) : (prev[campaignId]?.addSuccessful || 0),
        status: field === "status" ? (value as "Pending" | "Partially Completed" | "Completed") : (prev[campaignId]?.status || "Pending"),
      },
    }));
  };

  const exportPdf = () => {
    exportUniversityReportPDF(record, universities, meetings, campaigns);
  };

  const exportExcel = () => {
    exportUniversityReportExcel(record, campaigns);
  };

  const persistReport = async (): Promise<boolean> => {
    if (!canManageUniversityRecords) {
      toast({ title: "Permission required", description: "You do not have access to update university records.", variant: "destructive" });
      return false;
    }

    try {
      await updateRecord.mutateAsync({
        id: record.id,
        status: "Completed",
        notes,
        attendance: attendance as "Present" | "Absent" | "Late" | undefined,
        attendanceCount,
        attendees: record.attendees || [],
        activityReports,
        customActivities,
        nextMonthTasks,
        updatedAt: new Date().toISOString(),
      });

      const updatedCampaigns = ongoingCampaigns.filter((campaign) => {
        const nextState = campaignProgress[campaign.id];
        if (!nextState) return false;
        return (
          nextState.addCompleted !== 0
          || nextState.addApproached !== 0
          || nextState.addSuccessful !== 0
          || nextState.status !== (campaign.status || "Pending")
        );
      });

      for (const campaign of updatedCampaigns) {
        const nextState = campaignProgress[campaign.id];
        if (!nextState) continue;
        await updateCampaign.mutateAsync({
          id: campaign.id,
          completedNumber: Math.max(0, (campaign.completedNumber || 0) + (nextState.addCompleted || 0)),
          approachedStudents: Math.max(0, (campaign.approachedStudents || 0) + (nextState.addApproached || 0)),
          successfulStudents: Math.max(0, (campaign.successfulStudents || 0) + (nextState.addSuccessful || 0)),
          status: nextState.status,
        });
      }

      setEditing(false);
      toast({ title: "Saved", description: "University report, tasks, and campaign progress saved successfully." });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save report.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
      return false;
    }
  };

  const saveReport = async () => {
    await persistReport();
  };

  const saveAndNextUniversity = async () => {
    const saved = await persistReport();
    if (!saved) return;

    if (nextPendingUniversityId) {
      navigate(`/university-meetings/${meetingId}/report/${nextPendingUniversityId}`);
      return;
    }

    toast({ title: "All done", description: "No pending university report left in this meeting." });
    navigate(`/universities/${universityId}`);
  };

  const startCampaignInMeeting = async () => {
    const activity = activities.find((a) => a.id === campaignActivityId);
    const scenario = getScenarioById(campaignScenarioId);
    const target = Number(campaignTarget);

    if (!canManageUniversityCampaigns) {
      toast({ title: "Permission required", description: "You do not have access to create university campaigns.", variant: "destructive" });
      return;
    }

    if (!activity || !Number.isFinite(target) || target <= 0) {
      toast({ title: "Missing fields", description: "Select activity and valid target number.", variant: "destructive" });
      return;
    }

    try {
      await createCampaign.mutateAsync({
        month: meeting.month,
        universityId: university.id,
        universityName: university.name,
        activityId: activity.id,
        activityName: activity.name,
        scenarioId: campaignScenarioId,
        scenarioName: scenario?.name,
        targetNumber: target,
        completedNumber: 0,
        approachedStudents: 0,
        successfulStudents: 0,
        notes: campaignNotes.trim() || undefined,
        status: "Pending",
        startedInMeetingId: meeting.id,
        startedInMeetingTitle: meeting.title,
      });

      setCampaignOpen(false);
      setCampaignActivityId("");
      setCampaignTarget("");
      setCampaignScenarioId("admissions");
      setCampaignNotes("");
      toast({ title: "Campaign started", description: "Campaign linked to this meeting and analytics." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start campaign.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5 max-w-5xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{meeting.title}</h1>
              <Badge variant={record.status === "Completed" ? "default" : "outline"} className="text-[10px]">{record.status}</Badge>
              {editing && <Badge variant="secondary" className="text-[10px]">Editing</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">{university.name} · {meeting.meetingDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && !editing && <Button variant="outline" size="sm" className="text-xs" disabled={!canManageUniversityRecords} onClick={() => setEditing(true)}><Eye className="h-3.5 w-3.5 mr-1" /> Edit Report</Button>}
            <Button variant="outline" size="sm" className="text-xs" disabled={!canExportUniversityReports} onClick={exportPdf}>Export PDF</Button>
            <Button variant="outline" size="sm" className="text-xs" disabled={!canExportUniversityReports} onClick={exportExcel}><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Export Excel</Button>
            <Button data-quick-save="university-report" size="sm" className="text-xs" disabled={!canManageUniversityRecords || updateRecord.isPending || updateCampaign.isPending} onClick={saveReport}><Save className="h-3.5 w-3.5 mr-1" /> {updateRecord.isPending || updateCampaign.isPending ? "Saving..." : "Save"}</Button>
            {nextPendingUniversityId && (
              <Button
                data-quick-save-next="university-report"
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={!canManageUniversityRecords || updateRecord.isPending || updateCampaign.isPending}
                onClick={saveAndNextUniversity}
              >
                <Save className="h-3.5 w-3.5 mr-1" /> Save & Next Pending
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Attendance & Notes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Attendance</Label>
              <Select value={attendance} onValueChange={setAttendance} disabled={!isEditable}>
                <SelectTrigger><SelectValue placeholder="Select attendance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Attendance Count</Label>
              <Input type="number" min={0} value={attendanceCount} disabled={!isEditable} onChange={(e) => setAttendanceCount(Math.max(0, Number(e.target.value) || 0))} />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={notes} disabled={!isEditable} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Activity Reports</CardTitle>
              {isEditable && (
                <Select onValueChange={addActivityReport}>
                  <SelectTrigger className="w-[190px] h-8 text-xs"><SelectValue placeholder="+ Add Activity" /></SelectTrigger>
                  <SelectContent>{activities.filter((a) => a.status === "Active").map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Completed</TableHead><TableHead>Description</TableHead><TableHead>Notes</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {activityReports.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-sm">{row.activityName}</TableCell>
                    <TableCell><Input type="number" className="w-20 h-7 text-xs" disabled={!isEditable} value={row.completedQuantity} onChange={(e) => setActivityReports((prev) => prev.map((item, i) => i === idx ? { ...item, completedQuantity: Number(e.target.value) || 0 } : item))} /></TableCell>
                    <TableCell><Input className="h-7 text-xs" disabled={!isEditable} value={row.description || ""} onChange={(e) => setActivityReports((prev) => prev.map((item, i) => i === idx ? { ...item, description: e.target.value } : item))} /></TableCell>
                    <TableCell><Input className="h-7 text-xs" disabled={!isEditable} value={row.notes || ""} onChange={(e) => setActivityReports((prev) => prev.map((item, i) => i === idx ? { ...item, notes: e.target.value } : item))} /></TableCell>
                    <TableCell className="w-10">{isEditable && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActivityReports((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>}</TableCell>
                  </TableRow>
                ))}
                {activityReports.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-sm">No activity rows</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Custom Activities</CardTitle>
              {isEditable && <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addCustomActivity}><Plus className="h-3 w-3" /> Add Custom Activity</Button>}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Quantity</TableHead><TableHead>Description</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {customActivities.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell><Input className="h-7 text-xs" disabled={!isEditable} value={row.name} onChange={(e) => setCustomActivities((prev) => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))} /></TableCell>
                    <TableCell><Input type="number" className="w-20 h-7 text-xs" disabled={!isEditable} value={row.quantity} onChange={(e) => setCustomActivities((prev) => prev.map((item, i) => i === idx ? { ...item, quantity: Number(e.target.value) || 0 } : item))} /></TableCell>
                    <TableCell><Input className="h-7 text-xs" disabled={!isEditable} value={row.description || ""} onChange={(e) => setCustomActivities((prev) => prev.map((item, i) => i === idx ? { ...item, description: e.target.value } : item))} /></TableCell>
                    <TableCell className="w-10">{isEditable && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCustomActivities((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>}</TableCell>
                  </TableRow>
                ))}
                {customActivities.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">No custom activities</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">Next Month Tasks</CardTitle>
              {isEditable && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={selectMajorityTasks}>Select Majority</Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setSelectedTaskIds([])}>Clear Selection</Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addNextMonthTask}><Plus className="h-3 w-3" /> Add Task</Button>
                </div>
              )}
            </div>
            {isEditable && nextMonthTasks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-3">
                <Select value={bulkTaskActivityType} onValueChange={setBulkTaskActivityType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Bulk activity type" /></SelectTrigger>
                  <SelectContent>{activities.filter((a) => a.status === "Active").map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="h-8 text-xs" type="number" min={0} value={bulkTaskTarget} onChange={(e) => setBulkTaskTarget(e.target.value)} placeholder="Bulk target" />
                <Input className="h-8 text-xs" type="date" value={bulkTaskDeadline} onChange={(e) => setBulkTaskDeadline(e.target.value)} />
                <Input className="h-8 text-xs" value={bulkTaskNotes} onChange={(e) => setBulkTaskNotes(e.target.value)} placeholder="Bulk notes" />
                <Button size="sm" className="h-8 text-xs" onClick={applyBulkToSelectedTasks}>Apply On Selected</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>{isEditable && <TableHead className="w-10">Sel</TableHead>}<TableHead>Task Name</TableHead><TableHead>Type</TableHead><TableHead>Target</TableHead><TableHead>Deadline</TableHead><TableHead>Notes</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {nextMonthTasks.map((row, idx) => (
                  <TableRow key={row.id}>
                    {isEditable && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(row.id)}
                          onChange={(e) => toggleTaskSelection(row.id, e.target.checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell><Input className="h-7 text-xs" disabled={!isEditable} value={row.taskName} onChange={(e) => setNextMonthTasks((prev) => prev.map((item, i) => i === idx ? { ...item, taskName: e.target.value } : item))} /></TableCell>
                    <TableCell><Input className="h-7 text-xs" disabled={!isEditable} value={row.activityType} onChange={(e) => setNextMonthTasks((prev) => prev.map((item, i) => i === idx ? { ...item, activityType: e.target.value } : item))} /></TableCell>
                    <TableCell><Input type="number" className="w-20 h-7 text-xs" disabled={!isEditable} value={row.targetQuantity} onChange={(e) => setNextMonthTasks((prev) => prev.map((item, i) => i === idx ? { ...item, targetQuantity: Number(e.target.value) || 0 } : item))} /></TableCell>
                    <TableCell><Input type="date" className="h-7 text-xs" disabled={!isEditable} value={row.deadline || ""} onChange={(e) => setNextMonthTasks((prev) => prev.map((item, i) => i === idx ? { ...item, deadline: e.target.value } : item))} /></TableCell>
                    <TableCell><Input className="h-7 text-xs" disabled={!isEditable} value={row.notes || ""} onChange={(e) => setNextMonthTasks((prev) => prev.map((item, i) => i === idx ? { ...item, notes: e.target.value } : item))} /></TableCell>
                    <TableCell className="w-10">{isEditable && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNextMonthTasks((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>}</TableCell>
                  </TableRow>
                ))}
                {nextMonthTasks.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">No next month tasks</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Campaigns Started In This Meeting</CardTitle>
              <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1" disabled={!canManageUniversityCampaigns}><Plus className="h-3 w-3" /> Start Campaign</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Campaign In This Meeting</DialogTitle>
                    <DialogDescription>This campaign will be live-linked to university analytics.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 pt-1">
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
                    <div className="space-y-1.5"><Label className="text-xs">Target Number</Label><Input type="number" min={1} value={campaignTarget} onChange={(e) => setCampaignTarget(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea rows={2} value={campaignNotes} onChange={(e) => setCampaignNotes(e.target.value)} /></div>
                    <Button className="w-full" onClick={startCampaignInMeeting} disabled={!canManageUniversityCampaigns || createCampaign.isPending}>{createCampaign.isPending ? "Saving..." : "Save Campaign"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/70 p-3 text-sm">Campaigns: <span className="font-semibold">{linkedCampaigns.length}</span></div>
              <div className="rounded-lg border border-border/70 p-3 text-sm">Target: <span className="font-semibold">{totalCampaignTarget}</span></div>
              <div className="rounded-lg border border-border/70 p-3 text-sm">Approached: <span className="font-semibold">{totalApproached}</span></div>
              <div className="rounded-lg border border-border/70 p-3 text-sm">Successful: <span className="font-semibold">{totalSuccessful}</span></div>
              <div className="rounded-lg border border-border/70 p-3 text-sm">Conversion: <span className="font-semibold">{conversion}%</span></div>
              <div className="rounded-lg border border-border/70 p-3 text-sm">Performance: <span className="font-semibold">{performance}%</span></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Scenario</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Approached</TableHead><TableHead>Successful</TableHead><TableHead>Conversion</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {linkedCampaigns.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium text-sm">{goal.activityName}</TableCell>
                    <TableCell>{goal.scenario || "Custom"}</TableCell>
                    <TableCell className="font-mono">{goal.targetNumber}</TableCell>
                    <TableCell className="font-mono">{goal.completedNumber || 0}</TableCell>
                    <TableCell className="font-mono">{goal.approachedStudents || 0}</TableCell>
                    <TableCell className="font-mono">{goal.successfulStudents || 0}</TableCell>
                    <TableCell className="font-mono text-xs">{(goal.approachedStudents || 0) > 0 ? Math.round(((goal.successfulStudents || 0) / (goal.approachedStudents || 1)) * 100) : 0}%</TableCell>
                    <TableCell><Badge variant={goal.status === "Completed" ? "default" : goal.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{goal.status || "Pending"}</Badge></TableCell>
                  </TableRow>
                ))}
                {linkedCampaigns.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6 text-sm">No campaigns started from this meeting</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Previous Campaign Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Table>
              <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Scenario</TableHead><TableHead>Target</TableHead><TableHead>Base Completed</TableHead><TableHead>Add Completed</TableHead><TableHead>Base Approached</TableHead><TableHead>Add Approached</TableHead><TableHead>Base Successful</TableHead><TableHead>Add Successful</TableHead><TableHead>Conversion</TableHead><TableHead>Status</TableHead><TableHead>Performance</TableHead></TableRow></TableHeader>
              <TableBody>
                {ongoingCampaigns.map((goal) => {
                  const progress = campaignProgress[goal.id] || {
                    baseCompleted: goal.completedNumber || 0,
                    baseApproached: goal.approachedStudents || 0,
                    baseSuccessful: goal.successfulStudents || 0,
                    addCompleted: 0,
                    addApproached: 0,
                    addSuccessful: 0,
                    status: goal.status || "Pending",
                  };
                  const totalApproachedLive = progress.baseApproached + progress.addApproached;
                  const totalSuccessfulLive = progress.baseSuccessful + progress.addSuccessful;
                  const totalCompletedLive = progress.baseCompleted + progress.addCompleted;
                  const conversionPct = totalApproachedLive > 0 ? Math.round((totalSuccessfulLive / totalApproachedLive) * 100) : 0;
                  const pct = goal.targetNumber > 0 ? Math.round((totalCompletedLive / goal.targetNumber) * 100) : 0;
                  return (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium text-sm">{goal.activityName}</TableCell>
                      <TableCell>{goal.scenario || "Custom"}</TableCell>
                      <TableCell className="font-mono">{goal.targetNumber}</TableCell>
                      <TableCell className="font-mono">{progress.baseCompleted}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 h-7 text-xs"
                          disabled={!isEditable}
                          min={0}
                          value={progress.addCompleted}
                          onChange={(e) => updateCampaignProgress(goal.id, "addCompleted", Number(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{progress.baseApproached}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 h-7 text-xs"
                          disabled={!isEditable}
                          min={0}
                          value={progress.addApproached}
                          onChange={(e) => updateCampaignProgress(goal.id, "addApproached", Number(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{progress.baseSuccessful}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 h-7 text-xs"
                          disabled={!isEditable}
                          min={0}
                          value={progress.addSuccessful}
                          onChange={(e) => updateCampaignProgress(goal.id, "addSuccessful", Number(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{conversionPct}%</TableCell>
                      <TableCell>
                        <Select value={progress.status} onValueChange={(value) => updateCampaignProgress(goal.id, "status", value as "Pending" | "Partially Completed" | "Completed")} disabled={!isEditable}>
                          <SelectTrigger className="h-7 text-xs w-[170px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Partially Completed">Partially Completed</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-medium">{pct}%</TableCell>
                    </TableRow>
                  );
                })}
                {ongoingCampaigns.length === 0 && <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-6 text-sm">No previous campaigns to update</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
