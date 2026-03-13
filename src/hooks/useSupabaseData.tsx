import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Zone,
  District,
  Coordinator,
  Activity,
  Goal,
  Meeting,
  DistrictMeetingRecord,
  Task,
  University,
  UniversityCoordinator,
  UniversityGoal,
  UniversityTask,
  UniversityMeeting,
  MadadgarTeam,
  MadadgarCoordinator,
  MadadgarGoal,
  MadadgarTask,
  MadadgarMeeting,
  PresidentSchedule,
  ScheduleFrequency,
  ScheduleTargetType,
} from "@/types";

// ─── Snake → Camel mapper ───
function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((r: any, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      r[camelKey] = toCamel(obj[key]);
      return r;
    }, {});
  }
  return obj;
}

function toSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((r: any, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      r[snakeKey] = toSnake(obj[key]);
      return r;
    }, {});
  }
  return obj;
}

// ─── Zones ───
export function useZones() {
  return useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("zones").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as Zone[];
    },
  });
}

// ─── Districts ───
export function useDistricts() {
  return useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("districts").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as District[];
    },
  });
}

// ─── Coordinators ───
export function useCoordinators() {
  return useQuery({
    queryKey: ["coordinators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coordinators").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as Coordinator[];
    },
  });
}

export function useCreateCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coord: Omit<Coordinator, "id">) => {
      const payload = toSnake(coord);
      delete payload.id;
      const { data, error } = await supabase.from("coordinators").insert(payload).select().single();
      if (error) throw error;
      return toCamel(data) as Coordinator;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinators"] }),
  });
}

export function useUpdateCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Coordinator> & { id: string }) => {
      const payload = toSnake(updates);
      const { data, error } = await supabase.from("coordinators").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return toCamel(data) as Coordinator;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinators"] }),
  });
}

export function useDeleteCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coordinators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinators"] }),
  });
}

// ─── Activities ───
export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as Activity[];
    },
  });
}

// ─── Goals ───
export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").order("month", { ascending: false });
      if (error) throw error;
      return toCamel(data || []) as Goal[];
    },
  });
}

// ─── Meetings ───
export function useMeetings() {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*, meeting_districts(district_id)")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((m: any) => {
        const mapped = toCamel(m) as any;
        mapped.districtIds = (m.meeting_districts || []).map((md: any) => md.district_id);
        delete mapped.meetingDistricts;
        return mapped as Meeting;
      });
    },
  });
}

// ─── Tasks ───
export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("deadline");
      if (error) throw error;
      return toCamel(data || []) as Task[];
    },
  });
}

// ─── District Meeting Records (with nested data) ───
export function useDistrictMeetingRecords(meetingId?: string) {
  return useQuery({
    queryKey: ["district_meeting_records", meetingId],
    queryFn: async () => {
      let query = supabase
        .from("district_meeting_records")
        .select("*, activity_reports(*), custom_activities(*), next_month_tasks(*)");
      if (meetingId) query = query.eq("meeting_id", meetingId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((r: any) => {
        const mapped = toCamel(r) as any;
        mapped.activityReports = toCamel(r.activity_reports || []);
        mapped.customActivities = toCamel(r.custom_activities || []);
        mapped.nextMonthTasks = toCamel(r.next_month_tasks || []);
        delete mapped.activityReports2;
        delete mapped.customActivities2;
        delete mapped.nextMonthTasks2;
        return mapped as DistrictMeetingRecord;
      });
    },
  });
}

// ─── Universities ───
export function useUniversities() {
  return useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("universities").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as University[];
    },
  });
}

export function useUniversityCoordinators() {
  return useQuery({
    queryKey: ["university_coordinators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("university_coordinators").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as UniversityCoordinator[];
    },
  });
}

export function useUniversityGoals() {
  return useQuery({
    queryKey: ["university_goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("university_goals").select("*").order("month", { ascending: false });
      if (error) throw error;
      return toCamel(data || []) as UniversityGoal[];
    },
  });
}

export function useUniversityTasks() {
  return useQuery({
    queryKey: ["university_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("university_tasks").select("*").order("deadline");
      if (error) throw error;
      return toCamel(data || []) as UniversityTask[];
    },
  });
}

export function useUniversityMeetings() {
  return useQuery({
    queryKey: ["university_meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("university_meetings")
        .select("*, university_meeting_links(university_id)")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((m: any) => {
        const mapped = toCamel(m) as any;
        mapped.universityIds = (m.university_meeting_links || []).map((x: any) => x.university_id);
        return mapped as UniversityMeeting;
      });
    },
  });
}

