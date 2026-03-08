import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { districtMeetingRecords, districts, meetings, activities, goals } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Download, Save, Pencil, X, ListTodo, MessageSquare, ClipboardList, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ActivityReport, CustomActivity, NextMonthTask } from "@/types";
import { exportDistrictReportPDF, exportDistrictReportExcel } from "@/lib/exportUtils";

export default function MeetingReport() {
  const { meetingId, districtId } = useParams();
  const navigate = useNavigate();

  const record = districtMeetingRecords.find(r => r.meetingId === meetingId && r.districtId === districtId);
  const district = districts.find(d => d.id === districtId);
  const meeting = meetings.find(m => m.id === meetingId);
  const previousGoals = goals.filter(g => g.districtId === districtId && g.month === meeting?.month);

  const [editing, setEditing] = useState(false);

  // Editable state initialized from record
  const [activityReports, setActivityReports] = useState<ActivityReport[]>(record?.activityReports || []);
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>(record?.customActivities || []);
  const [nextMonthTasks, setNextMonthTasks] = useState<NextMonthTask[]>(record?.nextMonthTasks || []);
  const [notes, setNotes] = useState(record?.notes || "");
  const [attendance, setAttendance] = useState(record?.attendance || "");

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
  const isEditable = editing || !isCompleted;

  const handleUpdateActivityReport = (index: number, field: keyof ActivityReport, value: string | number) => {
    setActivityReports(prev => prev.map((ar, i) => i === index ? { ...ar, [field]: value } : ar));
  };

  const handleDeleteActivityReport = (index: number) => {
    setActivityReports(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddActivityReport = (activityId: string, activityName: string) => {
    setActivityReports(prev => [...prev, {
      id: `ar_new_${Date.now()}`,
      activityId,
      activityName,
      completedQuantity: 0,
      description: "",
      notes: "",
    }]);
  };

  const handleUpdateCustomActivity = (index: number, field: keyof CustomActivity, value: string | number) => {
    setCustomActivities(prev => prev.map((ca, i) => i === index ? { ...ca, [field]: value } : ca));
  };

  const handleDeleteCustomActivity = (index: number) => {
    setCustomActivities(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomActivity = () => {
    setCustomActivities(prev => [...prev, { id: `ca_new_${Date.now()}`, name: "", quantity: 0, description: "" }]);
  };

  const handleUpdateTask = (index: number, field: keyof NextMonthTask, value: string | number) => {
    setNextMonthTasks(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleDeleteTask = (index: number) => {
    setNextMonthTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTask = () => {
    setNextMonthTasks(prev => [...prev, { id: `nmt_new_${Date.now()}`, taskName: "", activityType: "", targetQuantity: 0, deadline: "", notes: "" }]);
  };

  return (
    <AppLayout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{meeting.title}</h1>
              <Badge variant={isCompleted ? "default" : "outline"} className="text-[10px]">
                {record?.status || "Empty"}
              </Badge>
              {editing && <Badge variant="secondary" className="text-[10px]">Editing</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">{district.name} · {district.zone} · {meeting.meetingDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && !editing && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit Report
              </Button>
            )}
            {editing && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" /> Save
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
                        {isEditable ? (
                          <Input type="number" className="w-20 h-7 text-xs" defaultValue={g.completedNumber} placeholder="0" />
                        ) : (
                          <span className="font-mono font-semibold">{g.completedNumber ?? "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Select defaultValue={g.status || "Pending"}>
                            <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Partially Completed">Partially Completed</SelectItem>
                              <SelectItem value="Not Completed">Not Completed</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge>
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
              {isEditable && (
                <Select onValueChange={(val) => {
                  const act = activities.find(a => a.id === val);
                  if (act) handleAddActivityReport(act.id, act.name);
                }}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="+ Add Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.filter(a => a.status === "Active").map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                  {isEditable && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityReports.map((ar, i) => (
                  <TableRow key={ar.id}>
                    <TableCell className="font-medium text-sm">{ar.activityName}</TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input type="number" className="w-20 h-7 text-xs" value={ar.completedQuantity} onChange={e => handleUpdateActivityReport(i, "completedQuantity", parseInt(e.target.value) || 0)} />
                      ) : (
                        <span className="font-mono font-semibold">{ar.completedQuantity}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input className="h-7 text-xs" value={ar.description || ""} onChange={e => handleUpdateActivityReport(i, "description", e.target.value)} placeholder="Description" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{ar.description || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input className="h-7 text-xs" value={ar.notes || ""} onChange={e => handleUpdateActivityReport(i, "notes", e.target.value)} placeholder="Notes" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{ar.notes || "—"}</span>
                      )}
                    </TableCell>
                    {isEditable && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteActivityReport(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {activityReports.length === 0 && !isEditable && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">No activity reports</TableCell></TableRow>
                )}
                {activityReports.length === 0 && isEditable && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-sm">Use the dropdown above to add activities</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Custom Activities */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Custom Activities
              </CardTitle>
              {isEditable && (
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddCustomActivity}>
                  <Plus className="h-3 w-3" /> Add Custom
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {customActivities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Description</TableHead>
                    {isEditable && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customActivities.map((ca, i) => (
                    <TableRow key={ca.id}>
                      <TableCell>
                        {isEditable ? (
                          <Input className="h-7 text-xs" value={ca.name} onChange={e => handleUpdateCustomActivity(i, "name", e.target.value)} placeholder="Activity name" />
                        ) : (
                          <span className="font-medium text-sm">{ca.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Input type="number" className="w-20 h-7 text-xs" value={ca.quantity} onChange={e => handleUpdateCustomActivity(i, "quantity", parseInt(e.target.value) || 0)} />
                        ) : (
                          <span className="font-mono">{ca.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Input className="h-7 text-xs" value={ca.description || ""} onChange={e => handleUpdateCustomActivity(i, "description", e.target.value)} placeholder="Description" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{ca.description || "—"}</span>
                        )}
                      </TableCell>
                      {isEditable && (
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCustomActivity(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isEditable ? "Click 'Add Custom' to add non-standard activities" : "No custom activities reported."}
              </div>
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
            {isEditable ? (
              <Textarea
                placeholder="Enter meeting notes, challenges faced, achievements, support needed..."
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes || "No notes added."}</p>
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
              {isEditable && (
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddTask}>
                  <Plus className="h-3 w-3" /> Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {nextMonthTasks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Notes</TableHead>
                    {isEditable && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nextMonthTasks.map((t, i) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {isEditable ? (
                          <Input className="h-7 text-xs" value={t.taskName} onChange={e => handleUpdateTask(i, "taskName", e.target.value)} placeholder="Task name" />
                        ) : (
                          <span className="font-medium text-sm">{t.taskName}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Select value={t.activityType} onValueChange={val => handleUpdateTask(i, "activityType", val)}>
                            <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                              {activities.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs">{t.activityType}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Input type="number" className="w-20 h-7 text-xs" value={t.targetQuantity} onChange={e => handleUpdateTask(i, "targetQuantity", parseInt(e.target.value) || 0)} />
                        ) : (
                          <span className="font-mono">{t.targetQuantity}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Input type="date" className="h-7 text-xs" value={t.deadline || ""} onChange={e => handleUpdateTask(i, "deadline", e.target.value)} />
                        ) : (
                          <span className="text-xs">{t.deadline || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Input className="h-7 text-xs" value={t.notes || ""} onChange={e => handleUpdateTask(i, "notes", e.target.value)} placeholder="Notes" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{t.notes || "—"}</span>
                        )}
                      </TableCell>
                      {isEditable && (
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteTask(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isEditable ? "Click 'Add Task' to assign next month tasks" : "No tasks assigned."}
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
            {isEditable ? (
              <Select value={attendance} onValueChange={setAttendance}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select attendance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={attendance === "Present" ? "default" : attendance === "Late" ? "secondary" : "destructive"}>
                {attendance || "Not Recorded"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
