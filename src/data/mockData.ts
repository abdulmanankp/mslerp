import type { Zone, District, Coordinator, Activity, Goal, Meeting, DistrictMeetingRecord, Task } from "@/types";
import { allPakistanDistricts } from "./pakistanDistricts";

// Generate districts from Pakistan districts data
let districtCounter = 1;
export const districts: District[] = allPakistanDistricts.map(pd => ({
  id: `d${districtCounter++}`,
  name: pd.name,
  zone: pd.zone,
  division: pd.division,
  population: pd.population,
  status: "Active" as const,
  createdDate: "2024-01-15",
}));

// Build zones from district data
const zoneNames = [...new Set(districts.map(d => d.zone))];
export const zones: Zone[] = zoneNames.map((name, i) => {
  const zoneDistricts = districts.filter(d => d.zone === name);
  return {
    id: `z${i + 1}`,
    name,
    districtsCount: zoneDistricts.length,
    coordinatorsCount: 0, // will update after coordinators
    status: "Active" as const,
  };
});

// Assign coordinators to first few districts of each zone
const coordinatorNames = [
  "Ahmad Khan", "Bilal Ahmed", "Usman Ali", "Tariq Mehmood", "Hassan Raza",
  "Imran Shahid", "Fahad Hussain", "Zubair Ahmed", "Nasir Mahmood", "Abdul Qadir",
  "Muhammad Farooq", "Saeed Anwar", "Khalid Mehmood", "Rizwan Malik", "Waqar Younis",
  "Asif Iqbal", "Shahid Khan", "Kamran Akmal", "Faisal Hayat", "Adnan Sami",
  "Naveed Shah", "Junaid Khan", "Omar Farooq", "Yasir Abbas", "Hamza Ali",
  "Sohail Tanvir", "Babar Azam", "Shoaib Malik", "Danish Kaneria", "Wahab Riaz",
  "Sarfraz Ahmed", "Azhar Ali", "Shan Masood", "Abdullah Shafiq", "Saud Shakeel",
  "Fakhar Zaman", "Imam ul Haq", "Shadab Khan", "Haris Rauf", "Naseem Shah",
  "Shaheen Afridi", "Mohammad Rizwan", "Hasan Ali", "Mohammad Nawaz", "Agha Salman",
  "Usama Mir", "Abrar Ahmed", "Zaman Khan", "Ihsanullah", "Mohammad Wasim"
];

export const coordinators: Coordinator[] = [];
let coordIdx = 0;
const districtCoordMap: Record<string, string> = {};

zoneNames.forEach(zone => {
  const zoneDistricts = districts.filter(d => d.zone === zone);
  const assignCount = Math.min(zoneDistricts.length, Math.ceil(zoneDistricts.length * 0.6));
  for (let i = 0; i < assignCount && coordIdx < coordinatorNames.length; i++) {
    const d = zoneDistricts[i];
    const cId = `c${coordIdx + 1}`;
    coordinators.push({
      id: cId,
      name: coordinatorNames[coordIdx],
      phone: `+92-3${String(coordIdx).padStart(2, '0')}-${String(1000000 + coordIdx * 111111).slice(0, 7)}`,
      address: `${d.name}, ${zone}`,
      education: ["MBA", "BSc", "MS", "BA", "MA", "BBA", "MSc", "PhD"][coordIdx % 8],
      joiningDate: `2024-0${(coordIdx % 3) + 1}-${String((coordIdx % 28) + 1).padStart(2, '0')}`,
      zone: zone,
      districtId: d.id,
      districtName: d.name,
      status: "Active",
      totalActivities: Math.floor(Math.random() * 60) + 10,
      attendanceRate: Math.floor(Math.random() * 25) + 75,
    });
    districtCoordMap[d.id] = cId;
    coordIdx++;
  }
});

// Update districts with coordinator IDs
districts.forEach(d => {
  if (districtCoordMap[d.id]) {
    d.currentCoordinatorId = districtCoordMap[d.id];
  }
});

// Update zone coordinator counts
zones.forEach(z => {
  z.coordinatorsCount = coordinators.filter(c => c.zone === z.name && c.status === "Active").length;
});

