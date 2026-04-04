import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDistricts, useCoordinators, useDistrictMeetingRecords, useGoals, useTasks, useMeetings, useActivities, useCreateMeeting, useZones, useUpdateDistrict, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, Target, ClipboardList, FileText, Plus, Download, Eye, History, Edit } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ZoneName } from "@/types";

export default function DistrictProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [editZoneOpen, setEditZoneOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingMonth, setMeetingMonth] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const createMeeting = useCreateMeeting();
  const updateDistrict = useUpdateDistrict();
  const { toast } = useToast();

  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: coordinators = [], isLoading: cL } = useCoordinators();
  const { data: dmRecords = [], isLoading: rL } = useDistrictMeetingRecords();
  const { data: goals = [], isLoading: gL } = useGoals();
  const { data: tasks = [], isLoading: tL } = useTasks();
  const { data: meetings = [], isLoading: mL } = useMeetings();
  const { data: activities = [] } = useActivities();

  if (dL || zL || cL || rL || gL || tL || mL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const district = districts.find(d => d.id === id);
  if (!district) {
    return <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">District not found</p><Button variant="ghost" onClick={() => navigate("/districts")}>Go Back</Button></div></AppLayout>;
  }

  const currentCoord = coordinators.find(c => c.id === district.currentCoordinatorId);
  const previousCoords = coordinators.filter(c => c.districtId === id && c.status === "Expired");
  const districtRecords = dmRecords.filter(r => r.districtId === id);
  const districtGoals = goals.filter(g => g.districtId === id);
  const districtTasks = tasks.filter(t => t.districtId === id);

  const allMeetingsForDistrict = meetings
    .filter(m => m.districtIds.includes(id!))
    .map(m => ({ meeting: m, record: districtRecords.find(r => r.meetingId === m.id) }))
    .sort((a, b) => b.meeting.meetingDate.localeCompare(a.meeting.meetingDate));

  const activityChartData = districtRecords.flatMap(r => r.activityReports).reduce((acc, ar) => {
    const existing = acc.find(a => a.name === ar.activityName);
    if (existing) existing.count += ar.completedQuantity;
    else acc.push({ name: ar.activityName.length > 12 ? ar.activityName.substring(0, 12) + "…" : ar.activityName, count: ar.completedQuantity });
    return acc;
  }, [] as { name: string; count: number }[]);

  const totalActivities = districtRecords.reduce((sum, r) => sum + r.activityReports.reduce((s, ar) => s + ar.completedQuantity, 0), 0);

  const months = [...new Set(districtRecords.map(r => r.month))].sort().reverse();
  const filteredRecords = selectedMonth === "all" ? districtRecords : districtRecords.filter(r => r.month === selectedMonth);
  const filteredGoals = selectedMonth === "all" ? districtGoals : districtGoals.filter(g => g.month === selectedMonth);

  const handleCreateDistrictMeeting = async () => {
    if (!meetingTitle || !meetingMonth || !meetingDate) {
      toast({ title: "Missing fields", description: "Title, month and meeting date are required.", variant: "destructive" });
      return;
    }

    try {
      await createMeeting.mutateAsync({
        title: meetingTitle,
        month: meetingMonth,
        meetingDate,
        agenda: meetingAgenda,
        notes: meetingNotes,
        scope: "Selected",
        districtIds: [district.id],
      });
      toast({ title: "Meeting created", description: `Meeting created for ${district.name}.` });
      setCreateMeetingOpen(false);
      setMeetingTitle("");
      setMeetingMonth("");
      setMeetingDate("");
      setMeetingAgenda("");
      setMeetingNotes("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create meeting.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleUpdateZone = async () => {
    if (!selectedZone || selectedZone === district.zone) {
      toast({ title: "No changes", description: "Please select a different zone.", variant: "destructive" });
      return;
    }

    try {
      await updateDistrict.mutateAsync({
        districtId: district.id!,
        updates: { zone: selectedZone as ZoneName },
      });
      toast({ title: "Zone updated", description: `Zone changed to ${selectedZone}.` });
      setEditZoneOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update zone.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
                <div className="flex justify-end mb-2">
                  <Dialog open={createMeetingOpen} onOpenChange={setCreateMeetingOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 shadow-sm"><Plus className="h-4 w-4" /> Create Meeting for this District</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create Meeting for {district.name}</DialogTitle>
                        <DialogDescription>Meeting will be linked to this district.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2"><Label>Meeting Title</Label><Input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} placeholder="e.g., April Monthly Review" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>Month</Label><Input type="month" value={meetingMonth} onChange={e => setMeetingMonth(e.target.value)} /></div>
                          <div className="space-y-2"><Label>Meeting Date</Label><Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} /></div>
                        </div>
                        <div className="space-y-2"><Label>Agenda</Label><Textarea value={meetingAgenda} onChange={e => setMeetingAgenda(e.target.value)} placeholder="Meeting agenda..." rows={3} /></div>
                        <div className="space-y-2"><Label>Notes (Optional)</Label><Textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="Additional notes..." rows={2} /></div>
                        <div className="space-y-2"><Label>District</Label><Input value={district.name} disabled /></div>
                        <Button className="w-full" disabled={createMeeting.isPending} onClick={handleCreateDistrictMeeting}>{createMeeting.isPending ? "Creating..." : "Create Meeting"}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/districts")} className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{district.name}</h1>
              <p className="text-muted-foreground text-sm">{district.zone} · {district.division} Division</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={editZoneOpen} onOpenChange={setEditZoneOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs"
                  onClick={() => setSelectedZone(district.zone)}
                >
                  <Edit className="h-3 w-3" /> Change Zone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Change District Zone</DialogTitle>
                  <DialogDescription>Update {district.name} to a different zone.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">New Zone</Label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a zone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.name}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-xs text-muted-foreground">
                    <p><strong>Current Zone:</strong> {district.zone}</p>
                    <p className="mt-1"><strong>New Zone:</strong> {selectedZone || "—"}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditZoneOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleUpdateZone} disabled={updateDistrict.isPending || !selectedZone || selectedZone === district.zone}>
                      {updateDistrict.isPending ? "Updating..." : "Update Zone"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Badge variant={district.status === "Active" ? "default" : "secondary"} className="text-xs shrink-0">{district.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Population</p><p className="text-lg font-bold font-mono">{district.population?.toLocaleString() || "—"}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Coordinator</p><p className="text-sm font-bold truncate">{currentCoord?.name || "Unassigned"}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Meetings</p><p className="text-lg font-bold">{allMeetingsForDistrict.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Activities Done</p><p className="text-lg font-bold">{totalActivities}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Goals</p><p className="text-lg font-bold">{districtGoals.filter(g => g.status === "Pending").length}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="meetings" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="meetings" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Meetings</TabsTrigger>
            <TabsTrigger value="monthly-records" className="gap-1.5"><History className="h-3.5 w-3.5" /> Monthly Records</TabsTrigger>
            <TabsTrigger value="overview" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="coordinators" className="gap-1.5"><User className="h-3.5 w-3.5" /> Coordinators</TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Goals</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-4">
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Meeting</TableHead><TableHead>Month</TableHead><TableHead>Date</TableHead><TableHead>Report Status</TableHead><TableHead>Attendance</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {allMeetingsForDistrict.map(({ meeting, record }) => (
                    <TableRow key={meeting.id}>
                      <TableCell className="font-medium text-sm">{meeting.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{meeting.month}</TableCell>
                      <TableCell className="text-xs">{meeting.meetingDate}</TableCell>
                      <TableCell><Badge variant={record?.status === "Completed" ? "default" : "outline"} className="text-[10px]">{record?.status || "Empty"}</Badge></TableCell>
                      <TableCell>{record?.attendance ? <Badge variant={record.attendance === "Present" ? "default" : record.attendance === "Late" ? "secondary" : "destructive"} className="text-[10px]">{record.attendance}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/meetings/${meeting.id}/report/${district.id}`)}>
                          {record?.status === "Completed" ? <><Eye className="h-3 w-3" /> View</> : <><Plus className="h-3 w-3" /> Add Report</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {allMeetingsForDistrict.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10 text-sm">No meetings assigned</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="monthly-records" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Previous Monthly Records</h3>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by month" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Months</SelectItem>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">Activity Reports by Month</CardTitle></CardHeader><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Meeting</TableHead><TableHead>Activities Done</TableHead><TableHead>Attendance</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-sm">{record.month}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{record.meetingTitle}</TableCell>
                      <TableCell className="font-mono text-sm">{record.activityReports.reduce((s, ar) => s + ar.completedQuantity, 0)}</TableCell>
                      <TableCell>{record.attendance ? <Badge variant={record.attendance === "Present" ? "default" : "secondary"} className="text-[10px]">{record.attendance}</Badge> : "—"}</TableCell>
                      <TableCell><Badge variant={record.status === "Completed" ? "default" : "outline"} className="text-[10px]">{record.status}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/meetings/${record.meetingId}/report/${district.id}`)}><Eye className="h-3 w-3" /> View</Button></TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No records</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>

            <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">Goals Progress</CardTitle></CardHeader><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Activity</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Progress</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredGoals.map(g => {
                    const progress = g.targetNumber > 0 ? Math.round(((g.completedNumber || 0) / g.targetNumber) * 100) : 0;
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium text-sm">{g.month}</TableCell>
                        <TableCell className="text-sm">{g.activityName}</TableCell>
                        <TableCell className="font-mono">{g.targetNumber}</TableCell>
                        <TableCell className="font-mono">{g.completedNumber || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                            <span className="text-[10px] font-mono text-muted-foreground">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredGoals.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No goals</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            {activityChartData.length > 0 && (
              <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">Activities Summary</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityChartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}
            <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">District Information</CardTitle></CardHeader><CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs">Zone:</span> <span className="font-medium ml-1">{district.zone}</span></div>
                <div><span className="text-muted-foreground text-xs">Division:</span> <span className="font-medium ml-1">{district.division}</span></div>
                <div><span className="text-muted-foreground text-xs">Created:</span> <span className="font-medium ml-1">{district.createdDate}</span></div>
                <div><span className="text-muted-foreground text-xs">Status:</span> <span className="font-medium ml-1">{district.status}</span></div>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="coordinators" className="space-y-4">
            {currentCoord ? (
              <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" />Current Coordinator</CardTitle></CardHeader><CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs">Name:</span><p className="font-medium">{currentCoord.name}</p></div>
                  <div><span className="text-muted-foreground text-xs">Phone:</span><p className="font-medium">{currentCoord.phone}</p></div>
                  <div><span className="text-muted-foreground text-xs">Joined:</span><p className="font-medium">{currentCoord.joiningDate}</p></div>
                  <div><span className="text-muted-foreground text-xs">Activities:</span><p className="font-medium">{currentCoord.totalActivities}</p></div>
                </div>
              </CardContent></Card>
            ) : (
              <Card className="border-none shadow-sm"><CardContent className="p-6 text-center"><p className="text-muted-foreground text-sm">No coordinator assigned</p><Button variant="outline" size="sm" className="mt-3 gap-1"><Plus className="h-3 w-3" /> Assign Coordinator</Button></CardContent></Card>
            )}
            {previousCoords.length > 0 && (
              <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm">Previous Coordinators</CardTitle></CardHeader><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Activities</TableHead><TableHead>Attendance</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {previousCoords.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-sm">{c.name}</TableCell><TableCell className="text-xs">{c.phone}</TableCell><TableCell className="text-xs">{c.joiningDate}</TableCell>
                        <TableCell className="text-xs">{c.endDate}</TableCell><TableCell className="text-sm">{c.totalActivities}</TableCell><TableCell className="text-sm">{c.attendanceRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Assigned Goals</h3>
              <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Assign Goal</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Assign Goal to {district.name}</DialogTitle><DialogDescription>Set a monthly activity goal.</DialogDescription></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label className="text-xs">District</Label><Input value={district.name} disabled className="bg-muted/50" /></div>
                      <div className="space-y-2"><Label className="text-xs">Zone</Label><Input value={district.zone} disabled className="bg-muted/50" /></div>
                    </div>
                    <div className="space-y-2"><Label className="text-xs">Activity</Label>
                      <Select><SelectTrigger><SelectValue placeholder="Select activity..." /></SelectTrigger>
                        <SelectContent>{activities.filter(a => a.status === "Active").map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label className="text-xs">Month</Label><Input type="month" /></div>
                      <div className="space-y-2"><Label className="text-xs">Target Number</Label><Input type="number" placeholder="e.g., 10" /></div>
                    </div>
                    <div className="space-y-2"><Label className="text-xs">Notes (Optional)</Label><Textarea placeholder="Goal notes..." rows={2} /></div>
                    <Button className="w-full" onClick={() => setGoalDialogOpen(false)}>Assign Goal</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Month</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {districtGoals.map(g => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium text-sm">{g.activityName}</TableCell><TableCell className="text-xs">{g.month}</TableCell>
                      <TableCell className="font-mono">{g.targetNumber}</TableCell><TableCell className="font-mono">{g.completedNumber || "—"}</TableCell>
                      <TableCell><Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {districtGoals.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">No goals assigned</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Assigned Tasks</h3>
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Add Task</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Add Task for {district.name}</DialogTitle><DialogDescription>Assign a new task to this district.</DialogDescription></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2"><Label className="text-xs">Task Title</Label><Input placeholder="e.g., Organize Quran Classes" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label className="text-xs">Start Date</Label><Input type="date" /></div>
                      <div className="space-y-2"><Label className="text-xs">Deadline</Label><Input type="date" /></div>
                    </div>
                    <div className="space-y-2"><Label className="text-xs">Priority</Label>
                      <Select defaultValue="Medium"><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={() => setTaskDialogOpen(false)}>Add Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {districtTasks.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">{t.title}</TableCell>
                      <TableCell><Badge variant={t.priority === "Critical" || t.priority === "High" ? "destructive" : "secondary"} className="text-[10px]">{t.priority}</Badge></TableCell>
                      <TableCell className="text-xs">{t.deadline}</TableCell>
                      <TableCell><Badge variant={t.status === "Completed" ? "default" : "outline"} className="text-[10px]">{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {districtTasks.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">No tasks assigned</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
