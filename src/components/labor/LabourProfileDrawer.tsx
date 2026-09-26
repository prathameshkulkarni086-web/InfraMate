import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  Shield,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  FileEdit,
  History,
  CheckCircle2,
  MapPin,
  Fingerprint,
  TrendingUp,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Worker, AttendanceRecord, Project, UserRole } from "../../types";
import { attendanceService } from "../../services/attendanceService";

interface LabourProfileDrawerProps {
  worker: Worker | null;
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  attendanceHistory: AttendanceRecord[];
  onManualOverride: (
    recordId: string,
    newStatus: string,
    reason: string
  ) => void;
  userRole: UserRole;
  currentUserName: string;
}

export const LabourProfileDrawer: React.FC<LabourProfileDrawerProps> = ({
  worker,
  isOpen,
  onClose,
  project,
  attendanceHistory,
  onManualOverride,
  userRole,
  currentUserName,
}) => {
  const [selectedRecordForEdit, setSelectedRecordForEdit] =
    useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>("present");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");

  if (!isOpen || !worker) return null;

  // Filter attendance records for this worker
  const workerRecords = attendanceHistory.filter(
    (a) => a.workerId === worker.id
  );

  const canEditAttendance =
    userRole === "admin" ||
    userRole === "project_manager" ||
    userRole === "site_engineer";

  // Calculate Worker Stats
  const totalDays = workerRecords.length;
  const presentDays = workerRecords.filter(
    (a) => a.status === "present" || a.status === "overtime"
  ).length;
  const halfDays = workerRecords.filter((a) => a.status === "half_day").length;
  const absentDays = workerRecords.filter((a) => a.status === "absent").length;
  const leaveDays = workerRecords.filter((a) => a.status === "leave").length;
  const totalEarned = workerRecords.reduce(
    (sum, a) => sum + (a.calculatedWage || 0),
    0
  );
  const totalOtHours = workerRecords.reduce(
    (sum, a) => sum + (a.overtimeHours || 0),
    0
  );
  const attendanceRate =
    totalDays > 0 ? Math.round(((presentDays + halfDays * 0.5) / totalDays) * 100) : 100;

  const handleOpenOverrideModal = (record: AttendanceRecord) => {
    setSelectedRecordForEdit(record);
    setOverrideStatus(record.status);
    setOverrideReason("");
    setOverrideError(null);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForEdit) return;

    if (!overrideReason.trim()) {
      setOverrideError("A documented reason is strictly required for attendance status correction.");
      return;
    }

    onManualOverride(
      selectedRecordForEdit.id,
      overrideStatus,
      overrideReason.trim()
    );
    setSelectedRecordForEdit(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-bold text-lg">
              {worker.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {worker.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {worker.employeeId || `ID: ${worker.id.slice(-4)}`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {worker.role} • Assigned Site: {worker.siteName || project.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Quick Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Present / Total
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {presentDays} / {totalDays}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {attendanceRate}% Reliability
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Total Earned
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                ₹{totalEarned.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500">
                Daily: ₹{worker.dailyWage}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Overtime Logged
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {totalOtHours} hrs
              </div>
              <span className="text-[10px] text-amber-600 font-semibold">
                OT Rate: ₹{worker.overtimeHourlyRate || Math.round(worker.dailyWage / 8)}/hr
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Status
              </span>
              <div className="mt-1">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    worker.status === "active"
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {worker.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Workforce Credentials & Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Trade / Category:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {worker.role}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Contact Phone:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {worker.phone}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Emergency Contact:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {worker.emergencyContactName || "N/A"} ({worker.emergencyContactPhone || worker.phone})
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Blood Group:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {worker.bloodGroup || "O+"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Contractor / Sub-Agency:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {worker.contractorName || "Direct Site Hire"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Biometric Enrollment:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" />
                  {worker.biometricRegistered ? "Enrolled (ID: " + (worker.biometricId || "BIO-" + worker.id) + ")" : "Not Enrolled"}
                </span>
              </div>

              {worker.address && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Residential Address:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {worker.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Attendance Ledger & Verification Trail ({workerRecords.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Click pencil to correct record
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">In / Out</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Wage</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {workerRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">
                        No attendance records logged yet.
                      </td>
                    </tr>
                  ) : (
                    workerRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                      >
                        <td className="p-2.5 font-medium whitespace-nowrap">
                          {rec.date}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rec.status === "present" || rec.status === "overtime"
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700"
                                : rec.status === "half_day"
                                ? "bg-amber-100 text-amber-700"
                                : rec.status === "leave"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px]">
                          {rec.checkIn || "--"} - {rec.checkOut || "--"}
                        </td>
                        <td className="p-2.5">
                          <span className="text-[11px] text-slate-500 font-mono">
                            {rec.method || "Manual"}
                            {rec.distanceFromSiteMeters !== undefined && (
                              <span className="text-[10px] block opacity-80">
                                ({rec.distanceFromSiteMeters}m from center)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          ₹{rec.calculatedWage || 0}
                        </td>
                        <td className="p-2.5 text-right">
                          {canEditAttendance && (
                            <button
                              onClick={() => handleOpenOverrideModal(rec)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Override/Correct Attendance"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Override Sub-Modal */}
      {selectedRecordForEdit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Manual Attendance Override
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForEdit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              <div className="font-bold">Audit Policy Notice:</div>
              <div>
                Manual changes are logged with your user credentials ({currentUserName}) and become part of the tamper-evident audit trail.
              </div>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selected Date: {selectedRecordForEdit.date}
                </label>
                <div className="text-slate-500">
                  Current Status: <span className="font-bold">{selectedRecordForEdit.status.toUpperCase()}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corrected Attendance Status
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="half_day">Half Day (4 hrs)</option>
                  <option value="overtime">Overtime</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Approved Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Justification / Reason *
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Biometric device offline during 09:00 shift; manually verified by Site Engineer."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              {overrideError && (
                <div className="p-2 rounded bg-red-50 text-red-600 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{overrideError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForEdit(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
                >
                  Confirm & Audit Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
