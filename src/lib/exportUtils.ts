import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { districts, zones, coordinators, districtMeetingRecords, meetings, goals, activities } from "@/data/mockData";
import type { DistrictMeetingRecord, Meeting } from "@/types";

// ─── PDF Helpers ───

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MSL ERP Portal", 14, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 28);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 34);
    doc.setTextColor(0);
  }
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(14, subtitle ? 37 : 32, 196, subtitle ? 37 : 32);
}

function addSummaryBox(doc: jsPDF, y: number, items: { label: string; value: string | number }[]) {
  const startX = 14;
  const boxW = (196 - 14) / items.length;
  items.forEach((item, i) => {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(startX + i * boxW, y, boxW - 2, 18, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(item.label, startX + i * boxW + 4, y + 7);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(String(item.value), startX + i * boxW + 4, y + 14);
    doc.setFont("helvetica", "normal");
  });
  return y + 24;
}

function addProgressBar(doc: jsPDF, x: number, y: number, w: number, pct: number) {
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(x, y, w, 4, 2, 2, "F");
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(x, y, Math.max(w * (pct / 100), 2), 4, 2, 2, "F");
}

// ─── Export Single District Meeting Report (PDF) ───

export function exportDistrictReportPDF(record: DistrictMeetingRecord) {
  const doc = new jsPDF();
  const district = districts.find(d => d.id === record.districtId);
  const meeting = meetings.find(m => m.id === record.meetingId);

  addHeader(doc, `District Report: ${record.districtName}`, `${meeting?.title || record.meetingTitle} · ${record.meetingDate} · ${district?.zone || ""}`);

  let y = 42;

  // Summary
  const totalActivities = record.activityReports.reduce((s, a) => s + a.completedQuantity, 0);
  y = addSummaryBox(doc, y, [
    { label: "Status", value: record.status },
    { label: "Attendance", value: record.attendance || "N/A" },
    { label: "Activities", value: record.activityReports.length },
    { label: "Total Completed", value: totalActivities },
  ]);

  // Activity Reports Table
  if (record.activityReports.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Activity Reports", 14, y + 4);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Activity", "Completed", "Description", "Notes"]],
      body: record.activityReports.map(ar => [ar.activityName, ar.completedQuantity, ar.description || "", ar.notes || ""]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] },
      theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Custom Activities
  if (record.customActivities.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Custom Activities", 14, y + 4);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Activity", "Quantity", "Description"]],
      body: record.customActivities.map(ca => [ca.name, ca.quantity, ca.description || ""]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
      theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Notes
  if (record.notes) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Notes & Comments", 14, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(record.notes, 180);
    doc.text(lines, 14, y + 10);
    y += 10 + lines.length * 4 + 4;
  }

  // Next Month Tasks
  if (record.nextMonthTasks.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Next Month Tasks", 14, y + 4);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Task", "Activity Type", "Target", "Deadline", "Notes"]],
      body: record.nextMonthTasks.map(t => [t.taskName, t.activityType, t.targetQuantity, t.deadline || "", t.notes || ""]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11] },
      theme: "grid",
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`MSL ERP Portal · Generated ${new Date().toLocaleString()} · Page ${i}/${pageCount}`, 14, 290);
  }

  doc.save(`${record.districtName}_${record.month}_Report.pdf`);
}

// ─── Export Full Meeting Report (PDF) - All zones & districts ───

