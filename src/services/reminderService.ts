import {
  AttendanceReminderSettings,
  AttendanceReminderLog,
  PushDeviceRegistration,
  AttendanceCorrectionRequest,
  ReminderIntervalMinutes,
  AttendanceAuditLog,
  ReminderType,
} from "../types/laborRoster";
import { Worker, AttendanceRecord, Project } from "../types";

const STORAGE_KEY_SETTINGS = "infrasync_reminder_settings";
const STORAGE_KEY_LOGS = "infrasync_reminder_logs";
const STORAGE_KEY_DEVICES = "infrasync_push_devices";
const STORAGE_KEY_CORRECTIONS = "infrasync_attendance_corrections";
const STORAGE_KEY_AUDIT = "infrasync_attendance_audit_logs";

export function getDefaultReminderSettings(projectId: string = "proj-101"): AttendanceReminderSettings {
  return {
    id: `set-${projectId}`,
    projectId,
    intervalMinutes: 15, // 10, 15 (default), 20
    checkInEnabled: true,
    checkOutEnabled: true,
    gracePeriodMinutes: 10, // 5, 10, 15 (default 10)
    maxReminders: 6, // default 6
    enabled: true,
    notifySupervisorOnMaxReached: true,
    supervisorPhone: "+91 98999 11223",
    supervisorName: "Gurpreet Singh (Site Lead)",
    createdBy: "System Admin",
    updatedAt: new Date().toISOString(),
  };
}

export function getInitialPushDevices(): PushDeviceRegistration[] {
  return [
    {
      id: "dev-w1",
      workerId: "w-1",
      workerName: "Ramesh Yadav",
      phone: "+91 98111 22334",
      deviceToken: "fcm-token-ramesh-android-98111",
      platform: "android",
      browser: "Chrome Mobile 128 (Android 14)",
      enabled: true,
      lastSeenAt: "2026-09-03T08:15:00.000Z",
      createdAt: "2026-08-10T10:00:00.000Z",
      updatedAt: "2026-09-03T08:15:00.000Z",
    },
    {
      id: "dev-w2",
      workerId: "w-2",
      workerName: "Dharmendra Kumar",
      phone: "+91 98222 33445",
      deviceToken: "fcm-token-dharmendra-android-98222",
      platform: "android",
      browser: "Samsung Internet 24 (Android 13)",
      enabled: true,
      lastSeenAt: "2026-09-03T08:20:00.000Z",
      createdAt: "2026-08-12T11:00:00.000Z",
      updatedAt: "2026-09-03T08:20:00.000Z",
    },
    {
      id: "dev-w3",
      workerId: "w-3",
      workerName: "Sanjay Mondal",
      phone: "+91 98333 44556",
      deviceToken: "fcm-token-sanjay-pwa-98333",
      platform: "web_pwa",
      browser: "PWA Standalone (Android 14)",
      enabled: true,
      lastSeenAt: "2026-09-03T08:10:00.000Z",
      createdAt: "2026-08-15T09:30:00.000Z",
      updatedAt: "2026-09-03T08:10:00.000Z",
    },
    {
      id: "dev-w4",
      workerId: "w-4",
      workerName: "Babulal Suthar",
      phone: "+91 98444 55667",
      deviceToken: "fcm-token-babulal-android-98444",
      platform: "android",
      browser: "Chrome Mobile 127",
      enabled: true,
      lastSeenAt: "2026-09-03T07:55:00.000Z",
      createdAt: "2026-08-18T14:00:00.000Z",
      updatedAt: "2026-09-03T07:55:00.000Z",
    },
    {
      id: "dev-w5",
      workerId: "w-5",
      workerName: "Mustaq Ali",
      phone: "+91 98555 66778",
      deviceToken: "fcm-token-mustaq-android-98555",
      platform: "android",
      browser: "Chrome Mobile 126",
      enabled: false,
      lastSeenAt: "2026-09-02T19:00:00.000Z",
      createdAt: "2026-08-20T16:00:00.000Z",
      updatedAt: "2026-09-02T19:00:00.000Z",
    },
    {
      id: "dev-w6",
      workerId: "w-6",
      workerName: "Kishore Jena",
      phone: "+91 98666 77889",
      deviceToken: "fcm-token-kishore-ios-98666",
      platform: "ios",
      browser: "Safari Mobile 17.5 (iOS 17)",
      enabled: true,
      lastSeenAt: "2026-09-03T08:00:00.000Z",
      createdAt: "2026-08-22T08:00:00.000Z",
      updatedAt: "2026-09-03T08:00:00.000Z",
    },
    {
      id: "dev-w8",
      workerId: "w-8",
      workerName: "Vikram Chauhan",
      phone: "+91 98888 99001",
      deviceToken: "fcm-token-vikram-android-98888",
      platform: "android",
      browser: "Chrome Mobile 128",
      enabled: true,
      lastSeenAt: "2026-09-03T08:30:00.000Z",
      createdAt: "2026-08-25T11:00:00.000Z",
      updatedAt: "2026-09-03T08:30:00.000Z",
    },
  ];
}

