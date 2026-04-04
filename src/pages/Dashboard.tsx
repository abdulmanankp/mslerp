import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useZones,
  useDistricts,
  useCoordinators,
  useMeetings,
  useTasks,
  useGoals,
  useDistrictMeetingRecords,
  useUniversities,
  useMadadgarTeams,
  usePresidentSchedules,
  LoadingSkeleton,
} from "@/hooks/useFirebaseData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Building2,
  Users,
  Calendar,
  CalendarDays,
  CheckCircle2,
  BellRing,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const COLORS = ["#014f35", "#1b7d59", "#2ea877", "#8fd0b8"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: coordinators = [], isLoading: cL } = useCoordinators();
  const { data: meetings = [], isLoading: mL } = useMeetings();
  const { data: universities = [], isLoading: uL } = useUniversities();
  const { data: madadgarTeams = [], isLoading: mdL } = useMadadgarTeams();
  const { data: tasks = [], isLoading: tL } = useTasks();
  const { data: goals = [], isLoading: gL } = useGoals();
  const { data: presidentSchedules = [], isLoading: psL } = usePresidentSchedules();
  const { data: dmRecords = [] } = useDistrictMeetingRecords();

  if (zL || dL || cL || mL || uL || mdL || tL || gL || psL) {
    return (
      <AppLayout>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const reportStats = {
    total: dmRecords.length,
    completed: dmRecords.filter((r) => r.status === "Completed").length,
    pending: dmRecords.filter((r) => r.status !== "Completed").length,
  };

  const completionRate = reportStats.total > 0 ? Math.round((reportStats.completed / reportStats.total) * 100) : 0;

  const statCards = [
    { label: "Active Districts", value: districts.length, icon: Building2, subtitle: "National coverage" },
    { label: "Active Coordinators", value: coordinators.filter((c) => c.status === "Active").length, icon: Users, subtitle: "Field leadership" },
    { label: "Meetings This Month", value: meetings.filter((m) => m.month === currentMonth).length, icon: Calendar, subtitle: "Scheduled in calendar" },
    { label: "Completion Rate", value: `${completionRate}%`, icon: CheckCircle2, subtitle: "Reports submitted" },
  ];

  const upcomingMeetings = meetings
    .filter((m) => m.meetingDate >= today)
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))
    .slice(0, 6);

  const upcomingSchedules = presidentSchedules
    .filter((s) => s.scheduleDate >= today)
    .sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate))
    .slice(0, 4);

  const reminderItems = [
    ...upcomingMeetings.map((m) => ({
      id: `meeting-${m.id}`,
      title: m.title,
      date: m.meetingDate,
      meta: `${m.districtIds.length} districts`,
      type: "Meeting",
    })),
    ...upcomingSchedules.map((s) => ({
      id: `schedule-${s.id}`,
      title: s.title,
      date: s.scheduleDate,
      meta: s.targetName,
      type: "Schedule",
    })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const monthlyTrend = [
    { month: "Zones", total: zones.length },
    { month: "Districts", total: districts.length },
    { month: "Universities", total: universities.length },
    { month: "Madadgar", total: madadgarTeams.length },
    { month: "Tasks", total: tasks.length },
    { month: "Goals", total: goals.length },
  ];

  const zonePerformance = zones.map((z) => ({
    name: z.name.length > 14 ? `${z.name.substring(0, 14)}...` : z.name,
    districts: districts.filter((d) => d.zone === z.name).length,
    coordinators: coordinators.filter((c) => c.zone === z.name && c.status === "Active").length,
  }));

  const taskStatusData = [
    { name: "Pending", value: tasks.filter((t) => t.status === "Pending").length },
    { name: "In Progress", value: tasks.filter((t) => t.status === "In Progress").length },
    { name: "Completed", value: tasks.filter((t) => t.status === "Completed").length },
    { name: "Delayed", value: tasks.filter((t) => t.status === "Delayed").length },
  ].filter((d) => d.value > 0);

  const activeGoals = goals.filter((g) => g.status !== "Completed").length;
  const activeTasks = tasks.filter((t) => t.status !== "Completed").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#0b6b4a]/20 bg-gradient-to-br from-[#f6fbf8] via-[#eef7f2] to-[#e4f2eb] p-6 shadow-[0_20px_60px_rgba(1,79,53,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#014f35]/70">Overview</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#013122]">Welcome Back, MSL Team</h1>
              <p className="mt-1 text-sm text-[#014f35]/75">Live organizational operations, meetings and reminders in one place.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="gap-1 rounded-full border-0 bg-[#014f35] px-3 py-1 text-[11px] text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Live Data
              </Badge>
              <button
                onClick={() => navigate("/meetings")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#014f35] shadow-sm ring-1 ring-[#014f35]/20 transition hover:bg-[#014f35] hover:text-white"
              >
                Open Meetings <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border border-[#d3e7dc] bg-white/85 shadow-none">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs font-medium text-[#014f35]/70">{stat.label}</p>
                    <p className="mt-1 text-3xl font-semibold text-[#013122]">{stat.value}</p>
                    <p className="text-[11px] text-[#014f35]/60">{stat.subtitle}</p>
                  </div>
                  <div className="rounded-xl bg-[#014f35]/10 p-2.5 text-[#014f35]">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upcoming Meetings & President Schedule - Enhanced Styling */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="border-none shadow-lg xl:col-span-2 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            <CardHeader className="pb-3 border-b border-blue-200/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#013122]">
                  <Calendar className="h-5 w-5 text-blue-600" /> Upcoming Meetings
                </CardTitle>
                <button onClick={() => navigate("/meetings")} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">View all →</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {upcomingMeetings.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No upcoming meetings.</p>}
              {upcomingMeetings.map((meeting, idx) => (
                <div key={meeting.id} className="flex items-center justify-between rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 px-4 py-3 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#013122]">{meeting.title}</p>
                      <p className="text-xs text-blue-600/70">{meeting.meetingDate} • {meeting.districtIds.length} districts</p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-blue-100 text-xs text-blue-700">{meeting.scope}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 via-white to-pink-50">
            <CardHeader className="pb-3 border-b border-purple-200/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#013122]">
                  <CalendarDays className="h-5 w-5 text-purple-600" /> President Schedule
                </CardTitle>
                <button onClick={() => navigate("/president-schedule")} className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition">View all →</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {upcomingSchedules.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No schedules.</p>}
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.id} className="rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-pink-50/80 px-4 py-3 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <p className="truncate text-sm font-medium text-[#013122]">{schedule.title}</p>
                  </div>
                  <p className="text-xs text-purple-600/70 ml-4">{schedule.targetName}</p>
                  <div className="mt-2 flex items-center justify-between ml-4">
                    <p className="text-[11px] text-purple-600/80 font-medium">{schedule.scheduleDate}</p>
                    <Badge className="text-[10px] bg-purple-100 text-purple-700 border-0">{schedule.frequency}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Performance Meter */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-orange-50 via-red-50 to-yellow-50">
          <CardHeader className="pb-3 border-b border-orange-200/30">
            <CardTitle className="text-base font-semibold text-[#013122]">📊 Performance Meter</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Completion Rate Meter */}
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 mb-3">Report Completion</p>
                <div className="relative h-32 w-32 mx-auto">
                  <svg className="transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#grad1)"
                      strokeWidth="8"
                      strokeDasharray={`${(completionRate / 100) * 314} 314`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-bold text-[#013122]">{completionRate}%</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">{reportStats.completed}/{reportStats.total} reports</p>
              </div>

              {/* Tasks Meter */}
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 mb-3">Task Progress</p>
                <div className="relative h-32 w-32 mx-auto">
                  <svg className="transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#grad2)"
                      strokeWidth="8"
                      strokeDasharray={`${tasks.length > 0 ? ((tasks.filter(t => t.status === "Completed").length / tasks.length) * 314) : 0} 314`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-bold text-[#013122]">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100) : 0}%</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">{tasks.filter(t => t.status === "Completed").length} completed</p>
              </div>

              {/* Goals Meter */}
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 mb-3">Goals Achieved</p>
                <div className="relative h-32 w-32 mx-auto">
                  <svg className="transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#grad3)"
                      strokeWidth="8"
                      strokeDasharray={`${goals.length > 0 ? ((goals.filter(g => g.status === "Completed").length / goals.length) * 314) : 0} 314`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-bold text-[#013122]">{goals.length > 0 ? Math.round((goals.filter(g => g.status === "Completed").length / goals.length) * 100) : 0}%</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">{goals.filter(g => g.status === "Completed").length} completed</p>
              </div>

              {/* Overall Health Meter */}
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 mb-3">Overall Health</p>
                <div className="relative h-32 w-32 mx-auto">
                  <svg className="transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />

                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#grad4)"
                      strokeWidth="8"
                      strokeDasharray={`${((completionRate + (tasks.length > 0 ? ((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100) : 0) + (goals.length > 0 ? ((goals.filter(g => g.status === "Completed").length / goals.length) * 100) : 0)) / 3 / 100) * 314} 314`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-bold text-[#013122]">{Math.round((completionRate + (tasks.length > 0 ? ((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100) : 0) + (goals.length > 0 ? ((goals.filter(g => g.status === "Completed").length / goals.length) * 100) : 0)) / 3)}%</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">System Overall</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Card className="border-none bg-white shadow-sm xl:col-span-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#013122]">Live Operations Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#014f35" strokeWidth={2.5} dot={{ r: 4, fill: "#014f35" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none bg-[#0b1f18] text-white shadow-sm xl:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white"><BellRing className="h-4 w-4 text-emerald-300" /> Meeting Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminderItems.length === 0 && <p className="rounded-lg bg-white/5 px-3 py-4 text-xs text-emerald-100/80">No upcoming reminders.</p>}
              {reminderItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <Badge variant="outline" className="border-white/20 bg-white/10 text-[10px] text-emerald-200">{item.type}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-100/75">{item.meta}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-300"><Clock3 className="h-3 w-3" /> {item.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Zone Performance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={zonePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="districts" fill="#014f35" radius={[4, 4, 0, 0]} name="Districts" />
                  <Bar dataKey="coordinators" fill="#27a176" radius={[4, 4, 0, 0]} name="Coordinators" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
              <div className="mt-2 grid grid-cols-2 gap-2">
                {taskStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Operations Section */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50">
          <CardHeader className="pb-3 border-b border-teal-200/30">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#013122]">
              <span className="h-3 w-3 rounded-full bg-teal-500 animate-pulse" /> Live Operations Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-teal-200/50 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
                <p className="text-xs font-semibold text-teal-700 mb-2">Active Districts</p>
                <p className="text-3xl font-bold text-[#013122]">{districts.length}</p>
                <div className="mt-3 h-2 bg-teal-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${Math.min((districts.length / 35) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">Active Coordinators</p>
                <p className="text-3xl font-bold text-[#013122]">{coordinators.filter((c) => c.status === "Active").length}</p>
                <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min((coordinators.filter((c) => c.status === "Active").length / coordinators.length * 100) || 0, 100)}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                <p className="text-xs font-semibold text-purple-700 mb-2">Active Meetings</p>
                <p className="text-3xl font-bold text-[#013122]">{meetings.filter((m) => m.month === currentMonth).length}</p>
                <div className="mt-3 h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min((meetings.filter((m) => m.month === currentMonth).length / meetings.length * 100) || 0, 100)}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50 to-red-50 p-4">
                <p className="text-xs font-semibold text-orange-700 mb-2">Pending Actions</p>
                <p className="text-3xl font-bold text-[#013122]">{reportStats.pending}</p>
                <div className="mt-3 h-2 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${Math.min((reportStats.pending / reportStats.total * 100) || 0, 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={() => navigate("/districts")} className="rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:shadow-lg">
                → View Districts
              </button>
              <button onClick={() => navigate("/coordinators")} className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:shadow-lg">
                → View Coordinators
              </button>
              <button onClick={() => navigate("/meetings")} className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:shadow-lg">
                → View Meetings
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-[#014f35] to-[#013826] text-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Quick Health Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-xs text-emerald-100/80">Pending Reports</p>
                <p className="mt-1 text-2xl font-semibold">{reportStats.pending}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-xs text-emerald-100/80">Open Tasks</p>
                <p className="mt-1 text-2xl font-semibold">{activeTasks}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-xs text-emerald-100/80">Active Goals</p>
                <p className="mt-1 text-2xl font-semibold">{activeGoals}</p>
              </div>
            </div>
            <button onClick={() => navigate("/analytics")} className="w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#014f35] transition hover:bg-emerald-50">
              Open Detailed Analytics
            </button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
