import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Fingerprint,
  Calendar,
  Compass,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Download,
  DollarSign,
  Search,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Worker,
  AttendanceRecord,
  Project,
  UserRole,
} from "../../types";
import { pdfService } from "../../services/pdfService";

interface AttendanceDashboardProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  project: Project;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenTerminal: () => void;
  onOpenGeofenceModal: () => void;
  onSelectWorkerForProfile: (worker: Worker) => void;
  userRole: UserRole;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({
  workers = [],
  attendance = [],
  project,
  selectedDate,
  onDateChange,
  onOpenTerminal,
  onOpenGeofenceModal,
  onSelectWorkerForProfile,
  userRole,
}) => {
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const [tradeFilter, setTradeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Attendance for selected date
  const dayRecords = safeAttendance.filter((a) => a && a.date === selectedDate);

  // Workforce stats for selected date
  const totalWorkers = safeWorkers.length;
  const presentCount = dayRecords.filter(
    (a) => a.status === "present" || a.status === "overtime"
  ).length;
  const halfDayCount = dayRecords.filter((a) => a.status === "half_day").length;
  const absentCount = dayRecords.filter((a) => a.status === "absent").length;
  const leaveCount = dayRecords.filter((a) => a.status === "leave").length;
  const notMarkedCount = Math.max(0, totalWorkers - dayRecords.length);
  const totalWageOutlayToday = dayRecords.reduce(
    (sum, a) => sum + (a.calculatedWage || 0),
    0
  );

  const biometricCount = dayRecords.filter((a) => a.method === "Biometric").length;
  const gpsCount = dayRecords.filter((a) => a.method === "GPS").length;
  const manualCount = dayRecords.filter(
    (a) => a.method === "Manual" || !a.method
  ).length;

  const attendanceRate =
    totalWorkers > 0
      ? Math.round(((presentCount + halfDayCount * 0.5) / totalWorkers) * 100)
      : 0;

  // Trade-wise distribution data for charts
  const tradesMap = new Map<string, { total: number; present: number }>();
  safeWorkers.forEach((w) => {
    if (!w) return;
    const prev = tradesMap.get(w.role) || { total: 0, present: 0 };
    const isPresent = dayRecords.some(
      (a) => a.workerId === w.id && (a.status === "present" || a.status === "overtime" || a.status === "half_day")
    );
    tradesMap.set(w.role, {
      total: prev.total + 1,
      present: prev.present + (isPresent ? 1 : 0),
    });
  });

  const tradeChartData = Array.from(tradesMap.entries()).map(([role, data]) => ({
    role,
    Total: data.total,
    Present: data.present,
  }));

  const methodPieData = [
    { name: "GPS Geofence", value: gpsCount, color: "#f59e0b" },
    { name: "Biometric Device", value: biometricCount, color: "#10b981" },
    { name: "Manual / Direct", value: manualCount, color: "#64748b" },
  ].filter((d) => d.value > 0);

  // Filtered Roster
  const rosterItems = safeWorkers.filter((w) => {
    if (!w) return false;
    const record = dayRecords.find((a) => a.workerId === w.id);
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.employeeId && w.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrade = tradeFilter === "all" || w.role === tradeFilter;

    let matchesStatus = true;
    if (statusFilter === "present") {
      matchesStatus = record?.status === "present" || record?.status === "overtime";
    } else if (statusFilter === "half_day") {
      matchesStatus = record?.status === "half_day";
    } else if (statusFilter === "absent") {
      matchesStatus = record?.status === "absent" || !record;
    } else if (statusFilter === "leave") {
      matchesStatus = record?.status === "leave";
    }

    let matchesMethod = true;
    if (methodFilter !== "all") {
      matchesMethod = record?.method === methodFilter;
    }

    return matchesSearch && matchesTrade && matchesStatus && matchesMethod;
  });

  const handleExportPDF = () => {
    pdfService.generateLaborReport(project, safeWorkers, safeAttendance, selectedDate);
  };

  const handleExportCSV = () => {
    const headers = [
      "Labour ID",
      "Name",
      "Trade",
      "Date",
      "Status",
      "Check In",
      "Check Out",
      "Working Hours",
      "Overtime Hours",
      "Method",
      "GPS Distance (m)",
      "Daily Rate",
      "Calculated Wage",
    ];

    const rows = safeWorkers.map((w) => {
      const rec = dayRecords.find((a) => a.workerId === w.id);
      return [
        w.employeeId || w.id,
        `"${w.name}"`,
        `"${w.role}"`,
        selectedDate,
        rec ? rec.status.toUpperCase() : "ABSENT",
        rec?.checkIn || "--",
        rec?.checkOut || "--",
        rec?.workingHours || 0,
        rec?.overtimeHours || 0,
        rec?.method || "Unmarked",
        rec?.distanceFromSiteMeters ?? "--",
        w.dailyWage,
        rec?.calculatedWage || 0,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Daily_Attendance_Muster_${project.name.substring(0, 10)}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner with Date Picker & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Muster & Field Tracking
            </span>
            <span className="text-xs text-slate-500">
              Site Geofence Radius: {project.attendanceRadiusMeters || 100}m
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            Labour Attendance & Workforce Tracking
          </h2>
          <p className="text-xs text-slate-500">
            Real-time biometric validation, GPS satellite geofencing, and automated daily payroll calculation.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Configure Geofence */}
          <button
            onClick={onOpenGeofenceModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
            title="Configure Site Radius and Coordinates"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            Geofence ({project.attendanceRadiusMeters || 100}m)
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            CSV
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            Muster Roll PDF
          </button>

          {/* Quick Check In Action */}
          <button
            onClick={onOpenTerminal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Fingerprint className="w-4 h-4" />
            Check-In Terminal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Labour</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {totalWorkers}
          </div>
          <span className="text-[11px] text-slate-500">Enrolled on Site</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold uppercase">
            <span>Present Today</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {presentCount}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {attendanceRate}% Deployment Rate
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 text-xs font-semibold uppercase">
            <span>Half Day (4h)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {halfDayCount}
          </div>
          <span className="text-[11px] text-slate-500">Partial Shifts</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-red-500 text-xs font-semibold uppercase">
            <span>Absent / Off</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-red-500 mt-1">
            {absentCount + notMarkedCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {leaveCount > 0 ? `${leaveCount} on Leave` : "Unreported"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 text-xs font-semibold uppercase">
            <span>Method Split</span>
            <Compass className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
            {gpsCount} GPS / {biometricCount} Bio
          </div>
          <span className="text-[11px] text-slate-500">Verified Methods</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase">
            <span>Today's Wages</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalWageOutlayToday.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500">Approved Outlay</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trade Distribution Bar Chart */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Workforce Deployment by Trade Category
            </h3>
            <span className="text-[11px] text-slate-500">
              Total Enrolled vs Present Today
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="role" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    fontSize: "12px",
                    color: "#fff",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Present" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Method Breakdown */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Verification Methods
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {dayRecords.length} check-ins
            </span>
          </div>

          {methodPieData.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {methodPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              No check-ins marked yet today
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Option B — GPS Geofence
              </span>
              <span className="font-bold">{gpsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Option A — Biometric Scanner
              </span>
              <span className="font-bold">{biometricCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Muster Roll Table & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter daily roster by name, ID, or trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 w-64"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present (Full / OT)</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent / Unmarked</option>
              <option value="leave">On Leave</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Methods</option>
              <option value="GPS">GPS Geofence</option>
              <option value="Biometric">Biometric Scanner</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Emp ID & Name</th>
                <th className="p-3">Trade / Role</th>
                <th className="p-3">Attendance Status</th>
                <th className="p-3">Check-In / Out</th>
                <th className="p-3">Verification Method</th>
                <th className="p-3">GPS Proximity</th>
                <th className="p-3 text-right">Computed Wage</th>
                <th className="p-3 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {rosterItems.map((worker) => {
                const rec = dayRecords.find((a) => a.workerId === worker.id);
                return (
                  <tr
                    key={worker.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition cursor-pointer"
                    onClick={() => onSelectWorkerForProfile(worker)}
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {worker.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {worker.employeeId || `LAB-${worker.id.slice(-4)}`}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                        {worker.role}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          rec?.status === "present" || rec?.status === "overtime"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700"
                            : rec?.status === "half_day"
                            ? "bg-amber-100 text-amber-700"
                            : rec?.status === "leave"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {rec ? rec.status.toUpperCase() : "ABSENT"}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[11px]">
                      {rec?.checkIn || "--"} {rec?.checkOut ? `→ ${rec.checkOut}` : ""}
                    </td>

                    <td className="p-3">
                      {rec?.method ? (
                        <div className="flex items-center gap-1">
                          {rec.method === "Biometric" ? (
                            <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Compass className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {rec.method}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unrecorded</span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-[11px]">
                      {rec?.distanceFromSiteMeters !== undefined ? (
                        <span className="text-emerald-600 font-semibold">
                          {rec.distanceFromSiteMeters} m from site
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      ₹{rec?.calculatedWage || 0}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkerForProfile(worker);
                        }}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
