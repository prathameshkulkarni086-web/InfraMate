import {
  RosterEntry,
  ShiftType,
  RosterStatus,
  AttendanceAuditLog,
} from "../types/laborRoster";
import { Worker, Project } from "../types";
import { reminderService } from "./reminderService";

const STORAGE_KEY_ROSTERS = "infrasync_worker_rosters";
const STORAGE_KEY_AUDIT = "infrasync_attendance_audit_logs";

export const SHIFT_TIMINGS: Record<
  ShiftType,
  { startTime: string; endTime: string; breakMinutes: number; label: string }
> = {
  Morning: {
    startTime: "08:00 AM",
    endTime: "05:00 PM",
    breakMinutes: 60,
    label: "Morning Shift (08:00 AM – 05:00 PM)",
  },
  Afternoon: {
    startTime: "12:00 PM",
    endTime: "08:00 PM",
    breakMinutes: 45,
    label: "Afternoon Shift (12:00 PM – 08:00 PM)",
  },
  Evening: {
    startTime: "04:00 PM",
    endTime: "12:00 AM",
    breakMinutes: 45,
    label: "Evening Shift (04:00 PM – 12:00 AM)",
  },
  Night: {
    startTime: "10:00 PM",
    endTime: "06:00 AM",
    breakMinutes: 60,
    label: "Night Shift (10:00 PM – 06:00 AM)",
  },
  "Full Day": {
    startTime: "08:00 AM",
    endTime: "08:00 PM",
    breakMinutes: 90,
    label: "Full Day Extended (08:00 AM – 08:00 PM)",
  },
  Custom: {
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    breakMinutes: 60,
    label: "Custom Shift Hours",
  },
  OFF: {
    startTime: "--",
    endTime: "--",
    breakMinutes: 0,
    label: "Weekly Scheduled Rest (OFF)",
  },
  Leave: {
    startTime: "--",
    endTime: "--",
    breakMinutes: 0,
    label: "Approved Leave",
  },
};

