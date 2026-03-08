import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { districts, coordinators, zones } from "@/data/mockData";
import { Search, Plus, Building2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Districts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialZone = searchParams.get("zone") || "all";
  const [zoneFilter, setZoneFilter] = useState(initialZone);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = districts.filter(d => {
    if (zoneFilter !== "all" && d.zone !== zoneFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.division.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const assigned = filtered.filter(d => d.currentCoordinatorId).length;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Districts</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {filtered.length} districts · {assigned} with coordinators
            </p>
          </div>
          <Button className="gap-2 shadow-sm"><Plus className="h-4 w-4" /> Add District</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or division..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Filter by zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones ({districts.length})</SelectItem>
              {zones.map(z => {
                const count = districts.filter(d => d.zone === z.name).length;
                return <SelectItem key={z.id} value={z.name}>{z.name} ({count})</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead className="text-right">Population</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => {
                  const coord = coordinators.find(c => c.id === d.currentCoordinatorId);
                  return (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/districts/${d.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{d.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{d.zone}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{d.division}</TableCell>
                      <TableCell>
                        {coord ? (
                          <span className="text-sm">{coord.name}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-right font-mono">{d.population?.toLocaleString() || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "Active" ? "default" : "secondary"} className="text-[10px]">{d.status}</Badge>
                      </TableCell>
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
