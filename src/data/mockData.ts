import type { Zone, District, Coordinator, Activity, Goal, Meeting, DistrictMeetingRecord, Task } from "@/types";

export const zones: Zone[] = [
  { id: "z1", name: "Khyber Pakhtunkhwa", districtsCount: 4, coordinatorsCount: 4, status: "Active" },
  { id: "z2", name: "Federal (Islamabad)", districtsCount: 2, coordinatorsCount: 2, status: "Active" },
  { id: "z3", name: "North Punjab", districtsCount: 3, coordinatorsCount: 3, status: "Active" },
  { id: "z4", name: "Central Punjab", districtsCount: 5, coordinatorsCount: 5, status: "Active" },
  { id: "z5", name: "South Punjab", districtsCount: 3, coordinatorsCount: 3, status: "Active" },
  { id: "z6", name: "Sindh", districtsCount: 4, coordinatorsCount: 4, status: "Active" },
  { id: "z7", name: "Balochistan", districtsCount: 2, coordinatorsCount: 2, status: "Active" },
  { id: "z8", name: "Azad Kashmir", districtsCount: 2, coordinatorsCount: 2, status: "Active" },
  { id: "z9", name: "Gilgit-Baltistan", districtsCount: 2, coordinatorsCount: 1, status: "Active" },
];

export const districts: District[] = [
  { id: "d1", name: "Peshawar", zone: "Khyber Pakhtunkhwa", division: "Peshawar", population: 4269079, status: "Active", createdDate: "2024-01-15", currentCoordinatorId: "c1" },
  { id: "d2", name: "Mardan", zone: "Khyber Pakhtunkhwa", division: "Mardan", population: 2373061, status: "Active", createdDate: "2024-01-15", currentCoordinatorId: "c2" },
  { id: "d3", name: "Swat", zone: "Khyber Pakhtunkhwa", division: "Malakand", population: 2309570, status: "Active", createdDate: "2024-02-01" },
  { id: "d4", name: "Abbottabad", zone: "Khyber Pakhtunkhwa", division: "Hazara", population: 1332912, status: "Active", createdDate: "2024-02-01" },
  { id: "d5", name: "Islamabad", zone: "Federal (Islamabad)", division: "Islamabad", population: 2006572, status: "Active", createdDate: "2024-01-10", currentCoordinatorId: "c3" },
  { id: "d6", name: "Rawalpindi", zone: "Federal (Islamabad)", division: "Rawalpindi", population: 5405633, status: "Active", createdDate: "2024-01-10", currentCoordinatorId: "c4" },
  { id: "d7", name: "Lahore", zone: "Central Punjab", division: "Lahore", population: 11126285, status: "Active", createdDate: "2024-01-10", currentCoordinatorId: "c5" },
  { id: "d8", name: "Faisalabad", zone: "Central Punjab", division: "Faisalabad", population: 7873910, status: "Active", createdDate: "2024-01-15", currentCoordinatorId: "c6" },
  { id: "d9", name: "Gujranwala", zone: "Central Punjab", division: "Gujranwala", population: 5014196, status: "Active", createdDate: "2024-02-01" },
  { id: "d10", name: "Kasur", zone: "Central Punjab", division: "Lahore", population: 3454881, status: "Active", createdDate: "2024-02-15", currentCoordinatorId: "c7" },
  { id: "d11", name: "Sialkot", zone: "Central Punjab", division: "Gujranwala", population: 3893672, status: "Active", createdDate: "2024-03-01" },
  { id: "d12", name: "Karachi", zone: "Sindh", division: "Karachi", population: 14910352, status: "Active", createdDate: "2024-01-10", currentCoordinatorId: "c8" },
  { id: "d13", name: "Hyderabad", zone: "Sindh", division: "Hyderabad", population: 3429471, status: "Active", createdDate: "2024-01-15" },
  { id: "d14", name: "Multan", zone: "South Punjab", division: "Multan", population: 4745109, status: "Active", createdDate: "2024-01-15", currentCoordinatorId: "c9" },
  { id: "d15", name: "Quetta", zone: "Balochistan", division: "Quetta", population: 2275699, status: "Active", createdDate: "2024-02-01", currentCoordinatorId: "c10" },
];

