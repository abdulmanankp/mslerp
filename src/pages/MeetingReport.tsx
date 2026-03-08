import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { districtMeetingRecords, districts, meetings } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, CheckCircle, AlertCircle } from "lucide-react";

export default function MeetingReport() {
  const { meetingId, districtId } = useParams();
  const navigate = useNavigate();

  const record = districtMeetingRecords.find(r => r.meetingId === meetingId && r.districtId === districtId);
  const district = districts.find(d => d.id === districtId);
  const meeting = meetings.find(m => m.id === meetingId);

  if (!record || !district || !meeting) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Report not found</p>
          <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <p className="text-muted-foreground text-sm">{district.name} · {record.month}</p>
          </div>
          <Badge variant={record.status === "Completed" ? "default" : "outline"} className="ml-auto">{record.status}</Badge>
        </div>

        {/* Activity Reports */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Activity Reports</CardTitle>
              <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.activityReports.map(ar => (
                  <TableRow key={ar.id}>
                    <TableCell className="font-medium">{ar.activityName}</TableCell>
                    <TableCell className="font-mono font-semibold">{ar.completedQuantity}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ar.description || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ar.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Custom Activities */}
        {record.customActivities.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Custom Activities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Quantity</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                <TableBody>
                  {record.customActivities.map(ca => (
                    <TableRow key={ca.id}>
                      <TableCell className="font-medium">{ca.name}</TableCell>
                      <TableCell className="font-mono">{ca.quantity}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{ca.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Notes & Comments</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes || "No notes added."}</p>
          </CardContent>
        </Card>

        {/* Next Month Tasks */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Next Month Tasks</CardTitle>
              <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3 w-3" /> Add Task</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Activity Type</TableHead><TableHead>Target</TableHead><TableHead>Deadline</TableHead></TableRow></TableHeader>
              <TableBody>
                {record.nextMonthTasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.taskName}</TableCell>
                    <TableCell className="text-sm">{t.activityType}</TableCell>
                    <TableCell className="font-mono">{t.targetQuantity}</TableCell>
                    <TableCell className="text-sm">{t.deadline || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Attendance</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={record.attendance === "Present" ? "default" : record.attendance === "Late" ? "secondary" : "destructive"}>
              {record.attendance || "Not Recorded"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
