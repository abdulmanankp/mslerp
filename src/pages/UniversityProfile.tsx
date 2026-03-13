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
  useUniversityTasks,
  useUniversityMeetings,
  useCreateUniversityMeeting,
  LoadingSkeleton,
} from "@/hooks/useSupabaseData";
import { ArrowLeft, Calendar, ClipboardList, Plus, Target, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

export default function UniversityProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [meetingScope, setMeetingScope] = useState("All");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingMonth, setMeetingMonth] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  const { data: universities = [], isLoading: uL } = useUniversities();
  const { data: coordinators = [], isLoading: cL } = useUniversityCoordinators();
  const { data: goals = [], isLoading: gL } = useUniversityGoals();
  const { data: tasks = [], isLoading: tL } = useUniversityTasks();
  const { data: meetings = [], isLoading: mL } = useUniversityMeetings();
  const createMeeting = useCreateUniversityMeeting();

  if (uL || cL || gL || tL || mL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const university = universities.find((u) => u.id === id);
  if (!university) {
    return <AppLayout><div className="text-center py-20">University not found</div></AppLayout>;
  }

  const currentCoord = coordinators.find((c) => c.id === university.currentCoordinatorId);
  const universityGoals = goals.filter((g) => g.universityId === id);
  const universityTasks = tasks.filter((t) => t.universityId === id);
  const universityMeetings = meetings.filter((m) => m.universityIds.includes(id || ""));

  const handleCreateMeeting = async () => {
    if (!meetingTitle || !meetingMonth || !meetingDate) return;
    const allIds = universities.map((u) => u.id);
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
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Meeting</Button>
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
                <Button className="w-full" disabled={createMeeting.isPending} onClick={handleCreateMeeting}>{createMeeting.isPending ? "Creating..." : "Create Meeting"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Coordinator</p><p className="text-sm font-bold">{currentCoord?.name || "Unassigned"}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Meetings</p><p className="text-lg font-bold">{universityMeetings.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Goals</p><p className="text-lg font-bold">{universityGoals.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Tasks</p><p className="text-lg font-bold">{universityTasks.length}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="meetings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="meetings" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Meetings</TabsTrigger>
            <TabsTrigger value="coordinators" className="gap-1"><Users className="h-3.5 w-3.5" /> Coordinators</TabsTrigger>
            <TabsTrigger value="goals" className="gap-1"><Target className="h-3.5 w-3.5" /> Goals</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /> Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="meetings">
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Month</TableHead><TableHead>Date</TableHead><TableHead>Scope</TableHead></TableRow></TableHeader>
                <TableBody>
                  {universityMeetings.map((m) => (
                    <TableRow key={m.id}><TableCell>{m.title}</TableCell><TableCell>{m.month}</TableCell><TableCell>{m.meetingDate}</TableCell><TableCell>{m.scope}</TableCell></TableRow>
                  ))}
                  {universityMeetings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No meetings</TableCell></TableRow>}
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

          <TabsContent value="goals">
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Activity</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {universityGoals.map((g) => (
                    <TableRow key={g.id}><TableCell>{g.month}</TableCell><TableCell>{g.activityName}</TableCell><TableCell>{g.targetNumber}</TableCell><TableCell>{g.completedNumber || 0}</TableCell><TableCell>{g.status || "Pending"}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
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
      </div>
    </AppLayout>
  );
}
