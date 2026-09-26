import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  ArrowRightLeft,
  Edit2,
  Trash2,
  ShieldCheck,
  Bell,
  BellRing,
  MoreVertical,
  Fingerprint,
} from "lucide-react";
import { Worker, AttendanceRecord, Project, UserRole } from "../../types";
import { rosterService } from "../../services/rosterService";
import { reminderService } from "../../services/reminderService";

interface LabourDirectoryViewProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  projects: Project[];
  activeProject: Project;
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
  onTransferWorker: (
    workerId: string,
    newProjectId: string,
    newSiteId?: string,
    newSiteName?: string
  ) => void;
  onSelectWorkerForProfile: (worker: Worker) => void;
  userRole: UserRole;
  currentDate?: string;
}

export const LabourDirectoryView: React.FC<LabourDirectoryViewProps> = ({
  workers = [],
  attendance = [],
  projects = [],
  activeProject,
  onSaveWorker,
  onDeleteWorker,
  onTransferWorker,
  onSelectWorkerForProfile,
  userRole,
  currentDate = new Date().toISOString().split("T")[0],
}) => {
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const [searchQuery, setSearchQuery] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Push notification permission prompt modal
  const [permissionModalWorker, setPermissionModalWorker] = useState<Worker | null>(null);

  // Add / Edit Modal
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<Partial<Worker>>({
    name: "",
    role: "Mason",
    phone: "",
    dailyWage: 850,
    overtimeHourlyRate: 150,
    employeeId: "",
    status: "active",
    biometricRegistered: true,
  });

  const canManage =
    userRole === "admin" ||
    userRole === "project_manager" ||
    userRole === "site_engineer" ||
    userRole === "contractor";

  const tradesList = [
    "Mason",
    "Helper",
    "General Labour",
    "Electrician",
    "Plumber",
    "Carpenter",
    "Welder",
    "Painter",
    "Machine Operator",
    "Supervisor",
    "Steel Fixer / Barbender",
    "Other",
  ];

  // Map today's rosters for workers
  const todayRosters = rosterService.getRosters(activeProject.id, currentDate);

  // Compute stats
  const totalLabour = safeWorkers.length;
  let presentToday = 0;
  let absentToday = 0;
  let lateToday = 0;
  let onLeaveToday = 0;
  let notCheckedInToday = 0;

  safeWorkers.forEach((w) => {
    const att = safeAttendance.find(
      (a) => a.workerId === w.id && (a.date === currentDate || a.attendanceDate === currentDate)
    );
    const roster = todayRosters.find((r) => r.workerId === w.id);

    if (roster?.shift === "Leave" || w.status === "on_leave" || w.status === "leave" || att?.status === "on_leave" || att?.status === "leave") {
      onLeaveToday++;
    } else if (att?.status === "present" || att?.status === "overtime") {
      presentToday++;
    } else if (att?.status === "half_day") {
      presentToday++;
    } else if (att?.status === "absent") {
      absentToday++;
    } else if (!att || !att.checkIn) {
      notCheckedInToday++;
    }
  });

  // Filtered workers list
  const filteredWorkers = safeWorkers.filter((w) => {
    if (!w) return false;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.employeeId && w.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phone.includes(searchQuery);

    const matchesTrade = tradeFilter === "all" || w.role.toLowerCase().includes(tradeFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;

    const roster = todayRosters.find((r) => r.workerId === w.id);
    const matchesShift = shiftFilter === "all" || (roster && roster.shift === shiftFilter);

    return matchesSearch && matchesTrade && matchesStatus && matchesShift;
  });

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({
      name: "",
      role: "Mason",
      phone: "+91 ",
      dailyWage: 850,
      overtimeHourlyRate: 150,
      employeeId: `LAB-${Math.floor(100 + Math.random() * 900)}`,
      status: "active",
      biometricRegistered: true,
      projectId: activeProject.id,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setEditingWorker(w);
    setFormData({ ...w });
    setIsAddEditModalOpen(true);
  };

  const handleSaveWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const saved: Worker = {
      id: editingWorker ? editingWorker.id : `w-${Date.now()}`,
      projectId: activeProject.id,
      name: formData.name || "",
      role: formData.role || "Mason",
      phone: formData.phone || "",
      dailyWage: Number(formData.dailyWage) || 850,
      overtimeHourlyRate: Number(formData.overtimeHourlyRate) || 150,
      employeeId: formData.employeeId || `LAB-${Math.floor(100 + Math.random() * 900)}`,
      status: formData.status || "active",
      biometricRegistered: formData.biometricRegistered ?? true,
      joiningDate: editingWorker?.joiningDate || currentDate,
      siteId: activeProject.sites?.[0]?.id || "site-101-a",
      siteName: activeProject.sites?.[0]?.name || activeProject.name,
    };

    onSaveWorker(saved);
    setIsAddEditModalOpen(false);
  };

  const handleTogglePush = async (w: Worker) => {
    const isEnabled = reminderService.isWorkerPushEnabled(w.id);
    if (isEnabled) {
      reminderService.toggleDevicePush(w.id, false);
      // force re-render
      setSearchQuery((q) => q + "");
    } else {
      setPermissionModalWorker(w);
    }
  };

  const handleGrantPushPermission = async () => {
    if (!permissionModalWorker) return;
    await reminderService.registerPushDevice({
      id: permissionModalWorker.id,
      name: permissionModalWorker.name,
      phone: permissionModalWorker.phone,
    });
    setPermissionModalWorker(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Labour Management Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Labour</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalLabour}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Assigned to site</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {presentToday}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-500/80 mt-0.5">
            {totalLabour > 0 ? `${Math.round((presentToday / totalLabour) * 100)}% muster rate` : "0%"}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Not Checked In</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {notCheckedInToday}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-500/80 mt-0.5">
            Automated reminders active
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Absent Today</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {absentToday}
          </div>
          <div className="text-[11px] text-red-500 mt-0.5">Unscheduled absence</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>On Leave</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {onLeaveToday}
          </div>
          <div className="text-[11px] text-purple-500 mt-0.5">Approved leave/rest</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Smartphone Push</span>
            <Smartphone className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-2">
            {safeWorkers.filter((w) => reminderService.isWorkerPushEnabled(w.id)).length}
          </div>
          <div className="text-[11px] text-sky-600 mt-0.5">Registered devices</div>
        </div>
      </div>

      {/* 2. Search, Filter and Actions Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2.5 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search labour by name, worker ID, trade, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Trades</option>
            {tradesList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Shifts</option>
            <option value="Morning">Morning Shift (08:00 AM)</option>
            <option value="Afternoon">Afternoon Shift (12:00 PM)</option>
            <option value="Evening">Evening Shift (04:00 PM)</option>
            <option value="Night">Night Shift (10:00 PM)</option>
            <option value="Leave">Leave / OFF</option>
          </select>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            id="btn-add-labour"
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Labour
          </button>
        )}
      </div>

      {/* 3. Labour Management: Desktop Table + Mobile Cards */}
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Worker ID & Name</th>
                <th className="py-3 px-3">Trade</th>
                <th className="py-3 px-3">Assigned Project</th>
                <th className="py-3 px-3">Shift</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Smartphone Push Status</th>
                <th className="py-3 px-3">Today's Attendance</th>
                <th className="py-3 px-3">Check-In / Out</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No labour matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => {
                  const att = safeAttendance.find(
                    (a) =>
                      a.workerId === worker.id &&
                      (a.date === currentDate || a.attendanceDate === currentDate)
                  );
                  const roster = todayRosters.find((r) => r.workerId === worker.id);
                  const isPushEnabled = reminderService.isWorkerPushEnabled(worker.id);

                  let attendanceBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Clock className="w-3 h-3" /> Not Checked In
                    </span>
                  );

                  if (att?.status === "present") {
                    attendanceBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Present
                      </span>
                    );
                  } else if (att?.status === "half_day") {
                    attendanceBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Half Day
                      </span>
                    );
                  } else if (att?.status === "absent") {
                    attendanceBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        <XCircle className="w-3 h-3" /> Absent
                      </span>
                    );
                  } else if (roster?.shift === "Leave" || att?.status === "on_leave") {
                    attendanceBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <Calendar className="w-3 h-3" /> Approved Leave
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={worker.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Worker ID & Name */}
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer"
                          onClick={() => onSelectWorkerForProfile(worker)}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                            {worker.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition flex items-center gap-1.5">
                              {worker.name}
                              {worker.biometricRegistered && (
                                <span title="Biometrics Registered">
                                  <Fingerprint className="w-3 h-3 text-emerald-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {worker.employeeId || worker.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trade */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {worker.role}
                        </span>
                      </td>

                      {/* Assigned Project */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {activeProject.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {worker.siteName || activeProject.sites?.[0]?.name || "Main Site"}
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-3">
                        {roster ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {roster.shift}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {roster.startTime} – {roster.endTime}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <a
                            href={`tel:${worker.phone}`}
                            className="font-mono text-[11px] hover:underline hover:text-blue-600"
                          >
                            {worker.phone}
                          </a>
                        </div>
                      </td>

                      {/* Smartphone Push Status */}
                      <td className="py-3 px-3">
                        {isPushEnabled ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Enabled
                            </span>
                            <button
                              onClick={() => handleTogglePush(worker)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                              title="Turn off reminders for this smartphone"
                            >
                              Disable
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTogglePush(worker)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition border border-blue-200 dark:border-blue-800"
                          >
                            <BellRing className="w-3 h-3" />
                            Enable Notifications
                          </button>
                        )}
                      </td>

                      {/* Today's Attendance */}
                      <td className="py-3 px-3">{attendanceBadge}</td>

                      {/* Check-In / Out */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {att ? (
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {att.checkIn || "--"}
                            </span>
                            {" → "}
                            <span className="text-slate-500">{att.checkOut || "--"}</span>
                          </div>
                        ) : (
                          <span>--</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectWorkerForProfile(worker)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="View Profile & Full Attendance"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(worker)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition"
                                title="Edit Worker Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteWorker(worker.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="Delete Labour Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No labour matching your filter criteria.
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const att = safeAttendance.find(
              (a) =>
                a.workerId === worker.id &&
                (a.date === currentDate || a.attendanceDate === currentDate)
            );
            const roster = todayRosters.find((r) => r.workerId === worker.id);
            const isPushEnabled = reminderService.isWorkerPushEnabled(worker.id);

            let attendanceBadge = (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Clock className="w-3 h-3" /> Not Checked In
              </span>
            );

            if (att?.status === "present") {
              attendanceBadge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Present
                </span>
              );
            } else if (att?.status === "half_day") {
              attendanceBadge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Half Day
                </span>
              );
            } else if (att?.status === "absent") {
              attendanceBadge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  <XCircle className="w-3 h-3" /> Absent
                </span>
              );
            } else if (roster?.shift === "Leave" || att?.status === "on_leave") {
              attendanceBadge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Calendar className="w-3 h-3" /> Approved Leave
                </span>
              );
            }

            return (
              <div
                key={worker.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                    onClick={() => onSelectWorkerForProfile(worker)}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {worker.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm truncate">
                        <span>{worker.name}</span>
                        {worker.biometricRegistered && (
                          <Fingerprint className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                          {worker.role}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {worker.employeeId || worker.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">{attendanceBadge}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Shift</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {roster?.shift || "Standard"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {roster ? `${roster.startTime}–${roster.endTime}` : "08:00 AM – 05:00 PM"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Wage</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{worker.dailyWage}</span>
                    <span className="text-[10px] text-slate-400 block">+ ₹{worker.overtimeHourlyRate}/hr OT</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <a
                    href={`tel:${worker.phone}`}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-mono text-[11px] min-h-[36px] px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{worker.phone}</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectWorkerForProfile(worker)}
                      className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition"
                    >
                      Profile
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(worker)}
                          className="min-h-[36px] p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete worker ${worker.name}?`)) {
                              onDeleteWorker(worker.id);
                            }
                          }}
                          className="min-h-[36px] p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Push Notification Permission Modal */}
      {permissionModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <BellRing className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Enable Attendance Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                InfraMate can send <strong className="text-slate-800 dark:text-slate-200">{permissionModalWorker.name}</strong> reminders directly to their registered smartphone about:
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Shift check-in reminders (10, 15, or 20 min interval)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Shift check-out reminders at shift completion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Roster changes and shift updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Attendance correction status updates</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPermissionModalWorker(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Not Now
              </button>
              <button
                onClick={handleGrantPushPermission}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                Allow Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Labour Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                {editingWorker ? "Edit Labour Details" : "Register New Labour"}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveWorkerSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Worker Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Worker ID / Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId || ""}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="LAB-109"
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Trade / Skill *
                  </label>
                  <select
                    value={formData.role || "Mason"}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    {tradesList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Phone Number (Smartphone) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98111 22334"
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Daily Wage (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={300}
                    value={formData.dailyWage || 850}
                    onChange={(e) => setFormData({ ...formData, dailyWage: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Overtime Rate (₹ / hr)
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={formData.overtimeHourlyRate || 150}
                    onChange={(e) =>
                      setFormData({ ...formData, overtimeHourlyRate: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {editingWorker ? "Save Changes" : "Create Labour Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
