export type ZoneName =
  | "Khyber Pakhtunkhwa"
  | "Federal (Islamabad)"
  | "North Punjab"
  | "Central Punjab"
  | "South Punjab"
  | "Eastern Punjab"
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

export type CoordinatorType = "Zonal" | "District" | "Department";

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
  departmentName?: string;
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
  sector?: "Public" | "Private";
  status: "Active" | "Inactive";
  createdDate: string;
  currentCoordinatorId?: string;
}

export interface UniversityScenario {
  id: string;
  name: string;
  description?: string;
  approachedLabel: string;
  successfulLabel: string;
  status: "Active" | "Inactive";
  createdDate: string;
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
  scenario?: "Admissions" | "Quran Class Hostel" | "Study Circle" | "Syllabus" | "Custom";
  scenarioId?: string;
  scenarioName?: string;
  customName?: string;
  targetNumber: number;
  completedNumber?: number;
  approachedStudents?: number;
  successfulStudents?: number;
  notes?: string;
  status?: "Pending" | "Completed" | "Partially Completed" | "Not Completed";
  startedInMeetingId?: string;
  startedInMeetingTitle?: string;
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

export interface UniversityMeetingRecord {
  id: string;
  meetingId: string;
  universityId: string;
  universityName: string;
  meetingTitle: string;
  month: string;
  meetingDate: string;
  status: "Empty" | "Completed";
  attendance?: "Present" | "Absent" | "Late";
  attendanceCount?: number;
  attendees?: MeetingAttendee[];
  notes: string;
  activityReports: ActivityReport[];
  customActivities: CustomActivity[];
  nextMonthTasks: NextMonthTask[];
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
  attendanceCount?: number;
  attendees?: MeetingAttendee[];
  mediaReport?: DistrictMediaReport;
}

export interface DistrictMediaReport {
  contentProduction: number;
  reels: number;
  mediaPosting: number;
  hasFacebookPage: boolean;
  facebookFollowers: number;
  postingFrequency: "Daily" | "Weekly" | "Monthly" | "Rarely";
}

export interface MeetingAttendee {
  id: string;
  name?: string;
  designation?: string;
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
  assignmentScope?: "District" | "Markazi";
  markaziCoordinatorId?: string;
  markaziCoordinatorName?: string;
  markaziDesignation?: string;
  department?: string;
  startDate: string;
  deadline: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Completed" | "Delayed";
}

export interface MarkaziTeamProfile {
  id: string;
  name: string;
  designation: string;
  status: "Active" | "Inactive";
  createdAt: string;
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

export interface AppUserPermissions {
  appAccess: boolean;
  canAddDistrictData: boolean;
  canEditDistrictData: boolean;
  canCreateMeetings: boolean;
  canManageUsers: boolean;
  canCreateUniversityMeetings: boolean;
  canManageUniversityRecords: boolean;
  canManageUniversityCampaigns: boolean;
  canMonitorUniversityAnalytics: boolean;
  canExportUniversityReports: boolean;
  assignedDistrictIds: string[];
}

export interface AppUserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  profilePhotoUrl?: string | null;
  designation: UserRole;
  status: "Active" | "Inactive";
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}
