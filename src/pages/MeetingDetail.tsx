import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { meetings, districtMeetingRecords, districts } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meeting = meetings.find(m => m.id === id);

  if (!meeting) {
    return <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">Meeting not found</p><Button variant="ghost" onClick={() => navigate("/meetings")}>Go Back</Button></div></AppLayout>;
  }

  const records = districtMeetingRecords.filter(r => r.meetingId === id);
  const meetingDistricts = meeting.districtIds.map(dId => districts.find(d => d.id === dId)).filter(Boolean);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/meetings")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <p className="text-muted-foreground text-sm">{meeting.meetingDate} · {meeting.scope === "All" ? "All Districts" : meeting.scopeValue || meeting.scope}</p>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Meeting Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Month:</span><p className="font-medium">{meeting.month}</p></div>
              <div><span className="text-muted-foreground">Date:</span><p className="font-medium">{meeting.meetingDate}</p></div>
              <div><span className="text-muted-foreground">Scope:</span><p className="font-medium">{meeting.scope}</p></div>
              <div><span className="text-muted-foreground">Districts:</span><p className="font-medium">{meeting.districtIds.length}</p></div>
            </div>
            <div className="mt-4">
              <span className="text-muted-foreground text-sm">Agenda:</span>
              <p className="text-sm mt-1">{meeting.agenda}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">District Reports</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Report Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetingDistricts.map(d => {
                  if (!d) return null;
                  const record = records.find(r => r.districtId === d.id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{d.zone}</TableCell>
                      <TableCell>
                        <Badge variant={record?.status === "Completed" ? "default" : "outline"} className="text-[10px]">
                          {record?.status || "Empty"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record?.attendance === "Present" ? "default" : record?.attendance === "Late" ? "secondary" : "destructive"} className="text-[10px]">
                          {record?.attendance || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/meetings/${id}/report/${d.id}`)}>
                            View Report
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
