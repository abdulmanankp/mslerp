import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { meetings, districtMeetingRecords, districts, zones } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search, FileText, Eye, Plus } from "lucide-react";
import { useState } from "react";

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meeting = meetings.find(m => m.id === id);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  if (!meeting) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Meeting not found</p>
          <Button variant="ghost" onClick={() => navigate("/meetings")}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  const records = districtMeetingRecords.filter(r => r.meetingId === id);
  const meetingDistricts = meeting.districtIds
    .map(dId => {
      const d = districts.find(dd => dd.id === dId);
      const record = records.find(r => r.districtId === dId);
      return d ? { district: d, record } : null;
    })
    .filter(Boolean) as { district: typeof districts[0]; record: typeof records[0] | undefined }[];

  const filtered = meetingDistricts.filter(({ district, record }) => {
    if (search && !district.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (zoneFilter !== "all" && district.zone !== zoneFilter) return false;
    if (statusFilter === "completed" && record?.status !== "Completed") return false;
    if (statusFilter === "empty" && record?.status !== "Empty" && record) return false;
    if (statusFilter === "empty" && !record) return true;
    return true;
  });

  const completedCount = records.filter(r => r.status === "Completed").length;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/meetings")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
            <p className="text-muted-foreground text-sm">
              {meeting.meetingDate} · {meeting.scope === "All" ? "All Districts" : meeting.scopeValue || meeting.scope}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
            <Download className="h-3.5 w-3.5" /> Export All
          </Button>
        </div>

        {/* Meeting Info */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div><span className="text-muted-foreground text-xs">Month</span><p className="font-medium">{meeting.month}</p></div>
              <div><span className="text-muted-foreground text-xs">Date</span><p className="font-medium">{meeting.meetingDate}</p></div>
              <div><span className="text-muted-foreground text-xs">Scope</span><p className="font-medium">{meeting.scope}</p></div>
              <div><span className="text-muted-foreground text-xs">Districts</span><p className="font-medium">{meeting.districtIds.length}</p></div>
              <div><span className="text-muted-foreground text-xs">Reports</span><p className="font-medium">{completedCount}/{records.length}</p></div>
            </div>
            {meeting.agenda && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-muted-foreground text-xs">Agenda:</span>
                <p className="text-sm mt-0.5">{meeting.agenda}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search districts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="empty">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* District Reports Table */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">District Reports ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Report Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ district: d, record }) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{d.zone}</TableCell>
                    <TableCell>
                      <Badge variant={record?.status === "Completed" ? "default" : "outline"} className="text-[10px]">
                        {record?.status || "Empty"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record?.attendance ? (
                        <Badge variant={record.attendance === "Present" ? "default" : record.attendance === "Late" ? "secondary" : "destructive"} className="text-[10px]">
                          {record.attendance}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => navigate(`/meetings/${id}/report/${d.id}`)}
                        >
                          {record?.status === "Completed" ? (
                            <><Eye className="h-3 w-3" /> View</>
                          ) : (
                            <><Plus className="h-3 w-3" /> Add Report</>
                          )}
                        </Button>
                        {record?.status === "Completed" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <Download className="h-3 w-3" /> Export
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
