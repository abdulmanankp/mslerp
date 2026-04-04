import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMeetings, useDistrictMeetingRecords, useZones, useDistricts, useCreateMeeting, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { Plus, Calendar, Users, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportMonthlyOverallMeetingsExcel } from "@/lib/exportUtils";

export default function Meetings() {

  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [scope, setScope] = useState("All");
  const [zoneScope, setZoneScope] = useState("");
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<string[]>([]);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingMonth, setMeetingMonth] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [exportMonth, setExportMonth] = useState("");
  const createMeeting = useCreateMeeting();
  const { toast } = useToast();

  const { data: meetings = [], isLoading: mL } = useMeetings();
  const { data: dmRecords = [], isLoading: rL } = useDistrictMeetingRecords();
  const { data: zones = [] } = useZones();
  const { data: districts = [] } = useDistricts();
  const meetingMonths = Array.from(new Set(meetings.map((meeting) => meeting.month))).sort().reverse();

  const resetForm = () => {
    setMeetingTitle("");
    setMeetingMonth("");
    setMeetingDate("");
    setMeetingAgenda("");
    setMeetingNotes("");
    setScope("All");
    setZoneScope("");
    setSelectedDistrictIds([]);
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle || !meetingMonth || !meetingDate) {
      toast({ title: "Missing fields", description: "Title, month and meeting date are required.", variant: "destructive" });
      return;
    }

    let districtIds: string[] = [];
    if (scope === "All") {
      districtIds = districts.map((d) => d.id);
    } else if (scope === "Zone") {
      districtIds = districts.filter((d) => d.zone === zoneScope).map((d) => d.id);
    } else {
      districtIds = selectedDistrictIds;
    }

    if (scope === "Zone" && !zoneScope) {
      toast({ title: "Select zone", description: "Please select a zone for this meeting.", variant: "destructive" });
      return;
    }

    if (districtIds.length === 0) {
      toast({ title: "No districts selected", description: "Choose at least one district for this meeting.", variant: "destructive" });
      return;
    }

    try {
      await createMeeting.mutateAsync({
        title: meetingTitle,
        month: meetingMonth,
        meetingDate,
        agenda: meetingAgenda,
        notes: meetingNotes,
        scope: scope as "All" | "Zone" | "Selected",
        scopeValue: scope === "Zone" ? zoneScope : undefined,
        districtIds,
      });
      toast({ title: "Meeting created", description: `Meeting created for ${districtIds.length} district(s).` });
      setCreateOpen(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create meeting.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleMonthlyExport = () => {
    if (!exportMonth) {
      toast({ title: "Select month", description: "Please select a month to export monthly overall report.", variant: "destructive" });
      return;
    }

    const monthMeetings = meetings.filter((meeting) => meeting.month === exportMonth);
    if (monthMeetings.length === 0) {
      toast({ title: "No data", description: "No meetings found for the selected month.", variant: "destructive" });
      return;
    }

    exportMonthlyOverallMeetingsExcel(exportMonth, meetings, dmRecords, districts);
    toast({ title: "Exported", description: `Monthly overall report exported for ${exportMonth}.` });
  };

  if (mL || rL) {
    return (
      <AppLayout>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>

      <div className="space-y-5">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Central meeting management · {meetings.length} meetings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="w-full sm:w-[180px]">
              <Select value={exportMonth} onValueChange={setExportMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {meetingMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="gap-2" onClick={handleMonthlyExport}>
              <Download className="h-4 w-4" /> Export Monthly Overall
            </Button>

            {/* CREATE MEETING DIALOG */}

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>

            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Create Meeting
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">

              <DialogHeader>
                <DialogTitle>Create New Meeting</DialogTitle>
                <DialogDescription>
                  Create a meeting and auto-generate records for selected districts.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">

                <div className="space-y-2">
                  <Label>Meeting Title</Label>
                  <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="e.g., April Monthly Review" />
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Input type="month" value={meetingMonth} onChange={(e) => setMeetingMonth(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Meeting Date</Label>
                    <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
                  </div>

                </div>

                <div className="space-y-2">
                  <Label>Agenda</Label>
                  <Textarea value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} placeholder="Meeting agenda..." rows={3} />
                </div>

                {/* SCOPE */}

                <div className="space-y-2">

                  <Label>Scope</Label>

                  <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="All">All Districts</SelectItem>
                      <SelectItem value="Zone">Specific Zone</SelectItem>
                      <SelectItem value="Selected">Selected Districts</SelectItem>
                    </SelectContent>
                  </Select>

                </div>

                {/* ZONE */}

                {scope === "Zone" && (
                  <div className="space-y-2">

                    <Label>Select Zone</Label>

                    <Select value={zoneScope} onValueChange={setZoneScope}>

                      <SelectTrigger>
                        <SelectValue placeholder="Choose zone..." />
                      </SelectTrigger>

                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z.id} value={z.name}>
                            {z.name}
                          </SelectItem>
                        ))}
                      </SelectContent>

                    </Select>

                  </div>
                )}

                {/* SELECTED DISTRICTS */}

                {scope === "Selected" && (

                  <div className="space-y-2">

                    <Label>Select Districts</Label>

                    <div className="max-h-48 overflow-y-auto border rounded p-2 grid grid-cols-1 gap-2">

                      {districts.map((d) => (

                        <label key={d.id} className="flex items-center gap-2">

                          <input
                            type="checkbox"
                            value={d.id}
                            checked={selectedDistrictIds.includes(d.id)}
                            onChange={(e) => {

                              if (e.target.checked) {
                                setSelectedDistrictIds([
                                  ...selectedDistrictIds,
                                  d.id
                                ]);
                              } else {
                                setSelectedDistrictIds(
                                  selectedDistrictIds.filter(id => id !== d.id)
                                );
                              }

                            }}
                          />

                          <span>{d.name}</span>

                        </label>

                      ))}

                    </div>

                  </div>

                )}

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
                </div>

                <Button
                  className="w-full"
                  disabled={createMeeting.isPending}
                  onClick={handleCreateMeeting}
                >
                  {createMeeting.isPending ? "Creating..." : "Create Meeting"}
                </Button>

              </div>

            </DialogContent>

            </Dialog>
          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{meetings.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Meetings</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <FileText className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {dmRecords.filter(r => r.status === "Completed").length}
                </p>
                <p className="text-[10px] text-muted-foreground">Reports Completed</p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </AppLayout>
  );
}
