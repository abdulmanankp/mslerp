import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useZones, useDistricts, useCoordinators, useGoals, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Analytics() {
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: coordinators = [], isLoading: cL } = useCoordinators();
  const { data: goals = [], isLoading: gL } = useGoals();

  if (zL || dL || cL || gL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const zoneComparison = zones.map(z => ({
    name: z.name.length > 10 ? z.name.substring(0, 10) + "…" : z.name,
    districts: districts.filter(d => d.zone === z.name).length,
    coordinators: coordinators.filter(c => c.zone === z.name && c.status === "Active").length,
  }));

  const coordComparison = coordinators.filter(c => c.status === "Active").slice(0, 8).map(c => ({
    name: c.name.split(" ")[0],
    activities: c.totalActivities || 0,
    attendance: c.attendanceRate || 0,
  }));

  const districtGoalCompletion = goals.filter(g => g.month === currentMonth).map(g => ({
    name: g.districtName,
    target: g.targetNumber,
    completed: g.completedNumber || 0,
  }));

  const categoryData = [
    { name: "Education", value: 35 },
    { name: "Outreach", value: 20 },
    { name: "Youth", value: 18 },
    { name: "Welfare", value: 15 },
    { name: "Media", value: 12 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Compare performance across zones, districts, and coordinators</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Zone Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={zoneComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="districts" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="coordinators" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Coordinator Performance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={coordComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="activities" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Goal vs Achievement</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={districtGoalCompletion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="target" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Activity Categories</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
