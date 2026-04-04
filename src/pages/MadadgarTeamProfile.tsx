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
import {
  useMadadgarTeams,
  useMadadgarCoordinators,
  useMadadgarGoals,
  useMadadgarTasks,
  useMadadgarMeetings,
  useCreateMadadgarMeeting,
  LoadingSkeleton,
} from "@/hooks/useFirebaseData";
import { ArrowLeft, Calendar, ClipboardList, Plus, Target, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

export default function MadadgarTeamProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingMonth, setMeetingMonth] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");

  const { data: teams = [], isLoading: tmL } = useMadadgarTeams();
  const { data: coordinators = [], isLoading: cL } = useMadadgarCoordinators();
  const { data: goals = [], isLoading: gL } = useMadadgarGoals();
  const { data: tasks = [], isLoading: tL } = useMadadgarTasks();
  const { data: meetings = [], isLoading: mL } = useMadadgarMeetings();
  const createMeeting = useCreateMadadgarMeeting();

  if (tmL || cL || gL || tL || mL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const team = teams.find((t) => t.id === id);
  if (!team) {
    return <AppLayout><div className="text-center py-20">Team not found</div></AppLayout>;
  }

  const currentCoord = coordinators.find((c) => c.id === team.currentCoordinatorId);
  const teamGoals = goals.filter((g) => g.teamId === id);
  const teamTasks = tasks.filter((t) => t.teamId === id);
  const teamMeetings = meetings.filter((m) => m.teamIds.includes(id || ""));

  const handleCreateMeeting = async () => {
    if (!meetingTitle || !meetingMonth || !meetingDate) return;
    await createMeeting.mutateAsync({
      title: meetingTitle,
      month: meetingMonth,
      meetingDate,
      agenda: meetingAgenda,
      scope: "Selected",
      teamIds: [team.id],
    });
    setCreateOpen(false);
    setMeetingTitle("");
    setMeetingMonth("");
    setMeetingDate("");
    setMeetingAgenda("");
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/madadgar-teams")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-muted-foreground text-sm">{team.zone} · {team.districtName || "No district"}</p>
          </div>
          <Badge variant={team.status === "Active" ? "default" : "secondary"} className="text-xs">{team.status}</Badge>
        </div>

        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Meeting</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Madadgar Team Meeting</DialogTitle>
                <DialogDescription>Meeting will be linked to this team.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1"><Label>Title</Label><Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Team Progress Review" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Month</Label><Input type="month" value={meetingMonth} onChange={(e) => setMeetingMonth(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Date</Label><Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} /></div>
                </div>
                <div className="space-y-1"><Label>Team</Label><Input value={team.name} disabled /></div>
                <div className="space-y-1"><Label>Agenda</Label><Textarea value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} rows={3} /></div>
                <Button className="w-full" disabled={createMeeting.isPending} onClick={handleCreateMeeting}>{createMeeting.isPending ? "Creating..." : "Create Meeting"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Coordinator</p><p className="text-sm font-bold">{currentCoord?.name || "Unassigned"}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Meetings</p><p className="text-lg font-bold">{teamMeetings.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Goals</p><p className="text-lg font-bold">{teamGoals.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Tasks</p><p className="text-lg font-bold">{teamTasks.length}</p></CardContent></Card>
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
                  {teamMeetings.map((m) => (
                    <TableRow key={m.id}><TableCell>{m.title}</TableCell><TableCell>{m.month}</TableCell><TableCell>{m.meetingDate}</TableCell><TableCell>{m.scope}</TableCell></TableRow>
                  ))}
                  {teamMeetings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No meetings</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="coordinators">
            <Card className="border-none shadow-sm"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {coordinators.filter((c) => c.teamId === id).map((c) => (
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
                  {teamGoals.map((g) => (
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
                  {teamTasks.map((t) => (
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
