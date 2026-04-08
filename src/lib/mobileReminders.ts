import type { PresidentSchedule, Task } from "@/types";

const REMINDER_PREF_KEY = "msl-mobile-reminders-enabled";
const TASK_ID_PREFIX = 101000000;
const SCHEDULE_ID_PREFIX = 202000000;
const REMINDER_WINDOW_DAYS = 45;

let lastSyncSignature = "";

function isReminderEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(REMINDER_PREF_KEY) !== "false";
}

function makeDateAt(dateValue: string, hour: number, minute: number) {
  const [y, m, d] = dateValue.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hour, minute, 0, 0);
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function makeNotificationId(prefix: number, key: string) {
  return prefix + (hashString(key) % 90000000);
}

async function canUseNativeNotifications() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function clearManagedNotifications() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const pending = await LocalNotifications.getPending();
  const managedIds = pending.notifications
    .map((n) => n.id)
    .filter((id) => (id >= TASK_ID_PREFIX && id < TASK_ID_PREFIX + 90000000)
      || (id >= SCHEDULE_ID_PREFIX && id < SCHEDULE_ID_PREFIX + 90000000));

  if (managedIds.length > 0) {
    await LocalNotifications.cancel({ notifications: managedIds.map((id) => ({ id })) });
  }
}

export async function getNotificationPermissionState() {
  if (!(await canUseNativeNotifications())) return false;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const status = await LocalNotifications.checkPermissions();
  return status.display === "granted";
}

export async function ensureNotificationPermissions() {
  if (!(await canUseNativeNotifications())) return false;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const status = await LocalNotifications.checkPermissions();
  if (status.display === "granted") return true;

  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

export function setReminderPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMINDER_PREF_KEY, enabled ? "true" : "false");
}

export async function syncMobileReminders(tasks: Task[], schedules: PresidentSchedule[]) {
  if (!(await canUseNativeNotifications())) return;

  const { LocalNotifications } = await import("@capacitor/local-notifications");

  if (!isReminderEnabled()) {
    await clearManagedNotifications();
    return;
  }

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await LocalNotifications.createChannel({
    id: "msl-reminders",
    name: "MSL Reminders",
    description: "Task and schedule reminders",
    importance: 4,
    vibration: true,
    sound: "default",
  });

  const now = new Date();
  const maxDate = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const taskReminders = tasks
    .filter((task) => task.status !== "Completed")
    .map((task) => {
      const remindAt = makeDateAt(task.deadline, 9, 0);
      remindAt.setDate(remindAt.getDate() - 1);

      return {
        id: makeNotificationId(TASK_ID_PREFIX, task.id),
        title: "Task Reminder",
        body: `${task.title} is due on ${task.deadline}.`,
        scheduleAt: remindAt,
      };
    })
    .filter((item) => item.scheduleAt > now && item.scheduleAt < maxDate);

  const scheduleReminders = schedules
    .filter((schedule) => schedule.status === "Active")
    .map((schedule) => ({
      id: makeNotificationId(SCHEDULE_ID_PREFIX, schedule.id),
      title: "President Schedule Reminder",
      body: `${schedule.title} for ${schedule.targetName} (${schedule.frequency}).`,
      scheduleAt: makeDateAt(schedule.scheduleDate, 8, 30),
    }))
    .filter((item) => item.scheduleAt > now && item.scheduleAt < maxDate);

  const reminderSignature = JSON.stringify({
    tasks: taskReminders.map((item) => `${item.id}:${item.scheduleAt.toISOString()}`),
    schedules: scheduleReminders.map((item) => `${item.id}:${item.scheduleAt.toISOString()}`),
  });

  if (reminderSignature === lastSyncSignature) return;
  lastSyncSignature = reminderSignature;

  await clearManagedNotifications();

  const reminders = [...taskReminders, ...scheduleReminders];
  if (reminders.length === 0) return;

  await LocalNotifications.schedule({
    notifications: reminders.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      schedule: { at: item.scheduleAt, allowWhileIdle: true },
      sound: "default",
      channelId: "msl-reminders",
    })),
  });
}
