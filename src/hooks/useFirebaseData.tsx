/* eslint-disable react-refresh/only-export-components */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { firestore } from "@/integrations/firebase/client";
import {
  appendCollectionCacheItem,
  enqueueFirestoreOperation,
  isOnlineNow,
  readCollectionCache,
  saveCollectionCache,
} from "@/lib/offlineSync";
import type {
  Activity,
  Coordinator,
  District,
  DistrictMeetingRecord,
  Goal,
  MadadgarCoordinator,
  MadadgarGoal,
  MadadgarMeeting,
  MadadgarTask,
  MadadgarTeam,
  MarkaziTeamProfile,
  Meeting,
  PresidentSchedule,
  ScheduleFrequency,
  ScheduleTargetType,
  Task,
  University,
  UniversityCoordinator,
  UniversityGoal,
  UniversityMeeting,
  UniversityMeetingRecord,
  UniversityScenario,
  UniversityTask,
  Zone,
  ZoneName,
} from "@/types";

type AnyObject = Record<string, unknown>;

function toCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === "object" && !(obj instanceof Date)) {
    const input = obj as Record<string, unknown>;
    return Object.keys(input).reduce((acc: AnyObject, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      acc[camelKey] = toCamel(input[key]);
      return acc;
    }, {});
  }
  return obj;
}

async function readCollection<T>(name: string, orderField?: string, direction: "asc" | "desc" = "asc"): Promise<T[]> {
  const ref = collection(firestore, name);
  try {
    const q = orderField ? query(ref, orderBy(orderField, direction)) : query(ref);
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => {
      const data = toCamel(d.data()) as Record<string, unknown>;
      return { id: d.id, ...data } as T;
    });
    await saveCollectionCache(name, rows);
    return rows;
  } catch {
    try {
      const snap = await getDocs(ref);
      const rows = snap.docs.map((d) => {
        const data = toCamel(d.data()) as Record<string, unknown>;
        return { id: d.id, ...data } as T;
      });
      await saveCollectionCache(name, rows);
      return rows;
    } catch {
      const cached = await readCollectionCache<T>(name);
      return cached || [];
    }
  }
}

async function readDocById<T>(name: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(firestore, name, id));
  if (!snap.exists()) return null;
  const data = toCamel(snap.data()) as Record<string, unknown>;
  return { id: snap.id, ...data } as T;
}

// Zones
export function useZones() {
  return useQuery({
    queryKey: ["zones"],
    queryFn: async () => readCollection<Zone>("zones", "name"),
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: ZoneName; status: "Active" | "Inactive" }) => {
      if (!payload.name) throw new Error("Zone name is required");
      
      const id = doc(collection(firestore, "zones")).id;
      const zoneData = { name: payload.name, status: payload.status || "Active" };

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "zones", id), zoneData);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "zones",
          docId: id,
          data: zoneData,
        });
      }
      
      const fresh = await readDocById<Zone>("zones", id);
      if (!fresh) throw new Error("Zone not found after creation.");
      return fresh;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { zoneId: string; updates: Partial<Omit<Zone, "id">> }) => {
      if (!payload.zoneId || !payload.updates) {
        throw new Error("Missing zone ID or updates");
      }
      
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "zones", payload.zoneId), payload.updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "zones",
          docId: payload.zoneId,
          data: payload.updates,
        });
      }
      
      const fresh = await readDocById<Zone>("zones", payload.zoneId);
      if (!fresh) throw new Error("Zone not found after update.");
      return fresh;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useUpdateZoneDistricts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { zoneName: string; districtIds: string[] }) => {
      if (!payload.zoneName) throw new Error("Zone name is required");

      // Get all districts to update
      const allDistricts = await readCollection<District>("districts", "name");
      
      // Create a batch for the updates
      const batch = writeBatch(firestore);

      // Update all districts: assign to zone if in list, remove otherwise
      for (const district of allDistricts) {
        const shouldBeInZone = payload.districtIds.includes(district.id);
        const currentlyInZone = district.zone === payload.zoneName;

        if (shouldBeInZone && !currentlyInZone) {
          // Add district to zone
          batch.update(doc(firestore, "districts", district.id), { zone: payload.zoneName });
        }
      }

      await batch.commit();
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

// Districts
export function useDistricts() {
  return useQuery({
    queryKey: ["districts"],
    queryFn: async () => readCollection<District>("districts", "name"),
  });
}

export function useUpdateDistrict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { districtId: string; updates: Partial<Omit<District, "id">> }) => {
      if (!payload.districtId || !payload.updates) {
        throw new Error("Missing district ID or updates");
      }
      
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "districts", payload.districtId), payload.updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "districts",
          docId: payload.districtId,
          data: payload.updates,
        });
      }
      
      const fresh = await readDocById<District>("districts", payload.districtId);
      if (!fresh) throw new Error("District not found after update.");
      return fresh;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["districts"] });
    },
  });
}