export const coordinators: Coordinator[] = [
  { id: "c1", name: "Ahmad Khan", phone: "+92-300-1234567", address: "Peshawar, KPK", education: "MBA", joiningDate: "2024-01-20", zone: "Khyber Pakhtunkhwa", districtId: "d1", districtName: "Peshawar", status: "Active", totalActivities: 45, attendanceRate: 92 },
  { id: "c2", name: "Bilal Ahmed", phone: "+92-301-2345678", address: "Mardan, KPK", education: "BSc", joiningDate: "2024-01-25", zone: "Khyber Pakhtunkhwa", districtId: "d2", districtName: "Mardan", status: "Active", totalActivities: 38, attendanceRate: 88 },
  { id: "c3", name: "Usman Ali", phone: "+92-302-3456789", address: "Islamabad", education: "MS", joiningDate: "2024-01-15", zone: "Federal (Islamabad)", districtId: "d5", districtName: "Islamabad", status: "Active", totalActivities: 52, attendanceRate: 95 },
  { id: "c4", name: "Tariq Mehmood", phone: "+92-303-4567890", address: "Rawalpindi", education: "BA", joiningDate: "2024-01-15", zone: "Federal (Islamabad)", districtId: "d6", districtName: "Rawalpindi", status: "Active", totalActivities: 41, attendanceRate: 90 },
  { id: "c5", name: "Hassan Raza", phone: "+92-304-5678901", address: "Lahore", education: "MBA", joiningDate: "2024-01-12", zone: "Central Punjab", districtId: "d7", districtName: "Lahore", status: "Active", totalActivities: 67, attendanceRate: 97 },
  { id: "c6", name: "Imran Shahid", phone: "+92-305-6789012", address: "Faisalabad", education: "BSc", joiningDate: "2024-01-18", zone: "Central Punjab", districtId: "d8", districtName: "Faisalabad", status: "Active", totalActivities: 34, attendanceRate: 85 },
  { id: "c7", name: "Fahad Hussain", phone: "+92-306-7890123", address: "Kasur", education: "MA", joiningDate: "2024-03-01", zone: "Central Punjab", districtId: "d10", districtName: "Kasur", status: "Active", totalActivities: 22, attendanceRate: 80 },
  { id: "c8", name: "Zubair Ahmed", phone: "+92-307-8901234", address: "Karachi", education: "BBA", joiningDate: "2024-01-12", zone: "Sindh", districtId: "d12", districtName: "Karachi", status: "Active", totalActivities: 58, attendanceRate: 93 },
  { id: "c9", name: "Nasir Mahmood", phone: "+92-308-9012345", address: "Multan", education: "BSc", joiningDate: "2024-01-20", zone: "South Punjab", districtId: "d14", districtName: "Multan", status: "Active", totalActivities: 30, attendanceRate: 87 },
  { id: "c10", name: "Abdul Qadir", phone: "+92-309-0123456", address: "Quetta", education: "BA", joiningDate: "2024-02-05", zone: "Balochistan", districtId: "d15", districtName: "Quetta", status: "Active", totalActivities: 18, attendanceRate: 78 },
  // Expired coordinator
  { id: "c11", name: "Khalid Mehmood", phone: "+92-310-1234567", address: "Kasur", education: "MSc", joiningDate: "2024-01-10", endDate: "2024-02-28", zone: "Central Punjab", districtId: "d10", districtName: "Kasur", status: "Expired", totalActivities: 15, attendanceRate: 75 },
];

export const activities: Activity[] = [
  { id: "a1", name: "Quran Classes", description: "Regular Quran reading and memorization classes", category: "Education", status: "Active" },
  { id: "a2", name: "Islamic Education Sessions", description: "Islamic knowledge and learning sessions", category: "Education", status: "Active" },
  { id: "a3", name: "Dawah Programs", description: "Community outreach and dawah activities", category: "Outreach", status: "Active" },
  { id: "a4", name: "Muslim Kids Programs", description: "Educational and fun programs for children", category: "Youth", status: "Active" },
  { id: "a5", name: "Ramadan Iftar Distribution", description: "Organizing and distributing iftar meals", category: "Welfare", status: "Active" },
  { id: "a6", name: "Welfare Support Programs", description: "Community welfare and support initiatives", category: "Welfare", status: "Active" },
  { id: "a7", name: "Media Campaigns", description: "Social media and awareness campaigns", category: "Media", status: "Active" },
];

