import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type {
  District,
  Coordinator,
  Zone,
  Goal,
  Meeting,
  DistrictMeetingRecord,
  University,
  UniversityCoordinator,
  MadadgarTeam,
  MadadgarCoordinator,
} from "@/types";

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

// ─── Export Single District Meeting Report (PDF) ───

export function exportDistrictReportPDF(record: DistrictMeetingRecord, districts: District[], meetings: Meeting[]) {
  const doc = new jsPDF();
  const district = districts.find(d => d.id === record.districtId);
  const meeting = meetings.find(m => m.id === record.meetingId);

  addHeader(doc, `District Report: ${record.districtName}`, `${meeting?.title || record.meetingTitle} · ${record.meetingDate} · ${district?.zone || ""}`);

  let y = 42;
  const totalActivities = record.activityReports.reduce((s, a) => s + a.completedQuantity, 0);
  y = addSummaryBox(doc, y, [
    { label: "Status", value: record.status },
    { label: "Attendance", value: record.attendance || "N/A" },
    { label: "Activities", value: record.activityReports.length },
    { label: "Total Completed", value: totalActivities },
  ]);

  if (record.activityReports.length > 0) {
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Activity Reports", 14, y + 4); y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Activity", "Completed", "Description", "Notes"]],
      body: record.activityReports.map(ar => [ar.activityName, ar.completedQuantity, ar.description || "", ar.notes || ""]),
      styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [16, 185, 129] }, theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  if (record.customActivities.length > 0) {
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Custom Activities", 14, y + 4); y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Activity", "Quantity", "Description"]],
      body: record.customActivities.map(ca => [ca.name, ca.quantity, ca.description || ""]),
      styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [59, 130, 246] }, theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  if (record.notes) {
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Notes & Comments", 14, y + 4);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    const lines = doc.splitTextToSize(record.notes, 180);
    doc.text(lines, 14, y + 10);
    y += 10 + lines.length * 4 + 4;
  }

  if (record.nextMonthTasks.length > 0) {
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Next Month Tasks", 14, y + 4); y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Task", "Activity Type", "Target", "Deadline", "Notes"]],
      body: record.nextMonthTasks.map(t => [t.taskName, t.activityType, t.targetQuantity, t.deadline || "", t.notes || ""]),
      styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [245, 158, 11] }, theme: "grid",
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`MSL ERP Portal · Generated ${new Date().toLocaleString()} · Page ${i}/${pageCount}`, 14, 290);
  }
  doc.save(`${record.districtName}_${record.month}_Report.pdf`);
}

// ─── Export Full Meeting Report (PDF) ───

export function exportFullMeetingPDF(meeting: Meeting, records: DistrictMeetingRecord[], districts: District[], zones: Zone[]) {
  const doc = new jsPDF();
  const completedRecords = records.filter(r => r.status === "Completed");

  addHeader(doc, meeting.title, `${meeting.meetingDate} · ${meeting.scope === "All" ? "All Districts" : meeting.scopeValue || meeting.scope} · ${meeting.agenda}`);

  let y = 42;
  y = addSummaryBox(doc, y, [
    { label: "Total Districts", value: meeting.districtIds.length },
    { label: "Reports Completed", value: completedRecords.length },
    { label: "Pending", value: records.length - completedRecords.length },
    { label: "Present", value: records.filter(r => r.attendance === "Present").length },
  ]);

  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Zone-wise Summary", 14, y + 4); y += 8;

  const zoneData = zones.map(z => {
    const zoneDistrictIds = districts.filter(d => d.zone === z.name).map(d => d.id);
    const zoneRecords = records.filter(r => zoneDistrictIds.includes(r.districtId));
    const completed = zoneRecords.filter(r => r.status === "Completed").length;
    const present = zoneRecords.filter(r => r.attendance === "Present").length;
    const totalAct = zoneRecords.reduce((s, r) => s + r.activityReports.reduce((ss, a) => ss + a.completedQuantity, 0), 0);
    return [z.name, String(zoneDistrictIds.length), String(completed), String(present), String(totalAct), completed > 0 ? `${Math.round((completed / Math.max(zoneDistrictIds.length, 1)) * 100)}%` : "0%"];
  });

  autoTable(doc, {
    startY: y, head: [["Zone", "Districts", "Completed", "Present", "Activities", "Progress"]], body: zoneData,
    styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [16, 185, 129] }, theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("District-wise Report Status", 14, y); y += 6;

  const districtRows = meeting.districtIds.map(dId => {
    const d = districts.find(dd => dd.id === dId);
    const r = records.find(rr => rr.districtId === dId);
    const totalAct = r?.activityReports.reduce((s, a) => s + a.completedQuantity, 0) || 0;
    return [d?.name || "", d?.zone || "", r?.status || "Empty", r?.attendance || "N/A", String(r?.activityReports.length || 0), String(totalAct)];
  });

  autoTable(doc, {
    startY: y, head: [["District", "Zone", "Status", "Attendance", "Activities", "Total Completed"]], body: districtRows,
    styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [16, 185, 129] }, theme: "grid",
  });

  completedRecords.forEach(record => {
    doc.addPage();
    let py = 20;
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(`${record.districtName} — Detailed Report`, 14, py);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    const d = districts.find(dd => dd.id === record.districtId);
    doc.text(`Zone: ${d?.zone || ""} · Attendance: ${record.attendance || "N/A"}`, 14, py + 6);
    doc.setTextColor(0); py += 12;

    if (record.activityReports.length > 0) {
      autoTable(doc, { startY: py, head: [["Activity", "Completed", "Description", "Notes"]], body: record.activityReports.map(ar => [ar.activityName, ar.completedQuantity, ar.description || "", ar.notes || ""]), styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [16, 185, 129] }, theme: "grid" });
      py = (doc as any).lastAutoTable.finalY + 6;
    }
    if (record.notes) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("Notes:", 14, py + 2);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      const lines = doc.splitTextToSize(record.notes, 180);
      doc.text(lines, 14, py + 8);
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`MSL ERP Portal · ${meeting.title} · Generated ${new Date().toLocaleString()} · Page ${i}/${pageCount}`, 14, 290);
  }
  doc.save(`${meeting.title.replace(/\s+/g, "_")}_Full_Report.pdf`);
}