// Coordinators
export function useCoordinators() {
  return useQuery({
    queryKey: ["coordinators"],
    queryFn: async () => readCollection<Coordinator>("coordinators", "name"),
  });
}

export function useCreateCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coord: Omit<Coordinator, "id">) => {
      const id = doc(collection(firestore, "coordinators")).id;
      const row = { id, ...coord } as Coordinator;

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "coordinators", id), coord);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "coordinators",
          docId: id,
          data: coord,
        });
      }

      await appendCollectionCacheItem("coordinators", row);
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinators"] }),
  });
}

export function useUpdateCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Coordinator> & { id: string }) => {
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "coordinators", id), updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "coordinators",
          docId: id,
          data: updates,
        });
      }
      const fresh = await readDocById<Coordinator>("coordinators", id);
      if (!fresh) throw new Error("Coordinator not found after update.");
      return fresh;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinators"] }),
  });
}

export function useDeleteCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnlineNow()) {
        await deleteDoc(doc(firestore, "coordinators", id));
      } else {
        await enqueueFirestoreOperation({
          type: "delete",
          collection: "coordinators",
          docId: id,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinators"] }),
  });
}

// Activities
export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: async () => readCollection<Activity>("activities", "name"),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activity: Omit<Activity, "id">) => {
      const id = doc(collection(firestore, "activities")).id;
      if (isOnlineNow()) {
        await setDoc(doc(firestore, "activities", id), activity);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "activities",
          docId: id,
          data: activity,
        });
      }
      const row = { id, ...activity } as Activity;
      await appendCollectionCacheItem("activities", row);
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Activity> & { id: string }) => {
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "activities", id), updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "activities",
          docId: id,
          data: updates,
        });
      }
      const fresh = await readDocById<Activity>("activities", id);
      if (!fresh) throw new Error("Activity not found after update.");
      return fresh;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["district_meeting_records"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnlineNow()) {
        await deleteDoc(doc(firestore, "activities", id));
      } else {
        await enqueueFirestoreOperation({
          type: "delete",
          collection: "activities",
          docId: id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

// University Scenarios
export function useUniversityScenarios() {
  return useQuery({
    queryKey: ["university_scenarios"],
    queryFn: async () => readCollection<UniversityScenario>("university_scenarios", "name"),
  });
}

export function useCreateUniversityScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scenario: Omit<UniversityScenario, "id">) => {
      const id = doc(collection(firestore, "university_scenarios")).id;
      if (isOnlineNow()) {
        await setDoc(doc(firestore, "university_scenarios", id), scenario);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "university_scenarios",
          docId: id,
          data: scenario,
        });
      }
      const row = { id, ...scenario } as UniversityScenario;
      await appendCollectionCacheItem("university_scenarios", row);
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["university_scenarios"] }),
  });
}

export function useUpdateUniversityScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UniversityScenario> & { id: string }) => {
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "university_scenarios", id), updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "university_scenarios",
          docId: id,
          data: updates,
        });
      }
      const fresh = await readDocById<UniversityScenario>("university_scenarios", id);
      if (!fresh) throw new Error("Scenario not found after update.");
      return fresh;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["university_scenarios"] });
      qc.invalidateQueries({ queryKey: ["university_goals"] });
    },
  });
}

export function useDeleteUniversityScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnlineNow()) {
        await deleteDoc(doc(firestore, "university_scenarios", id));
      } else {
        await enqueueFirestoreOperation({
          type: "delete",
          collection: "university_scenarios",
          docId: id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["university_scenarios"] });
      qc.invalidateQueries({ queryKey: ["university_goals"] });
    },
  });
}

