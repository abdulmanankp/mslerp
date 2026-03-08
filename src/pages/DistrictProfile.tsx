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
import { districts, coordinators, districtMeetingRecords, goals, tasks, meetings, activities } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, Target, ClipboardList, FileText, Plus, Download, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

export default function DistrictProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const district = districts.find(d => d.id === id);

  if (!district) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">District not found</p>
          <Button variant="ghost" onClick={() => navigate("/districts")}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  const currentCoord = coordinators.find(c => c.id === district.currentCoordinatorId);
  const previousCoords = coordinators.filter(c => c.districtId === id && c.status === "Expired");
  const dmRecords = districtMeetingRecords.filter(r => r.districtId === id);
  const districtGoals = goals.filter(g => g.districtId === id);
  const districtTasks = tasks.filter(t => t.districtId === id);

  // Build all meeting records for this district (from meetings that include this district)
  const allMeetingsForDistrict = meetings
    .filter(m => m.districtIds.includes(id!))
    .map(m => {
      const record = dmRecords.find(r => r.meetingId === m.id);
      return { meeting: m, record };
    })
    .sort((a, b) => b.meeting.meetingDate.localeCompare(a.meeting.meetingDate));

  const activityChartData = dmRecords.flatMap(r => r.activityReports).reduce((acc, ar) => {
    const existing = acc.find(a => a.name === ar.activityName);
    if (existing) existing.count += ar.completedQuantity;
    else acc.push({ name: ar.activityName.length > 12 ? ar.activityName.substring(0, 12) + "…" : ar.activityName, count: ar.completedQuantity });
    return acc;
  }, [] as { name: string; count: number }[]);

  const totalActivities = dmRecords.reduce((sum, r) => sum + r.activityReports.reduce((s, ar) => s + ar.completedQuantity, 0), 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/districts")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{district.name}</h1>
            <p className="text-muted-foreground text-sm">{district.zone} · {district.division} Division</p>
          </div>
          <Badge variant={district.status === "Active" ? "default" : "secondary"} className="text-xs">{district.status}</Badge>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Population</p>
              <p className="text-lg font-bold font-mono">{district.population?.toLocaleString() || "—"}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Coordinator</p>
              <p className="text-sm font-bold truncate">{currentCoord?.name || "Unassigned"}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Meetings</p>
              <p className="text-lg font-bold">{allMeetingsForDistrict.length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Activities Done</p>
              <p className="text-lg font-bold">{totalActivities}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Goals</p>
              <p className="text-lg font-bold">{districtGoals.filter(g => g.status === "Pending").length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="meetings" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="meetings" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Meetings</TabsTrigger>
            <TabsTrigger value="overview" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="coordinators" className="gap-1.5"><User className="h-3.5 w-3.5" /> Coordinators</TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Goals</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Tasks</TabsTrigger>
          </TabsList>

          {/* Meetings Tab - Primary */}
          <TabsContent value="meetings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Meeting Timeline</h3>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3 w-3" /> Create Meeting
              </Button>
            </div>
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meeting</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Report Status</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allMeetingsForDistrict.map(({ meeting, record }) => (
                      <TableRow key={meeting.id} className="group">
                        <TableCell className="font-medium text-sm">{meeting.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{meeting.month}</TableCell>
                        <TableCell className="text-xs">{meeting.meetingDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={record?.status === "Completed" ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {record?.status || "Empty"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record?.attendance ? (
                            <Badge
                              variant={record.attendance === "Present" ? "default" : record.attendance === "Late" ? "secondary" : "destructive"}
                              className="text-[10px]"
                            >
                              {record.attendance}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {record ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => navigate(`/meetings/${meeting.id}/report/${district.id}`)}
                                >
                                  <Eye className="h-3 w-3" />
                                  {record.status === "Empty" ? "Add Report" : "View Report"}
                                </Button>
                                {record.status === "Completed" && (
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                    <Download className="h-3 w-3" /> Export
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => navigate(`/meetings/${meeting.id}/report/${district.id}`)}
                              >
                                <Plus className="h-3 w-3" /> Add Report
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allMeetingsForDistrict.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10 text-sm">
                          No meetings assigned to this district yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {activityChartData.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Activities Summary</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">District Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs">Zone:</span> <span className="font-medium ml-1">{district.zone}</span></div>
                  <div><span className="text-muted-foreground text-xs">Division:</span> <span className="font-medium ml-1">{district.division}</span></div>
                  <div><span className="text-muted-foreground text-xs">Created:</span> <span className="font-medium ml-1">{district.createdDate}</span></div>
                  <div><span className="text-muted-foreground text-xs">Status:</span> <span className="font-medium ml-1">{district.status}</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coordinators Tab */}
          <TabsContent value="coordinators" className="space-y-4">
            {currentCoord && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Current Coordinator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground text-xs">Name:</span><p className="font-medium">{currentCoord.name}</p></div>
                    <div><span className="text-muted-foreground text-xs">Phone:</span><p className="font-medium">{currentCoord.phone}</p></div>
                    <div><span className="text-muted-foreground text-xs">Joined:</span><p className="font-medium">{currentCoord.joiningDate}</p></div>
                    <div><span className="text-muted-foreground text-xs">Activities:</span><p className="font-medium">{currentCoord.totalActivities}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
            {!currentCoord && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">No coordinator assigned</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1"><Plus className="h-3 w-3" /> Assign Coordinator</Button>
                </CardContent>
              </Card>
            )}
            {previousCoords.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Previous Coordinators</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Activities</TableHead>
                        <TableHead>Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previousCoords.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-sm">{c.name}</TableCell>
                          <TableCell className="text-xs">{c.phone}</TableCell>
                          <TableCell className="text-xs">{c.joiningDate}</TableCell>
                          <TableCell className="text-xs">{c.endDate}</TableCell>
                          <TableCell className="text-sm">{c.totalActivities}</TableCell>
                          <TableCell className="text-sm">{c.attendanceRate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {districtGoals.map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium text-sm">{g.activityName}</TableCell>
                        <TableCell className="text-xs">{g.month}</TableCell>
                        <TableCell className="font-mono">{g.targetNumber}</TableCell>
                        <TableCell className="font-mono">{g.completedNumber || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {districtGoals.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">No goals assigned</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {districtTasks.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium text-sm">{t.title}</TableCell>
                        <TableCell><Badge variant={t.priority === "Critical" || t.priority === "High" ? "destructive" : "secondary"} className="text-[10px]">{t.priority}</Badge></TableCell>
                        <TableCell className="text-xs">{t.deadline}</TableCell>
                        <TableCell><Badge variant={t.status === "Completed" ? "default" : "outline"} className="text-[10px]">{t.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {districtTasks.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">No tasks assigned</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
