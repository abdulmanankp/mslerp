export type ZoneName =
  | "Khyber Pakhtunkhwa"
  | "Federal (Islamabad)"
  | "North Punjab"
  | "Central Punjab"
  | "South Punjab"
  | "Sindh"
  | "Balochistan"
  | "Azad Kashmir"
  | "Gilgit-Baltistan";

export interface Zone {
  id: string;
  name: ZoneName;
  districtsCount: number;
  coordinatorsCount: number;
  status: "Active" | "Inactive";
}

export interface District {
  id: string;
  name: string;
  zone: ZoneName;
  division: string;
  population?: number;
  status: "Active" | "Inactive";
  createdDate: string;
  currentCoordinatorId?: string;
}

export interface Coordinator {
  id: string;
  name: string;
  phone: string;
  address: string;
  education?: string;
  joiningDate: string;
  endDate?: string;
  zone: ZoneName;
  districtId: string;
  districtName: string;
  status: "Active" | "Expired";
  totalActivities?: number;
  attendanceRate?: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "Active" | "Inactive";
}

export interface Goal {
  id: string;
  month: string;
  zone: ZoneName;
  districtId: string;
  districtName: string;
  activityId: string;
  activityName: string;
  targetNumber: number;
  completedNumber?: number;
  notes?: string;
  status?: "Pending" | "Completed" | "Partially Completed" | "Not Completed";
}

export interface Meeting {
  id: string;
  title: string;
  month: string;
  meetingDate: string;
  agenda: string;
  notes?: string;
  scope: "All" | "Zone" | "Selected";
  scopeValue?: string;
  districtIds: string[];
}

export interface DistrictMeetingRecord {
  id: string;
  meetingId: string;
  districtId: string;
  districtName: string;
  meetingTitle: string;
  month: string;
  meetingDate: string;
  status: "Empty" | "Completed";
  activityReports: ActivityReport[];
  customActivities: CustomActivity[];
  notes: string;
  nextMonthTasks: NextMonthTask[];
  attendance?: "Present" | "Absent" | "Late";
}

export interface ActivityReport {
  id: string;
  activityId: string;
  activityName: string;
  completedQuantity: number;
  description?: string;
  notes?: string;
}

export interface CustomActivity {
  id: string;
  name: string;
  quantity: number;
  description?: string;
}

export interface NextMonthTask {
  id: string;
  taskName: string;
  activityType: string;
  targetQuantity: number;
  deadline?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  districtId?: string;
  districtName?: string;
  zone?: ZoneName;
  department?: string;
  startDate: string;
  deadline: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Completed" | "Delayed";
}

export type UserRole = "Super Admin" | "President" | "Zone Coordinator" | "District Coordinator" | "Department Head" | "Viewer";