// Goals
export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => readCollection<Goal>("goals", "month", "desc"),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Omit<Goal, "id">) => {
      const id = doc(collection(firestore, "goals")).id;
      if (isOnlineNow()) {
        await setDoc(doc(firestore, "goals", id), goal);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "goals",
          docId: id,
          data: goal,
        });
      }
      const row = { id, ...goal } as Goal;
      await appendCollectionCacheItem("goals", row);
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "goals", id), updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "goals",
          docId: id,
          data: updates,
        });
      }

      const fresh = await readDocById<Goal>("goals", id);
      if (!fresh) throw new Error("Goal not found after update.");
      return fresh;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["district_meeting_records"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnlineNow()) {
        await deleteDoc(doc(firestore, "goals", id));
      } else {
        await enqueueFirestoreOperation({
          type: "delete",
          collection: "goals",
          docId: id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// Meetings
export function useMeetings() {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const rows = await readCollection<Meeting>("meetings", "meetingDate", "desc");
      return rows.map((m) => ({
        ...m,
        districtIds: Array.isArray((m as { districtIds?: unknown }).districtIds)
          ? ((m as { districtIds?: string[] }).districtIds || [])
          : [],
      }));
    },
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      month: string;
      meetingDate: string;
      agenda: string;
      notes?: string;
      scope: "All" | "Zone" | "Selected";
      scopeValue?: string;
      districtIds: string[];
    }) => {
      const districtIds = Array.from(new Set(payload.districtIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)));
      if (districtIds.length === 0) {
        throw new Error("No valid districts were selected for this meeting.");
      }

      console.info("[useCreateMeeting] submit", {
        title: payload.title,
        month: payload.month,
        meetingDate: payload.meetingDate,
        scope: payload.scope,
        districtCount: districtIds.length,
      });

      const meetingId = doc(collection(firestore, "meetings")).id;
      const meetingRow = {
        title: payload.title,
        month: payload.month,
        meetingDate: payload.meetingDate,
        agenda: payload.agenda,
        notes: payload.notes || "",
        scope: payload.scope,
        scopeValue: payload.scopeValue || null,
        districtIds,
      };

      const online = isOnlineNow();

      if (online) {
        await setDoc(doc(firestore, "meetings", meetingId), meetingRow);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "meetings",
          docId: meetingId,
          data: meetingRow,
        });
      }

      const allDistricts = await readCollection<District>("districts", "name");
      const districtNameById = new Map(allDistricts.map((d) => [d.id, d.name]));

      const districtRecords = districtIds.map((districtId) => {
        const linkId = `${meetingId}_${districtId}`;
        const districtRecord = {
          id: linkId,
          meetingId,
          districtId,
          districtName: districtNameById.get(districtId) || "Unknown District",
          meetingTitle: payload.title,
          month: payload.month,
          meetingDate: payload.meetingDate,
          status: "Empty" as const,
          notes: "",
          activityReports: [],
          customActivities: [],
          nextMonthTasks: [],
          attendanceCount: 0,
          attendees: [],
        };
        return districtRecord;
      });

      if (online) {
        const batchDistrictLimit = 200;
        for (let i = 0; i < districtRecords.length; i += batchDistrictLimit) {
          const chunk = districtRecords.slice(i, i + batchDistrictLimit);
          const batch = writeBatch(firestore);

          for (const record of chunk) {
            batch.set(doc(firestore, "meeting_districts", record.id), {
              meetingId,
              districtId: record.districtId,
            });
            batch.set(doc(firestore, "district_meeting_records", record.id), {
              meetingId: record.meetingId,
              districtId: record.districtId,
              districtName: record.districtName,
              meetingTitle: record.meetingTitle,
              month: record.month,
              meetingDate: record.meetingDate,
              status: record.status,
              notes: record.notes,
              activityReports: record.activityReports,
              customActivities: record.customActivities,
              nextMonthTasks: record.nextMonthTasks,
              attendanceCount: record.attendanceCount,
              attendees: record.attendees,
            });
          }

          await batch.commit();
        }

        const verificationSnap = await getDocs(query(collection(firestore, "district_meeting_records"), where("meetingId", "==", meetingId)));
        const createdDistrictIds = new Set(
          verificationSnap.docs.map((d) => {
            const data = d.data() as { districtId?: string };
            return data.districtId || "";
          }).filter(Boolean),
        );

        const missingDistrictRecords = districtIds.filter((districtId) => !createdDistrictIds.has(districtId));
        if (missingDistrictRecords.length > 0) {
          const recoveryBatch = writeBatch(firestore);
          for (const districtId of missingDistrictRecords) {
            const record = districtRecords.find((item) => item.districtId === districtId);
            if (!record) continue;
            recoveryBatch.set(doc(firestore, "district_meeting_records", record.id), {
              meetingId: record.meetingId,
              districtId: record.districtId,
              districtName: record.districtName,
              meetingTitle: record.meetingTitle,
              month: record.month,
              meetingDate: record.meetingDate,
              status: record.status,
              notes: record.notes,
              activityReports: record.activityReports,
              customActivities: record.customActivities,
              nextMonthTasks: record.nextMonthTasks,
              attendanceCount: record.attendanceCount,
              attendees: record.attendees,
            });
          }
          await recoveryBatch.commit();
        }
      } else {
        for (const record of districtRecords) {
          await enqueueFirestoreOperation({
            type: "set",
            collection: "meeting_districts",
            docId: record.id,
            data: {
              meetingId,
              districtId: record.districtId,
            },
          });

          await enqueueFirestoreOperation({
            type: "set",
            collection: "district_meeting_records",
            docId: record.id,
            data: {
              meetingId: record.meetingId,
              districtId: record.districtId,
              districtName: record.districtName,
              meetingTitle: record.meetingTitle,
              month: record.month,
              meetingDate: record.meetingDate,
              status: record.status,
              notes: record.notes,
              activityReports: record.activityReports,
              customActivities: record.customActivities,
              nextMonthTasks: record.nextMonthTasks,
              attendanceCount: record.attendanceCount,
              attendees: record.attendees,
            },
          });
        }
      }

      const cachedRecords = (await readCollectionCache<DistrictMeetingRecord>("district_meeting_records")) || [];
      const recordMap = new Map(cachedRecords.map((r) => [r.id, r]));
      for (const record of districtRecords) {
        recordMap.set(record.id, record as DistrictMeetingRecord);
      }
      await saveCollectionCache("district_meeting_records", Array.from(recordMap.values()));

      console.info("[useCreateMeeting] success", { meetingId });

      const meetingResult = {
        id: meetingId,
        title: payload.title,
        month: payload.month,
        meetingDate: payload.meetingDate,
        agenda: payload.agenda,
        notes: payload.notes || "",
        scope: payload.scope,
        scopeValue: payload.scopeValue,
        districtIds,
      } as Meeting;

      await appendCollectionCacheItem("meetings", meetingResult);

      return meetingResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["district_meeting_records"] });
    },
  });
}

