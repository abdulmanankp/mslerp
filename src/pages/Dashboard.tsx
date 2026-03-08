import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useZones, useDistricts, useCoordinators, useMeetings, useTasks, useGoals, useDistrictMeetingRecords, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Building2, Users, MapPin, Calendar, ClipboardList, Target, TrendingUp, CheckCircle, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COLORS = ["hsl(var(--chart-3))", "hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--chart-5))"];

const monthlyTrend = [
  { month: "Oct", activities: 32 },
  { month: "Nov", activities: 41 },
  { month: "Dec", activities: 38 },
  { month: "Jan", activities: 45 },
  { month: "Feb", activities: 62 },
  { month: "Mar", activities: 78 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: coordinators = [], isLoading: cL } = useCoordinators();
  const { data: meetings = [], isLoading: mL } = useMeetings();
  const { data: tasks = [], isLoading: tL } = useTasks();
  const { data: goals = [], isLoading: gL } = useGoals();
  const { data: dmRecords = [] } = useDistrictMeetingRecords();

  if (zL || dL || cL || mL || tL || gL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const statCards = [
    { label: "Total Zones", value: zones.length, icon: MapPin, change: `${zones.length}`, color: "chart-1" },
    { label: "Total Districts", value: districts.length, icon: Building2, change: `${districts.length}`, color: "chart-2" },
    { label: "Active Coordinators", value: coordinators.filter(c => c.status === "Active").length, icon: Users, change: "+5", color: "chart-3" },
    { label: "Meetings This Month", value: meetings.filter(m => m.month === currentMonth).length, icon: Calendar, change: "+2", color: "chart-4" },
    { label: "Tasks Assigned", value: tasks.length, icon: ClipboardList, change: `${tasks.length}`, color: "chart-1" },
    { label: "Goals Completed", value: goals.filter(g => g.status === "Completed").length, icon: CheckCircle, change: goals.length > 0 ? `${Math.round(goals.filter(g => g.status === "Completed").length / goals.length * 100)}%` : "0%", color: "chart-2" },
  ];

  const zonePerformance = zones.map(z => ({
    name: z.name.length > 14 ? z.name.substring(0, 14) + "…" : z.name,
    districts: districts.filter(d => d.zone === z.name).length,
    coordinators: coordinators.filter(c => c.zone === z.name && c.status === "Active").length,
  }));

  const goalData = goals.filter(g => g.month === currentMonth).map(g => ({
    name: `${g.districtName} - ${g.activityName.split(" ")[0]}`,
    target: g.targetNumber,
    completed: g.completedNumber || 0,
  }));

  const taskStatusData = [
    { name: "Pending", value: tasks.filter(t => t.status === "Pending").length },
    { name: "In Progress", value: tasks.filter(t => t.status === "In Progress").length },
    { name: "Completed", value: tasks.filter(t => t.status === "Completed").length },
    { name: "Delayed", value: tasks.filter(t => t.status === "Delayed").length },
  ].filter(d => d.value > 0);

  const reportStats = {
    total: dmRecords.length,
    completed: dmRecords.filter(r => r.status === "Completed").length,
    empty: dmRecords.filter(r => r.status === "Empty").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">MSL ERP Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Organization performance overview</p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                    <stat.icon className={`h-4 w-4 text-${stat.color}`} />
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-none shadow-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer" onClick={() => navigate("/meetings")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium">Meeting Reports</p>
                <p className="text-2xl font-bold">{reportStats.completed}/{reportStats.total}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-emerald-200" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer" onClick={() => navigate("/districts")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">Districts Coverage</p>
                <p className="text-2xl font-bold">{districts.filter(d => d.currentCoordinatorId).length}/{districts.length}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-blue-200" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer" onClick={() => navigate("/goals")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium">Goals Achievement</p>
                <p className="text-2xl font-bold">{goals.length > 0 ? Math.round(goals.filter(g => g.status === "Completed").length / goals.length * 100) : 0}%</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-amber-200" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Zone Overview</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={zonePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="districts" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Districts" />
                  <Bar dataKey="coordinators" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Coordinators" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Goals vs Achievement</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={goalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="target" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Target" />
                  <Bar dataKey="completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Task Distribution</CardTitle></CardHeader>
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
              <div className="flex flex-wrap justify-center gap-3 mt-1">
                {taskStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Monthly Activities Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="activities" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--chart-1))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Tasks</CardTitle>
              <button onClick={() => navigate("/tasks")} className="text-xs text-primary hover:underline font-medium">View All →</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.districtName || task.zone} · Due {task.deadline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={task.priority === "Critical" || task.priority === "High" ? "destructive" : "secondary"} className="text-[10px]">{task.priority}</Badge>
                    <Badge variant={task.status === "Completed" ? "default" : "outline"} className="text-[10px]">{task.status}</Badge>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No tasks yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
