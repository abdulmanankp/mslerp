import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMadadgarTeams, useMadadgarCoordinators, useZones, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { exportMadadgarTeamsExcel, exportMadadgarTeamsPDF } from "@/lib/exportUtils";
import { Building2, Download, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function MadadgarTeams() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");

  const { data: teams = [], isLoading: tL } = useMadadgarTeams();
  const { data: coordinators = [], isLoading: cL } = useMadadgarCoordinators();
  const { data: zones = [], isLoading: zL } = useZones();

  if (tL || cL || zL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const filtered = teams.filter((t) => {
    if (zoneFilter !== "all" && t.zone !== zoneFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !(t.districtName || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Madadgar Teams</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} teams</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportMadadgarTeamsPDF(filtered, coordinators)}>
                <FileText className="h-3.5 w-3.5 mr-2" /> Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMadadgarTeamsExcel(filtered, coordinators)}>
                <FileText className="h-3.5 w-3.5 mr-2" /> Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search team or district..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map((z) => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const coord = coordinators.find((c) => c.teamId === t.id && c.status === "Active");
                  return (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/madadgar-teams/${t.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{t.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.zone}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.districtName || "-"}</TableCell>
                      <TableCell>{coord?.name || <span className="text-xs text-muted-foreground italic">Unassigned</span>}</TableCell>
                      <TableCell><Badge variant={t.status === "Active" ? "default" : "secondary"} className="text-[10px]">{t.status}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
