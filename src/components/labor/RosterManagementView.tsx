import React, { useState } from "react";
import {
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Filter,
  Search,
  Sparkles,
  Users,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Worker, Project, UserRole } from "../../types";
import {
  RosterEntry,
  ShiftType,
  RosterStatus,
} from "../../types/laborRoster";
import { rosterService, SHIFT_TIMINGS } from "../../services/rosterService";

interface RosterManagementViewProps {
  workers: Worker[];
  project: Project;
  userRole: UserRole;
  currentUserName: string;
  workerId?: string; // If logged in as worker
}

export const RosterManagementView: React.FC<RosterManagementViewProps> = ({
  workers = [],
  project,
  userRole,
  currentUserName,
  workerId,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  // Selected for bulk publishing
  const [selectedRosterIds, setSelectedRosterIds] = useState<string[]>([]);

  // Modals
  const [isAddRosterModalOpen, setIsAddRosterModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<RosterEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<RosterEntry>>({
    workerId: workers[0]?.id || "",
    shift: "Morning",
    date: selectedDate,
    startTime: "08:00 AM",
    endTime: "05:00 PM",
    breakDurationMinutes: 60,
    siteLocation: project.sites?.[0]?.name || project.name,
    status: "Draft",
    notes: "",
  });

  const isWorkerOnly = userRole === "worker";
  const canManage =
    userRole === "admin" ||
    userRole === "project_manager" ||
    userRole === "site_engineer" ||
    userRole === "contractor";

  // Retrieve rosters
  const allRosters = rosterService.getRosters(project.id);

  // If worker, filter strictly to this worker
  const activeWorkerId = isWorkerOnly ? (workerId || workers[0]?.id) : null;

  const relevantRosters = activeWorkerId
    ? allRosters.filter((r) => r.workerId === activeWorkerId)
    : allRosters;

  const dailyRosters = relevantRosters.filter((r) => r.date === selectedDate);

  const filteredDailyRosters = dailyRosters.filter((r) => {
    const matchesSearch =
      r.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workerRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShift = shiftFilter === "all" || r.shift === shiftFilter;
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesShift && matchesStatus;
  });

  // Shift breakdown counts for selected date
  const morningCount = dailyRosters.filter((r) => r.shift === "Morning").length;
  const afternoonCount = dailyRosters.filter((r) => r.shift === "Afternoon").length;
  const nightCount = dailyRosters.filter((r) => r.shift === "Night").length;
  const restCount = dailyRosters.filter((r) => r.shift === "OFF" || r.shift === "Leave").length;
  const publishedCount = dailyRosters.filter((r) => r.status === "Published").length;
  const draftCount = dailyRosters.filter((r) => r.status === "Draft").length;

  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleOpenAddRoster = () => {
    setEditingRoster(null);
    setFormData({
      workerId: workers[0]?.id || "",
      shift: "Morning",
      date: selectedDate,
      startTime: "08:00 AM",
      endTime: "05:00 PM",
      breakDurationMinutes: 60,
      siteLocation: project.sites?.[0]?.name || project.name,
      status: "Draft",
      notes: "",
    });
    setIsAddRosterModalOpen(true);
  };

  const handleOpenEditRoster = (r: RosterEntry) => {
    setEditingRoster(r);
    setFormData({ ...r });
    setIsAddRosterModalOpen(true);
  };

  const handleShiftChange = (shift: ShiftType) => {
    const timing = SHIFT_TIMINGS[shift] || SHIFT_TIMINGS["Morning"];
    setFormData({
      ...formData,
      shift,
      startTime: timing.startTime,
      endTime: timing.endTime,
      breakDurationMinutes: timing.breakMinutes,
    });
  };

  const handleSaveRosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetWorker = workers.find((w) => w.id === formData.workerId);
    if (!targetWorker) return;

    const saved: RosterEntry = {
      id: editingRoster ? editingRoster.id : `rst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workerId: targetWorker.id,
      workerName: targetWorker.name,
      workerRole: targetWorker.role,
      workerPhone: targetWorker.phone,
      projectId: project.id,
      projectName: project.name,
      siteLocation: formData.siteLocation || project.name,
      date: formData.date || selectedDate,
      shift: formData.shift || "Morning",
      startTime: formData.startTime || "08:00 AM",
      endTime: formData.endTime || "05:00 PM",
      breakDurationMinutes: Number(formData.breakDurationMinutes) || 60,
      status: formData.status || "Draft",
      notes: formData.notes,
      createdAt: editingRoster?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    rosterService.saveRoster(saved, currentUserName);
    setIsAddRosterModalOpen(false);
  };

  const handlePublishSingle = (rosterId: string) => {
    rosterService.publishRosters([rosterId], currentUserName);
    // force re-render
    setSelectedDate((d) => d + "");
  };

  const handlePublishBulk = () => {
    const idsToPublish =
      selectedRosterIds.length > 0
        ? selectedRosterIds
        : dailyRosters.filter((r) => r.status === "Draft").map((r) => r.id);

    if (idsToPublish.length === 0) return;
    rosterService.publishRosters(idsToPublish, currentUserName);
    setSelectedRosterIds([]);
    setSelectedDate((d) => d + "");
  };

  const handleBatchGenerate = (shift: ShiftType) => {
    rosterService.batchAssignWeekRosters(
      workers,
      project,
      selectedDate,
      shift,
      currentUserName
    );
    setIsBatchModalOpen(false);
    setSelectedDate((d) => d + "");
  };

  const handleDeleteRoster = (id: string) => {
    rosterService.deleteRoster(id, currentUserName);
    setSelectedDate((d) => d + "");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isWorkerOnly ? "My Shift Roster" : "Worker Roster & Shift Planning"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {project.name}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isWorkerOnly
                ? "View your assigned shifts, scheduled hours, and site location."
                : "Assign, schedule, and publish shifts. Auto-dispatches smartphone push notifications to workers."}
            </p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateShift(-1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => handleDateShift(1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* 2. Roster Shift KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Total Scheduled
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {dailyRosters.length}
          </div>
          <div className="text-[10px] text-slate-400">Workers scheduled</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            Morning Shift
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {morningCount}
          </div>
          <div className="text-[10px] text-slate-400">08:00 AM – 05:00 PM</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            Afternoon Shift
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {afternoonCount}
          </div>
          <div className="text-[10px] text-slate-400">12:00 PM – 08:00 PM</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            Night Shift
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {nightCount}
          </div>
          <div className="text-[10px] text-slate-400">10:00 PM – 06:00 AM</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            Rest / Leave (OFF)
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {restCount}
          </div>
          <div className="text-[10px] text-slate-400">Approved rest days</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Published Rosters
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {publishedCount} / {dailyRosters.length}
          </div>
          <div className="text-[10px] text-slate-400">
            {draftCount > 0 ? `${draftCount} pending publish` : "All published"}
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar (for Contractors/Admins) */}
      {!isWorkerOnly && canManage && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-2.5 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search worker by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Shifts</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
              <option value="Full Day">Full Day</option>
              <option value="Leave">Leave</option>
              <option value="OFF">Rest (OFF)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition text-xs font-bold border border-purple-200 dark:border-purple-800"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Batch Week Roster
            </button>

            {draftCount > 0 && (
              <button
                onClick={handlePublishBulk}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-bold shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Publish All Drafts ({draftCount})
              </button>
            )}

            <button
              onClick={handleOpenAddRoster}
              id="btn-add-roster"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Shift Roster
            </button>
          </div>
        </div>
      )}

      {/* 4. Roster Schedule Table / Worker Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Worker & Trade</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Shift Type</th>
                <th className="py-3 px-3">Scheduled Hours</th>
                <th className="py-3 px-3">Site Location</th>
                <th className="py-3 px-3">Break Duration</th>
                <th className="py-3 px-3">Roster Status</th>
                {!isWorkerOnly && <th className="py-3 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredDailyRosters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No shifts scheduled for {selectedDate}.
                    {!isWorkerOnly && canManage && (
                      <div className="mt-3">
                        <button
                          onClick={handleOpenAddRoster}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs"
                        >
                          + Create Shift for Today
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDailyRosters.map((roster) => {
                  return (
                    <tr
                      key={roster.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {roster.workerName}
                        </div>
                        <div className="text-[10px] text-slate-400">{roster.workerRole}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">{roster.date}</td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            roster.shift === "Morning"
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                              : roster.shift === "Afternoon"
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                              : roster.shift === "Night"
                              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                              : roster.shift === "Leave" || roster.shift === "OFF"
                              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {roster.shift}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {roster.startTime} – {roster.endTime}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {roster.siteLocation || project.name}
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {roster.breakDurationMinutes} mins
                      </td>

                      <td className="py-3 px-3">
                        {roster.status === "Published" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </td>

                      {!isWorkerOnly && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {roster.status === "Draft" && canManage && (
                              <button
                                onClick={() => handlePublishSingle(roster.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-[10px]"
                                title="Publish and send push notification to worker"
                              >
                                <Send className="w-3 h-3" />
                                Publish
                              </button>
                            )}

                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleOpenEditRoster(roster)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  title="Edit Shift Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoster(roster.id)}
                                  className="p-1 text-slate-400 hover:text-red-600"
                                  title="Delete Roster"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Single Roster Modal */}
      {isAddRosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                {editingRoster ? "Edit Worker Shift Roster" : "Assign Worker Shift"}
              </h3>
              <button
                onClick={() => setIsAddRosterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRosterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Worker *
                </label>
                <select
                  required
                  value={formData.workerId || ""}
                  onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role}) — {w.employeeId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Roster Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || selectedDate}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Shift Pattern *
                  </label>
                  <select
                    value={formData.shift || "Morning"}
                    onChange={(e) => handleShiftChange(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Morning">Morning (08:00 AM – 05:00 PM)</option>
                    <option value="Afternoon">Afternoon (12:00 PM – 08:00 PM)</option>
                    <option value="Evening">Evening (04:00 PM – 12:00 AM)</option>
                    <option value="Night">Night (10:00 PM – 06:00 AM)</option>
                    <option value="Full Day">Full Day (08:00 AM – 08:00 PM)</option>
                    <option value="Custom">Custom Hours</option>
                    <option value="OFF">Weekly Rest (OFF)</option>
                    <option value="Leave">Approved Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Shift Start Time
                  </label>
                  <input
                    type="text"
                    value={formData.startTime || "08:00 AM"}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Shift End Time
                  </label>
                  <input
                    type="text"
                    value={formData.endTime || "05:00 PM"}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Site / Sector Location
                </label>
                <input
                  type="text"
                  value={formData.siteLocation || ""}
                  onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                  placeholder="e.g. Main Villa RCC & Superstructure"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || "Draft"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as RosterStatus })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="Draft">Draft (Not visible to worker yet)</option>
                  <option value="Published">Published (Dispatches instant push notification)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRosterModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {editingRoster ? "Save Changes" : "Save Roster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch 7-Day Weekly Roster Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Generate 7-Day Weekly Roster
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Batch assign all {workers.length} registered workers to a shift schedule starting from{" "}
                <strong>{selectedDate}</strong> (Sunday will automatically be designated as Rest / OFF).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Standard Work Shift:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleBatchGenerate("Morning")}
                  className="p-3 text-left rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 transition"
                >
                  <div className="font-bold text-xs text-amber-700 dark:text-amber-300">
                    Morning Shift
                  </div>
                  <div className="text-[10px] text-slate-500">08:00 AM – 05:00 PM</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchGenerate("Afternoon")}
                  className="p-3 text-left rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-500 transition"
                >
                  <div className="font-bold text-xs text-blue-700 dark:text-blue-300">
                    Afternoon Shift
                  </div>
                  <div className="text-[10px] text-slate-500">12:00 PM – 08:00 PM</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchGenerate("Night")}
                  className="p-3 text-left rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-500 transition"
                >
                  <div className="font-bold text-xs text-indigo-700 dark:text-indigo-300">
                    Night Shift
                  </div>
                  <div className="text-[10px] text-slate-500">10:00 PM – 06:00 AM</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchGenerate("Full Day")}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 transition"
                >
                  <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Full Day (Extended)
                  </div>
                  <div className="text-[10px] text-slate-500">08:00 AM – 08:00 PM</div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