// Tasks
export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => readCollection<Task>("tasks", "deadline"),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<Task, "id">) => {
      const id = doc(collection(firestore, "tasks")).id;
      if (isOnlineNow()) {
        await setDoc(doc(firestore, "tasks", id), task);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "tasks",
          docId: id,
          data: task,
        });
      }
      const row = { id, ...task } as Task;
      await appendCollectionCacheItem("tasks", row);
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useMarkaziTeamProfiles() {
  return useQuery({
    queryKey: ["markazi_team_profiles"],
    queryFn: async () => readCollection<MarkaziTeamProfile>("markazi_team_profiles", "name"),
  });
}

export function useCreateMarkaziTeamProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<MarkaziTeamProfile, "id" | "createdAt">) => {
      const id = doc(collection(firestore, "markazi_team_profiles")).id;
      const row = { ...payload, createdAt: new Date().toISOString() };
      if (isOnlineNow()) {
        await setDoc(doc(firestore, "markazi_team_profiles", id), row);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "markazi_team_profiles",
          docId: id,
          data: row,
        });
      }
      const result = { id, ...row } as MarkaziTeamProfile;
      await appendCollectionCacheItem("markazi_team_profiles", result);
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["markazi_team_profiles"] }),
  });
}

export function useUpdateMarkaziTeamProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarkaziTeamProfile> & { id: string }) => {
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "markazi_team_profiles", id), updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "markazi_team_profiles",
          docId: id,
          data: updates,
        });
      }
      const fresh = await readDocById<MarkaziTeamProfile>("markazi_team_profiles", id);
      if (!fresh) throw new Error("Markazi team profile not found after update.");
      return fresh;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["markazi_team_profiles"] }),
  });
}

export function useDeleteMarkaziTeamProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnlineNow()) {
        await deleteDoc(doc(firestore, "markazi_team_profiles", id));
      } else {
        await enqueueFirestoreOperation({
          type: "delete",
          collection: "markazi_team_profiles",
          docId: id,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["markazi_team_profiles"] }),
  });
}

