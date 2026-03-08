import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { districts, coordinators, districtMeetingRecords, goals, tasks } from "@/data/mockData";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, Target, ClipboardList, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DistrictProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const district = districts.find(d => d.id === id);

  if (!district) {
    return <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">District not found</p><Button variant="ghost" onClick={() => navigate("/districts")}>Go Back</Button></div></AppLayout>;
  }

  const currentCoord = coordinators.find(c => c.id === district.currentCoordinatorId);
  const previousCoords = coordinators.filter(c => c.districtId === id && c.status === "Expired");
  const allCoords = coordinators.filter(c => c.districtId === id);
  const dmRecords = districtMeetingRecords.filter(r => r.districtId === id);
  const districtGoals = goals.filter(g => g.districtId === id);
  const districtTasks = tasks.filter(t => t.districtId === id);

  const activityChartData = dmRecords.flatMap(r => r.activityReports).reduce((acc, ar) => {
    const existing = acc.find(a => a.name === ar.activityName);
    if (existing) existing.count += ar.completedQuantity;
    else acc.push({ name: ar.activityName, count: ar.completedQuantity });
    return acc;
  }, [] as { name: string; count: number }[]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/districts")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{district.name}</h1>
            <p className="text-muted-foreground text-sm">{district.zone} · {district.division}</p>
          </div>
          <Badge variant={district.status === "Active" ? "default" : "secondary"} className="ml-auto">{district.status}</Badge>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Population</p><p className="text-lg font-bold">{district.population?.toLocaleString() || "—"}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Coordinator</p><p className="text-lg font-bold">{currentCoord?.name || "Unassigned"}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Meetings</p><p className="text-lg font-bold">{dmRecords.length}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Goals</p><p className="text-lg font-bold">{districtGoals.filter(g => g.status === "Pending").length}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {activityChartData.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Activities Summary</CardTitle></CardHeader>
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
              <CardHeader className="pb-2"><CardTitle className="text-base">District Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Zone:</span> <span className="font-medium ml-1">{district.zone}</span></div>
                  <div><span className="text-muted-foreground">Division:</span> <span className="font-medium ml-1">{district.division}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium ml-1">{district.createdDate}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="font-medium ml-1">{district.status}</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coordinators" className="space-y-4">
            {currentCoord && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Current Coordinator</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{currentCoord.name}</p></div>
                    <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{currentCoord.phone}</p></div>
                    <div><span className="text-muted-foreground">Joined:</span><p className="font-medium">{currentCoord.joiningDate}</p></div>
                    <div><span className="text-muted-foreground">Activities:</span><p className="font-medium">{currentCoord.totalActivities}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
            {previousCoords.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Previous Coordinators</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Activities</TableHead><TableHead>Attendance</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {previousCoords.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                          <TableCell>{c.joiningDate}</TableCell>
                          <TableCell>{c.endDate}</TableCell>
                          <TableCell>{c.totalActivities}</TableCell>
                          <TableCell>{c.attendanceRate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Meeting</TableHead><TableHead>Month</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Attendance</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {dmRecords.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.meetingTitle}</TableCell>
                        <TableCell>{r.month}</TableCell>
                        <TableCell>{r.meetingDate}</TableCell>
                        <TableCell><Badge variant={r.status === "Completed" ? "default" : "outline"} className="text-[10px]">{r.status}</Badge></TableCell>
                        <TableCell><Badge variant={r.attendance === "Present" ? "default" : r.attendance === "Late" ? "secondary" : "destructive"} className="text-[10px]">{r.attendance || "—"}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => navigate(`/meetings/${r.meetingId}/report/${r.districtId}`)}>View Report</Button></TableCell>
                      </TableRow>
                    ))}
                    {dmRecords.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No meeting records yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Month</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {districtGoals.map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.activityName}</TableCell>
                        <TableCell>{g.month}</TableCell>
                        <TableCell>{g.targetNumber}</TableCell>
                        <TableCell>{g.completedNumber || "—"}</TableCell>
                        <TableCell><Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {districtTasks.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell><Badge variant={t.priority === "Critical" ? "destructive" : "secondary"} className="text-[10px]">{t.priority}</Badge></TableCell>
                        <TableCell>{t.deadline}</TableCell>
                        <TableCell><Badge variant={t.status === "Completed" ? "default" : "outline"} className="text-[10px]">{t.status}</Badge></TableCell>
                      </TableRow>
                    ))}
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
