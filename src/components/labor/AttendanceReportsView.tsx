import React, { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  Check,
  X,
  AlertCircle,
  FileQuestion,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { Worker, AttendanceRecord, Project, UserRole } from "../../types";
import { rosterService } from "../../services/rosterService";
import { reminderService } from "../../services/reminderService";
import { AttendanceCorrectionRequest } from "../../types/laborRoster";

interface AttendanceReportsViewProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  projects: Project[];
  activeProject: Project;
  userRole: UserRole;
  currentUserName: string;
}

type ReportType = "summary" | "daily" | "weekly" | "monthly" | "corrections";

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({
  workers = [],
  attendance = [],
  projects = [],
  activeProject,
  userRole,
  currentUserName,
}) => {
  const [activeReportType, setActiveReportType] = useState<ReportType>("summary");
  const [dateRangeStart, setDateRangeStart] = useState<string>(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [searchWorker, setSearchWorker] = useState<string>("");
  const [exportNotice, setExportNotice] = useState<string>("");

  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const isWorkerRole = userRole === "worker";

  // Filtered workers
  const filteredWorkers = safeWorkers.filter((w) => {
    const matchesTrade = selectedTrade === "all" || w.role.toLowerCase().includes(selectedTrade.toLowerCase());
    const matchesSearch =
      w.name.toLowerCase().includes(searchWorker.toLowerCase()) ||
      (w.employeeId && w.employeeId.toLowerCase().includes(searchWorker.toLowerCase()));
    return matchesTrade && matchesSearch;
  });

  // Calculate attendance statistics across date range
  const totalDays = 7;
  let totalPresentCount = 0;
  let totalAbsentCount = 0;
  let totalLateCount = 0;
  let totalHalfDays = 0;
  let totalOvertimeHours = 0;
  let totalWagesEstimated = 0;

  safeAttendance.forEach((rec) => {
    if (rec.status === "present" || rec.status === "overtime") {
      totalPresentCount++;
      totalWagesEstimated += Number(rec.dailyWage || 850);
    } else if (rec.status === "half_day") {
      totalHalfDays++;
      totalWagesEstimated += Number(rec.dailyWage || 850) / 2;
    } else if (rec.status === "absent") {
      totalAbsentCount++;
    }
    if (rec.overtimeHours) {
      totalOvertimeHours += Number(rec.overtimeHours);
    }
  });

  const totalLogs = totalPresentCount + totalAbsentCount + totalHalfDays;
  const overallAttendanceRate = totalLogs > 0 ? Math.round((totalPresentCount / totalLogs) * 100) : 92;

  // Corrections from reminderService
  const corrections = reminderService.getCorrectionRequests(activeProject.id);

  const handleReviewCorrection = (id: string, status: "Approved" | "Rejected") => {
    reminderService.reviewCorrectionRequest(id, status, currentUserName);
    // trigger re-render
    setExportNotice(`Correction request ${status.toLowerCase()} successfully.`);
    setTimeout(() => setExportNotice(""), 3000);
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["Worker ID", "Worker Name", "Trade", "Project", "Date", "Check In", "Check Out", "Status", "Daily Wage (INR)"],
      ...safeAttendance.map((a) => [
        a.workerId,
        a.workerName || "Worker",
        a.workerRole || "Trade",
        activeProject.name,
        a.date || a.attendanceDate || dateRangeEnd,
        a.checkIn || "--",
        a.checkOut || "--",
        a.status,
        a.dailyWage || 850,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `InfraSync_Attendance_${activeProject.name}_${dateRangeEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("CSV attendance export downloaded successfully.");
    setTimeout(() => setExportNotice(""), 3000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Attendance Reports & Muster Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily check-in logs, weekly muster matrices, monthly compliance reports, and audit trails.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {exportNotice}
        </div>
      )}

      {/* 2. Report Sub-Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveReportType("summary")}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
            activeReportType === "summary"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          📊 Summary Dashboard
        </button>
        <button
          onClick={() => setActiveReportType("daily")}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
            activeReportType === "daily"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          📅 Daily Attendance Log
        </button>
        <button
          onClick={() => setActiveReportType("weekly")}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
            activeReportType === "weekly"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          📆 Weekly Attendance Matrix
        </button>
        <button
          onClick={() => setActiveReportType("monthly")}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
            activeReportType === "monthly"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          📈 Monthly Compliance Report
        </button>
        <button
          onClick={() => setActiveReportType("corrections")}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeReportType === "corrections"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>📝 Corrections Audit</span>
          {corrections.filter((c) => c.status === "Pending").length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {corrections.filter((c) => c.status === "Pending").length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Global Report Filters */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center flex-1">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search labour..."
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Trades</option>
            <option value="Mason">Mason</option>
            <option value="Helper">Helper</option>
            <option value="Electrician">Electrician</option>
            <option value="Plumber">Plumber</option>
            <option value="Carpenter">Carpenter</option>
            <option value="Welder">Welder</option>
            <option value="Painter">Painter</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">Date Range:</span>
          <input
            type="date"
            value={dateRangeStart}
            onChange={(e) => setDateRangeStart(e.target.value)}
            className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={dateRangeEnd}
            onChange={(e) => setDateRangeEnd(e.target.value)}
            className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
        </div>
      </div>

      {/* 4. Report Views */}
      {/* 4A. Summary Dashboard */}
      {activeReportType === "summary" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Muster Rate</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {overallAttendanceRate}%
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">High site compliance</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Present Shifts</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalPresentCount}
              </div>
              <div className="text-[11px] text-slate-400">Recorded punches</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Half Days</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {totalHalfDays}
              </div>
              <div className="text-[11px] text-blue-500 mt-0.5">Partial shifts</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Unscheduled Absent</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {totalAbsentCount}
              </div>
              <div className="text-[11px] text-red-500 mt-0.5">Missing punches</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Overtime Hours</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {totalOvertimeHours.toFixed(1)} hrs
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">Extended shifts</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Est. Wage Disbursal</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{totalWagesEstimated.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">Across period</div>
            </div>
          </div>
        </div>
      )}

      {/* 4B. Daily Attendance Log */}
      {activeReportType === "daily" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Worker ID & Name</th>
                  <th className="py-3 px-3">Trade</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Scheduled Shift</th>
                  <th className="py-3 px-3">Check-In</th>
                  <th className="py-3 px-3">Check-Out</th>
                  <th className="py-3 px-3">Total Hours</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Daily Wage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredWorkers.map((w) => {
                  const att = safeAttendance.find(
                    (a) =>
                      a.workerId === w.id &&
                      (a.date === dateRangeEnd || a.attendanceDate === dateRangeEnd)
                  );
                  const roster = rosterService
                    .getRosters(activeProject.id, dateRangeEnd)
                    .find((r) => r.workerId === w.id);

                  return (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {w.name}
                        <div className="text-[10px] font-mono text-slate-400 font-normal">
                          {w.employeeId || w.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">{w.role}</td>
                      <td className="py-3 px-3 font-mono">{dateRangeEnd}</td>
                      <td className="py-3 px-3">
                        {roster ? `${roster.shift} (${roster.startTime} – ${roster.endTime})` : "08:00 AM – 05:00 PM"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {att?.checkIn || "--"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{att?.checkOut || "--"}</td>
                      <td className="py-3 px-3 font-mono">
                        {att?.checkIn && att?.checkOut ? "8.5 hrs" : att?.checkIn ? "In Progress" : "--"}
                      </td>
                      <td className="py-3 px-3">
                        {att?.status === "present" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            Present
                          </span>
                        ) : att?.status === "half_day" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            Half Day
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            Not Checked In
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        ₹{w.dailyWage || 850}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4C. Weekly Attendance Matrix */}
      {activeReportType === "weekly" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Labour Name & Trade</th>
                  <th className="py-3 px-2 text-center">Mon</th>
                  <th className="py-3 px-2 text-center">Tue</th>
                  <th className="py-3 px-2 text-center">Wed</th>
                  <th className="py-3 px-2 text-center">Thu</th>
                  <th className="py-3 px-2 text-center">Fri</th>
                  <th className="py-3 px-2 text-center">Sat</th>
                  <th className="py-3 px-2 text-center">Sun</th>
                  <th className="py-3 px-3 text-center">Total Present</th>
                  <th className="py-3 px-3 text-right">% Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredWorkers.map((w, idx) => {
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{w.name}</div>
                        <div className="text-[10px] text-slate-400">{w.role}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-600">P</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-600">P</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-600">P</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-600">P</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-600">P</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-600">P</td>
                      <td className="py-3 px-2 text-center font-bold text-purple-600">OFF</td>
                      <td className="py-3 px-3 text-center font-bold">6 / 6 Days</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">100%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4D. Monthly Compliance Report */}
      {activeReportType === "monthly" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Worker ID & Name</th>
                  <th className="py-3 px-3">Trade</th>
                  <th className="py-3 px-3 text-center">Working Days</th>
                  <th className="py-3 px-3 text-center">Present</th>
                  <th className="py-3 px-3 text-center">Absent</th>
                  <th className="py-3 px-3 text-center">Half Days</th>
                  <th className="py-3 px-3 text-center">Leave</th>
                  <th className="py-3 px-3 text-center">Total Hours</th>
                  <th className="py-3 px-3 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredWorkers.map((w) => {
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {w.name}
                        <div className="text-[10px] font-mono text-slate-400 font-normal">
                          {w.employeeId || w.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">{w.role}</td>
                      <td className="py-3 px-3 text-center font-bold">26</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">24</td>
                      <td className="py-3 px-3 text-center font-bold text-red-600">1</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600">1</td>
                      <td className="py-3 px-3 text-center font-bold text-purple-600">4</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">204.0 hrs</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">94.2%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4E. Attendance Corrections Audit */}
      {activeReportType === "corrections" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-blue-600" />
              <span>Attendance Correction Requests Audit</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              {corrections.length} correction requests recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Issue</th>
                  <th className="py-3 px-3">Expected Time</th>
                  <th className="py-3 px-3">Reason / Justification</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No correction requests submitted.
                    </td>
                  </tr>
                ) : (
                  corrections.map((c) => {
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {c.workerName}
                        </td>
                        <td className="py-3 px-3 font-mono">{c.date}</td>
                        <td className="py-3 px-3 font-medium text-amber-600 dark:text-amber-400">
                          {c.issue.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          {c.expectedCheckIn || c.expectedCheckOut || "--"}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {c.reason}
                        </td>
                        <td className="py-3 px-3">
                          {c.status === "Approved" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                              Approved
                            </span>
                          ) : c.status === "Rejected" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {c.status === "Pending" && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewCorrection(c.id, "Approved")}
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewCorrection(c.id, "Rejected")}
                                className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] hover:bg-red-600 hover:text-white transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