// District Meeting Records
export function useDistrictMeetingRecords(meetingId?: string) {
  return useQuery({
    queryKey: ["district_meeting_records", meetingId],
    queryFn: async () => {
      const ref = collection(firestore, "district_meeting_records");
      try {
        const snap = meetingId
          ? await getDocs(query(ref, where("meetingId", "==", meetingId)))
          : await getDocs(ref);

        const rows = snap.docs.map((d) => {
          const row = toCamel(d.data()) as AnyObject;
          return {
            id: d.id,
            ...row,
            activityReports: Array.isArray(row.activityReports) ? row.activityReports : [],
            customActivities: Array.isArray(row.customActivities) ? row.customActivities : [],
            nextMonthTasks: Array.isArray(row.nextMonthTasks) ? row.nextMonthTasks : [],
            attendanceCount: typeof row.attendanceCount === "number" ? row.attendanceCount : 0,
            attendees: Array.isArray(row.attendees) ? row.attendees : [],
            mediaReport: row.mediaReport && typeof row.mediaReport === "object"
              ? {
                contentProduction: typeof (row.mediaReport as AnyObject).contentProduction === "number" ? (row.mediaReport as AnyObject).contentProduction as number : 0,
                reels: typeof (row.mediaReport as AnyObject).reels === "number" ? (row.mediaReport as AnyObject).reels as number : 0,
                mediaPosting: typeof (row.mediaReport as AnyObject).mediaPosting === "number" ? (row.mediaReport as AnyObject).mediaPosting as number : 0,
                hasFacebookPage: typeof (row.mediaReport as AnyObject).hasFacebookPage === "boolean" ? (row.mediaReport as AnyObject).hasFacebookPage as boolean : false,
                facebookFollowers: typeof (row.mediaReport as AnyObject).facebookFollowers === "number" ? (row.mediaReport as AnyObject).facebookFollowers as number : 0,
                postingFrequency: typeof (row.mediaReport as AnyObject).postingFrequency === "string"
                  ? ((row.mediaReport as AnyObject).postingFrequency as "Daily" | "Weekly" | "Monthly" | "Rarely")
                  : "Weekly",
              }
              : undefined,
          } as DistrictMeetingRecord;
        });

        await saveCollectionCache("district_meeting_records", rows);
        return rows;
      } catch {
        const cached = await readCollectionCache<DistrictMeetingRecord>("district_meeting_records");
        if (!cached) return [];
        return meetingId ? cached.filter((row) => row.meetingId === meetingId) : cached;
      }
    },
  });
}

export function useUpdateDistrictMeetingRecord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: "Empty" | "Completed";
      notes: string;
      attendance?: "Present" | "Absent" | "Late";
      attendanceCount: number;
      attendees: DistrictMeetingRecord["attendees"];
      mediaReport?: DistrictMeetingRecord["mediaReport"] | null;
      activityReports: DistrictMeetingRecord["activityReports"];
      customActivities: DistrictMeetingRecord["customActivities"];
      nextMonthTasks: DistrictMeetingRecord["nextMonthTasks"];
      updatedAt: string;
    }) => {
      const { id, ...updates } = payload;
      const firestoreUpdates: Record<string, unknown> = { ...updates };
      if (updates.mediaReport === null) {
        firestoreUpdates.mediaReport = deleteField();
      }

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "district_meeting_records", id), firestoreUpdates, { merge: true });
      } else {
        const offlineUpdates = { ...updates } as Record<string, unknown>;
        if (updates.mediaReport === null) {
          delete offlineUpdates.mediaReport;
        }

        await enqueueFirestoreOperation({
          type: "set",
          collection: "district_meeting_records",
          docId: id,
          data: offlineUpdates,
          merge: true,
        });
      }

      await appendCollectionCacheItem("district_meeting_records", {
        id,
        ...(updates as Record<string, unknown>),
        ...(updates.mediaReport === null ? { mediaReport: undefined } : {}),
      } as DistrictMeetingRecord);

      const fresh = await readDocById<DistrictMeetingRecord>("district_meeting_records", id);
      if (!fresh) {
        return {
          id,
          ...(updates as Record<string, unknown>),
        } as DistrictMeetingRecord;
      }
      return fresh;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["district_meeting_records"] });
    },
  });
}

// Universities
export function useUniversities() {
  return useQuery({
    queryKey: ["universities"],
    queryFn: async () => readCollection<University>("universities", "name"),
  });
}

export function useUniversityCoordinators() {
  return useQuery({
    queryKey: ["university_coordinators"],
    queryFn: async () => readCollection<UniversityCoordinator>("university_coordinators", "name"),
  });
}

