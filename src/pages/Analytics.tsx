import { useMemo, useRef, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useZones,
  useDistricts,
  useCoordinators,
  useGoals,
  useDistrictMeetingRecords,
  useActivities,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Activity, CalendarRange, Download, Filter, Radio, Search } from "lucide-react";
import { savePdfDocument } from "@/lib/exportUtils";

type Timeframe = "daily" | "weekly" | "monthly" | "yearly";
type ActivityFilter = "all" | `activity:${string}`;

const BRAND_COLORS = ["#014f35", "#f4c542", "#ec4899", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6"];
const PIE_COLORS = ["#014f35", "#f4c542", "#ec4899", "#ef4444", "#22c55e"];

async function loadLogoDataUrl(path: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = path;
  });
}

function parseDate(value: string): Date | null {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isInTimeframe(value: string, timeframe: Timeframe, reference: Date): boolean {
  const date = parseDate(value);
  if (!date) return false;

  if (timeframe === "daily") {
    return date.toDateString() === reference.toDateString();
  }

  if (timeframe === "weekly") {
    const start = startOfWeek(reference);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  }

  if (timeframe === "monthly") {
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
  }

  return date.getFullYear() === reference.getFullYear();
}

function bucketLabel(value: string, timeframe: Timeframe): string {
  const date = parseDate(value);
  if (!date) return "N/A";

  if (timeframe === "yearly") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }

  if (timeframe === "monthly") {
    return date.toLocaleDateString("en-US", { day: "2-digit" });
  }

  if (timeframe === "weekly") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function getActivityMatches(name: string, filter: ActivityFilter): boolean {
  const lowerName = name.toLowerCase();

  if (filter === "all") return true;
  if (filter.startsWith("activity:")) {
    return lowerName === filter.slice("activity:".length).toLowerCase();
  }

  return false;
}

export default function Analytics() {
  const chartsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [districtSearch, setDistrictSearch] = useState("");

  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: coordinators = [], isLoading: cL } = useCoordinators();
  const { data: goals = [], isLoading: gL } = useGoals();
  const { data: dmRecords = [], isLoading: rL } = useDistrictMeetingRecords();
  const { data: activities = [], isLoading: aL } = useActivities();

  const reference = useMemo(() => parseDate(referenceDate) || new Date(), [referenceDate]);

  const districtNameById = useMemo(() => {
    const map = new Map<string, string>();
    districts.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [districts]);

  const filteredRecords = useMemo(
    () => dmRecords.filter((row) => isInTimeframe(row.meetingDate, timeframe, reference)),
    [dmRecords, timeframe, reference],
  );

  const selectedGoals = useMemo(() => {
    if (timeframe === "daily" || timeframe === "weekly") {
      const month = `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}`;
      return goals.filter((g) => g.month === month);
    }

    if (timeframe === "monthly") {
      const month = `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}`;
      return goals.filter((g) => g.month === month);
    }

    const year = String(reference.getFullYear());
    return goals.filter((g) => g.month.startsWith(year));
  }, [goals, timeframe, reference]);

  const districtPerformanceAll = useMemo(() => {
    const map = new Map<string, { districtName: string; totalCompleted: number; reportCount: number }>();

    filteredRecords.forEach((row) => {
      let completed = 0;
      row.activityReports.forEach((activityRow) => {
        completed += activityRow.completedQuantity || 0;
      });

      row.customActivities.forEach((customRow) => {
        completed += customRow.quantity || 0;
      });

      const current = map.get(row.districtId) || {
        districtName: districtNameById.get(row.districtId) || row.districtName,
        totalCompleted: 0,
        reportCount: 0,
      };

      current.totalCompleted += completed;
      current.reportCount += 1;
      map.set(row.districtId, current);
    });

    return Array.from(map.entries())
      .map(([districtId, item]) => ({
        districtId,
        districtName: item.districtName,
        totalCompleted: item.totalCompleted,
        reportCount: item.reportCount,
      }))
      .sort((a, b) => b.totalCompleted - a.totalCompleted)
      .slice(0, 12);
  }, [filteredRecords, districtNameById]);

  const districtPerformance = useMemo(() => {
    const map = new Map<string, { districtName: string; totalCompleted: number; reportCount: number }>();

    filteredRecords.forEach((row) => {
      let completed = 0;
      row.activityReports.forEach((activityRow) => {
        if (getActivityMatches(activityRow.activityName, activityFilter)) {
          completed += activityRow.completedQuantity || 0;
        }
      });

      row.customActivities.forEach((customRow) => {
        if (getActivityMatches(customRow.name, activityFilter)) {
          completed += customRow.quantity || 0;
        }
      });

      if (completed === 0 && activityFilter !== "all") {
        return;
      }

      const current = map.get(row.districtId) || {
        districtName: districtNameById.get(row.districtId) || row.districtName,
        totalCompleted: 0,
        reportCount: 0,
      };

      current.totalCompleted += completed;
      current.reportCount += 1;
      map.set(row.districtId, current);
    });

    return Array.from(map.entries())
      .map(([districtId, item]) => ({
        districtId,
        districtName: item.districtName,
        totalCompleted: item.totalCompleted,
        reportCount: item.reportCount,
      }))
      .sort((a, b) => b.totalCompleted - a.totalCompleted)
      .slice(0, 12);
  }, [filteredRecords, activityFilter, districtNameById]);

  const activityMixData = useMemo(() => {
    const map = new Map<string, number>();

    filteredRecords.forEach((row) => {
      row.activityReports.forEach((activityRow) => {
        if (getActivityMatches(activityRow.activityName, activityFilter)) {
          map.set(activityRow.activityName, (map.get(activityRow.activityName) || 0) + (activityRow.completedQuantity || 0));
        }
      });

      row.customActivities.forEach((customRow) => {
        if (getActivityMatches(customRow.name, activityFilter)) {
          const key = `Custom: ${customRow.name}`;
          map.set(key, (map.get(key) || 0) + (customRow.quantity || 0));
        }
      });
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredRecords, activityFilter]);

  const liveTrendData = useMemo(() => {
    const map = new Map<string, { label: string; reports: number; completed: number; sortKey: number }>();

    filteredRecords.forEach((row) => {
      const label = bucketLabel(row.meetingDate, timeframe);
      const parsedDate = parseDate(row.meetingDate);
      const sortKey = parsedDate ? parsedDate.getTime() : 0;
      const current = map.get(label) || { label, reports: 0, completed: 0, sortKey };

      current.reports += 1;

      row.activityReports.forEach((activityRow) => {
        current.completed += activityRow.completedQuantity || 0;
      });

      row.customActivities.forEach((customRow) => {
        current.completed += customRow.quantity || 0;
      });

      map.set(label, current);
    });

    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredRecords, timeframe]);

  const zoneLiveData = useMemo(() => {
    return zones
      .map((zone) => {
        const zoneDistrictIds = new Set(districts.filter((d) => d.zone === zone.name).map((d) => d.id));
        const zoneRecords = filteredRecords.filter((r) => zoneDistrictIds.has(r.districtId));

        let totalCompleted = 0;
        zoneRecords.forEach((row) => {
          row.activityReports.forEach((activityRow) => {
            if (getActivityMatches(activityRow.activityName, activityFilter)) {
              totalCompleted += activityRow.completedQuantity || 0;
            }
          });
          row.customActivities.forEach((customRow) => {
            if (getActivityMatches(customRow.name, activityFilter)) {
              totalCompleted += customRow.quantity || 0;
            }
          });
        });

        return {
          name: zone.name.length > 10 ? `${zone.name.slice(0, 10)}...` : zone.name,
          reports: zoneRecords.length,
          completed: totalCompleted,
        };
      })
      .filter((item) => item.reports > 0 || item.completed > 0);
  }, [zones, districts, filteredRecords, activityFilter]);

  const filterLabel = activityFilter === "all" ? "All Activities" : activityFilter.slice("activity:".length);

  const searchedDistrictPerformance = useMemo(() => {
    const q = districtSearch.trim().toLowerCase();
    if (!q) return districtPerformance;
    return districtPerformance.filter((item) => item.districtName.toLowerCase().includes(q));
  }, [districtPerformance, districtSearch]);

  const totalCompleted = districtPerformanceAll.reduce((sum, row) => sum + row.totalCompleted, 0);
  const uniqueDistricts = new Set(filteredRecords.map((row) => row.districtId)).size;
  const vision12KDistrictRows = useMemo(() => {
    const map = new Map<string, { districtName: string; totalVision12K: number; reportCount: number }>();

    filteredRecords.forEach((row) => {
      const current = map.get(row.districtId) || {
        districtName: districtNameById.get(row.districtId) || row.districtName,
        totalVision12K: 0,
        reportCount: 0,
      };

      current.totalVision12K += row.vision12KCount || 0;
      current.reportCount += 1;
      map.set(row.districtId, current);
    });

    return Array.from(map.entries())
      .map(([districtId, item]) => ({
        districtId,
        districtName: item.districtName,
        totalVision12K: item.totalVision12K,
        reportCount: item.reportCount,
      }))
      .sort((a, b) => b.totalVision12K - a.totalVision12K);
  }, [filteredRecords, districtNameById]);

  const totalVision12K = vision12KDistrictRows.reduce((sum, row) => sum + row.totalVision12K, 0);
  const topVision12KDistrict = vision12KDistrictRows[0] || null;

  const bestReport = useMemo(() => {
    const ranked = filteredRecords.map((row) => {
      let completed = 0;

      row.activityReports.forEach((activityRow) => {
        completed += activityRow.completedQuantity || 0;
      });

      row.customActivities.forEach((customRow) => {
        completed += customRow.quantity || 0;
      });

      return {
        id: row.id,
        districtName: districtNameById.get(row.districtId) || row.districtName,
        meetingTitle: row.meetingTitle,
        meetingDate: row.meetingDate,
        completed,
      };
    });

    ranked.sort((a, b) => b.completed - a.completed);
    return ranked[0] || null;
  }, [filteredRecords, districtNameById]);

  const topDistrictPerformer = searchedDistrictPerformance[0] || null;
  const overallTopDistrict = districtPerformanceAll[0] || null;

  if (zL || dL || cL || gL || rL || aL) {
    return (
      <AppLayout>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  async function exportDistrictZoneProgressPDF() {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoDataUrl = await loadLogoDataUrl("/msl-logo.webp");

      doc.setFillColor(1, 79, 53);
      doc.rect(0, 0, pageWidth, 36, "F");
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", 14, 6, 18, 18);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Live Analytics Report", logoDataUrl ? 38 : 14, 14);
      doc.setFontSize(11);
      doc.text("MSL ERP Portal", logoDataUrl ? 38 : 14, 21);
      doc.text(`Generated: ${new Date().toLocaleString()}`, logoDataUrl ? 38 : 14, 27);
      doc.text(`Filters: ${timeframe.toUpperCase()} | ${referenceDate} | Activity: ${filterLabel}`, logoDataUrl ? 38 : 14, 33);
      doc.setTextColor(20, 35, 29);

      const chartNodes = chartsContainerRef.current
        ? Array.from(chartsContainerRef.current.querySelectorAll("[data-export-chart='true']")) as HTMLElement[]
        : [];

      if (chartNodes.length > 0) {
        let imageY = 45;
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        const targetWidth = pageWidth - margin * 2;

        for (const node of chartNodes) {
          const canvas = await html2canvas(node, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
          });

          const imageData = canvas.toDataURL("image/png");
          const imageHeight = (canvas.height * targetWidth) / canvas.width;

          if (imageY + imageHeight > pageHeight - 16) {
            doc.addPage();
            imageY = 16;
          }

          doc.addImage(imageData, "PNG", margin, imageY, targetWidth, imageHeight);
          imageY += imageHeight + 6;
        }

        doc.addPage();
      }

      autoTable(doc, {
        startY: 18,
        head: [["Summary Metric", "Value"]],
        body: [
          ["Records In Range", String(filteredRecords.length)],
          ["Districts Reporting", String(uniqueDistricts)],
          ["Total Completed Qty (Overall)", String(totalCompleted)],
          ["Vision 12K Total", String(totalVision12K)],
          ["Vision 12K Top District", topVision12KDistrict ? `${topVision12KDistrict.districtName} | ${topVision12KDistrict.totalVision12K}` : "N/A"],
          ["Top District Performer (Filtered)", topDistrictPerformer ? topDistrictPerformer.districtName : "N/A"],
          ["Best Activity Performance", topDistrictPerformer ? `${topDistrictPerformer.districtName} | Qty ${topDistrictPerformer.totalCompleted}` : "N/A"],
          ["Best Report", bestReport ? `${bestReport.districtName} | ${bestReport.meetingDate}` : "N/A"],
        ],
        styles: { fontSize: 9, cellPadding: 3, textColor: [20, 35, 29] },
        headStyles: { fillColor: [1, 79, 53], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [239, 248, 243] },
        theme: "grid",
      });

      const nextY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 32;
      autoTable(doc, {
        startY: nextY + 8,
        head: [["Overall District", "Reports", "Completed Qty"]],
        body: districtPerformanceAll.map((d) => [d.districtName, String(d.reportCount), String(d.totalCompleted)]),
        styles: { fontSize: 9, cellPadding: 3, textColor: [20, 35, 29] },
        headStyles: { fillColor: [1, 79, 53], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [239, 248, 243] },
        theme: "grid",
      });

      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || nextY + 8;
      autoTable(doc, {
        startY: finalY + 8,
        head: [["Activity Focus District", "Completed Qty"]],
        body: districtPerformance.map((d) => [d.districtName, String(d.totalCompleted)]),
        styles: { fontSize: 9, cellPadding: 3, textColor: [20, 35, 29] },
        headStyles: { fillColor: [236, 72, 153], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [252, 238, 246] },
        theme: "grid",
      });

      const visionY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || finalY + 8;
      autoTable(doc, {
        startY: visionY + 8,
        head: [["Vision 12K District", "Attached People", "Reports"]],
        body: vision12KDistrictRows.length > 0
          ? vision12KDistrictRows.map((d) => [d.districtName, String(d.totalVision12K), String(d.reportCount)])
          : [["No Vision 12K data", "0", "0"]],
        styles: { fontSize: 9, cellPadding: 3, textColor: [20, 35, 29] },
        headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [236, 246, 255] },
        theme: "grid",
      });

      const searchedY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || visionY + 8;
      autoTable(doc, {
        startY: searchedY + 8,
        head: [["District Search Result", "Reports", "Completed Qty"]],
        body: searchedDistrictPerformance.length > 0
          ? searchedDistrictPerformance.map((d) => [d.districtName, String(d.reportCount), String(d.totalCompleted)])
          : [["No district matched search", "0", "0"]],
        styles: { fontSize: 9, cellPadding: 3, textColor: [20, 35, 29] },
        headStyles: { fillColor: [34, 155, 112], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [233, 245, 239] },
        theme: "grid",
      });

      void savePdfDocument(doc, "Live_Analytics_Report.pdf");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#0b6b4a]/20 bg-gradient-to-br from-[#f6fbf8] via-[#eef7f2] to-[#e6f3ec] p-5 shadow-[0_16px_50px_rgba(1,79,53,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#013122]">Live Analytics</h1>
              <p className="mt-1 text-sm text-[#014f35]/75">Daily, weekly, monthly and yearly views with activity-level insights.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-[#014f35] text-white">
                <Radio className="mr-1 h-3.5 w-3.5" /> Live Data
              </Badge>
              <Button onClick={exportDistrictZoneProgressPDF} disabled={isExporting} className="gap-2">
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export Filtered PDF"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#014f35]/80"><CalendarRange className="mr-1 inline h-3.5 w-3.5" /> Timeframe</Label>
              <Select value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#014f35]/80">Reference Date</Label>
              <Input type="date" value={referenceDate} onChange={(e) => setReferenceDate(e.target.value)} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Records In Range</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{filteredRecords.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Districts Reporting</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{uniqueDistricts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Completed Qty</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{totalCompleted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Best Report Qty</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{bestReport?.completed ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Vision 12K Total</p>
              <p className="mt-1 text-2xl font-semibold text-[#013122]">{totalVision12K}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activities Analytics Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#014f35]/80"><Filter className="mr-1 inline h-3.5 w-3.5" /> Activities Filter</Label>
                <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as ActivityFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    {activities.map((activity) => (
                      <SelectItem key={activity.id} value={`activity:${activity.name}`}>
                        {activity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#014f35]/80"><Search className="mr-1 inline h-3.5 w-3.5" /> District Search</Label>
                <Input
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  placeholder="Search district performer..."
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#d5e8de] bg-[#f6fbf8] p-3">
              <p className="text-sm font-semibold text-[#013122]">Current view scope</p>
              <p className="mt-1 text-xs text-[#014f35]/80">
                This analytics view is based on {timeframe} timeframe, reference date {referenceDate}, and filter {filterLabel}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Top District Performer</p>
                {topDistrictPerformer ? (
                  <>
                    <p className="mt-1 text-base font-semibold text-[#013122]">{topDistrictPerformer.districtName}</p>
                    <p className="text-xs text-muted-foreground">
                      Completed Qty: {topDistrictPerformer.totalCompleted} | Reports: {topDistrictPerformer.reportCount}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No district performance data in selected filters.</p>
                )}
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Best Report</p>
                {bestReport ? (
                  <>
                    <p className="mt-1 text-base font-semibold text-[#013122]">{bestReport.districtName}</p>
                    <p className="text-xs text-muted-foreground">{bestReport.meetingTitle} | {bestReport.meetingDate}</p>
                    <p className="mt-1 text-xs font-medium text-[#014f35]">Completed Qty: {bestReport.completed}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No reports found in selected filters.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#d5e8de] bg-[#f6fbf8] p-3">
                <p className="text-xs text-muted-foreground">Vision 12K Overview</p>
                <p className="mt-1 text-base font-semibold text-[#013122]">Total attached people: {totalVision12K}</p>
                <p className="text-xs text-muted-foreground">
                  Top district: {topVision12KDistrict ? `${topVision12KDistrict.districtName} (${topVision12KDistrict.totalVision12K})` : "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Vision 12K District Leader</p>
                {topVision12KDistrict ? (
                  <>
                    <p className="mt-1 text-base font-semibold text-[#013122]">{topVision12KDistrict.districtName}</p>
                    <p className="text-xs text-muted-foreground">Attached people: {topVision12KDistrict.totalVision12K} | Reports: {topVision12KDistrict.reportCount}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No Vision 12K data in selected filters.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-white/70 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Activities Performance Graph (Top Districts)</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={searchedDistrictPerformance.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="districtName" type="category" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="totalCompleted" fill="#014f35" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div ref={chartsContainerRef} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card data-export-chart="true">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activities-Based District Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={districtPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="districtName" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="totalCompleted" radius={[4, 4, 0, 0]}>
                    {districtPerformance.map((_, index) => (
                      <Cell key={`district-bar-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-export-chart="true">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Live Trend ({timeframe})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={liveTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="reports" stroke="#014f35" strokeWidth={2.2} name="Reports" />
                  <Line type="monotone" dataKey="completed" stroke="#f4c542" strokeWidth={2.2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-export-chart="true">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity Mix ({filterLabel})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={activityMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activityMixData.map((_, i) => (
                      <Cell key={`mix-cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-export-chart="true">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filtered Activity District Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={districtPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="districtName" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="totalCompleted" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-export-chart="true">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vision 12K District Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vision12KDistrictRows.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="districtName" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="totalVision12K" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-export-chart="true" className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Zone Live Activity Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={zoneLiveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="reports" fill="#22c55e" name="Reports" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#ef4444" name="Completed Qty" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-[#014f35]" /> Goal Coverage (Filtered Period Context)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {selectedGoals.length} goal records matched for the selected period context.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