export function getInitialReminderLogs(): AttendanceReminderLog[] {
  return [
    {
      id: "rem-log-101",
      workerId: "w-2",
      workerName: "Dharmendra Kumar",
      workerPhone: "+91 98222 33445",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      reminderType: "CHECK_IN",
      scheduledAt: "2026-09-03T08:15:00.000Z",
      sentAt: "2026-09-03T08:15:02.000Z",
      status: "Delivered",
      attemptCount: 1,
      title: "🔔 InfraMate Attendance Reminder",
      message: "You haven't checked in yet.\nYour shift started at 08:00 AM.\nOpen InfraMate to mark your attendance.",
      actionUrl: "/?tab=labor&subtab=attendance",
      createdAt: "2026-09-03T08:15:00.000Z",
    },
    {
      id: "rem-log-102",
      workerId: "w-2",
      workerName: "Dharmendra Kumar",
      workerPhone: "+91 98222 33445",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      reminderType: "CHECK_IN",
      scheduledAt: "2026-09-03T08:30:00.000Z",
      sentAt: "2026-09-03T08:30:01.000Z",
      status: "Delivered",
      attemptCount: 2,
      title: "🔔 InfraMate Attendance Reminder",
      message: "You haven't checked in yet.\nYour shift started at 08:00 AM.\nOpen InfraMate to mark your attendance.",
      actionUrl: "/?tab=labor&subtab=attendance",
      createdAt: "2026-09-03T08:30:00.000Z",
    },
    {
      id: "rem-log-103",
      workerId: "w-8",
      workerName: "Vikram Chauhan",
      workerPhone: "+91 98888 99001",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      reminderType: "CHECK_IN",
      scheduledAt: "2026-09-03T08:15:00.000Z",
      sentAt: "2026-09-03T08:15:02.000Z",
      status: "Delivered",
      attemptCount: 1,
      title: "🔔 InfraMate Attendance Reminder",
      message: "You haven't checked in yet.\nYour shift started at 08:00 AM.\nOpen InfraMate to mark your attendance.",
      actionUrl: "/?tab=labor&subtab=attendance",
      createdAt: "2026-09-03T08:15:00.000Z",
    },
  ];
}

export function getInitialCorrections(): AttendanceCorrectionRequest[] {
  return [
    {
      id: "cor-101",
      workerId: "w-4",
      workerName: "Babulal Suthar",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      date: "2026-09-02",
      issue: "Check-in biometric scanner delay",
      expectedCheckIn: "08:05 AM",
      expectedCheckOut: "05:15 PM",
      reason: "Device scanner at Site B had a brief network glitch, but was on site at 08:05 AM.",
      status: "Pending",
      requestedAt: "2026-09-02T18:30:00.000Z",
    },
  ];
}

