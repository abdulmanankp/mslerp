import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { districtMeetingRecords, districts, meetings, activities, goals } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Download, Save, CheckCircle, AlertCircle, ListTodo, MessageSquare, ClipboardList } from "lucide-react";
import { useState } from "react";

export default function MeetingReport() {
  const { meetingId, districtId } = useParams();
  const navigate = useNavigate();

  const record = districtMeetingRecords.find(r => r.meetingId === meetingId && r.districtId === districtId);
  const district = districts.find(d => d.id === districtId);
  const meeting = meetings.find(m => m.id === meetingId);

  // Get previous month tasks (goals assigned from previous meeting)
  const previousGoals = goals.filter(g => g.districtId === districtId && g.month === meeting?.month);

  if (!district || !meeting) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Report not found</p>
          <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = record?.status === "Completed";
  const isEmpty = !record || record.status === "Empty";

  return (
    <AppLayout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{meeting.title}</h1>
              <Badge variant={isCompleted ? "default" : "outline"} className="text-[10px]">
                {record?.status || "Empty"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{district.name} · {district.zone} · {meeting.meetingDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Export Report
              </Button>
            )}
            <Button size="sm" className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" /> Save Report
            </Button>
          </div>
        </div>

        {/* Previous Month Progress Report */}
        {previousGoals.length > 0 && (
          <Card className="border-none shadow-sm border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-warning" />
                Previous Goals Progress Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previousGoals.map(g => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium text-sm">{g.activityName}</TableCell>
                      <TableCell className="font-mono">{g.targetNumber}</TableCell>
                      <TableCell>
                        {isCompleted ? (
                          <span className="font-mono font-semibold">{g.completedNumber ?? "—"}</span>
                        ) : (
                          <Input type="number" className="w-20 h-7 text-xs" defaultValue={g.completedNumber} placeholder="0" />
                        )}
                      </TableCell>
                      <TableCell>
                        {isCompleted ? (
                          <Badge
                            variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"}
                            className="text-[10px]"
                          >
                            {g.status}
                          </Badge>
                        ) : (
                          <Select defaultValue={g.status || "Pending"}>
                            <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Partially Completed">Partially Completed</SelectItem>
                              <SelectItem value="Not Completed">Not Completed</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{g.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Activity Reports */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Activity Reports
              </CardTitle>
              {!isCompleted && (
                <Button variant="outline" size="sm" className="gap-1 text-xs"><Plus className="h-3 w-3" /> Add Activity</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isCompleted && record ? (
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
                      <TableCell className="font-medium text-sm">{ar.activityName}</TableCell>
                      <TableCell className="font-mono font-semibold">{ar.completedQuantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ar.description || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ar.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 space-y-3">
                {activities.filter(a => a.status === "Active").map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{a.category}</p>
                    </div>
                    <Input type="number" className="w-20 h-8 text-xs" placeholder="Qty" />
                    <Input className="w-40 h-8 text-xs hidden sm:block" placeholder="Description" />
                    <Input className="w-32 h-8 text-xs hidden md:block" placeholder="Notes" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Activities */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Custom Activities
              </CardTitle>
              {!isCompleted && (
                <Button variant="outline" size="sm" className="gap-1 text-xs"><Plus className="h-3 w-3" /> Add Custom</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isCompleted && record && record.customActivities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.customActivities.map(ca => (
                    <TableRow key={ca.id}>
                      <TableCell className="font-medium text-sm">{ca.name}</TableCell>
                      <TableCell className="font-mono">{ca.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ca.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isCompleted ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Input className="flex-1 h-8 text-xs" placeholder="Activity name" />
                  <Input type="number" className="w-20 h-8 text-xs" placeholder="Qty" />
                  <Input className="w-48 h-8 text-xs hidden sm:block" placeholder="Description" />
                </div>
                <p className="text-[10px] text-muted-foreground">Add activities not in the standard list</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No custom activities reported.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Notes & Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCompleted ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record?.notes || "No notes added."}</p>
            ) : (
              <Textarea
                placeholder="Enter meeting notes, challenges faced, achievements, support needed..."
                rows={4}
                defaultValue={record?.notes}
              />
            )}
          </CardContent>
        </Card>

        {/* Next Month Tasks */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" /> Next Month Tasks
              </CardTitle>
              {!isCompleted && (
                <Button variant="outline" size="sm" className="gap-1 text-xs"><Plus className="h-3 w-3" /> Add Task</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isCompleted && record ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.nextMonthTasks.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">{t.taskName}</TableCell>
                      <TableCell className="text-xs">{t.activityType}</TableCell>
                      <TableCell className="font-mono">{t.targetQuantity}</TableCell>
                      <TableCell className="text-xs">{t.deadline || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Input className="flex-1 h-8 text-xs" placeholder="Task name" />
                  <Select>
                    <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Activity type" /></SelectTrigger>
                    <SelectContent>
                      {activities.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" className="w-20 h-8 text-xs" placeholder="Target" />
                  <Input type="date" className="w-36 h-8 text-xs hidden sm:block" />
                </div>
                <p className="text-[10px] text-muted-foreground">These tasks become goals for the next meeting cycle</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {isCompleted ? (
              <Badge variant={record?.attendance === "Present" ? "default" : record?.attendance === "Late" ? "secondary" : "destructive"}>
                {record?.attendance || "Not Recorded"}
              </Badge>
            ) : (
              <Select defaultValue={record?.attendance || ""}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select attendance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
