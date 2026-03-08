import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { zones, districts, coordinators, meetings, tasks, goals } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Building2, Users, MapPin, Calendar, ClipboardList, Target, TrendingUp, CheckCircle } from "lucide-react";

const statCards = [
  { label: "Total Zones", value: zones.length, icon: MapPin, color: "hsl(var(--chart-1))" },
  { label: "Total Districts", value: districts.length, icon: Building2, color: "hsl(var(--chart-2))" },
  { label: "Total Coordinators", value: coordinators.filter(c => c.status === "Active").length, icon: Users, color: "hsl(var(--chart-3))" },
  { label: "Meetings This Month", value: meetings.filter(m => m.month === "2026-03").length, icon: Calendar, color: "hsl(var(--chart-4))" },
  { label: "Tasks Assigned", value: tasks.length, icon: ClipboardList, color: "hsl(var(--chart-1))" },
  { label: "Tasks Completed", value: tasks.filter(t => t.status === "Completed").length, icon: CheckCircle, color: "hsl(var(--chart-2))" },
];

const zonePerformance = zones.slice(0, 6).map(z => ({
  name: z.name.length > 12 ? z.name.substring(0, 12) + "…" : z.name,
  districts: z.districtsCount,
  coordinators: z.coordinatorsCount,
}));

const goalData = goals.filter(g => g.month === "2026-03").map(g => ({
  name: g.activityName.length > 15 ? g.activityName.substring(0, 15) + "…" : g.activityName,
  target: g.targetNumber,
  completed: g.completedNumber || 0,
}));

const taskStatusData = [
  { name: "Pending", value: tasks.filter(t => t.status === "Pending").length },
  { name: "In Progress", value: tasks.filter(t => t.status === "In Progress").length },
  { name: "Completed", value: tasks.filter(t => t.status === "Completed").length },
  { name: "Delayed", value: tasks.filter(t => t.status === "Delayed").length },
];

const COLORS = ["hsl(var(--chart-3))", "hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--chart-5))"];

const monthlyTrend = [
  { month: "Jan", activities: 45 },
  { month: "Feb", activities: 62 },
  { month: "Mar", activities: 78 },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Organization performance overview</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: stat.color + "15" }}>
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zone Performance */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Zone Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={zonePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="districts" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="coordinators" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Goal vs Achievement */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Goals vs Achievement (March)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={goalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="target" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Distribution */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {taskStatusData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {taskStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Activities Trend */}
          <Card className="border-none shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Monthly Activities Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="activities" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.districtName || task.zone} · Due {task.deadline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={task.priority === "Critical" ? "destructive" : task.priority === "High" ? "destructive" : "secondary"} className="text-[10px]">
                      {task.priority}
                    </Badge>
                    <Badge variant={task.status === "Completed" ? "default" : "outline"} className="text-[10px]">
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
