import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useZones, useDistricts, useCoordinators, useGoals, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useRef, useState } from "react";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Analytics() {
  const chartsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  // District progress: completion % of goals for each district
  const districtProgress = districts.map(d => {
    const districtGoals = goals.filter(g => g.districtId === d.id);
    const total = districtGoals.length;
    const completed = districtGoals.filter(g => g.status === "Completed").length;
    return {
      name: d.name.length > 14 ? d.name.substring(0, 14) + "…" : d.name,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }).filter(d => d.progress > 0 || d.progress === 0);

  const zoneProgress = zones.map(z => {
    const zoneDistricts = districts.filter(d => d.zone === z.name);
    const districtIds = zoneDistricts.map(d => d.id);
    const zoneGoals = goals.filter(g => districtIds.includes(g.districtId));
    const total = zoneGoals.length;
    const completed = zoneGoals.filter(g => g.status === "Completed").length;
    return {
      name: z.name,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  async function exportDistrictZoneProgressPDF() {
    setIsExporting(true);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("District, Zone and Chart Analytics", 14, 20);
    doc.setFontSize(12);
    doc.text("Generated: " + new Date().toLocaleString(), 14, 28);

    const chartNodes = chartsContainerRef.current
      ? Array.from(chartsContainerRef.current.querySelectorAll("[data-export-chart='true']")) as HTMLElement[]
      : [];

    if (chartNodes.length > 0) {
      let imageY = 36;
      const pageWidth = doc.internal.pageSize.getWidth();
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
      startY: 20,
      head: [["District", "Progress %"]],
      body: districtProgress.map(d => [d.name, `${d.progress}%`]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] },
      theme: "grid",
    });

    const zoneTableStartY = 50 + Math.max(districtProgress.length, 1) * 8;
    autoTable(doc, {
      startY: zoneTableStartY,
      head: [["Zone", "Progress %"]],
      body: zoneProgress.map(z => [z.name, `${z.progress}%`]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
      theme: "grid",
    });

    doc.save("District_Zone_Progress.pdf");
    setIsExporting(false);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-end mb-2">
          <Button onClick={exportDistrictZoneProgressPDF} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export Progress PDF"}
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Compare performance across zones, districts, and coordinators</p>
        </div>

        <div ref={chartsContainerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-export-chart="true" className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">District Progress</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={districtProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card data-export-chart="true" className="border-none shadow-sm">
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

          <Card data-export-chart="true" className="border-none shadow-sm">
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

          <Card data-export-chart="true" className="border-none shadow-sm">
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

          <Card data-export-chart="true" className="border-none shadow-sm">
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
