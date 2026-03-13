import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUniversities, useUniversityCoordinators, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { exportUniversitiesExcel, exportUniversitiesPDF } from "@/lib/exportUtils";
import { Building2, Download, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Universities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: universities = [], isLoading: uL } = useUniversities();
  const { data: coordinators = [], isLoading: cL } = useUniversityCoordinators();

  if (uL || cL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const filtered = universities.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Universities Department</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} universities</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportUniversitiesPDF(filtered, coordinators)}>
                <FileText className="h-3.5 w-3.5 mr-2" /> Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportUniversitiesExcel(filtered, coordinators)}>
                <FileText className="h-3.5 w-3.5 mr-2" /> Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search university or city..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const coord = coordinators.find((c) => c.universityId === u.id && c.status === "Active");
                  return (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/universities/${u.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.province}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.city}</TableCell>
                      <TableCell>{coord?.name || <span className="text-xs text-muted-foreground italic">Unassigned</span>}</TableCell>
                      <TableCell><Badge variant={u.status === "Active" ? "default" : "secondary"} className="text-[10px]">{u.status}</Badge></TableCell>
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