class ReminderService {
  /**
   * Get settings for a project
   */
  getSettings(projectId: string = "proj-101"): AttendanceReminderSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.projectId === projectId || parsed.id === `set-${projectId}`) {
          return parsed;
        }
      }
      const initial = getDefaultReminderSettings(projectId);
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(initial));
      return initial;
    } catch {
      return getDefaultReminderSettings(projectId);
    }
  }

  /**
   * Save settings (Contractor / Admin only)
   */
  saveSettings(
    settings: AttendanceReminderSettings,
    actorName: string = "Contractor"
  ): AttendanceReminderSettings {
    const updated: AttendanceReminderSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));

    this.logAudit({
      user: actorName,
      action: "Reminder Interval Changed",
      entity: "Settings",
      entityId: settings.id,
      details: `Updated reminder interval to ${settings.intervalMinutes} minutes (Grace period: ${settings.gracePeriodMinutes}m, Max: ${settings.maxReminders}).`,
    });

    // Sync to backend if online
    try {
      fetch("/api/reminders/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => {});
    } catch {}

    return updated;
  }

  /**
   * Get all registered push devices
   */
  getPushDevices(): PushDeviceRegistration[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DEVICES);
      let list: PushDeviceRegistration[] = raw ? JSON.parse(raw) : getInitialPushDevices();
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(list));
      }
      return list;
    } catch {
      return getInitialPushDevices();
    }
  }

  getRegisteredDevices(): PushDeviceRegistration[] {
    return this.getPushDevices();
  }

  /**
   * Check if a worker has smartphone notifications enabled
   */
  isWorkerPushEnabled(workerId: string): boolean {
    const devices = this.getPushDevices();
    const dev = devices.find((d) => d.workerId === workerId);
    return dev ? dev.enabled : false;
  }

  /**
   * Register or toggle push notification for a worker smartphone
   */
  async registerPushDevice(worker: {
    id: string;
    name: string;
    phone?: string;
  }): Promise<{ success: boolean; device: PushDeviceRegistration; error?: string }> {
    let platform: "android" | "ios" | "web_pwa" | "browser" = "browser";
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) platform = "android";
    else if (ua.includes("iphone") || ua.includes("ipad")) platform = "ios";

    // Request native browser permission
    let hasNativePerm = false;
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        hasNativePerm = perm === "granted";
      } catch {
        hasNativePerm = false;
      }
    }

    const all = this.getPushDevices();
    const existingIdx = all.findIndex((d) => d.workerId === worker.id);

    const deviceToken = `infrasync-push-${worker.id}-${Math.random().toString(36).substring(2, 10)}`;

    const devRecord: PushDeviceRegistration = {
      id: existingIdx >= 0 ? all[existingIdx].id : `dev-${worker.id}`,
      workerId: worker.id,
      workerName: worker.name,
      phone: worker.phone,
      deviceToken,
      platform,
      browser: `${navigator.userAgent.substring(0, 45)}...`,
      enabled: true,
      lastSeenAt: new Date().toISOString(),
      createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      all[existingIdx] = devRecord;
    } else {
      all.push(devRecord);
    }

    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(all));

    this.logAudit({
      user: worker.name,
      action: "Push Device Registered",
      entity: "Device",
      entityId: devRecord.id,
      details: `Smartphone push notifications enabled for ${worker.name} (${platform})`,
    });

    // Register on backend
    try {
      fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(devRecord),
      }).catch(() => {});
    } catch {}

    return { success: true, device: devRecord };
  }

  /**
   * Toggle smartphone push notifications for a worker
   */
  toggleDevicePush(workerId: string, enabled: boolean): boolean {
    const all = this.getPushDevices();
    const dev = all.find((d) => d.workerId === workerId);
    if (dev) {
      dev.enabled = enabled;
      dev.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(all));
      return true;
    }
    return false;
  }

  /**
   * Get reminder logs
   */
  getReminderLogs(projectId?: string): AttendanceReminderLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOGS);
      let list: AttendanceReminderLog[] = raw ? JSON.parse(raw) : getInitialReminderLogs();
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(list));
      }
      if (projectId) {
        list = list.filter((l) => l.projectId === projectId);
      }
      return list;
    } catch {
      return getInitialReminderLogs();
    }
  }

  /**
   * Dispatch push notification to a worker's smartphone
   */
  async sendPushNotification(payload: {
    workerId: string;
    workerName: string;
    workerPhone?: string;
    projectId: string;
    projectName: string;
    title: string;
    message: string;
    reminderType: ReminderType;
    url?: string;
  }): Promise<AttendanceReminderLog> {
    const log: AttendanceReminderLog = {
      id: `rem-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workerId: payload.workerId,
      workerName: payload.workerName,
      workerPhone: payload.workerPhone,
      projectId: payload.projectId,
      projectName: payload.projectName,
      reminderType: payload.reminderType,
      scheduledAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: "Delivered",
      attemptCount: 1,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.url || "/?tab=labor&subtab=attendance",
      createdAt: new Date().toISOString(),
    };

    // Store log locally
    const logs = this.getReminderLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 500)));

    // Trigger local Web Notification if supported & permitted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(payload.title, {
              body: payload.message,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              tag: `infrasync-${payload.workerId}-${Date.now()}`,
              renotify: true,
              data: {
                url: payload.url || "/?tab=labor&subtab=attendance",
                workerId: payload.workerId,
              },
            } as any);
          });
        } else {
          new Notification(payload.title, {
            body: payload.message,
            icon: "/favicon.ico",
          });
        }
      } catch (e) {
        console.warn("Could not display native notification:", e);
      }
    }

    // Call backend push proxy
    try {
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      }).catch(() => {});
    } catch {}

    return log;
  }

  /**
   * Run server-style reminder check evaluation across all rosters and attendance
   */
  evaluateAndProcessReminders(
    project: Project,
    workers: Worker[],
    attendance: AttendanceRecord[],
    rosters: any[],
    customNow?: Date
  ): {
    evaluatedCount: number;
    remindersSent: number;
    supervisorAlertsSent: number;
    logs: AttendanceReminderLog[];
  } {
    const settings = this.getSettings(project.id);
    if (!settings.enabled) {
      return { evaluatedCount: 0, remindersSent: 0, supervisorAlertsSent: 0, logs: [] };
    }

    const now = customNow || new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const existingLogs = this.getReminderLogs(project.id);
    const todayLogs = existingLogs.filter((l) => l.createdAt.startsWith(todayStr));

    let remindersSent = 0;
    let supervisorAlertsSent = 0;
    const generatedLogs: AttendanceReminderLog[] = [];

    // Evaluate for each worker
    workers.forEach((worker) => {
      // 1. Smart gate: Worker must be active
      if (worker.status !== "active") return;

      // 2. Worker must be assigned to project
      if (worker.projectId !== project.id) return;

      // 3. Find published roster for today
      const roster = rosters.find(
        (r) => r.workerId === worker.id && r.date === todayStr && r.status === "Published"
      );
      if (!roster) return;

      // 4. Smart gate: Not on leave or OFF
      if (roster.shift === "OFF" || roster.shift === "Leave") return;

      // 5. Check attendance record for today
      const attRecord = attendance.find(
        (a) => a.workerId === worker.id && (a.date === todayStr || a.attendanceDate === todayStr)
      );

      // --- CHECK-IN REMINDER LOGIC ---
      if (settings.checkInEnabled && (!attRecord || !attRecord.checkIn)) {
        // Parse start time e.g. "08:00 AM"
        const startMinutes = this.parseTimeToMinutes(roster.startTime);
        if (startMinutes !== null) {
          // Check if shift start time (plus grace period) has arrived
          const shiftStartThreshold = startMinutes + settings.gracePeriodMinutes;

          // Worker's reminders sent today for Check-in
          const workerCheckInLogs = todayLogs.filter(
            (l) => l.workerId === worker.id && l.reminderType === "CHECK_IN"
          );
          const attemptCount = workerCheckInLogs.length;

          // Check if max limit reached
          if (attemptCount >= settings.maxReminders) {
            // Check if supervisor alert already sent
            const supervisorAlertSent = todayLogs.some(
              (l) => l.workerId === worker.id && l.reminderType === "SUPERVISOR_ALERT"
            );

            if (!supervisorAlertSent && settings.notifySupervisorOnMaxReached) {
              const supLog: AttendanceReminderLog = {
                id: `rem-sup-${Date.now()}-${worker.id}`,
                workerId: worker.id,
                workerName: worker.name,
                workerPhone: worker.phone,
                projectId: project.id,
                projectName: project.name,
                reminderType: "SUPERVISOR_ALERT",
                scheduledAt: now.toISOString(),
                sentAt: now.toISOString(),
                status: "Delivered",
                attemptCount: attemptCount + 1,
                title: "⚠️ Attendance Alert: Missing Check-In",
                message: `${worker.name} (${worker.role}) has not checked in for today's ${roster.startTime} shift despite ${attemptCount} automated smartphone reminders.`,
                actionUrl: "/?tab=labor&subtab=attendance",
                createdAt: now.toISOString(),
              };
              generatedLogs.push(supLog);
              existingLogs.unshift(supLog);
              supervisorAlertsSent++;
            }
            return;
          }

          // Check if due for next reminder
          let isDue = false;
          if (attemptCount === 0) {
            // First reminder after shift start threshold
            isDue = currentTimeMinutes >= shiftStartThreshold;
          } else {
            // Subsequent reminders at configured interval (10, 15, or 20 min)
            const lastLog = workerCheckInLogs[0]; // most recent
            const lastSentTime = new Date(lastLog.sentAt || lastLog.createdAt).getTime();
            const elapsedMinutes = (now.getTime() - lastSentTime) / (1000 * 60);
            isDue = elapsedMinutes >= settings.intervalMinutes;
          }

          if (isDue) {
            const remLog: AttendanceReminderLog = {
              id: `rem-log-${Date.now()}-${worker.id}-${attemptCount + 1}`,
              workerId: worker.id,
              workerName: worker.name,
              workerPhone: worker.phone,
              projectId: project.id,
              projectName: project.name,
              rosterId: roster.id,
              reminderType: "CHECK_IN",
              scheduledAt: now.toISOString(),
              sentAt: now.toISOString(),
              status: "Delivered",
              attemptCount: attemptCount + 1,
              title: "🔔 InfraMate Attendance Reminder",
              message: `You haven't checked in yet.\nYour shift started at ${roster.startTime}.\nOpen InfraMate to mark your attendance.`,
              actionUrl: "/?tab=labor&subtab=attendance",
              createdAt: now.toISOString(),
            };

            generatedLogs.push(remLog);
            existingLogs.unshift(remLog);
            remindersSent++;

            // Trigger local push notification
            this.sendPushNotification({
              workerId: worker.id,
              workerName: worker.name,
              workerPhone: worker.phone,
              projectId: project.id,
              projectName: project.name,
              title: remLog.title,
              message: remLog.message,
              reminderType: "CHECK_IN",
              url: "/?tab=labor&subtab=attendance",
            });
          }
        }
      }

      // --- CHECK-OUT REMINDER LOGIC ---
      if (settings.checkOutEnabled && attRecord && attRecord.checkIn && !attRecord.checkOut) {
        const endMinutes = this.parseTimeToMinutes(roster.endTime);
        if (endMinutes !== null) {
          // If shift end has arrived
          if (currentTimeMinutes >= endMinutes) {
            const workerCheckOutLogs = todayLogs.filter(
              (l) => l.workerId === worker.id && l.reminderType === "CHECK_OUT"
            );
            const attemptCount = workerCheckOutLogs.length;

            if (attemptCount < settings.maxReminders) {
              let isDue = false;
              if (attemptCount === 0) {
                isDue = true;
              } else {
                const lastLog = workerCheckOutLogs[0];
                const lastSentTime = new Date(lastLog.sentAt || lastLog.createdAt).getTime();
                const elapsedMinutes = (now.getTime() - lastSentTime) / (1000 * 60);
                isDue = elapsedMinutes >= settings.intervalMinutes;
              }

              if (isDue) {
                const remLog: AttendanceReminderLog = {
                  id: `rem-out-${Date.now()}-${worker.id}-${attemptCount + 1}`,
                  workerId: worker.id,
                  workerName: worker.name,
                  workerPhone: worker.phone,
                  projectId: project.id,
                  projectName: project.name,
                  rosterId: roster.id,
                  attendanceId: attRecord.id,
                  reminderType: "CHECK_OUT",
                  scheduledAt: now.toISOString(),
                  sentAt: now.toISOString(),
                  status: "Delivered",
                  attemptCount: attemptCount + 1,
                  title: "🔔 InfraMate Check-Out Reminder",
                  message: `Your shift ends at ${roster.endTime}.\nPlease remember to check out.`,
                  actionUrl: "/?tab=labor&subtab=attendance",
                  createdAt: now.toISOString(),
                };

                generatedLogs.push(remLog);
                existingLogs.unshift(remLog);
                remindersSent++;

                this.sendPushNotification({
                  workerId: worker.id,
                  workerName: worker.name,
                  workerPhone: worker.phone,
                  projectId: project.id,
                  projectName: project.name,
                  title: remLog.title,
                  message: remLog.message,
                  reminderType: "CHECK_OUT",
                  url: "/?tab=labor&subtab=attendance",
                });
              }
            }
          }
        }
      }
    });

    if (generatedLogs.length > 0) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(existingLogs.slice(0, 500)));
    }

    return {
      evaluatedCount: workers.length,
      remindersSent,
      supervisorAlertsSent,
      logs: generatedLogs,
    };
  }

  /**
   * Helper to parse time string like "08:00 AM" into minutes from midnight
   */
  parseTimeToMinutes(timeStr?: string): number | null {
    if (!timeStr || timeStr === "--") return null;
    try {
      const parts = timeStr.trim().split(" ");
      if (parts.length < 2) return null;
      const [hm, ampm] = parts;
      let [h, m] = hm.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return null;

      if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
      if (ampm.toUpperCase() === "AM" && h === 12) h = 0;

      return h * 60 + m;
    } catch {
      return null;
    }
  }

  // --- ATTENDANCE CORRECTION REQUESTS ---
  getCorrectionRequests(projectId?: string): AttendanceCorrectionRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CORRECTIONS);
      let list: AttendanceCorrectionRequest[] = raw ? JSON.parse(raw) : getInitialCorrections();
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_CORRECTIONS, JSON.stringify(list));
      }
      if (projectId) {
        list = list.filter((c) => c.projectId === projectId);
      }
      return list;
    } catch {
      return getInitialCorrections();
    }
  }

  submitCorrectionRequest(
    request: Omit<AttendanceCorrectionRequest, "id" | "status" | "requestedAt">
  ): AttendanceCorrectionRequest {
    const all = this.getCorrectionRequests();
    const newReq: AttendanceCorrectionRequest = {
      ...request,
      id: `cor-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      status: "Pending",
      requestedAt: new Date().toISOString(),
    };
    all.unshift(newReq);
    localStorage.setItem(STORAGE_KEY_CORRECTIONS, JSON.stringify(all));

    this.logAudit({
      user: request.workerName,
      action: "Attendance Correction Requested",
      entity: "Correction",
      entityId: newReq.id,
      details: `Correction requested for date ${request.date}: ${request.issue}`,
    });

    return newReq;
  }

  reviewCorrectionRequest(
    id: string,
    status: "Approved" | "Rejected",
    reviewerName: string = "Contractor",
    reviewNotes?: string
  ): AttendanceCorrectionRequest | null {
    const all = this.getCorrectionRequests();
    const req = all.find((r) => r.id === id);
    if (!req) return null;

    req.status = status;
    req.reviewedBy = reviewerName;
    req.reviewedAt = new Date().toISOString();
    req.reviewNotes = reviewNotes;

    localStorage.setItem(STORAGE_KEY_CORRECTIONS, JSON.stringify(all));

    this.logAudit({
      user: reviewerName,
      action: status === "Approved" ? "Attendance Correction Approved" : "Attendance Correction Rejected",
      entity: "Correction",
      entityId: id,
      details: `${status} attendance correction for ${req.workerName} (${req.date}). Notes: ${reviewNotes || "None"}`,
    });

    return req;
  }

  private logAudit(entry: Omit<AttendanceAuditLog, "id" | "timestamp">) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
      const logs: AttendanceAuditLog[] = raw ? JSON.parse(raw) : [];
      logs.unshift({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toISOString(),
        ...entry,
      });
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs.slice(0, 300)));
    } catch {}
  }
}

export const reminderService = new ReminderService();