export function useCreateUniversityMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      month: string;
      meetingDate: string;
      agenda: string;
      notes?: string;
      scope: "All" | "Selected";
      universityIds: string[];
    }) => {
      const { data: meetingData, error: meetingError } = await supabase
        .from("university_meetings")
        .insert({
          title: payload.title,
          month: payload.month,
          meeting_date: payload.meetingDate,
          agenda: payload.agenda,
          notes: payload.notes || "",
          scope: payload.scope,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      if (payload.universityIds.length > 0) {
        const links = payload.universityIds.map((universityId) => ({
          meeting_id: meetingData.id,
          university_id: universityId,
        }));
        const { error: linkError } = await supabase.from("university_meeting_links").insert(links);
        if (linkError) throw linkError;
      }

      return meetingData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["university_meetings"] }),
  });
}

// ─── Madadgar Teams ───
export function useMadadgarTeams() {
  return useQuery({
    queryKey: ["madadgar_teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("madadgar_teams").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as MadadgarTeam[];
    },
  });
}

export function useMadadgarCoordinators() {
  return useQuery({
    queryKey: ["madadgar_coordinators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("madadgar_coordinators").select("*").order("name");
      if (error) throw error;
      return toCamel(data || []) as MadadgarCoordinator[];
    },
  });
}

export function useMadadgarGoals() {
  return useQuery({
    queryKey: ["madadgar_goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("madadgar_goals").select("*").order("month", { ascending: false });
      if (error) throw error;
      return toCamel(data || []) as MadadgarGoal[];
    },
  });
}

export function useMadadgarTasks() {
  return useQuery({
    queryKey: ["madadgar_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("madadgar_tasks").select("*").order("deadline");
      if (error) throw error;
      return toCamel(data || []) as MadadgarTask[];
    },
  });
}

export function useMadadgarMeetings() {
  return useQuery({
    queryKey: ["madadgar_meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("madadgar_meetings")
        .select("*, madadgar_meeting_links(team_id)")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((m: any) => {
        const mapped = toCamel(m) as any;
        mapped.teamIds = (m.madadgar_meeting_links || []).map((x: any) => x.team_id);
        return mapped as MadadgarMeeting;
      });
    },
  });
}

export function useCreateMadadgarMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      month: string;
      meetingDate: string;
      agenda: string;
      notes?: string;
      scope: "All" | "Selected";
      teamIds: string[];
    }) => {
      const { data: meetingData, error: meetingError } = await supabase
        .from("madadgar_meetings")
        .insert({
          title: payload.title,
          month: payload.month,
          meeting_date: payload.meetingDate,
          agenda: payload.agenda,
          notes: payload.notes || "",
          scope: payload.scope,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      if (payload.teamIds.length > 0) {
        const links = payload.teamIds.map((teamId) => ({
          meeting_id: meetingData.id,
          team_id: teamId,
        }));
        const { error: linkError } = await supabase.from("madadgar_meeting_links").insert(links);
        if (linkError) throw linkError;
      }

      return meetingData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["madadgar_meetings"] }),
  });
}

// ─── President Schedules ───
export function usePresidentSchedules() {
  return useQuery({
    queryKey: ["president_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("president_schedules")
        .select("*")
        .order("schedule_date", { ascending: true });
      if (error) throw error;
      return toCamel(data || []) as PresidentSchedule[];
    },
  });
}

export function useCreatePresidentSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      frequency: ScheduleFrequency;
      scheduleDate: string;
      targetType: ScheduleTargetType;
      targetId: string;
      targetName: string;
      createdBy?: string;
    }) => {
      const row: Record<string, string | null> = {
        title: payload.title,
        description: payload.description || "",
        frequency: payload.frequency,
        schedule_date: payload.scheduleDate,
        target_type: payload.targetType,
        target_name: payload.targetName,
        zone_id: null,
        district_id: null,
        university_id: null,
        created_by: payload.createdBy || null,
      };

      if (payload.targetType === "Zone") row.zone_id = payload.targetId;
      if (payload.targetType === "District") row.district_id = payload.targetId;
      if (payload.targetType === "University") row.university_id = payload.targetId;

      const { data, error } = await supabase
        .from("president_schedules")
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return toCamel(data) as PresidentSchedule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["president_schedules"] }),
  });
}

// ─── Loading component ───
export function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Page header shimmer */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted animate-pulse opacity-60" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>

      {/* Main content blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-muted animate-pulse" style={{ animationDelay: '120ms' }} />
        <div className="h-64 rounded-xl bg-muted animate-pulse" style={{ animationDelay: '180ms' }} />
      </div>

      {/* Table / list shimmer */}
      <div className="rounded-xl bg-muted/50 border border-border overflow-hidden">
        <div className="h-11 bg-muted animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-4 py-3 border-t border-border"
            style={{ animationDelay: `${240 + i * 50}ms` }}
          >
            <div className="h-4 rounded-md bg-muted animate-pulse flex-1" />
            <div className="h-4 w-20 rounded-md bg-muted animate-pulse opacity-70" />
            <div className="h-4 w-16 rounded-md bg-muted animate-pulse opacity-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
