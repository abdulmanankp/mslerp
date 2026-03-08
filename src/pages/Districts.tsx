import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { districts, coordinators, zones } from "@/data/mockData";
import { Building2, Search, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Districts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialZone = searchParams.get("zone") || "all";
  const [zoneFilter, setZoneFilter] = useState(initialZone);
  const [search, setSearch] = useState("");

  const filtered = districts.filter(d => {
    if (zoneFilter !== "all" && d.zone !== zoneFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Districts</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} districts</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add District</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search districts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Filter by zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}
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
                  <TableHead>Population</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => {
                  const coord = coordinators.find(c => c.id === d.currentCoordinatorId);
                  return (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/districts/${d.id}`)}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{d.zone}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{d.division}</TableCell>
                      <TableCell>{coord ? coord.name : <span className="text-muted-foreground text-xs">Unassigned</span>}</TableCell>
                      <TableCell className="text-sm">{d.population?.toLocaleString() || "—"}</TableCell>
                      <TableCell><Badge variant={d.status === "Active" ? "default" : "secondary"} className="text-[10px]">{d.status}</Badge></TableCell>
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