// Add expired coordinator example
coordinators.push({
  id: "c_exp1",
  name: "Khalid Mehmood",
  phone: "+92-310-1234567",
  address: "Kasur, Central Punjab",
  education: "MSc",
  joiningDate: "2024-01-10",
  endDate: "2024-02-28",
  zone: "Central Punjab",
  districtId: districts.find(d => d.name === "Kasur")?.id || "d1",
  districtName: "Kasur",
  status: "Expired",
  totalActivities: 15,
  attendanceRate: 75,
});

export const activities: Activity[] = [
  { id: "a1", name: "Quran Classes", description: "Regular Quran reading and memorization classes", category: "Education", status: "Active" },
  { id: "a2", name: "Islamic Education Sessions", description: "Islamic knowledge and learning sessions", category: "Education", status: "Active" },
  { id: "a3", name: "Dawah Programs", description: "Community outreach and dawah activities", category: "Outreach", status: "Active" },
  { id: "a4", name: "Muslim Kids Programs", description: "Educational and fun programs for children", category: "Youth", status: "Active" },
  { id: "a5", name: "Ramadan Iftar Distribution", description: "Organizing and distributing iftar meals", category: "Welfare", status: "Active" },
  { id: "a6", name: "Welfare Support Programs", description: "Community welfare and support initiatives", category: "Welfare", status: "Active" },
  { id: "a7", name: "Media Campaigns", description: "Social media and awareness campaigns", category: "Media", status: "Active" },
  { id: "a8", name: "Community Seminars", description: "Public seminars on Islamic topics", category: "Outreach", status: "Active" },
  { id: "a9", name: "Youth Mentorship", description: "Mentoring young members of the community", category: "Youth", status: "Active" },
  { id: "a10", name: "Health Camps", description: "Free medical checkup camps", category: "Welfare", status: "Active" },
];

// Pick some well-known districts for richer mock data
const kasurId = districts.find(d => d.name === "Kasur")?.id || "d1";
const lahoreId = districts.find(d => d.name === "Lahore")?.id || "d1";
const karachiSouthId = districts.find(d => d.name === "Karachi South")?.id || "d1";
const peshawarId = districts.find(d => d.name === "Peshawar")?.id || "d1";
const multanId = districts.find(d => d.name === "Multan")?.id || "d1";
const islamabadId = districts.find(d => d.name === "Islamabad")?.id || "d1";
const quettaId = districts.find(d => d.name === "Quetta")?.id || "d1";
const faisalabadId = districts.find(d => d.name === "Faisalabad")?.id || "d1";

export const goals: Goal[] = [
  { id: "g1", month: "2026-03", zone: "Central Punjab", districtId: kasurId, districtName: "Kasur", activityId: "a5", activityName: "Ramadan Iftar Distribution", targetNumber: 10, completedNumber: 8, notes: "Ramadan month priority", status: "Partially Completed" },
  { id: "g2", month: "2026-03", zone: "Central Punjab", districtId: lahoreId, districtName: "Lahore", activityId: "a1", activityName: "Quran Classes", targetNumber: 20, completedNumber: 20, notes: "", status: "Completed" },
  { id: "g3", month: "2026-03", zone: "Central Punjab", districtId: lahoreId, districtName: "Lahore", activityId: "a4", activityName: "Muslim Kids Programs", targetNumber: 5, completedNumber: 3, notes: "", status: "Partially Completed" },
  { id: "g4", month: "2026-03", zone: "Sindh", districtId: karachiSouthId, districtName: "Karachi South", activityId: "a1", activityName: "Quran Classes", targetNumber: 15, completedNumber: 15, notes: "", status: "Completed" },
  { id: "g5", month: "2026-04", zone: "Central Punjab", districtId: kasurId, districtName: "Kasur", activityId: "a1", activityName: "Quran Classes", targetNumber: 15, notes: "New quarter target", status: "Pending" },
  { id: "g6", month: "2026-04", zone: "Central Punjab", districtId: kasurId, districtName: "Kasur", activityId: "a4", activityName: "Muslim Kids Programs", targetNumber: 5, notes: "", status: "Pending" },
  { id: "g7", month: "2026-03", zone: "Khyber Pakhtunkhwa", districtId: peshawarId, districtName: "Peshawar", activityId: "a3", activityName: "Dawah Programs", targetNumber: 8, completedNumber: 6, status: "Partially Completed" },
  { id: "g8", month: "2026-03", zone: "South Punjab", districtId: multanId, districtName: "Multan", activityId: "a6", activityName: "Welfare Support Programs", targetNumber: 12, completedNumber: 12, status: "Completed" },
];

