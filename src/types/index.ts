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

export type CoordinatorType = "Zonal" | "District";

export interface Coordinator {
  id: string;
  name: string;
  phone: string;
  address: string;
  education?: string;
  coordinatorType: CoordinatorType;
  joiningDate: string;
  endDate?: string;
  zone: ZoneName;
  districtId?: string;
  districtName?: string;
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

export interface University {
  id: string;
  name: string;
  province: string;
  city: string;
  status: "Active" | "Inactive";
  createdDate: string;
  currentCoordinatorId?: string;
}

export interface UniversityCoordinator {
  id: string;
  name: string;
  phone: string;
  address: string;
  education?: string;
  joiningDate: string;
  endDate?: string;
  universityId: string;
  universityName?: string;
  status: "Active" | "Expired";
  totalActivities?: number;
  attendanceRate?: number;
}

export interface UniversityGoal {
  id: string;
  month: string;
  universityId: string;
  universityName: string;
  activityId: string;
  activityName: string;
  targetNumber: number;
  completedNumber?: number;
  notes?: string;
  status?: "Pending" | "Completed" | "Partially Completed" | "Not Completed";
}

export interface UniversityTask {
  id: string;
  title: string;
  universityId: string;
  universityName?: string;
  startDate: string;
  deadline: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Completed" | "Delayed";
}

export interface UniversityMeeting {
  id: string;
  title: string;
  month: string;
  meetingDate: string;
  agenda: string;
  notes?: string;
  scope: "All" | "Selected";
  universityIds: string[];
}

export interface MadadgarTeam {
  id: string;
  name: string;
  districtId: string;
  districtName?: string;
  zone: ZoneName;
  status: "Active" | "Inactive";
  createdDate: string;
  currentCoordinatorId?: string;
}

export interface MadadgarCoordinator {
  id: string;
  name: string;
  phone: string;
  address: string;
  joiningDate: string;
  endDate?: string;
  teamId: string;
  teamName?: string;
  status: "Active" | "Expired";
  totalActivities?: number;
  attendanceRate?: number;
}

export interface MadadgarGoal {
  id: string;
  month: string;
  teamId: string;
  teamName: string;
  activityId: string;
  activityName: string;
  targetNumber: number;
  completedNumber?: number;
  notes?: string;
  status?: "Pending" | "Completed" | "Partially Completed" | "Not Completed";
}

export interface MadadgarTask {
  id: string;
  title: string;
  teamId: string;
  teamName?: string;
  startDate: string;
  deadline: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Completed" | "Delayed";
}

export interface MadadgarMeeting {
  id: string;
  title: string;
  month: string;
  meetingDate: string;
  agenda: string;
  notes?: string;
  scope: "All" | "Selected";
  teamIds: string[];
}

export type ScheduleFrequency = "Daily" | "Weekly" | "Monthly";
export type ScheduleTargetType = "Zone" | "District" | "University";

export interface PresidentSchedule {
  id: string;
  title: string;
  description?: string;
  frequency: ScheduleFrequency;
  scheduleDate: string;
  targetType: ScheduleTargetType;
  zoneId?: string;
  districtId?: string;
  universityId?: string;
  targetName: string;
  status: "Active" | "Inactive";
  createdBy?: string;
  createdAt: string;
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

export type UserRole =
  | "Super Admin"
  | "President"
  | "Zone Coordinator"
  | "District Coordinator"
  | "University Coordinator"
  | "Madadgar Team Coordinator"
  | "Department Head"
  | "Viewer";
