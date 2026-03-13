import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGoals, useZones, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Goals() {
  const [monthFilter, setMonthFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  const { data: goals = [], isLoading: gL } = useGoals();
  const { data: zones = [], isLoading: zL } = useZones();

  if (gL || zL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const filtered = goals.filter(g => {
    if (monthFilter !== "all" && g.month !== monthFilter) return false;
    if (zoneFilter !== "all" && g.zone !== zoneFilter) return false;
    return true;
  });

  const months = [...new Set(goals.map(g => g.month))];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Goals</h1>
            <p className="text-muted-foreground text-sm mt-1">Assign monthly activity goals to districts</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Assign Goal</Button>
        </div>

        <div className="flex gap-3">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead><TableHead>District</TableHead><TableHead>Zone</TableHead>
                  <TableHead>Month</TableHead><TableHead>Target</TableHead><TableHead>Completed</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.activityName}</TableCell>
                    <TableCell>{g.districtName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{g.zone}</TableCell>
                    <TableCell>{g.month}</TableCell>
                    <TableCell className="font-mono">{g.targetNumber}</TableCell>
                    <TableCell className="font-mono">{g.completedNumber ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={g.status === "Completed" ? "default" : g.status === "Partially Completed" ? "secondary" : "outline"} className="text-[10px]">{g.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No goals found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