export const goals: Goal[] = [
  { id: "g1", month: "2026-03", zone: "Central Punjab", districtId: "d10", districtName: "Kasur", activityId: "a5", activityName: "Ramadan Iftar Distribution", targetNumber: 10, completedNumber: 8, notes: "Ramadan month priority", status: "Partially Completed" },
  { id: "g2", month: "2026-03", zone: "Central Punjab", districtId: "d7", districtName: "Lahore", activityId: "a1", activityName: "Quran Classes", targetNumber: 20, completedNumber: 20, notes: "", status: "Completed" },
  { id: "g3", month: "2026-03", zone: "Central Punjab", districtId: "d7", districtName: "Lahore", activityId: "a4", activityName: "Muslim Kids Programs", targetNumber: 5, completedNumber: 3, notes: "", status: "Partially Completed" },
  { id: "g4", month: "2026-03", zone: "Sindh", districtId: "d12", districtName: "Karachi", activityId: "a1", activityName: "Quran Classes", targetNumber: 15, completedNumber: 15, notes: "", status: "Completed" },
  { id: "g5", month: "2026-04", zone: "Central Punjab", districtId: "d10", districtName: "Kasur", activityId: "a1", activityName: "Quran Classes", targetNumber: 15, notes: "New quarter target", status: "Pending" },
  { id: "g6", month: "2026-04", zone: "Central Punjab", districtId: "d10", districtName: "Kasur", activityId: "a4", activityName: "Muslim Kids Programs", targetNumber: 5, notes: "", status: "Pending" },
];

export const meetings: Meeting[] = [
  { id: "m1", title: "January Monthly Review", month: "2026-01", meetingDate: "2026-01-28", agenda: "Review Q4 progress and set Q1 goals", notes: "All zones participated", scope: "All", districtIds: districts.map(d => d.id) },
  { id: "m2", title: "February Monthly Review", month: "2026-02", meetingDate: "2026-02-25", agenda: "February activities review", notes: "", scope: "All", districtIds: districts.map(d => d.id) },
  { id: "m3", title: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", agenda: "Ramadan preparation and progress review", notes: "", scope: "All", districtIds: districts.map(d => d.id) },
];

export const districtMeetingRecords: DistrictMeetingRecord[] = [
  {
    id: "dmr1", meetingId: "m3", districtId: "d10", districtName: "Kasur", meetingTitle: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", status: "Completed",
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
    id: "dmr2", meetingId: "m3", districtId: "d7", districtName: "Lahore", meetingTitle: "March Monthly Review", month: "2026-03", meetingDate: "2026-03-25", status: "Completed",
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
];

export const tasks: Task[] = [
  { id: "t1", title: "Organize Ramadan Iftar in Kasur", districtId: "d10", districtName: "Kasur", zone: "Central Punjab", startDate: "2026-03-01", deadline: "2026-03-30", priority: "High", status: "In Progress" },
  { id: "t2", title: "Setup Quran Classes in Swat", districtId: "d3", districtName: "Swat", zone: "Khyber Pakhtunkhwa", startDate: "2026-03-05", deadline: "2026-04-05", priority: "Medium", status: "Pending" },
  { id: "t3", title: "Launch Media Campaign for Karachi", districtId: "d12", districtName: "Karachi", zone: "Sindh", startDate: "2026-02-20", deadline: "2026-03-20", priority: "High", status: "Completed" },
  { id: "t4", title: "Welfare Distribution in Quetta", districtId: "d15", districtName: "Quetta", zone: "Balochistan", startDate: "2026-03-10", deadline: "2026-03-31", priority: "Critical", status: "In Progress" },
  { id: "t5", title: "Youth Program Launch in Lahore", districtId: "d7", districtName: "Lahore", zone: "Central Punjab", startDate: "2026-03-15", deadline: "2026-04-15", priority: "Medium", status: "Pending" },
  { id: "t6", title: "Coordinator Training Workshop", zone: "Federal (Islamabad)", startDate: "2026-04-01", deadline: "2026-04-10", priority: "Low", status: "Pending" },
];
