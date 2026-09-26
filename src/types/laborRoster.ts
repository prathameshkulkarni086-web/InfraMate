import { Worker, AttendanceRecord, Project, UserRole } from "./index";

export type WorkerTrade =
  | "Mason"
  | "Helper"
  | "Electrician"
  | "Plumber"
  | "Carpenter"
  | "Welder"
  | "Painter"
  | "Machine Operator"
  | "General Labour"
  | "Other";

export type ShiftType =
  | "Morning"
  | "Afternoon"
  | "Evening"
  | "Night"
  | "Full Day"
  | "Custom"
  | "OFF"
  | "Leave";

export type RosterStatus = "Draft" | "Published" | "Completed" | "Cancelled";

export interface RosterEntry {
  id: string;
  workerId: string;
  workerName: string;
  workerRole: WorkerTrade | string;
  workerPhone?: string;
  projectId: string;
  projectName: string;
  siteLocation?: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  startTime: string; // e.g. "08:00 AM"
  endTime: string; // e.g. "05:00 PM"
  breakDurationMinutes: number; // e.g. 60
  status: RosterStatus;
  notes?: string;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderIntervalMinutes = 10 | 15 | 20;

export interface AttendanceReminderSettings {
  id: string;
  projectId: string;
  intervalMinutes: ReminderIntervalMinutes; // 10, 15, 20 (default 15)
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  gracePeriodMinutes: 5 | 10 | 15; // default 10
  maxReminders: number; // default 6
  enabled: boolean;
  notifySupervisorOnMaxReached: boolean;
  supervisorPhone?: string;
  supervisorName?: string;
  createdBy?: string;
  updatedAt: string;
}

export type ReminderDeliveryStatus =
  | "Scheduled"
  | "Sent"
  | "Delivered"
  | "Opened"
  | "Failed"
  | "Cancelled"
  | "Stopped";

export type ReminderType =
  | "CHECK_IN"
  | "CHECK_OUT"
  | "ROSTER_PUBLISHED"
  | "ROSTER_UPDATED"
  | "SUPERVISOR_ALERT";

export type AttendanceReminderLog = {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone?: string;
  projectId: string;
  projectName: string;
  rosterId?: string;
  attendanceId?: string;
  reminderType: ReminderType;
  scheduledAt: string;
  sentAt?: string;
  status: ReminderDeliveryStatus;
  attemptCount: number;
  title: string;
  message: string;
  actionUrl?: string;
  error?: string;
  createdAt: string;
};

export type ReminderLog = AttendanceReminderLog;

export interface PushDeviceRegistration {
  id: string;
  workerId: string;
  userId?: string;
  workerName: string;
  phone?: string;
  deviceToken: string;
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  platform: "android" | "ios" | "web_pwa" | "browser";
  browser: string;
  enabled: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  workerId: string;
  workerName: string;
  projectId: string;
  projectName: string;
  date: string;
  issue: string;
  expectedCheckIn: string;
  expectedCheckOut: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AttendanceAuditLog {
  id: string;
  user: string;
  action:
    | "Roster Created"
    | "Roster Updated"
    | "Roster Published"
    | "Attendance Created"
    | "Attendance Updated"
    | "Attendance Correction Requested"
    | "Attendance Correction Approved"
    | "Attendance Correction Rejected"
    | "Reminder Scheduled"
    | "Reminder Sent"
    | "Reminder Failed"
    | "Reminder Cancelled"
    | "Manual Attendance Override"
    | "Reminder Interval Changed"
    | "Push Device Registered";
  entity: "Roster" | "Attendance" | "Reminder" | "Correction" | "Settings" | "Device";
  entityId: string;
  timestamp: string;
  details?: string;
}

export interface DailyReportRow {
  workerId: string;
  workerName: string;
  trade: string;
  project: string;
  shift: ShiftType;
  scheduledStart: string;
  checkIn: string;
  scheduledEnd: string;
  checkOut: string;
  totalHours: string;
  lateByMinutes: number;
  earlyCheckoutMinutes: number;
  status: "Present" | "Late" | "Absent" | "Half Day" | "On Leave" | "Not Checked In";
  attendanceRecordId?: string;
}

export interface WeeklySummaryRow {
  workerId: string;
  workerName: string;
  trade: string;
  days: {
    [dateStr: string]: {
      code: "P" | "L" | "A" | "H" | "LV" | "O" | "--";
      hours: number;
    };
  };
  totalWorkingDays: number;
  presentDays: number;
  attendancePercentage: number;
}

export interface MonthlySummaryRow {
  workerId: string;
  workerName: string;
  trade: string;
  workingDays: number;
  present: number;
  absent: number;
  late: number;
  halfDays: number;
  leave: number;
  totalHours: number;
  attendancePercentage: number;
}