export function useCreateUniversityCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coord: Omit<UniversityCoordinator, "id">) => {
      const id = doc(collection(firestore, "university_coordinators")).id;
      const row = { id, ...coord } as UniversityCoordinator;

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "university_coordinators", id), coord);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "university_coordinators",
          docId: id,
          data: coord,
        });
      }

      await appendCollectionCacheItem("university_coordinators", row);
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["university_coordinators"] }),
  });
}

export function useUpdateUniversityCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UniversityCoordinator> & { id: string }) => {
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "university_coordinators", id), updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "university_coordinators",
          docId: id,
          data: updates,
        });
      }

      const fresh = await readDocById<UniversityCoordinator>("university_coordinators", id);
      if (!fresh) throw new Error("University coordinator not found after update.");
      return fresh;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["university_coordinators"] }),
  });
}

export function useDeleteUniversityCoordinator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnlineNow()) {
        await deleteDoc(doc(firestore, "university_coordinators", id));
      } else {
        await enqueueFirestoreOperation({
          type: "delete",
          collection: "university_coordinators",
          docId: id,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["university_coordinators"] }),
  });
}

export function useUniversityGoals() {
  return useQuery({
    queryKey: ["university_goals"],
    queryFn: async () => readCollection<UniversityGoal>("university_goals", "month", "desc"),
  });
}

export function useCreateUniversityGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Omit<UniversityGoal, "id">) => {
      const id = doc(collection(firestore, "university_goals")).id;

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "university_goals", id), goal);
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "university_goals",
          docId: id,
          data: goal,
        });
      }

      const row = { id, ...goal } as UniversityGoal;
      await appendCollectionCacheItem("university_goals", row);
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["university_goals"] });
      qc.invalidateQueries({ queryKey: ["university_meeting_records"] });
    },
  });
}

export function useUpdateUniversityGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UniversityGoal> & { id: string }) => {
      if (isOnlineNow()) {
        await updateDoc(doc(firestore, "university_goals", id), updates);
      } else {
        await enqueueFirestoreOperation({
          type: "update",
          collection: "university_goals",
          docId: id,
          data: updates,
        });
      }

      const fresh = await readDocById<UniversityGoal>("university_goals", id);
      if (!fresh) throw new Error("University campaign not found after update.");
      return fresh;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["university_goals"] });
      qc.invalidateQueries({ queryKey: ["university_meeting_records"] });
    },
  });
}

export function useDeleteUniversityGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnlineNow()) {
        await deleteDoc(doc(firestore, "university_goals", id));
      } else {
        await enqueueFirestoreOperation({
          type: "delete",
          collection: "university_goals",
          docId: id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["university_goals"] });
    },
  });
}

export function useUniversityTasks() {
  return useQuery({
    queryKey: ["university_tasks"],
    queryFn: async () => readCollection<UniversityTask>("university_tasks", "deadline"),
  });
}

export function useUniversityMeetings() {
  return useQuery({
    queryKey: ["university_meetings"],
    queryFn: async () => {
      const rows = await readCollection<UniversityMeeting>("university_meetings", "meetingDate", "desc");
      return rows.map((m) => ({
        ...m,
        universityIds: Array.isArray((m as { universityIds?: unknown }).universityIds)
          ? ((m as { universityIds?: string[] }).universityIds || [])
          : [],
      }));
    },
  });
}

export function useUniversityMeetingRecords(meetingId?: string) {
  return useQuery({
    queryKey: ["university_meeting_records", meetingId],
    queryFn: async () => {
      const ref = collection(firestore, "university_meeting_records");
      try {
        const snap = meetingId
          ? await getDocs(query(ref, where("meetingId", "==", meetingId)))
          : await getDocs(ref);

        const rows = snap.docs.map((d) => {
          const row = toCamel(d.data()) as AnyObject;
          return {
            id: d.id,
            ...row,
            activityReports: Array.isArray(row.activityReports) ? row.activityReports : [],
            customActivities: Array.isArray(row.customActivities) ? row.customActivities : [],
            nextMonthTasks: Array.isArray(row.nextMonthTasks) ? row.nextMonthTasks : [],
            attendanceCount: typeof row.attendanceCount === "number" ? row.attendanceCount : 0,
            attendees: Array.isArray(row.attendees) ? row.attendees : [],
          } as UniversityMeetingRecord;
        });

        await saveCollectionCache("university_meeting_records", rows);
        return rows;
      } catch {
        const cached = await readCollectionCache<UniversityMeetingRecord>("university_meeting_records");
        if (!cached) return [];
        return meetingId ? cached.filter((row) => row.meetingId === meetingId) : cached;
      }
    },
  });
}

