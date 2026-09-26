import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  Clock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings,
  ShieldCheck,
  Send,
  RefreshCw,
  Eye,
  X,
  Users,
  Sliders,
  Radio,
  Zap,
} from "lucide-react";
import { Worker, AttendanceRecord, Project, UserRole } from "../../types";
import {
  ReminderIntervalMinutes,
  AttendanceReminderSettings,
  ReminderLog,
  PushDeviceRegistration,
} from "../../types/laborRoster";
import { reminderService } from "../../services/reminderService";
import { rosterService } from "../../services/rosterService";

interface AttendanceRemindersDashboardProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  activeProject: Project;
  userRole: UserRole;
  currentUserName: string;
}

export const AttendanceRemindersDashboard: React.FC<AttendanceRemindersDashboardProps> = ({
  workers = [],
  attendance = [],
  activeProject,
  userRole,
  currentUserName,
}) => {
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const todayStr = new Date().toISOString().split("T")[0];

  const canManage =
    userRole === "admin" ||
    userRole === "project_manager" ||
    userRole === "site_engineer" ||
    userRole === "contractor";

  // Settings state
  const [settings, setSettings] = useState<AttendanceReminderSettings>(() =>
    reminderService.getSettings(activeProject.id)
  );

  // Reminder logs & Registered devices
  const [logs, setLogs] = useState<ReminderLog[]>(() =>
    reminderService.getReminderLogs(activeProject.id)
  );
  const [devices, setDevices] = useState<PushDeviceRegistration[]>(() =>
    reminderService.getRegisteredDevices()
  );

  // Live simulation phone modal
  const [simulatedNotification, setSimulatedNotification] = useState<{
    workerName: string;
    title: string;
    message: string;
    time: string;
    shiftTime: string;
  } | null>(null);

  // Engine run status
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [engineResult, setEngineResult] = useState<string>("");
  const [savedSettingsNotice, setSavedSettingsNotice] = useState<string>("");

  const refreshData = () => {
    setLogs(reminderService.getReminderLogs(activeProject.id));
    setDevices(reminderService.getRegisteredDevices());
  };

  // Handle interval selection (10, 15, 20)
  const handleIntervalChange = (interval: ReminderIntervalMinutes) => {
    if (!canManage) return;
    const updated: AttendanceReminderSettings = {
      ...settings,
      intervalMinutes: interval,
      updatedAt: new Date().toISOString(),
    };
    setSettings(updated);
    reminderService.saveSettings(updated);
    setSavedSettingsNotice(`Global reminder interval updated to ${interval} minutes.`);
    setTimeout(() => setSavedSettingsNotice(""), 3000);
  };

  // Handle grace period change
  const handleGracePeriodChange = (grace: 5 | 10 | 15) => {
    if (!canManage) return;
    const updated: AttendanceReminderSettings = {
      ...settings,
      gracePeriodMinutes: grace,
      updatedAt: new Date().toISOString(),
    };
    setSettings(updated);
    reminderService.saveSettings(updated);
  };

  // Handle max reminders change
  const handleMaxRemindersChange = (max: number) => {
    if (!canManage) return;
    const updated: AttendanceReminderSettings = {
      ...settings,
      maxReminders: max,
      updatedAt: new Date().toISOString(),
    };
    setSettings(updated);
    reminderService.saveSettings(updated);
  };

  // Handle toggle enabled
  const handleToggleGlobal = () => {
    if (!canManage) return;
    const updated: AttendanceReminderSettings = {
      ...settings,
      enabled: !settings.enabled,
      updatedAt: new Date().toISOString(),
    };
    setSettings(updated);
    reminderService.saveSettings(updated);
  };

  // Run Reminder Engine Now
  const handleRunEngineNow = async () => {
    setIsRunningEngine(true);
    setEngineResult("");

    const rosters = rosterService.getRosters(activeProject.id, todayStr);
    const result = reminderService.evaluateAndProcessReminders(
      activeProject,
      safeWorkers,
      safeAttendance,
      rosters
    );

    setIsRunningEngine(false);
    refreshData();
    setEngineResult(
      `Engine cycle complete: Evaluated ${result.evaluatedCount} workers. Sent ${result.remindersSent} push reminders and ${result.supervisorAlertsSent} supervisor escalation alerts.`
    );
    setTimeout(() => setEngineResult(""), 5000);
  };

  // Send Instant Manual Reminder
  const handleSendInstantReminder = async (worker: Worker) => {
    const todayRoster = rosterService
      .getRosters(activeProject.id, todayStr)
      .find((r) => r.workerId === worker.id);

    const shiftTime = todayRoster ? todayRoster.startTime : "08:00 AM";

    await reminderService.sendPushNotification({
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      projectId: activeProject.id,
      projectName: activeProject.name,
      reminderType: "CHECK_IN",
      title: "🔔 InfraMate Attendance Reminder",
      message: `You haven't checked in yet.\nYour shift started at ${shiftTime}.\nOpen InfraMate to mark your attendance.`,
      url: "/?tab=labor&subtab=attendance",
    });

    refreshData();
    setSavedSettingsNotice(`Instant reminder dispatched to ${worker.name}'s smartphone.`);
    setTimeout(() => setSavedSettingsNotice(""), 3000);
  };

  // Preview Lockscreen Push
  const handlePreviewLockscreen = (worker: Worker) => {
    const todayRoster = rosterService
      .getRosters(activeProject.id, todayStr)
      .find((r) => r.workerId === worker.id);

    const shiftTime = todayRoster ? todayRoster.startTime : "08:00 AM";

    setSimulatedNotification({
      workerName: worker.name,
      title: "🔔 InfraMate Attendance Reminder",
      message: `You haven't checked in yet. Your shift started at ${shiftTime}. Open InfraMate to mark your attendance.`,
      time: "Just now",
      shiftTime,
    });
  };

  // Today's roster workers missing check-in
  const todayRosters = rosterService.getRosters(activeProject.id, todayStr);
  const workersMissingCheckIn = safeWorkers.filter((w) => {
    const roster = todayRosters.find((r) => r.workerId === w.id);
    if (!roster || roster.shift === "OFF" || roster.shift === "Leave") return false;
    const att = safeAttendance.find(
      (a) => a.workerId === w.id && (a.date === todayStr || a.attendanceDate === todayStr)
    );
    return !att || !att.checkIn;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Smartphone Attendance Reminders</span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  settings.enabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 border border-red-500/20"
                }`}
              >
                {settings.enabled ? "● Engine Active" : "○ Engine Paused"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated push reminders dispatched to worker smartphones if check-in is not completed.
            </p>
          </div>
        </div>

        {/* Engine Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunEngineNow}
            disabled={isRunningEngine}
            id="btn-run-reminder-engine"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            {isRunningEngine ? "Evaluating Shifts..." : "⚡ Run Reminder Check Now"}
          </button>
        </div>
      </div>

      {savedSettingsNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {savedSettingsNotice}
        </div>
      )}

      {engineResult && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 shrink-0" />
          {engineResult}
        </div>
      )}

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Interval Card */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Reminder Interval</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            Every {settings.intervalMinutes} Mins
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Configurable: 10, 15, or 20 mins
          </div>
        </div>

        {/* Missing Check-In Today */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Missing Check-In</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {workersMissingCheckIn.length} Workers
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-0.5">
            Pending attendance punch
          </div>
        </div>

        {/* Notifications Sent Today */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Reminders Sent Today</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {logs.filter((l) => l.createdAt.startsWith(todayStr)).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            100% push delivery rate
          </div>
        </div>

        {/* Registered Push Devices */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Active Smartphone Devices</span>
            <Smartphone className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {devices.filter((d) => d.enabled).length} Phones
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400/80 mt-0.5">
            Web Push & Android PWA
          </div>
        </div>
      </div>

      {/* 3. Global Reminder Interval & Policy Configuration */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Reminder Frequency & Escalation Policy</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Only authorized contractors and project managers can configure global reminder rules. Workers cannot modify reminder intervals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleGlobal}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                settings.enabled
                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-800"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
              }`}
            >
              {settings.enabled ? "Pause All Reminders" : "Enable Reminders"}
            </button>
          </div>
        </div>

        {/* Configurable 10 / 15 / 20 mins Interval Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Select Smartphone Push Reminder Interval:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 10 Minutes */}
            <div
              onClick={() => handleIntervalChange(10)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                settings.intervalMinutes === 10
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  settings.intervalMinutes === 10 ? "border-blue-600" : "border-slate-400"
                }`}
              >
                {settings.intervalMinutes === 10 && (
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                )}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  10 Minutes
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  High urgency. Sends reminders every 10 minutes following scheduled shift start.
                </div>
              </div>
            </div>

            {/* 15 Minutes (Default) */}
            <div
              onClick={() => handleIntervalChange(15)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 relative ${
                settings.intervalMinutes === 15
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase">
                Recommended
              </span>
              <div
                className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  settings.intervalMinutes === 15 ? "border-blue-600" : "border-slate-400"
                }`}
              >
                {settings.intervalMinutes === 15 && (
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                )}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  15 Minutes (Default)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Balanced site cadence. Recommended for standard construction shifts.
                </div>
              </div>
            </div>

            {/* 20 Minutes */}
            <div
              onClick={() => handleIntervalChange(20)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                settings.intervalMinutes === 20
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  settings.intervalMinutes === 20 ? "border-blue-600" : "border-slate-400"
                }`}
              >
                {settings.intervalMinutes === 20 && (
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                )}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  20 Minutes
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Relaxed reminder schedule for flexible site arrivals.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grace Period & Escalation Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Grace Period Before 1st Reminder
            </label>
            <select
              value={settings.gracePeriodMinutes}
              onChange={(e) => handleGracePeriodChange(Number(e.target.value) as 5 | 10 | 15)}
              disabled={!canManage}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes (Standard)</option>
              <option value={15}>15 Minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Max Consecutive Reminders
            </label>
            <select
              value={settings.maxReminders}
              onChange={(e) => handleMaxRemindersChange(Number(e.target.value))}
              disabled={!canManage}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value={4}>4 Reminders (e.g. 1 hour)</option>
              <option value={6}>6 Reminders (Default, ~1.5 hours)</option>
              <option value={8}>8 Reminders (~2 hours)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Supervisor Escalation Contact
            </label>
            <input
              type="text"
              readOnly
              value={`${settings.supervisorName || "Gurpreet Singh"} (${settings.supervisorPhone || "+91 98999 11223"})`}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* 4. Live Reminder Status & Worker Roster Tracking */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Today's Live Worker Reminder Stream ({todayStr})</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            {workersMissingCheckIn.length} workers missing attendance check-in
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Labour Name & Trade</th>
                <th className="py-3 px-3">Shift & Start</th>
                <th className="py-3 px-3">Last Reminder Sent</th>
                <th className="py-3 px-3">Reminder Count</th>
                <th className="py-3 px-3">Attendance Status</th>
                <th className="py-3 px-3">Push Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {safeWorkers.map((w) => {
                const roster = todayRosters.find((r) => r.workerId === w.id);
                const att = safeAttendance.find(
                  (a) => a.workerId === w.id && (a.date === todayStr || a.attendanceDate === todayStr)
                );
                const workerLogs = logs.filter(
                  (l) => l.workerId === w.id && l.reminderType === "CHECK_IN" && l.createdAt.startsWith(todayStr)
                );
                const lastLog = workerLogs[0];
                const isPushReg = reminderService.isWorkerPushEnabled(w.id);

                return (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{w.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {w.role} • {w.phone}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {roster ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {roster.shift}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {roster.startTime} – {roster.endTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]">
                      {lastLog ? (
                        <span className="text-slate-800 dark:text-slate-200">
                          {new Date(lastLog.sentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {workerLogs.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {workerLogs.length} / {settings.maxReminders} Sent
                        </span>
                      ) : (
                        <span className="text-slate-400">0 Sent</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {att?.status === "present" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Checked In ({att.checkIn})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> Not Checked In
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {isPushReg ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Delivered
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No Device</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePreviewLockscreen(w)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-[10px] transition flex items-center gap-1"
                          title="Preview Lockscreen Notification"
                        >
                          <Eye className="w-3 h-3" />
                          Lockscreen
                        </button>

                        <button
                          onClick={() => handleSendInstantReminder(w)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition flex items-center gap-1"
                          title="Send smartphone reminder now"
                        >
                          <Send className="w-3 h-3" />
                          Send Now
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Interactive Smartphone Lockscreen Push Notification Simulator Modal */}
      {simulatedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-[40px] bg-slate-900 border-4 border-slate-700 p-6 shadow-2xl space-y-6 text-white overflow-hidden">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto -mt-2"></div>

            {/* Lockscreen Clock */}
            <div className="text-center space-y-1">
              <div className="text-5xl font-thin tracking-tight">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="text-xs text-slate-400">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Push Notification Banner */}
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-lg space-y-2 animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <div className="w-4 h-4 rounded-md bg-blue-600 flex items-center justify-center text-[10px]">
                    IS
                  </div>
                  <span>INFRASYNC</span>
                </div>
                <span>{simulatedNotification.time}</span>
              </div>

              <div className="text-xs font-bold text-white">
                {simulatedNotification.title}
              </div>

              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {simulatedNotification.message}
              </div>

              {/* Notification Quick Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                <button
                  onClick={() => setSimulatedNotification(null)}
                  className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                >
                  PUNCH CHECK IN
                </button>
                <button
                  onClick={() => setSimulatedNotification(null)}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setSimulatedNotification(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
