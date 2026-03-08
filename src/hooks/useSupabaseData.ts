import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Zone, District, Coordinator, Activity, Goal, Meeting, DistrictMeetingRecord, Task } from "@/types";

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

// ─── Loading component ───
export function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <img src="/msl-logo.webp" alt="MSL" className="w-10 h-10 animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}