// ─── Export Full Meeting (Excel) ───

export function exportFullMeetingExcel(meeting: Meeting, records: DistrictMeetingRecord[], districts: District[], zones: Zone[]) {
  const wb = XLSX.utils.book_new();

  const summaryData = meeting.districtIds.map(dId => {
    const d = districts.find(dd => dd.id === dId);
    const r = records.find(rr => rr.districtId === dId);
    return {
      District: d?.name || "", Zone: d?.zone || "", Division: d?.division || "",
      Status: r?.status || "Empty", Attendance: r?.attendance || "N/A",
      "Total Activities": r?.activityReports.length || 0,
      "Total Completed": r?.activityReports.reduce((s, a) => s + a.completedQuantity, 0) || 0,
      Notes: r?.notes || "",
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");

  const zoneSummary = zones.map(z => {
    const zDists = districts.filter(d => d.zone === z.name);
    const zRecs = records.filter(r => zDists.some(d => d.id === r.districtId));
    return {
      Zone: z.name, "Total Districts": zDists.length,
      "Reports Completed": zRecs.filter(r => r.status === "Completed").length,
      Present: zRecs.filter(r => r.attendance === "Present").length,
      "Total Activities Done": zRecs.reduce((s, r) => s + r.activityReports.reduce((ss, a) => ss + a.completedQuantity, 0), 0),
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(zoneSummary), "Zone Summary");

  const activityRows: any[] = [];
  records.forEach(r => {
    r.activityReports.forEach(ar => {
      activityRows.push({ District: r.districtName, Zone: districts.find(d => d.id === r.districtId)?.zone || "", Activity: ar.activityName, Completed: ar.completedQuantity, Description: ar.description || "", Notes: ar.notes || "" });
    });
  });
  if (activityRows.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activityRows), "Activity Details");

  XLSX.writeFile(wb, `${meeting.title.replace(/\s+/g, "_")}_Report.xlsx`);
}

// ─── Export Single District Report (Excel) ───

export function exportDistrictReportExcel(record: DistrictMeetingRecord, districts: District[]) {
  const wb = XLSX.utils.book_new();
  const district = districts.find(d => d.id === record.districtId);

  const info = [{ District: record.districtName, Zone: district?.zone || "", Meeting: record.meetingTitle, Date: record.meetingDate, Status: record.status, Attendance: record.attendance || "N/A", Notes: record.notes }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(info), "Info");

  if (record.activityReports.length > 0) {
    const acts = record.activityReports.map(ar => ({ Activity: ar.activityName, Completed: ar.completedQuantity, Description: ar.description || "", Notes: ar.notes || "" }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acts), "Activities");
  }

  if (record.nextMonthTasks.length > 0) {
    const tasks = record.nextMonthTasks.map(t => ({ Task: t.taskName, "Activity Type": t.activityType, Target: t.targetQuantity, Deadline: t.deadline || "", Notes: t.notes || "" }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasks), "Next Month Tasks");
  }

  XLSX.writeFile(wb, `${record.districtName}_${record.month}_Report.xlsx`);
}

// ─── Zone Report Export (PDF) ───

export function exportZoneReportPDF(zoneName: string, districts: District[], coordinators: Coordinator[], goals: Goal[]) {
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

  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Districts", 14, y + 4); y += 8;
  autoTable(doc, {
    startY: y, head: [["District", "Division", "Coordinator", "Status"]],
    body: zoneDistricts.map(d => {
      const coord = coordinators.find(c => c.districtId === d.id && c.status === "Active");
      return [d.name, d.division, coord?.name || "Unassigned", d.status];
    }),
    styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [16, 185, 129] }, theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (zoneGoals.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Goals Progress", 14, y); y += 6;
    autoTable(doc, {
      startY: y, head: [["District", "Activity", "Target", "Completed", "Status"]],
      body: zoneGoals.map(g => [g.districtName, g.activityName, g.targetNumber, g.completedNumber ?? "—", g.status || "Pending"]),
      styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [245, 158, 11] }, theme: "grid",
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150); doc.text(`MSL ERP Portal · ${zoneName} · Generated ${new Date().toLocaleString()} · Page ${i}/${pageCount}`, 14, 290); }
  doc.save(`${zoneName.replace(/\s+/g, "_")}_Zone_Report.pdf`);
}

// ─── Zone Report Export (Excel) ───

export function exportZoneReportExcel(zoneName: string, districts: District[], coordinators: Coordinator[], goals: Goal[]) {
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
    const coordData = zoneCoords.map(c => ({ Name: c.name, District: c.districtName, Phone: c.phone, Education: c.education || "", Status: c.status }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coordData), "Coordinators");
  }

  if (zoneGoals.length > 0) {
    const goalData = zoneGoals.map(g => ({ District: g.districtName, Activity: g.activityName, Target: g.targetNumber, Completed: g.completedNumber ?? "", Status: g.status || "Pending", Month: g.month }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalData), "Goals");
  }

  XLSX.writeFile(wb, `${zoneName.replace(/\s+/g, "_")}_Zone_Report.xlsx`);
}

// ─── Districts List Export ───

export function exportDistrictsExcel(filteredDistricts: District[], coordinators: Coordinator[]) {
  const wb = XLSX.utils.book_new();
  const data = filteredDistricts.map(d => {
    const coord = coordinators.find(c => c.districtId === d.id && c.status === "Active");
    return { District: d.name, Zone: d.zone, Division: d.division, Population: d.population || "", Coordinator: coord?.name || "Unassigned", Status: d.status };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Districts");
  XLSX.writeFile(wb, "Districts_Report.xlsx");
}

export function exportDistrictsPDF(filteredDistricts: District[], coordinators: Coordinator[]) {
  const doc = new jsPDF();
  addHeader(doc, "Districts Report", `${filteredDistricts.length} districts · Generated ${new Date().toLocaleDateString()}`);

  autoTable(doc, {
    startY: 42,
    head: [["District", "Zone", "Division", "Coordinator", "Population", "Status"]],
    body: filteredDistricts.map(d => {
      const coord = coordinators.find(c => c.districtId === d.id && c.status === "Active");
      return [d.name, d.zone, d.division, coord?.name || "Unassigned", d.population?.toLocaleString() || "—", d.status];
    }),
    styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [16, 185, 129] }, theme: "grid",
  });

  doc.save("Districts_Report.pdf");
}

export function exportUniversitiesExcel(universities: University[], coordinators: UniversityCoordinator[]) {
  const wb = XLSX.utils.book_new();
  const data = universities.map((u) => {
    const coord = coordinators.find((c) => c.universityId === u.id && c.status === "Active");
    return {
      University: u.name,
      Province: u.province,
      City: u.city,
      Coordinator: coord?.name || "Unassigned",
      Status: u.status,
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Universities");
  XLSX.writeFile(wb, "Universities_Report.xlsx");
}

export function exportUniversitiesPDF(universities: University[], coordinators: UniversityCoordinator[]) {
  const doc = new jsPDF();
  addHeader(doc, "Universities Report", `${universities.length} universities · Generated ${new Date().toLocaleDateString()}`);
  autoTable(doc, {
    startY: 42,
    head: [["University", "Province", "City", "Coordinator", "Status"]],
    body: universities.map((u) => {
      const coord = coordinators.find((c) => c.universityId === u.id && c.status === "Active");
      return [u.name, u.province, u.city, coord?.name || "Unassigned", u.status];
    }),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129] },
    theme: "grid",
  });
  doc.save("Universities_Report.pdf");
}

export function exportMadadgarTeamsExcel(teams: MadadgarTeam[], coordinators: MadadgarCoordinator[]) {
  const wb = XLSX.utils.book_new();
  const data = teams.map((t) => {
    const coord = coordinators.find((c) => c.teamId === t.id && c.status === "Active");
    return {
      Team: t.name,
      Zone: t.zone,
      District: t.districtName || "",
      Coordinator: coord?.name || "Unassigned",
      Status: t.status,
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Madadgar Teams");
  XLSX.writeFile(wb, "Madadgar_Teams_Report.xlsx");
}

export function exportMadadgarTeamsPDF(teams: MadadgarTeam[], coordinators: MadadgarCoordinator[]) {
  const doc = new jsPDF();
  addHeader(doc, "Madadgar Teams Report", `${teams.length} teams · Generated ${new Date().toLocaleDateString()}`);
  autoTable(doc, {
    startY: 42,
    head: [["Team", "Zone", "District", "Coordinator", "Status"]],
    body: teams.map((t) => {
      const coord = coordinators.find((c) => c.teamId === t.id && c.status === "Active");
      return [t.name, t.zone, t.districtName || "", coord?.name || "Unassigned", t.status];
    }),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    theme: "grid",
  });
  doc.save("Madadgar_Teams_Report.pdf");
}