// Seed initial rosters for current date (2026-09-03) and surrounding days
export function getInitialRosters(): RosterEntry[] {
  const today = "2026-09-03";
  const yesterday = "2026-09-02";
  const tomorrow = "2026-09-04";

  return [
    {
      id: "rst-101",
      workerId: "w-1",
      workerName: "Ramesh Yadav",
      workerRole: "Mason",
      workerPhone: "+91 98111 22334",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: today,
      shift: "Morning",
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      status: "Published",
      notes: "First floor slab brickwork & reinforcement alignment",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    {
      id: "rst-102",
      workerId: "w-2",
      workerName: "Dharmendra Kumar",
      workerRole: "Mason",
      workerPhone: "+91 98222 33445",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: today,
      shift: "Morning",
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      status: "Published",
      notes: "Masonry partition walls grid line 3 to 6",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    {
      id: "rst-103",
      workerId: "w-3",
      workerName: "Sanjay Mondal",
      workerRole: "Steel Fixer / Barbender",
      workerPhone: "+91 98333 44556",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: today,
      shift: "Morning",
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      status: "Published",
      notes: "Beam & column tie reinforcement binding",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    {
      id: "rst-104",
      workerId: "w-4",
      workerName: "Babulal Suthar",
      workerRole: "Carpenter / Shuttering",
      workerPhone: "+91 98444 55667",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Courtyard, Pool Deck & Landscaping",
      date: today,
      shift: "Morning",
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      status: "Published",
      notes: "Formwork props erection for terrace pergola",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    {
      id: "rst-105",
      workerId: "w-5",
      workerName: "Mustaq Ali",
      workerRole: "General Helper / Laborer",
      workerPhone: "+91 98555 66778",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: today,
      shift: "Morning",
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      status: "Published",
      notes: "Concrete mixer assistance and aggregate shifting",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    {
      id: "rst-106",
      workerId: "w-6",
      workerName: "Kishore Jena",
      workerRole: "Electrician",
      workerPhone: "+91 98666 77889",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: today,
      shift: "Afternoon",
      startTime: "12:00 PM",
      endTime: "08:00 PM",
      breakDurationMinutes: 45,
      status: "Published",
      notes: "Ceiling conduit chasing and DB panel earthing",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    {
      id: "rst-107",
      workerId: "w-7",
      workerName: "Harishankar Pal",
      workerRole: "Plumber",
      workerPhone: "+91 98777 88990",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: today,
      shift: "Leave",
      startTime: "--",
      endTime: "--",
      breakDurationMinutes: 0,
      status: "Published",
      notes: "Approved medical leave - 1 day",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    {
      id: "rst-108",
      workerId: "w-8",
      workerName: "Vikram Chauhan",
      workerRole: "Machine Operator",
      workerPhone: "+91 98888 99001",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: today,
      shift: "Morning",
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      status: "Published",
      notes: "Transit mixer and concrete hoist operations",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
    // Tomorrow rosters
    {
      id: "rst-201",
      workerId: "w-1",
      workerName: "Ramesh Yadav",
      workerRole: "Mason",
      workerPhone: "+91 98111 22334",
      projectId: "proj-101",
      projectName: "Riverside Commercial Complex",
      siteLocation: "Main Villa RCC & Superstructure",
      date: tomorrow,
      shift: "Morning",
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      status: "Published",
      notes: "External facade plastering keying",
      publishedAt: "2026-09-02T18:00:00.000Z",
      publishedBy: "Gurpreet Singh (Contractor)",
      createdAt: "2026-09-02T17:30:00.000Z",
      updatedAt: "2026-09-02T18:00:00.000Z",
    },
  ];
}

class RosterService {
  getRosters(projectId?: string, date?: string): RosterEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ROSTERS);
      let list: RosterEntry[] = raw ? JSON.parse(raw) : getInitialRosters();

      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ROSTERS, JSON.stringify(list));
      }

      if (projectId) {
        list = list.filter((r) => r.projectId === projectId);
      }
      if (date) {
        list = list.filter((r) => r.date === date);
      }

      return list;
    } catch {
      return getInitialRosters();
    }
  }

  getRosterForWorker(workerId: string, date?: string): RosterEntry | null {
    const all = this.getRosters();
    const targetDate = date || new Date().toISOString().split("T")[0];
    return (
      all.find(
        (r) => r.workerId === workerId && r.date === targetDate && r.status === "Published"
      ) ||
      all.find((r) => r.workerId === workerId && r.date === targetDate) ||
      null
    );
  }

  saveRoster(roster: RosterEntry, actorName: string = "Admin"): RosterEntry {
    const all = this.getRosters();
    const existingIndex = all.findIndex((r) => r.id === roster.id);

    const isNew = existingIndex < 0;
    const prevRoster = !isNew ? all[existingIndex] : null;

    const saved: RosterEntry = {
      ...roster,
      updatedAt: new Date().toISOString(),
      createdAt: roster.createdAt || new Date().toISOString(),
    };

    if (isNew) {
      all.unshift(saved);
      this.logAudit({
        user: actorName,
        action: "Roster Created",
        entity: "Roster",
        entityId: saved.id,
        details: `Created roster for ${saved.workerName} on ${saved.date} (${saved.shift})`,
      });
    } else {
      all[existingIndex] = saved;
      this.logAudit({
        user: actorName,
        action: "Roster Updated",
        entity: "Roster",
        entityId: saved.id,
        details: `Updated roster for ${saved.workerName} on ${saved.date}`,
      });

      // If shift or times changed and already published, trigger shift updated push notification!
      if (
        prevRoster &&
        prevRoster.status === "Published" &&
        (prevRoster.shift !== saved.shift ||
          prevRoster.startTime !== saved.startTime ||
          prevRoster.endTime !== saved.endTime)
      ) {
        reminderService.sendPushNotification({
          workerId: saved.workerId,
          workerName: saved.workerName,
          projectId: saved.projectId,
          projectName: saved.projectName,
          title: "⚠️ Roster Updated",
          message: `Your shift has been changed.\nPrevious: ${prevRoster.startTime} – ${prevRoster.endTime}\nNew: ${saved.startTime} – ${saved.endTime}\nTap to view details.`,
          reminderType: "ROSTER_UPDATED",
          url: "/?tab=labor&subtab=roster",
        });
      }
    }

    localStorage.setItem(STORAGE_KEY_ROSTERS, JSON.stringify(all));
    return saved;
  }

  publishRosters(rosterIds: string[], actorName: string = "Contractor"): number {
    const all = this.getRosters();
    let publishedCount = 0;
    const now = new Date().toISOString();

    all.forEach((r) => {
      if (rosterIds.includes(r.id)) {
        const wasDraft = r.status !== "Published";
        r.status = "Published";
        r.publishedAt = now;
        r.publishedBy = actorName;
        r.updatedAt = now;
        publishedCount += 1;

        if (wasDraft) {
          // Send push notification to worker's registered smartphone
          reminderService.sendPushNotification({
            workerId: r.workerId,
            workerName: r.workerName,
            projectId: r.projectId,
            projectName: r.projectName,
            title: "📅 InfraSync Roster",
            message: `Your shift tomorrow is:\n${r.projectName}\n${r.startTime} – ${r.endTime}\nTap to view your roster.`,
            reminderType: "ROSTER_PUBLISHED",
            url: "/?tab=labor&subtab=roster",
          });
        }
      }
    });

    localStorage.setItem(STORAGE_KEY_ROSTERS, JSON.stringify(all));

    this.logAudit({
      user: actorName,
      action: "Roster Published",
      entity: "Roster",
      entityId: rosterIds.join(", "),
      details: `Published ${publishedCount} worker rosters for project sites.`,
    });

    return publishedCount;
  }

  deleteRoster(id: string, actorName: string = "Admin"): boolean {
    const all = this.getRosters();
    const filtered = all.filter((r) => r.id !== id);
    if (filtered.length !== all.length) {
      localStorage.setItem(STORAGE_KEY_ROSTERS, JSON.stringify(filtered));
      this.logAudit({
        user: actorName,
        action: "Roster Updated",
        entity: "Roster",
        entityId: id,
        details: `Deleted roster ID ${id}`,
      });
      return true;
    }
    return false;
  }

  batchAssignWeekRosters(
    workers: Worker[],
    project: Project,
    startDateStr: string,
    shift: ShiftType,
    actorName: string = "Contractor"
  ): RosterEntry[] {
    const timings = SHIFT_TIMINGS[shift] || SHIFT_TIMINGS["Morning"];
    const all = this.getRosters();
    const created: RosterEntry[] = [];

    const startDate = new Date(startDateStr);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + dayOffset);
      const dateStr = d.toISOString().split("T")[0];
      const isSunday = d.getDay() === 0;

      workers.forEach((w) => {
        const assignedShift = isSunday ? "OFF" : shift;
        const shiftTimes = SHIFT_TIMINGS[assignedShift];

        // Check if roster already exists for worker on this date
        const existingIdx = all.findIndex(
          (r) => r.workerId === w.id && r.date === dateStr && r.projectId === project.id
        );

        const newRoster: RosterEntry = {
          id: existingIdx >= 0 ? all[existingIdx].id : `rst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          workerId: w.id,
          workerName: w.name,
          workerRole: w.role,
          workerPhone: w.phone,
          projectId: project.id,
          projectName: project.name,
          siteLocation: w.siteName || "Main Construction Sector",
          date: dateStr,
          shift: assignedShift,
          startTime: shiftTimes.startTime,
          endTime: shiftTimes.endTime,
          breakDurationMinutes: shiftTimes.breakMinutes,
          status: "Published",
          notes: isSunday ? "Weekly off day" : "Regular scheduled shift",
          publishedAt: new Date().toISOString(),
          publishedBy: actorName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          all[existingIdx] = newRoster;
        } else {
          all.push(newRoster);
        }
        created.push(newRoster);
      });
    }

    localStorage.setItem(STORAGE_KEY_ROSTERS, JSON.stringify(all));

    this.logAudit({
      user: actorName,
      action: "Roster Published",
      entity: "Roster",
      entityId: `batch-${startDateStr}`,
      details: `Generated and published 7-day weekly roster for ${workers.length} workers (${created.length} shifts created).`,
    });

    return created;
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
    } catch {
      // storage unavailable
    }
  }

  getAuditLogs(): AttendanceAuditLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const rosterService = new RosterService();