export function exportFullMeetingPDF(meetingId: string) {
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) return;

  const doc = new jsPDF();
  const records = districtMeetingRecords.filter(r => r.meetingId === meetingId);
  const completedRecords = records.filter(r => r.status === "Completed");

  addHeader(doc, meeting.title, `${meeting.meetingDate} · ${meeting.scope === "All" ? "All Districts" : meeting.scopeValue || meeting.scope} · ${meeting.agenda}`);

  let y = 42;

  // Overall Summary
  y = addSummaryBox(doc, y, [
    { label: "Total Districts", value: meeting.districtIds.length },
    { label: "Reports Completed", value: completedRecords.length },
    { label: "Pending", value: records.length - completedRecords.length },
    { label: "Present", value: records.filter(r => r.attendance === "Present").length },
  ]);

  // Zone-wise Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Zone-wise Summary", 14, y + 4);
  y += 8;

  const zoneData = zones.map(z => {
    const zoneDistrictIds = districts.filter(d => d.zone === z.name).map(d => d.id);
    const zoneRecords = records.filter(r => zoneDistrictIds.includes(r.districtId));
    const completed = zoneRecords.filter(r => r.status === "Completed").length;
    const present = zoneRecords.filter(r => r.attendance === "Present").length;
    const totalActivities = zoneRecords.reduce((s, r) => s + r.activityReports.reduce((ss, a) => ss + a.completedQuantity, 0), 0);
    return [z.name, String(zoneDistrictIds.length), String(completed), String(present), String(totalActivities), completed > 0 ? `${Math.round((completed / Math.max(zoneDistrictIds.length, 1)) * 100)}%` : "0%"];
  });

  autoTable(doc, {
    startY: y,
    head: [["Zone", "Districts", "Completed", "Present", "Activities", "Progress"]],
    body: zoneData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129] },
    theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // District-wise Report Table
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("District-wise Report Status", 14, y);
  y += 6;

  const districtRows = meeting.districtIds.map(dId => {
    const d = districts.find(dd => dd.id === dId);
    const r = records.find(rr => rr.districtId === dId);
    const totalAct = r?.activityReports.reduce((s, a) => s + a.completedQuantity, 0) || 0;
    return [d?.name || "", d?.zone || "", r?.status || "Empty", r?.attendance || "N/A", String(r?.activityReports.length || 0), String(totalAct)];
  });

  autoTable(doc, {
    startY: y,
    head: [["District", "Zone", "Status", "Attendance", "Activities", "Total Completed"]],
    body: districtRows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129] },
    theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Detailed reports for completed districts
  completedRecords.forEach(record => {
    doc.addPage();
    let py = 20;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${record.districtName} — Detailed Report`, 14, py);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const d = districts.find(dd => dd.id === record.districtId);
    doc.text(`Zone: ${d?.zone || ""} · Attendance: ${record.attendance || "N/A"}`, 14, py + 6);
    doc.setTextColor(0);
    py += 12;

    if (record.activityReports.length > 0) {
      autoTable(doc, {
        startY: py,
        head: [["Activity", "Completed", "Description", "Notes"]],
        body: record.activityReports.map(ar => [ar.activityName, ar.completedQuantity, ar.description || "", ar.notes || ""]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129] },
        theme: "grid",
      });
      py = (doc as any).lastAutoTable.finalY + 6;
    }

    if (record.customActivities.length > 0) {
      autoTable(doc, {
        startY: py,
        head: [["Custom Activity", "Quantity", "Description"]],
        body: record.customActivities.map(ca => [ca.name, ca.quantity, ca.description || ""]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246] },
        theme: "grid",
      });
      py = (doc as any).lastAutoTable.finalY + 6;
    }

    if (record.notes) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, py + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(record.notes, 180);
      doc.text(lines, 14, py + 8);
    }
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`MSL ERP Portal · ${meeting.title} · Generated ${new Date().toLocaleString()} · Page ${i}/${pageCount}`, 14, 290);
  }

  doc.save(`${meeting.title.replace(/\s+/g, "_")}_Full_Report.pdf`);
}

// ─── Export Full Meeting (Excel) ───

export function exportFullMeetingExcel(meetingId: string) {
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) return;

  const records = districtMeetingRecords.filter(r => r.meetingId === meetingId);
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = meeting.districtIds.map(dId => {
    const d = districts.find(dd => dd.id === dId);
    const r = records.find(rr => rr.districtId === dId);
    return {
      District: d?.name || "",
      Zone: d?.zone || "",
      Division: d?.division || "",
      Status: r?.status || "Empty",
      Attendance: r?.attendance || "N/A",
      "Total Activities": r?.activityReports.length || 0,
      "Total Completed": r?.activityReports.reduce((s, a) => s + a.completedQuantity, 0) || 0,
      "Custom Activities": r?.customActivities.length || 0,
      Notes: r?.notes || "",
    };
  });
  const ws1 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // Zone Summary sheet
  const zoneSummary = zones.map(z => {
    const zDists = districts.filter(d => d.zone === z.name);
    const zRecs = records.filter(r => zDists.some(d => d.id === r.districtId));
    return {
      Zone: z.name,
      "Total Districts": zDists.length,
      "Reports Completed": zRecs.filter(r => r.status === "Completed").length,
      Present: zRecs.filter(r => r.attendance === "Present").length,
      Absent: zRecs.filter(r => r.attendance === "Absent").length,
      Late: zRecs.filter(r => r.attendance === "Late").length,
      "Total Activities Done": zRecs.reduce((s, r) => s + r.activityReports.reduce((ss, a) => ss + a.completedQuantity, 0), 0),
    };
  });
  const ws2 = XLSX.utils.json_to_sheet(zoneSummary);
  XLSX.utils.book_append_sheet(wb, ws2, "Zone Summary");

  // Activity Details sheet
  const activityRows: any[] = [];
  records.forEach(r => {
    r.activityReports.forEach(ar => {
      activityRows.push({
        District: r.districtName,
        Zone: districts.find(d => d.id === r.districtId)?.zone || "",
        Activity: ar.activityName,
        Completed: ar.completedQuantity,
        Description: ar.description || "",
        Notes: ar.notes || "",
      });
    });
    r.customActivities.forEach(ca => {
      activityRows.push({
        District: r.districtName,
        Zone: districts.find(d => d.id === r.districtId)?.zone || "",
        Activity: `[Custom] ${ca.name}`,
        Completed: ca.quantity,
        Description: ca.description || "",
        Notes: "",
      });
    });
  });
  if (activityRows.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(activityRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Activity Details");
  }

  // Attendance sheet
  const attendanceRows = records.map(r => ({
    District: r.districtName,
    Zone: districts.find(d => d.id === r.districtId)?.zone || "",
    Attendance: r.attendance || "N/A",
    "Report Status": r.status,
  }));
  const ws4 = XLSX.utils.json_to_sheet(attendanceRows);
  XLSX.utils.book_append_sheet(wb, ws4, "Attendance");

  XLSX.writeFile(wb, `${meeting.title.replace(/\s+/g, "_")}_Report.xlsx`);
}

// ─── Export Single District Report (Excel) ───

export function exportDistrictReportExcel(record: DistrictMeetingRecord) {
  const wb = XLSX.utils.book_new();
  const district = districts.find(d => d.id === record.districtId);

  // Info sheet
  const info = [{
    District: record.districtName,
    Zone: district?.zone || "",
    Meeting: record.meetingTitle,
    Date: record.meetingDate,
    Status: record.status,
    Attendance: record.attendance || "N/A",
    Notes: record.notes,
  }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(info), "Info");

  // Activities
  if (record.activityReports.length > 0) {
    const acts = record.activityReports.map(ar => ({
      Activity: ar.activityName,
      Completed: ar.completedQuantity,
      Description: ar.description || "",
      Notes: ar.notes || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acts), "Activities");
  }

  // Custom Activities
  if (record.customActivities.length > 0) {
    const cas = record.customActivities.map(ca => ({
      Activity: ca.name,
      Quantity: ca.quantity,
      Description: ca.description || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cas), "Custom Activities");
  }

  // Tasks
  if (record.nextMonthTasks.length > 0) {
    const tasks = record.nextMonthTasks.map(t => ({
      Task: t.taskName,
      "Activity Type": t.activityType,
      Target: t.targetQuantity,
      Deadline: t.deadline || "",
      Notes: t.notes || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasks), "Next Month Tasks");
  }

  XLSX.writeFile(wb, `${record.districtName}_${record.month}_Report.xlsx`);
}

// ─── Zone Report Export (PDF) ───

export function exportZoneReportPDF(zoneName: string) {
  const doc = new jsPDF();
  const zoneDistricts = districts.filter(d => d.zone === zoneName);
  const zoneCoords = coordinators.filter(c => c.zone === zoneName);
  const zoneGoals = goals.filter(g => g.zone === zoneName);

  addHeader(doc, `Zone Report: ${zoneName}`, `Generated on ${new Date().toLocaleDateString()}`);

  let y = 42;
  y = addSummaryBox(doc, y, [
    { label: "Districts", value: zoneDistricts.length },
    { label: "Active Coordinators", value: zoneCoords.filter(c => c.status === "Active").length },
    { label: "Total Goals", value: zoneGoals.length },
    { label: "Completed", value: zoneGoals.filter(g => g.status === "Completed").length },
  ]);

  // Districts table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Districts", 14, y + 4);
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [["District", "Division", "Coordinator", "Status"]],
    body: zoneDistricts.map(d => {
      const coord = coordinators.find(c => c.districtId === d.id && c.status === "Active");
      return [d.name, d.division, coord?.name || "Unassigned", d.status];
    }),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129] },
    theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Goals
  if (zoneGoals.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Goals Progress", 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["District", "Activity", "Target", "Completed", "Status"]],
      body: zoneGoals.map(g => [g.districtName, g.activityName, g.targetNumber, g.completedNumber ?? "—", g.status || "Pending"]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [245, 158, 11] },
      theme: "grid",
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`MSL ERP Portal · ${zoneName} · Generated ${new Date().toLocaleString()} · Page ${i}/${pageCount}`, 14, 290);
  }

  doc.save(`${zoneName.replace(/\s+/g, "_")}_Zone_Report.pdf`);
}

// ─── Zone Report Export (Excel) ───

export function exportZoneReportExcel(zoneName: string) {
  const wb = XLSX.utils.book_new();
  const zoneDistricts = districts.filter(d => d.zone === zoneName);
  const zoneCoords = coordinators.filter(c => c.zone === zoneName);
  const zoneGoals = goals.filter(g => g.zone === zoneName);

  const distData = zoneDistricts.map(d => {
    const coord = coordinators.find(c => c.districtId === d.id && c.status === "Active");
    return { District: d.name, Division: d.division, Population: d.population || "", Coordinator: coord?.name || "Unassigned", Status: d.status };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distData), "Districts");

  if (zoneCoords.length > 0) {
    const coordData = zoneCoords.map(c => ({ Name: c.name, District: c.districtName, Phone: c.phone, Education: c.education || "", Status: c.status, Activities: c.totalActivities, Attendance: `${c.attendanceRate}%` }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coordData), "Coordinators");
  }

  if (zoneGoals.length > 0) {
    const goalData = zoneGoals.map(g => ({ District: g.districtName, Activity: g.activityName, Target: g.targetNumber, Completed: g.completedNumber ?? "", Status: g.status || "Pending", Month: g.month }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalData), "Goals");
  }

  XLSX.writeFile(wb, `${zoneName.replace(/\s+/g, "_")}_Zone_Report.xlsx`);
}

// ─── Districts List Export ───

export function exportDistrictsExcel(filteredDistricts: typeof districts) {
  const wb = XLSX.utils.book_new();
  const data = filteredDistricts.map(d => {
    const coord = coordinators.find(c => c.districtId === d.id && c.status === "Active");
    return { District: d.name, Zone: d.zone, Division: d.division, Population: d.population || "", Coordinator: coord?.name || "Unassigned", Status: d.status };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Districts");
  XLSX.writeFile(wb, "Districts_Report.xlsx");
}

export function exportDistrictsPDF(filteredDistricts: typeof districts) {
  const doc = new jsPDF();
  addHeader(doc, "Districts Report", `${filteredDistricts.length} districts · Generated ${new Date().toLocaleDateString()}`);

  autoTable(doc, {
    startY: 42,
    head: [["District", "Zone", "Division", "Coordinator", "Population", "Status"]],
    body: filteredDistricts.map(d => {
      const coord = coordinators.find(c => c.districtId === d.id && c.status === "Active");
      return [d.name, d.zone, d.division, coord?.name || "Unassigned", d.population?.toLocaleString() || "—", d.status];
    }),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129] },
    theme: "grid",
  });

  doc.save("Districts_Report.pdf");
}
