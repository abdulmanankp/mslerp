import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSkeleton, useDistrictMeetingRecords, useDistricts } from "@/hooks/useFirebaseData";
import { exportVision12KAnalyticsExcel, exportVision12KAnalyticsPDF } from "@/lib/exportUtils";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, FileSpreadsheet, Search, UsersRound } from "lucide-react";

const BRAND_COLORS = ["#014f35", "#0f766e", "#0ea5e9", "#22c55e", "#f4c542", "#ef4444"];

type Vision12KDistrictRow = {
  districtId: string;
  districtName: string;
  zone: string;
  totalVision12K: number;
  reportCount: number;
  latestMeetingDate: string | null;
};

function formatMeetingDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function Vision12K() {
  const { data: districts = [], isLoading: districtsLoading } = useDistricts();
  const { data: meetingRecords = [], isLoading: recordsLoading } = useDistrictMeetingRecords();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const districtRows = useMemo(() => {
    const rowMap = new Map<string, Vision12KDistrictRow>();

    districts.forEach((district) => {
      rowMap.set(district.id, {
        districtId: district.id,
        districtName: district.name,
        zone: district.zone,
        totalVision12K: 0,
        reportCount: 0,
        latestMeetingDate: null,
      });
    });

    meetingRecords.forEach((record) => {
      const current = rowMap.get(record.districtId) || {
        districtId: record.districtId,
        districtName: record.districtName,
        zone: "Unknown",
        totalVision12K: 0,
        reportCount: 0,
        latestMeetingDate: null,
      };

      current.totalVision12K += record.vision12KCount || 0;
      current.reportCount += 1;

      if (!current.latestMeetingDate || record.meetingDate > current.latestMeetingDate) {
        current.latestMeetingDate = record.meetingDate;
      }

      rowMap.set(record.districtId, current);
    });

    return Array.from(rowMap.values()).sort((a, b) => {
      if (b.totalVision12K !== a.totalVision12K) return b.totalVision12K - a.totalVision12K;
      if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
      return a.districtName.localeCompare(b.districtName);
    });
  }, [districts, meetingRecords]);

  const zoneOptions = useMemo(() => {
    const zones = Array.from(new Set(districtRows.map((row) => row.zone))).sort((a, b) => a.localeCompare(b));
    return zones;
  }, [districtRows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return districtRows.filter((row) => {
      if (zoneFilter !== "all" && row.zone !== zoneFilter) return false;
      if (!query) return true;
      return row.districtName.toLowerCase().includes(query) || row.zone.toLowerCase().includes(query);
    });
  }, [districtRows, search, zoneFilter]);

  const totalAttachedPeople = districtRows.reduce((sum, row) => sum + row.totalVision12K, 0);
  const totalReports = districtRows.reduce((sum, row) => sum + row.reportCount, 0);
  const activeDistricts = districtRows.filter((row) => row.reportCount > 0).length;
  const coveragePercent = districts.length > 0 ? Math.round((activeDistricts / districts.length) * 100) : 0;
  const averagePerReport = totalReports > 0 ? Math.round(totalAttachedPeople / totalReports) : 0;
  const topDistrict = districtRows[0] || null;

  const chartRows = filteredRows.slice(0, 10);

  if (districtsLoading || recordsLoading) {
    return (
      <AppLayout>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      await exportVision12KAnalyticsPDF(filteredRows);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportExcel() {
    setIsExportingExcel(true);
    try {
      await exportVision12KAnalyticsExcel(filteredRows);
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#0b6b4a]/20 bg-gradient-to-br from-[#f6fbf8] via-[#eef7f2] to-[#e6f3ec] p-5 shadow-[0_16px_50px_rgba(1,79,53,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="border-0 bg-[#014f35] text-white">
                <UsersRound className="mr-1 h-3.5 w-3.5" /> Live District Data
              </Badge>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#013122]">Vision 12K</h1>
              <p className="mt-1 text-sm text-[#014f35]/75">
                Live district totals for attached people, reporting coverage, export, and ranking analytics.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleExportPdf} disabled={isExportingPdf || filteredRows.length === 0} className="gap-2">
                <Download className="h-4 w-4" />
                {isExportingPdf ? "Exporting..." : "Export PDF"}
              </Button>
              <Button variant="outline" onClick={handleExportExcel} disabled={isExportingExcel || filteredRows.length === 0} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {isExportingExcel ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#014f35]/80"><Search className="mr-1 inline h-3.5 w-3.5" /> Search District</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search district or zone..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#014f35]/80">Zone Filter</Label>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zoneOptions.map((zone) => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-xs text-muted-foreground">Current View</p>
              <p className="mt-1 text-sm font-semibold text-[#013122]">{filteredRows.length} districts in view</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Attached People</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{totalAttachedPeople}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Reporting Districts</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{activeDistricts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Coverage</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{coveragePercent}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Average / Report</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{averagePerReport}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Top District</p>
              <p className="mt-1 text-lg font-semibold text-[#013122]">{topDistrict ? topDistrict.districtName : "N/A"}</p>
              <p className="text-xs text-muted-foreground">{topDistrict ? `${topDistrict.totalVision12K} attached people` : "No data yet"}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-[#014f35]" /> Vision 12K District Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-[#d5e8de] bg-[#f6fbf8] p-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartRows} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="districtName" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="totalVision12K" radius={[0, 6, 6, 0]}>
                    {chartRows.map((_, index) => (
                      <Cell key={`vision12k-bar-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vision 12K Live District List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Attached People</TableHead>
                  <TableHead>Average / Report</TableHead>
                  <TableHead>Latest Meeting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.districtId}>
                    <TableCell className="font-medium">{row.districtName}</TableCell>
                    <TableCell>{row.zone}</TableCell>
                    <TableCell className="font-mono">{row.reportCount}</TableCell>
                    <TableCell className="font-mono">{row.totalVision12K}</TableCell>
                    <TableCell className="font-mono">{row.reportCount > 0 ? Math.round(row.totalVision12K / row.reportCount) : 0}</TableCell>
                    <TableCell>{formatMeetingDate(row.latestMeetingDate)}</TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No Vision 12K records match the current filters.
                    </TableCell>
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