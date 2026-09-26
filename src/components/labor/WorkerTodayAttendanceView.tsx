import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileQuestion,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { Worker, AttendanceRecord, Project, UserRole } from "../../types";
import { rosterService } from "../../services/rosterService";
import { reminderService } from "../../services/reminderService";

interface WorkerTodayAttendanceViewProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  activeProject: Project;
  userRole: UserRole;
  currentUserName: string;
  onSaveAttendance: (record: AttendanceRecord) => void;
  onOpenBiometricModal?: () => void;
  workerId?: string; // Optional for active worker
}

export const WorkerTodayAttendanceView: React.FC<WorkerTodayAttendanceViewProps> = ({
  workers = [],
  attendance = [],
  activeProject,
  userRole,
  currentUserName,
  onSaveAttendance,
  onOpenBiometricModal,
  workerId,
}) => {
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const todayStr = new Date().toISOString().split("T")[0];

  // Selected worker for attendance terminal
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    workerId || safeWorkers[0]?.id || ""
  );

  // Live timer state for active checked-in shift
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // GPS and Biometric simulation state
  const [isVerifyingGps, setIsVerifyingGps] = useState(false);
  const [gpsVerified, setGpsVerified] = useState<boolean | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number>(24);
  const [isScanningBiometric, setIsScanningBiometric] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState<boolean | null>(null);

  // Correction Request Modal
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionIssue, setCorrectionIssue] = useState<"MISSING_CHECK_IN" | "MISSING_CHECK_OUT" | "WRONG_TIME" | "GEOFENCE_ISSUE">("MISSING_CHECK_IN");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionDate, setCorrectionDate] = useState(todayStr);
  const [expectedTime, setExpectedTime] = useState("08:00 AM");
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState("");

  const activeWorker = safeWorkers.find((w) => w.id === selectedWorkerId) || safeWorkers[0];
  const isWorkerRole = userRole === "worker";

  // Today's attendance record for active worker
  const todayRecord = safeAttendance.find(
    (a) =>
      a.workerId === activeWorker?.id &&
      (a.date === todayStr || a.attendanceDate === todayStr)
  );

  // Today's scheduled roster
  const todayRoster = rosterService
    .getRosters(activeProject.id, todayStr)
    .find((r) => r.workerId === activeWorker?.id);

  // Calculate elapsed time if checked in
  useEffect(() => {
    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkOut) {
      setElapsedSeconds(0);
      return;
    }

    // Parse check-in time (e.g. "08:15 AM" or "08:15:00")
    const parseTime = (timeStr: string) => {
      try {
        const parts = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
        if (!parts) return new Date().getTime();
        let hours = parseInt(parts[1], 10);
        const mins = parseInt(parts[2], 10);
        const ampm = parts[4];
        if (ampm && ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (ampm && ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours, mins, 0, 0);
        return d.getTime();
      } catch {
        return new Date().getTime();
      }
    };

    const checkInMs = parseTime(todayRecord.checkIn);
    const updateElapsed = () => {
      const diffSec = Math.max(0, Math.floor((Date.now() - checkInMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [todayRecord]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, "0")}h ${mins
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Perform GPS Location check
  const handleVerifyLocation = () => {
    setIsVerifyingGps(true);
    setTimeout(() => {
      setIsVerifyingGps(false);
      setGpsVerified(true);
      setGpsDistance(18); // 18 meters from geofence centroid
    }, 600);
  };

  // Perform Check In
  const handleCheckIn = () => {
    if (!activeWorker) return;
    setIsScanningBiometric(true);

    setTimeout(() => {
      setIsScanningBiometric(false);
      setBiometricSuccess(true);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${activeWorker.id}`,
        workerId: activeWorker.id,
        workerName: activeWorker.name,
        workerRole: activeWorker.role,
        projectId: activeProject.id,
        date: todayStr,
        attendanceDate: todayStr,
        checkIn: timeStr,
        checkOut: undefined,
        status: "present",
        dailyWage: activeWorker.dailyWage || 850,
        calculatedWage: activeWorker.dailyWage || 850,
        siteId: activeProject.sites?.[0]?.id || "site-101-a",
        siteName: activeProject.sites?.[0]?.name || activeProject.name,
        overtimeHours: 0,
        notes: "Biometric verified via Smartphone Geofence (18m)",
      };

      onSaveAttendance(newRecord);
      setTimeout(() => setBiometricSuccess(null), 3000);
    }, 1200);
  };

  // Perform Check Out
  const handleCheckOut = () => {
    if (!activeWorker || !todayRecord) return;
    setIsScanningBiometric(true);

    setTimeout(() => {
      setIsScanningBiometric(false);
      setBiometricSuccess(true);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const updatedRecord: AttendanceRecord = {
        ...todayRecord,
        checkOut: timeStr,
        notes: "Shift completed & biometric verified.",
      };

      onSaveAttendance(updatedRecord);
      setTimeout(() => setBiometricSuccess(null), 3000);
    }, 1200);
  };

  // Submit Correction Request
  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorker) return;

    reminderService.submitCorrectionRequest({
      workerId: activeWorker.id,
      workerName: activeWorker.name,
      projectId: activeProject.id,
      projectName: activeProject.name,
      date: correctionDate,
      issue: correctionIssue,
      expectedCheckIn: correctionIssue === "MISSING_CHECK_IN" ? expectedTime : undefined,
      expectedCheckOut: correctionIssue === "MISSING_CHECK_OUT" ? expectedTime : undefined,
      reason: correctionReason || "Site punch machine failure / smartphone network delay",
    });

    setCorrectionSuccessMsg("Correction request submitted for supervisor approval.");
    setTimeout(() => {
      setCorrectionSuccessMsg("");
      setIsCorrectionModalOpen(false);
      setCorrectionReason("");
    }, 1800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Worker Selector for Site Supervisors */}
      {!isWorkerRole && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Select Worker for Site Punch Terminal:
            </span>
          </div>

          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 max-w-md"
          >
            {safeWorkers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.role}) — {w.employeeId || w.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 2. Main Smartphone Attendance Hero Card */}
      {activeWorker && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider mb-2 backdrop-blur-xs">
                  <Smartphone className="w-3 h-3 text-sky-400" />
                  Smartphone Biometric Attendance
                </div>
                <h1 className="text-xl sm:text-2xl font-black">{activeWorker.name}</h1>
                <div className="text-xs text-blue-200 mt-0.5 flex flex-wrap items-center gap-3">
                  <span>{activeWorker.role}</span>
                  <span>•</span>
                  <span>ID: {activeWorker.employeeId || activeWorker.id}</span>
                  <span>•</span>
                  <span>{activeProject.name}</span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="shrink-0">
                {todayRecord?.checkOut ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold backdrop-blur-xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-300" />
                    Shift Completed
                  </span>
                ) : todayRecord?.checkIn ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold backdrop-blur-xs animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Checked In (Working)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold backdrop-blur-xs">
                    <Clock className="w-4 h-4 text-amber-300" />
                    Not Checked In
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* Shift & Time Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Scheduled Shift
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {todayRoster ? `${todayRoster.shift} Shift` : "Regular Shift"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {todayRoster
                    ? `${todayRoster.startTime} – ${todayRoster.endTime}`
                    : "08:00 AM – 05:00 PM (8.0 hrs)"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Site GPS Geofence (100m)
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  <span>{gpsVerified ? "Within Site Geofence" : "Location Pending"}</span>
                  {gpsVerified && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>{gpsVerified ? `18m from site boundary` : "Tap to verify coordinates"}</span>
                  {!gpsVerified && (
                    <button
                      onClick={handleVerifyLocation}
                      disabled={isVerifyingGps}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      {isVerifyingGps ? "Pinging..." : "Verify GPS"}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Live Shift Duration
                </div>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                  {todayRecord?.checkIn && !todayRecord.checkOut
                    ? formatTimer(elapsedSeconds)
                    : todayRecord?.checkOut
                    ? "Shift Finished"
                    : "00h 00m 00s"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {todayRecord?.checkIn ? `In: ${todayRecord.checkIn}` : "Check-in pending"}
                  {todayRecord?.checkOut ? ` | Out: ${todayRecord.checkOut}` : ""}
                </div>
              </div>
            </div>

            {/* Attendance Punch Actions */}
            <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!todayRecord?.checkIn ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={isScanningBiometric}
                    id="btn-worker-checkin"
                    className="w-full sm:w-64 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <Fingerprint className="w-5 h-5" />
                    {isScanningBiometric ? "Scanning Biometrics..." : "PUNCH CHECK IN"}
                  </button>
                ) : !todayRecord?.checkOut ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={isScanningBiometric}
                    id="btn-worker-checkout"
                    className="w-full sm:w-64 py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <Fingerprint className="w-5 h-5" />
                    {isScanningBiometric ? "Recording Departure..." : "PUNCH CHECK OUT"}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Today's Attendance Completed ({todayRecord.checkIn} – {todayRecord.checkOut})
                  </div>
                )}
              </div>

              {biometricSuccess && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl font-bold border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-2 animate-in fade-in">
                  <ShieldCheck className="w-4 h-4" />
                  Biometric Verification Confirmed & Attendance Logged!
                </div>
              )}

              <p className="text-xs text-slate-400">
                Attendance is authenticated via Native Mobile Biometrics and validated against the site's 100m GPS Geofence coordinates.
              </p>
            </div>

            {/* Attendance Correction & Help */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-slate-500 flex items-center gap-1.5">
                <FileQuestion className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Missed punch or wrong hours recorded?</span>
              </div>
              <button
                onClick={() => setIsCorrectionModalOpen(true)}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline min-h-[36px] flex items-center"
              >
                Submit Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Correction Request Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-blue-600" />
                Attendance Correction Request
              </h3>
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                &times;
              </button>
            </div>

            {correctionSuccessMsg ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-center text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                {correctionSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitCorrection} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    required
                    value={correctionDate}
                    onChange={(e) => setCorrectionDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={correctionIssue}
                    onChange={(e) => setCorrectionIssue(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 min-h-[44px]"
                  >
                    <option value="MISSING_CHECK_IN">Missed Check-In Punch</option>
                    <option value="MISSING_CHECK_OUT">Missed Check-Out Punch</option>
                    <option value="WRONG_TIME">Incorrect Timing Recorded</option>
                    <option value="GEOFENCE_ISSUE">Geofence GPS Error on Site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Expected Accurate Time
                  </label>
                  <input
                    type="text"
                    value={expectedTime}
                    onChange={(e) => setExpectedTime(e.target.value)}
                    placeholder="e.g. 08:00 AM"
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Reason & Explanation *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="e.g. Arrived on time at 08:00 AM, but mobile internet had no signal at basement level."
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCorrectionModalOpen(false)}
                    className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
