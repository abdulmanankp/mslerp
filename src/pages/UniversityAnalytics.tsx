import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet } from "lucide-react";
import { LoadingSkeleton, useUniversities, useUniversityGoals, useUniversityMeetingRecords } from "@/hooks/useFirebaseData";
import { exportUniversityCampaignAnalyticsExcel, exportUniversityCampaignAnalyticsPDF } from "@/lib/exportUtils";

export default function UniversityAnalytics() {
  const { data: universities = [], isLoading: uL } = useUniversities();
  const { data: goals = [], isLoading: gL } = useUniversityGoals();
  const { data: meetingRecords = [], isLoading: rL } = useUniversityMeetingRecords();
  const [selectedUniversityId, setSelectedUniversityId] = useState("all");

  const filteredGoals = useMemo(() => {
    if (selectedUniversityId === "all") return goals;
    return goals.filter((g) => g.universityId === selectedUniversityId);
  }, [goals, selectedUniversityId]);

  const filteredRecords = useMemo(() => {
    if (selectedUniversityId === "all") return meetingRecords;
    return meetingRecords.filter((r) => r.universityId === selectedUniversityId);
  }, [meetingRecords, selectedUniversityId]);

  const selectedUniversity = useMemo(
    () => universities.find((u) => u.id === selectedUniversityId),
    [universities, selectedUniversityId],
  );

  const totalTarget = filteredGoals.reduce((sum, g) => sum + (g.targetNumber || 0), 0);
  const totalCompleted = filteredGoals.reduce((sum, g) => sum + (g.completedNumber || 0), 0);
  const totalApproached = filteredGoals.reduce((sum, g) => sum + (g.approachedStudents || 0), 0);
  const totalSuccessful = filteredGoals.reduce((sum, g) => sum + (g.successfulStudents || 0), 0);
  const completedReports = filteredRecords.filter((r) => r.status === "Completed").length;
  const performance = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
  const conversion = totalApproached > 0 ? Math.round((totalSuccessful / totalApproached) * 100) : 0;

  const scenarioRows = useMemo(() => {
    const map = new Map<string, { campaigns: number; target: number; completed: number; approached: number; successful: number }>();
    filteredGoals.forEach((goal) => {
      const key = goal.scenario || "Custom";
      const current = map.get(key) || { campaigns: 0, target: 0, completed: 0, approached: 0, successful: 0 };
      current.campaigns += 1;
      current.target += goal.targetNumber || 0;
      current.completed += goal.completedNumber || 0;
      current.approached += goal.approachedStudents || 0;
      current.successful += goal.successfulStudents || 0;
      map.set(key, current);
    });
    return Array.from(map.entries());
  }, [filteredGoals]);

  if (uL || gL || rL) {
    return (
      <AppLayout>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">University Analytics</h1>
            <p className="text-sm text-muted-foreground">Separate analytics generator for university campaigns and reports.</p>
          </div>
          <Badge variant="secondary" className="text-xs">{filteredGoals.length} campaigns</Badge>
        </div>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Select University</Label>
              <Select value={selectedUniversityId} onValueChange={setSelectedUniversityId}>
                <SelectTrigger>
                  <SelectValue placeholder="All universities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                disabled={!selectedUniversity || filteredGoals.length === 0}
                onClick={() => selectedUniversity && exportUniversityCampaignAnalyticsPDF(selectedUniversity, filteredGoals)}
              >
                <Download className="h-4 w-4 mr-1" /> Generate PDF
              </Button>
              <Button
                variant="outline"
                disabled={!selectedUniversity || filteredGoals.length === 0}
                onClick={() => selectedUniversity && exportUniversityCampaignAnalyticsExcel(selectedUniversity, filteredGoals)}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Generate Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Target</p><p className="text-lg font-bold font-mono">{totalTarget}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Completed</p><p className="text-lg font-bold font-mono">{totalCompleted}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Performance</p><p className="text-lg font-bold font-mono">{performance}%</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Approached</p><p className="text-lg font-bold font-mono">{totalApproached}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Successful</p><p className="text-lg font-bold font-mono">{totalSuccessful}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Conversion</p><p className="text-lg font-bold font-mono">{conversion}%</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Reports</p><p className="text-lg font-bold font-mono">{completedReports}</p></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Total Records</p><p className="text-lg font-bold font-mono">{filteredRecords.length}</p></CardContent></Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scenario Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Approached</TableHead>
                  <TableHead>Successful</TableHead>
                  <TableHead>Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarioRows.map(([scenario, row]) => (
                  <TableRow key={scenario}>
                    <TableCell className="font-medium">{scenario}</TableCell>
                    <TableCell className="font-mono">{row.campaigns}</TableCell>
                    <TableCell className="font-mono">{row.target}</TableCell>
                    <TableCell className="font-mono">{row.completed}</TableCell>
                    <TableCell className="font-mono">{row.target > 0 ? Math.round((row.completed / row.target) * 100) : 0}%</TableCell>
                    <TableCell className="font-mono">{row.approached}</TableCell>
                    <TableCell className="font-mono">{row.successful}</TableCell>
                    <TableCell className="font-mono">{row.approached > 0 ? Math.round((row.successful / row.approached) * 100) : 0}%</TableCell>
                  </TableRow>
                ))}
                {scenarioRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No scenario analytics data yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