export function useUpdateUniversityMeetingRecord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: "Empty" | "Completed";
      notes: string;
      attendance?: "Present" | "Absent" | "Late";
      attendanceCount: number;
      attendees: UniversityMeetingRecord["attendees"];
      activityReports: UniversityMeetingRecord["activityReports"];
      customActivities: UniversityMeetingRecord["customActivities"];
      nextMonthTasks: UniversityMeetingRecord["nextMonthTasks"];
      updatedAt: string;
    }) => {
      const { id, ...updates } = payload;

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "university_meeting_records", id), updates, { merge: true });
      } else {
        await enqueueFirestoreOperation({
          type: "set",
          collection: "university_meeting_records",
          docId: id,
          data: updates,
          merge: true,
        });
      }

      await appendCollectionCacheItem("university_meeting_records", {
        id,
        ...(updates as Record<string, unknown>),
      } as UniversityMeetingRecord);

      const fresh = await readDocById<UniversityMeetingRecord>("university_meeting_records", id);
      if (!fresh) {
        return {
          id,
          ...(updates as Record<string, unknown>),
        } as UniversityMeetingRecord;
      }
      return fresh;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["university_meeting_records"] });
      qc.invalidateQueries({ queryKey: ["university_goals"] });
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
      const id = doc(collection(firestore, "university_meetings")).id;
      const row = {
        title: payload.title,
        month: payload.month,
        meetingDate: payload.meetingDate,
        agenda: payload.agenda,
        notes: payload.notes || "",
        scope: payload.scope,
        universityIds: payload.universityIds,
      };

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "university_meetings", id), row);
      } else {
        await enqueueFirestoreOperation({ type: "set", collection: "university_meetings", docId: id, data: row });
      }

      const allUniversities = await readCollection<University>("universities", "name");
      const uniNameById = new Map(allUniversities.map((u) => [u.id, u.name]));
      const universityRecords = payload.universityIds.map((universityId) => {
        const recordId = `${id}_${universityId}`;
        return {
          id: recordId,
          meetingId: id,
          universityId,
          universityName: uniNameById.get(universityId) || "Unknown University",
          meetingTitle: payload.title,
          month: payload.month,
          meetingDate: payload.meetingDate,
          status: "Empty" as const,
          notes: "",
          activityReports: [],
          customActivities: [],
          nextMonthTasks: [],
          attendanceCount: 0,
          attendees: [],
        };
      });

      for (const universityId of payload.universityIds) {
        const linkId = `${id}_${universityId}`;
        const linkRow = { meetingId: id, universityId };
        if (isOnlineNow()) {
          await setDoc(doc(firestore, "university_meeting_links", linkId), linkRow);
        } else {
          await enqueueFirestoreOperation({ type: "set", collection: "university_meeting_links", docId: linkId, data: linkRow });
        }
      }

      for (const record of universityRecords) {
        if (isOnlineNow()) {
          await setDoc(doc(firestore, "university_meeting_records", record.id), {
            meetingId: record.meetingId,
            universityId: record.universityId,
            universityName: record.universityName,
            meetingTitle: record.meetingTitle,
            month: record.month,
            meetingDate: record.meetingDate,
            status: record.status,
            notes: record.notes,
            activityReports: record.activityReports,
            customActivities: record.customActivities,
            nextMonthTasks: record.nextMonthTasks,
            attendanceCount: record.attendanceCount,
            attendees: record.attendees,
          });
        } else {
          await enqueueFirestoreOperation({
            type: "set",
            collection: "university_meeting_records",
            docId: record.id,
            data: {
              meetingId: record.meetingId,
              universityId: record.universityId,
              universityName: record.universityName,
              meetingTitle: record.meetingTitle,
              month: record.month,
              meetingDate: record.meetingDate,
              status: record.status,
              notes: record.notes,
              activityReports: record.activityReports,
              customActivities: record.customActivities,
              nextMonthTasks: record.nextMonthTasks,
              attendanceCount: record.attendanceCount,
              attendees: record.attendees,
            },
          });
        }
      }

      const cachedRecords = (await readCollectionCache<UniversityMeetingRecord>("university_meeting_records")) || [];
      const recordMap = new Map(cachedRecords.map((r) => [r.id, r]));
      for (const rowRecord of universityRecords) {
        recordMap.set(rowRecord.id, rowRecord as UniversityMeetingRecord);
      }
      await saveCollectionCache("university_meeting_records", Array.from(recordMap.values()));

      const result = { id, ...payload } as UniversityMeeting;
      await appendCollectionCacheItem("university_meetings", result);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["university_meetings"] });
      qc.invalidateQueries({ queryKey: ["university_meeting_records"] });
    },
  });
}

