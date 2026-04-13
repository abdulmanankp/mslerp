import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDistrictMeetingRecords, useDistricts, useMeetings, useActivities, useGoals, useUpdateDistrictMeetingRecord, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Download, Save, Pencil, X, ListTodo, MessageSquare, ClipboardList, Trash2, Target } from "lucide-react";
import { useState, useEffect } from "react";
import type { ActivityReport, CustomActivity, DistrictMediaReport, MeetingAttendee, NextMonthTask } from "@/types";
import { exportDistrictReportPDF, exportDistrictReportExcel } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

export default function MeetingReport() {
  const { meetingId, districtId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: dmRecords = [], isLoading: rL } = useDistrictMeetingRecords(meetingId);
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: meetings = [], isLoading: mL } = useMeetings();
  const { data: activitiesList = [], isLoading: aL } = useActivities();
  const { data: goals = [] } = useGoals();
  const updateDistrictMeetingRecord = useUpdateDistrictMeetingRecord();

  const record = dmRecords.find(r => r.meetingId === meetingId && r.districtId === districtId);
  const district = districts.find(d => d.id === districtId);
  const meeting = meetings.find(m => m.id === meetingId);
  const previousGoals = goals.filter(g => g.districtId === districtId && g.month === meeting?.month);

  const [editing, setEditing] = useState(false);
  const [activityReports, setActivityReports] = useState<ActivityReport[]>([]);
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [nextMonthTasks, setNextMonthTasks] = useState<NextMonthTask[]>([]);
  const [notes, setNotes] = useState("");
  const [attendance, setAttendance] = useState("");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [vision12KCount, setVision12KCount] = useState(0);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [mediaReport, setMediaReport] = useState<DistrictMediaReport>({
    contentProduction: 0,
    reels: 0,
    mediaPosting: 0,
    hasFacebookPage: false,
    facebookFollowers: 0,
    postingFrequency: "Weekly",
  });
  const [includeMediaReport, setIncludeMediaReport] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkTaskActivityType, setBulkTaskActivityType] = useState("");
  const [bulkTaskTarget, setBulkTaskTarget] = useState("");
  const [bulkTaskDeadline, setBulkTaskDeadline] = useState("");
  const [bulkTaskNotes, setBulkTaskNotes] = useState("");

  useEffect(() => {
    if (record) {
      setActivityReports(record.activityReports || []);
      setCustomActivities(record.customActivities || []);
      setNextMonthTasks(record.nextMonthTasks || []);
      setNotes(record.notes || "");
      setAttendance(record.attendance || "");
      setAttendanceCount(record.attendanceCount || 0);
      setVision12KCount(record.vision12KCount || 0);
      setAttendees(record.attendees || []);
      const hasMedia = !!record.mediaReport;
      setIncludeMediaReport(hasMedia);
      setMediaReport(record.mediaReport || {
        contentProduction: 0,
        reels: 0,
        mediaPosting: 0,
        hasFacebookPage: false,
        facebookFollowers: 0,
        postingFrequency: "Weekly",
      });
    }
  }, [record]);

  useEffect(() => {
    setSelectedTaskIds((prev) => prev.filter((taskId) => nextMonthTasks.some((task) => task.id === taskId)));
  }, [nextMonthTasks]);

  if (rL || dL || mL || aL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  if (!district || !meeting) {
    return (
      <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">Report not found</p><Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button></div></AppLayout>
    );
  }

  const isCompleted = record?.status === "Completed";
  const isEditable = editing || !isCompleted;
  const nextPendingDistrictId = meeting.districtIds.find((candidateDistrictId) => {
    if (candidateDistrictId === districtId) return false;
    const candidateRecord = dmRecords.find((entry) => entry.districtId === candidateDistrictId);
    return candidateRecord?.status !== "Completed";
  });

  const handleUpdateActivityReport = (index: number, field: keyof ActivityReport, value: string | number) => {
    setActivityReports(prev => prev.map((ar, i) => i === index ? { ...ar, [field]: value } : ar));
  };
  const handleDeleteActivityReport = (index: number) => setActivityReports(prev => prev.filter((_, i) => i !== index));
  const handleAddActivityReport = (activityId: string, activityName: string) => {
    setActivityReports(prev => [...prev, { id: `ar_new_${Date.now()}`, activityId, activityName, completedQuantity: 0, description: "", notes: "" }]);
  };
  const handleUpdateCustomActivity = (index: number, field: keyof CustomActivity, value: string | number) => {
    setCustomActivities(prev => prev.map((ca, i) => i === index ? { ...ca, [field]: value } : ca));
  };
  const handleDeleteCustomActivity = (index: number) => setCustomActivities(prev => prev.filter((_, i) => i !== index));
  const handleAddCustomActivity = () => setCustomActivities(prev => [...prev, { id: `ca_new_${Date.now()}`, name: "", quantity: 0, description: "" }]);
  const handleUpdateTask = (index: number, field: keyof NextMonthTask, value: string | number) => {
    setNextMonthTasks(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };
  const handleDeleteTask = (index: number) => setNextMonthTasks(prev => prev.filter((_, i) => i !== index));
  const handleAddTask = () => setNextMonthTasks(prev => [...prev, { id: `nmt_new_${Date.now()}`, taskName: "", activityType: "", targetQuantity: 0, deadline: "", notes: "" }]);
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
  const handleAttendanceCountChange = (raw: string) => {
    const count = Math.max(0, parseInt(raw, 10) || 0);
    setAttendanceCount(count);
    setAttendees((prev) => {
      const base = prev.slice(0, count);
      while (base.length < count) {
        base.push({ id: `att_${Date.now()}_${base.length}`, name: "", designation: "" });
      }
      return base;
    });
  };
  const handleUpdateAttendee = (index: number, field: keyof MeetingAttendee, value: string) => {
    setAttendees((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const updateMediaMetric = (field: keyof DistrictMediaReport, raw: string) => {
    const value = Math.max(0, parseInt(raw, 10) || 0);
    setMediaReport((prev) => ({ ...prev, [field]: value }));
  };

  const persistReport = async (): Promise<boolean> => {
    if (!record?.id) {
      toast({ title: "Record not found", description: "Unable to save this report.", variant: "destructive" });
      return false;
    }

    try {
      await updateDistrictMeetingRecord.mutateAsync({
        id: record.id,
        status: "Completed",
        notes,
        attendance: attendance as "Present" | "Absent" | "Late" | undefined,
        attendanceCount,
        vision12KCount,
        attendees,
        mediaReport: includeMediaReport ? mediaReport : null,
        activityReports,
        customActivities,
        nextMonthTasks,
        updatedAt: new Date().toISOString(),
      });

      setEditing(false);
      toast({ title: "Saved", description: "Meeting report saved to Firebase." });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save report.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
      return false;
    }
  };

  const handleSaveReport = async () => {
    await persistReport();
  };

  const handleSaveAndNext = async () => {
    const saved = await persistReport();
    if (!saved) return;

    if (nextPendingDistrictId) {
      navigate(`/meetings/${meetingId}/report/${nextPendingDistrictId}`);
      return;
    }

    toast({ title: "All done", description: "No pending district report left in this meeting." });
    navigate(`/meetings/${meetingId}`);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSaveReport();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void handleSaveAndNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [meetingId, nextPendingDistrictId, updateDistrictMeetingRecord.isPending]);

  return (
    <AppLayout>
      <div className="space-y-5 max-w-5xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{meeting.title}</h1>
              <Badge variant={isCompleted ? "default" : "outline"} className="text-[10px]">{record?.status || "Empty"}</Badge>
              {editing && <Badge variant="secondary" className="text-[10px]">Editing</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">{district.name} · {district.zone} · {meeting.meetingDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && !editing && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /> Edit Report</Button>
            )}
            {editing && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /> Cancel</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => record && exportDistrictReportPDF(record, districts, meetings)}><FileText className="h-3.5 w-3.5 mr-2" /> Export as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => record && exportDistrictReportExcel(record, districts)}><FileText className="h-3.5 w-3.5 mr-2" /> Export as Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="gap-1.5 text-xs" onClick={handleSaveReport} disabled={updateDistrictMeetingRecord.isPending}><Save className="h-3.5 w-3.5" /> {updateDistrictMeetingRecord.isPending ? "Saving..." : "Save"}</Button>
            {nextPendingDistrictId && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={handleSaveAndNext}
                disabled={updateDistrictMeetingRecord.isPending}
              >
                <Save className="h-3.5 w-3.5" /> Save & Next Pending
              </Button>
            )}
          </div>
        </div>

        {previousGoals.length > 0 && (
          <Card className="border-none shadow-sm border-l-4 border-l-warning">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ListTodo className="h-4 w-4 text-warning" />Previous Goals Progress Report</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Goal</TableHead><TableHead>Completed</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                <TableBody>
                  {previousGoals.map(g => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium text-sm">{g.activityName}</TableCell>
                      <TableCell className="font-mono">{g.targetNumber}</TableCell>
                      <TableCell>{isEditable ? <Input type="number" className="w-20 h-7 text-xs" defaultValue={g.completedNumber} placeholder="0" /> : <span className="font-mono font-semibold">{g.completedNumber ?? "—"}</span>}</TableCell>
                      <TableCell>{isEditable ? (
                        <Select defaultValue={g.status || "Pending"}><SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Partially Completed">Partially Completed</SelectItem><SelectItem value="Not Completed">Not Completed</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select>
                      ) : <Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{g.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Vision 12K Attachment Report</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditable ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">People attached with us in Vision 12K</Label>
                <Input
                  type="number"
                  min={0}
                  value={vision12KCount}
                  onChange={(e) => setVision12KCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Update this count for each meeting report.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">Vision 12K attached people</p>
                <p className="mt-1 text-lg font-semibold font-mono">{vision12KCount || 0}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Activity Reports</CardTitle>
              {isEditable && (
                <Select onValueChange={(val) => { const act = activitiesList.find(a => a.id === val); if (act) handleAddActivityReport(act.id, act.name); }}>
                  <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="+ Add Activity" /></SelectTrigger>
                  <SelectContent>{activitiesList.filter(a => a.status === "Active").map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Completed</TableHead><TableHead>Description</TableHead><TableHead>Notes</TableHead>{isEditable && <TableHead className="w-10"></TableHead>}</TableRow></TableHeader>
              <TableBody>
                {activityReports.map((ar, i) => (
                  <TableRow key={ar.id}>
                    <TableCell className="font-medium text-sm">{ar.activityName}</TableCell>
                    <TableCell>{isEditable ? <Input type="number" className="w-20 h-7 text-xs" value={ar.completedQuantity} onChange={e => handleUpdateActivityReport(i, "completedQuantity", parseInt(e.target.value) || 0)} /> : <span className="font-mono font-semibold">{ar.completedQuantity}</span>}</TableCell>
                    <TableCell>{isEditable ? <Input className="h-7 text-xs" value={ar.description || ""} onChange={e => handleUpdateActivityReport(i, "description", e.target.value)} placeholder="Description" /> : <span className="text-xs text-muted-foreground">{ar.description || "—"}</span>}</TableCell>
                    <TableCell>{isEditable ? <Input className="h-7 text-xs" value={ar.notes || ""} onChange={e => handleUpdateActivityReport(i, "notes", e.target.value)} placeholder="Notes" /> : <span className="text-xs text-muted-foreground">{ar.notes || "—"}</span>}</TableCell>
                    {isEditable && <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteActivityReport(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>}
                  </TableRow>
                ))}
                {activityReports.length === 0 && <TableRow><TableCell colSpan={isEditable ? 5 : 4} className="text-center text-muted-foreground py-6 text-sm">{isEditable ? "Use the dropdown above to add activities" : "No activity reports"}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Custom Activities</CardTitle>
              {isEditable && <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddCustomActivity}><Plus className="h-3 w-3" /> Add Custom</Button>}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {customActivities.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Quantity</TableHead><TableHead>Description</TableHead>{isEditable && <TableHead className="w-10"></TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {customActivities.map((ca, i) => (
                    <TableRow key={ca.id}>
                      <TableCell>{isEditable ? <Input className="h-7 text-xs" value={ca.name} onChange={e => handleUpdateCustomActivity(i, "name", e.target.value)} placeholder="Activity name" /> : <span className="font-medium text-sm">{ca.name}</span>}</TableCell>
                      <TableCell>{isEditable ? <Input type="number" className="w-20 h-7 text-xs" value={ca.quantity} onChange={e => handleUpdateCustomActivity(i, "quantity", parseInt(e.target.value) || 0)} /> : <span className="font-mono">{ca.quantity}</span>}</TableCell>
                      <TableCell>{isEditable ? <Input className="h-7 text-xs" value={ca.description || ""} onChange={e => handleUpdateCustomActivity(i, "description", e.target.value)} placeholder="Description" /> : <span className="text-xs text-muted-foreground">{ca.description || "—"}</span>}</TableCell>
                      {isEditable && <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCustomActivity(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">{isEditable ? "Click 'Add Custom' to add non-standard activities" : "No custom activities reported."}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm">Media Department Report (Optional)</CardTitle>
              {isEditable && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Add media report</span>
                  <Switch checked={includeMediaReport} onCheckedChange={setIncludeMediaReport} />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditable ? (
              includeMediaReport ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Content Production</Label>
                  <Input type="number" min={0} value={mediaReport.contentProduction} onChange={(e) => updateMediaMetric("contentProduction", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reels</Label>
                  <Input type="number" min={0} value={mediaReport.reels} onChange={(e) => updateMediaMetric("reels", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Media Posting</Label>
                  <Input type="number" min={0} value={mediaReport.mediaPosting} onChange={(e) => updateMediaMetric("mediaPosting", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Facebook Page Available</Label>
                  <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                    <Switch
                      checked={mediaReport.hasFacebookPage}
                      onCheckedChange={(checked) => {
                        setMediaReport((prev) => ({
                          ...prev,
                          hasFacebookPage: checked,
                          facebookFollowers: checked ? prev.facebookFollowers : 0,
                        }));
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{mediaReport.hasFacebookPage ? "Yes" : "No"}</span>
                  </div>
                </div>

                {mediaReport.hasFacebookPage && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Facebook Followers</Label>
                      <Input type="number" min={0} value={mediaReport.facebookFollowers} onChange={(e) => updateMediaMetric("facebookFollowers", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Posting Frequency</Label>
                      <Select
                        value={mediaReport.postingFrequency}
                        onValueChange={(value) => setMediaReport((prev) => ({
                          ...prev,
                          postingFrequency: value as DistrictMediaReport["postingFrequency"],
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Rarely">Rarely</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              ) : (
                <p className="text-sm text-muted-foreground">Media report is optional. Enable the switch to add media metrics.</p>
              )
            ) : (
              includeMediaReport ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">Content: <span className="font-semibold">{mediaReport.contentProduction || 0}</span></div>
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">Reels: <span className="font-semibold">{mediaReport.reels || 0}</span></div>
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">Posts: <span className="font-semibold">{mediaReport.mediaPosting || 0}</span></div>
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">Facebook Page: <span className="font-semibold">{mediaReport.hasFacebookPage ? "Yes" : "No"}</span></div>
                  {mediaReport.hasFacebookPage && (
                    <>
                      <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">Followers: <span className="font-semibold">{mediaReport.facebookFollowers || 0}</span></div>
                      <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">Frequency: <span className="font-semibold">{mediaReport.postingFrequency}</span></div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No media report added.</p>
              )
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Notes & Comments</CardTitle></CardHeader>
          <CardContent>
            {isEditable ? <Textarea placeholder="Enter meeting notes, challenges faced, achievements, support needed..." rows={4} value={notes} onChange={e => setNotes(e.target.value)} /> : <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes || "No notes added."}</p>}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2"><ListTodo className="h-4 w-4 text-primary" /> Next Month Tasks</CardTitle>
              {isEditable && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={selectMajorityTasks}>Select Majority</Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setSelectedTaskIds([])}>Clear Selection</Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddTask}><Plus className="h-3 w-3" /> Add Task</Button>
                </div>
              )}
            </div>
            {isEditable && nextMonthTasks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-3">
                <Select value={bulkTaskActivityType} onValueChange={setBulkTaskActivityType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Bulk activity type" /></SelectTrigger>
                  <SelectContent>{activitiesList.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="h-8 text-xs" type="number" min={0} value={bulkTaskTarget} onChange={(e) => setBulkTaskTarget(e.target.value)} placeholder="Bulk target" />
                <Input className="h-8 text-xs" type="date" value={bulkTaskDeadline} onChange={(e) => setBulkTaskDeadline(e.target.value)} />
                <Input className="h-8 text-xs" value={bulkTaskNotes} onChange={(e) => setBulkTaskNotes(e.target.value)} placeholder="Bulk notes" />
                <Button size="sm" className="h-8 text-xs" onClick={applyBulkToSelectedTasks}>Apply On Selected</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {nextMonthTasks.length > 0 ? (
              <Table>
                <TableHeader><TableRow>{isEditable && <TableHead className="w-10">Sel</TableHead>}<TableHead>Task</TableHead><TableHead>Activity Type</TableHead><TableHead>Target</TableHead><TableHead>Deadline</TableHead><TableHead>Notes</TableHead>{isEditable && <TableHead className="w-10"></TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {nextMonthTasks.map((t, i) => (
                    <TableRow key={t.id}>
                      {isEditable && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(t.id)}
                            onChange={(e) => toggleTaskSelection(t.id, e.target.checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell>{isEditable ? <Input className="h-7 text-xs" value={t.taskName} onChange={e => handleUpdateTask(i, "taskName", e.target.value)} placeholder="Task name" /> : <span className="font-medium text-sm">{t.taskName}</span>}</TableCell>
                      <TableCell>{isEditable ? (
                        <Select value={t.activityType} onValueChange={val => handleUpdateTask(i, "activityType", val)}>
                          <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                          <SelectContent>{activitiesList.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <span className="text-xs">{t.activityType}</span>}</TableCell>
                      <TableCell>{isEditable ? <Input type="number" className="w-20 h-7 text-xs" value={t.targetQuantity} onChange={e => handleUpdateTask(i, "targetQuantity", parseInt(e.target.value) || 0)} /> : <span className="font-mono">{t.targetQuantity}</span>}</TableCell>
                      <TableCell>{isEditable ? <Input type="date" className="h-7 text-xs" value={t.deadline || ""} onChange={e => handleUpdateTask(i, "deadline", e.target.value)} /> : <span className="text-xs">{t.deadline || "—"}</span>}</TableCell>
                      <TableCell>{isEditable ? <Input className="h-7 text-xs" value={t.notes || ""} onChange={e => handleUpdateTask(i, "notes", e.target.value)} placeholder="Notes" /> : <span className="text-xs text-muted-foreground">{t.notes || "—"}</span>}</TableCell>
                      {isEditable && <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteTask(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">{isEditable ? "Click 'Add Task' to assign next month tasks" : "No tasks assigned."}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Attendance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isEditable ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Attendance Status</p>
                    <Select value={attendance} onValueChange={setAttendance}>
                      <SelectTrigger className="w-[170px]"><SelectValue placeholder="Select attendance" /></SelectTrigger>
                      <SelectContent><SelectItem value="Present">Present</SelectItem><SelectItem value="Absent">Absent</SelectItem><SelectItem value="Late">Late</SelectItem></SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Attendees Count</p>
                    <Input
                      type="number"
                      min={0}
                      className="w-[170px]"
                      value={attendanceCount}
                      onChange={(e) => handleAttendanceCountChange(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                {attendanceCount > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Attendees (Optional Name and Designation)</p>
                    <div className="space-y-2">
                      {attendees.map((person, index) => (
                        <div key={person.id} className="grid grid-cols-1 gap-2 md:grid-cols-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                          <Input
                            value={person.name || ""}
                            onChange={(e) => handleUpdateAttendee(index, "name", e.target.value)}
                            placeholder={`Attendee ${index + 1} name (optional)`}
                          />
                          <Input
                            value={person.designation || ""}
                            onChange={(e) => handleUpdateAttendee(index, "designation", e.target.value)}
                            placeholder="Designation (e.g. Media Coordinator)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Badge variant={attendance === "Present" ? "default" : attendance === "Late" ? "secondary" : "destructive"}>{attendance || "Not Recorded"}</Badge>
                <p className="text-sm text-muted-foreground">Attendees Count: {attendanceCount || 0}</p>
                {(attendees || []).length > 0 && (
                  <div className="space-y-1.5">
                    {attendees.map((person, index) => (
                      <p key={person.id} className="text-sm text-muted-foreground">
                        {index + 1}. {person.name?.trim() || "Unnamed attendee"}
                        {person.designation?.trim() ? ` - ${person.designation}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
