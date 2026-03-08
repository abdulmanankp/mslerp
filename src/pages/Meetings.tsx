import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMeetings, useDistrictMeetingRecords, useZones, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { Plus, Calendar, Users, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Meetings() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [scope, setScope] = useState("All");

  const { data: meetings = [], isLoading: mL } = useMeetings();
  const { data: dmRecords = [], isLoading: rL } = useDistrictMeetingRecords();
  const { data: zones = [] } = useZones();

  if (mL || rL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Central meeting management · {meetings.length} meetings</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm"><Plus className="h-4 w-4" /> Create Meeting</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Meeting</DialogTitle>
                <DialogDescription>Create a meeting and auto-generate records for selected districts.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Meeting Title</Label><Input placeholder="e.g., April Monthly Review" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Month</Label><Input type="month" /></div>
                  <div className="space-y-2"><Label>Meeting Date</Label><Input type="date" /></div>
                </div>
                <div className="space-y-2"><Label>Agenda</Label><Textarea placeholder="Meeting agenda..." rows={3} /></div>
                <div className="space-y-2"><Label>Scope</Label>
                  <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Districts</SelectItem>
                      <SelectItem value="Zone">Specific Zone</SelectItem>
                      <SelectItem value="Selected">Selected Districts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {scope === "Zone" && (
                  <div className="space-y-2"><Label>Select Zone</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Choose zone..." /></SelectTrigger>
                      <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2"><Label>Notes (Optional)</Label><Textarea placeholder="Additional notes..." rows={2} /></div>
                <Button className="w-full" onClick={() => setCreateOpen(false)}>Create Meeting</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Calendar className="h-4 w-4 text-primary" /></div>
              <div><p className="text-lg font-bold">{meetings.length}</p><p className="text-[10px] text-muted-foreground">Total Meetings</p></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10"><FileText className="h-4 w-4 text-info" /></div>
              <div><p className="text-lg font-bold">{dmRecords.filter(r => r.status === "Completed").length}</p><p className="text-[10px] text-muted-foreground">Reports Completed</p></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><FileText className="h-4 w-4 text-warning" /></div>
              <div><p className="text-lg font-bold">{dmRecords.filter(r => r.status === "Empty").length}</p><p className="text-[10px] text-muted-foreground">Pending Reports</p></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10"><Users className="h-4 w-4 text-primary" /></div>
              <div><p className="text-lg font-bold">{dmRecords.filter(r => r.attendance === "Present").length}</p><p className="text-[10px] text-muted-foreground">Present</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {meetings.map(m => {
            const records = dmRecords.filter(r => r.meetingId === m.id);
            const completed = records.filter(r => r.status === "Completed").length;
            return (
              <Card key={m.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/meetings/${m.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {m.scope === "All" ? "All Districts" : m.scope === "Zone" ? m.scopeValue : "Selected"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{m.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{m.agenda}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <span>{m.meetingDate}</span>
                    <div className="flex items-center gap-2">
                      <span>{completed}/{records.length} reports</span>
                      <span>·</span>
                      <span>{m.districtIds.length} districts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {meetings.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">No meetings created yet</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