// Madadgar Teams
export function useMadadgarTeams() {
  return useQuery({
    queryKey: ["madadgar_teams"],
    queryFn: async () => readCollection<MadadgarTeam>("madadgar_teams", "name"),
  });
}

export function useMadadgarCoordinators() {
  return useQuery({
    queryKey: ["madadgar_coordinators"],
    queryFn: async () => readCollection<MadadgarCoordinator>("madadgar_coordinators", "name"),
  });
}

export function useMadadgarGoals() {
  return useQuery({
    queryKey: ["madadgar_goals"],
    queryFn: async () => readCollection<MadadgarGoal>("madadgar_goals", "month", "desc"),
  });
}

export function useMadadgarTasks() {
  return useQuery({
    queryKey: ["madadgar_tasks"],
    queryFn: async () => readCollection<MadadgarTask>("madadgar_tasks", "deadline"),
  });
}

export function useMadadgarMeetings() {
  return useQuery({
    queryKey: ["madadgar_meetings"],
    queryFn: async () => {
      const rows = await readCollection<MadadgarMeeting>("madadgar_meetings", "meetingDate", "desc");
      return rows.map((m) => ({
        ...m,
        teamIds: Array.isArray((m as { teamIds?: unknown }).teamIds)
          ? ((m as { teamIds?: string[] }).teamIds || [])
          : [],
      }));
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
      const id = doc(collection(firestore, "madadgar_meetings")).id;
      const row = {
        title: payload.title,
        month: payload.month,
        meetingDate: payload.meetingDate,
        agenda: payload.agenda,
        notes: payload.notes || "",
        scope: payload.scope,
        teamIds: payload.teamIds,
      };

      if (isOnlineNow()) {
        await setDoc(doc(firestore, "madadgar_meetings", id), row);
      } else {
        await enqueueFirestoreOperation({ type: "set", collection: "madadgar_meetings", docId: id, data: row });
      }

      for (const teamId of payload.teamIds) {
        const linkId = `${id}_${teamId}`;
        const linkRow = { meetingId: id, teamId };
        if (isOnlineNow()) {
          await setDoc(doc(firestore, "madadgar_meeting_links", linkId), linkRow);
        } else {
          await enqueueFirestoreOperation({ type: "set", collection: "madadgar_meeting_links", docId: linkId, data: linkRow });
        }
      }

      const result = { id, ...payload } as MadadgarMeeting;
      await appendCollectionCacheItem("madadgar_meetings", result);
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["madadgar_meetings"] }),
  });
}

// President Schedules
export function usePresidentSchedules() {
  return useQuery({
    queryKey: ["president_schedules"],
    queryFn: async () => readCollection<PresidentSchedule>("president_schedules", "scheduleDate"),
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
      const row: AnyObject = {
        title: payload.title,
        description: payload.description || "",
        frequency: payload.frequency,
        scheduleDate: payload.scheduleDate,
        targetType: payload.targetType,
        targetName: payload.targetName,
        zoneId: null,
        districtId: null,
        universityId: null,
        status: "Active",
        createdBy: payload.createdBy || null,
        createdAt: new Date().toISOString(),
      };

      if (payload.targetType === "Zone") row.zoneId = payload.targetId;
      if (payload.targetType === "District") row.districtId = payload.targetId;
      if (payload.targetType === "University") row.universityId = payload.targetId;

      const id = doc(collection(firestore, "president_schedules")).id;
      if (isOnlineNow()) {
        await setDoc(doc(firestore, "president_schedules", id), row);
      } else {
        await enqueueFirestoreOperation({ type: "set", collection: "president_schedules", docId: id, data: row });
      }

      const result = { id, ...row } as PresidentSchedule;
      await appendCollectionCacheItem("president_schedules", result);
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["president_schedules"] }),
  });
}

// Loading component
export function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted animate-pulse opacity-60" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-muted animate-pulse" style={{ animationDelay: "120ms" }} />
        <div className="h-64 rounded-xl bg-muted animate-pulse" style={{ animationDelay: "180ms" }} />
      </div>

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