export const meetings: Meeting[] = [
  { id: "m1", title: "January Monthly Review", month: "2026-01", meetingDate: "2026-01-28", agenda: "Review Q4 progress and set Q1 goals", notes: "All zones participated", scope: "All", districtIds: districts.map(d => d.id) },
  { id: "m2", title: "February Monthly Review", month: "2026-02", meetingDate: "2026-02-25", agenda: "February activities review", notes: "", scope: "All", districtIds: districts.map(d => d.id) },
  { id: "m3", title: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", agenda: "Ramadan preparation and progress review", notes: "Focus on Ramadan activities", scope: "All", districtIds: districts.map(d => d.id) },
  { id: "m4", title: "KPK Zone Special Meeting", month: "2026-03", meetingDate: "2026-03-15", agenda: "Special meeting for KPK zone coordination", notes: "", scope: "Zone", scopeValue: "Khyber Pakhtunkhwa", districtIds: districts.filter(d => d.zone === "Khyber Pakhtunkhwa").map(d => d.id) },
];

export const districtMeetingRecords: DistrictMeetingRecord[] = [
  {
    id: "dmr1", meetingId: "m3", districtId: kasurId, districtName: "Kasur", meetingTitle: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", status: "Completed",
    activityReports: [
      { id: "ar1", activityId: "a1", activityName: "Quran Classes", completedQuantity: 12, description: "Weekly classes across 4 locations", notes: "Strong attendance" },
      { id: "ar2", activityId: "a5", activityName: "Ramadan Iftar Distribution", completedQuantity: 8, description: "Distributed in local mosques", notes: "2 remaining for next week" },
      { id: "ar3", activityId: "a4", activityName: "Muslim Kids Programs", completedQuantity: 3, description: "Weekend programs", notes: "" },
    ],
    customActivities: [{ id: "ca1", name: "Community Clean-up Drive", quantity: 2, description: "Organized neighborhood cleaning" }],
    notes: "Good progress overall. Coordinator performed well. Need more volunteers for iftar events.",
    nextMonthTasks: [
      { id: "nmt1", taskName: "Start 15 Quran Classes", activityType: "Quran Classes", targetQuantity: 15, deadline: "2026-04-30", notes: "" },
      { id: "nmt2", taskName: "Organize 5 Muslim Kids Programs", activityType: "Muslim Kids Programs", targetQuantity: 5, deadline: "2026-04-30", notes: "" },
    ],
    attendance: "Present",
  },
  {
    id: "dmr2", meetingId: "m3", districtId: lahoreId, districtName: "Lahore", meetingTitle: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", status: "Completed",
    activityReports: [
      { id: "ar4", activityId: "a1", activityName: "Quran Classes", completedQuantity: 20, description: "Across 8 locations", notes: "Target achieved" },
      { id: "ar5", activityId: "a4", activityName: "Muslim Kids Programs", completedQuantity: 3, description: "Saturday sessions", notes: "" },
      { id: "ar6", activityId: "a7", activityName: "Media Campaigns", completedQuantity: 5, description: "Social media posts", notes: "" },
    ],
    customActivities: [],
    notes: "Excellent performance from Lahore district.",
    nextMonthTasks: [
      { id: "nmt3", taskName: "Continue 20 Quran Classes", activityType: "Quran Classes", targetQuantity: 20, deadline: "2026-04-30", notes: "" },
    ],
    attendance: "Present",
  },
  {
    id: "dmr3", meetingId: "m3", districtId: peshawarId, districtName: "Peshawar", meetingTitle: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", status: "Completed",
    activityReports: [
      { id: "ar7", activityId: "a3", activityName: "Dawah Programs", completedQuantity: 6, description: "Community outreach in 6 areas", notes: "Good response" },
      { id: "ar8", activityId: "a1", activityName: "Quran Classes", completedQuantity: 10, description: "Regular weekly classes", notes: "" },
    ],
    customActivities: [{ id: "ca2", name: "Blood Donation Camp", quantity: 1, description: "Organized at local hospital" }],
    notes: "Peshawar district showing improvement. Weather issues caused some delays.",
    nextMonthTasks: [
      { id: "nmt4", taskName: "Expand Dawah Programs to 10", activityType: "Dawah Programs", targetQuantity: 10, deadline: "2026-04-30", notes: "" },
    ],
    attendance: "Present",
  },
  {
    id: "dmr4", meetingId: "m3", districtId: multanId, districtName: "Multan", meetingTitle: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", status: "Completed",
    activityReports: [
      { id: "ar9", activityId: "a6", activityName: "Welfare Support Programs", completedQuantity: 12, description: "Full target achieved", notes: "Excellent work" },
      { id: "ar10", activityId: "a5", activityName: "Ramadan Iftar Distribution", completedQuantity: 15, description: "Major iftar events", notes: "" },
    ],
    customActivities: [],
    notes: "Outstanding performance. Multan leads in welfare activities.",
    nextMonthTasks: [
      { id: "nmt5", taskName: "Continue Welfare Programs", activityType: "Welfare Support Programs", targetQuantity: 15, deadline: "2026-04-30", notes: "" },
    ],
    attendance: "Present",
  },
  // Empty records for other districts
  ...districts.filter(d => ![kasurId, lahoreId, peshawarId, multanId].includes(d.id)).slice(0, 20).map((d, i) => ({
    id: `dmr_empty_${i}`,
    meetingId: "m3",
    districtId: d.id,
    districtName: d.name,
    meetingTitle: "March Monthly Review",
    month: "2026-03",
    meetingDate: "2026-03-25",
    status: "Empty" as const,
    activityReports: [],
    customActivities: [],
    notes: "",
    nextMonthTasks: [],
    attendance: undefined,
  })),
];

export const tasks: Task[] = [
  { id: "t1", title: "Organize Ramadan Iftar in Kasur", districtId: kasurId, districtName: "Kasur", zone: "Central Punjab", startDate: "2026-03-01", deadline: "2026-03-30", priority: "High", status: "In Progress" },
  { id: "t2", title: "Setup Quran Classes in Swat", districtId: districts.find(d => d.name === "Swat")?.id, districtName: "Swat", zone: "Khyber Pakhtunkhwa", startDate: "2026-03-05", deadline: "2026-04-05", priority: "Medium", status: "Pending" },
  { id: "t3", title: "Launch Media Campaign for Karachi", districtId: karachiSouthId, districtName: "Karachi South", zone: "Sindh", startDate: "2026-02-20", deadline: "2026-03-20", priority: "High", status: "Completed" },
  { id: "t4", title: "Welfare Distribution in Quetta", districtId: quettaId, districtName: "Quetta", zone: "Balochistan", startDate: "2026-03-10", deadline: "2026-03-31", priority: "Critical", status: "In Progress" },
  { id: "t5", title: "Youth Program Launch in Lahore", districtId: lahoreId, districtName: "Lahore", zone: "Central Punjab", startDate: "2026-03-15", deadline: "2026-04-15", priority: "Medium", status: "Pending" },
  { id: "t6", title: "Coordinator Training Workshop", zone: "Federal (Islamabad)", startDate: "2026-04-01", deadline: "2026-04-10", priority: "Low", status: "Pending" },
  { id: "t7", title: "Health Camp in Faisalabad", districtId: faisalabadId, districtName: "Faisalabad", zone: "Central Punjab", startDate: "2026-03-20", deadline: "2026-04-20", priority: "Medium", status: "In Progress" },
  { id: "t8", title: "Dawah Program Expansion in Peshawar", districtId: peshawarId, districtName: "Peshawar", zone: "Khyber Pakhtunkhwa", startDate: "2026-03-01", deadline: "2026-04-01", priority: "High", status: "In Progress" },
];
