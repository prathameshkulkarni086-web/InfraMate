import React, { useState } from "react";
import {
  TrendingUp,
  Plus,
  Calendar,
  Camera,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  User,
  Clock,
  Layers,
  ChevronRight,
  Upload,
  X,
  MapPin,
  Building,
  Eye,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  ProgressLog,
  Task,
  Project,
  AttendanceRecord,
  UserRole,
  User as UserType,
  SitePhoto,
} from "../../types";
import { pdfService } from "../../services/pdfService";
import { ManualOnsiteCaptureModal } from "./ManualOnsiteCaptureModal";
import { permissionService } from "../../services/permissionService";

interface ProgressViewProps {
  progressLogs: ProgressLog[];
  tasks: Task[];
  project: Project;
  attendance: AttendanceRecord[];
  onSaveProgressLog: (log: ProgressLog) => void;
  onSaveTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, status: Task["status"]) => void;
  userRole?: UserRole;
  currentUser?: UserType;
  isOpenAddModal: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progressLogs,
  tasks,
  project,
  attendance,
  onSaveProgressLog,
  onSaveTask,
  onUpdateTaskStatus,
  userRole = "admin",
  currentUser,
  isOpenAddModal,
  onCloseAddModal,
  onOpenAddModal,
}) => {
  const [activeTab, setActiveTab] = useState<"logs" | "kanban" | "gallery">("logs");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showManualCaptureModal, setShowManualCaptureModal] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<{
    photo: SitePhoto;
    log: ProgressLog;
  } | null>(null);

  // New Task Form State
  const [newTaskData, setNewTaskData] = useState<{
    title: string;
    description: string;
    assignedToName: string;
    category: string;
    priority: Task["priority"];
    dueDate: string;
  }>({
    title: "",
    description: "",
    assignedToName: "Ramesh Kumar (Mason)",
    category: "Civil & Masonry",
    priority: "medium",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  });

  const canEdit = currentUser
    ? permissionService.hasPermission(currentUser, "manage_progress") ||
      permissionService.hasPermission(currentUser, "upload_site_photos")
    : userRole === "admin" ||
      userRole === "project_manager" ||
      userRole === "site_engineer" ||
      userRole === "supervisor";

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      projectId: project.id,
      title: newTaskData.title,
      description: newTaskData.description,
      assignedTo: "usr-1",
      assignedToName: newTaskData.assignedToName,
      priority: newTaskData.priority as any,
      status: "todo",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: newTaskData.dueDate,
      completionPercentage: 0,
    };

    onSaveTask(task);
    setShowAddTaskModal(false);
    setNewTaskData({
      title: "",
      description: "",
      assignedToName: "Ramesh Kumar (Mason)",
      category: "Civil & Masonry",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    });
  };

  const handleSaveDPR = (dprLog: ProgressLog) => {
    onSaveProgressLog(dprLog);
    setShowManualCaptureModal(false);
    onCloseAddModal();
  };

  const kanbanColumns: { status: Task["status"]; title: string; headerBg: string }[] = [
    { status: "todo", title: "To Do", headerBg: "text-slate-700 bg-slate-100" },
    { status: "in_progress", title: "In Progress", headerBg: "text-amber-700 bg-amber-50" },
    { status: "review", title: "Quality Inspection", headerBg: "text-blue-700 bg-blue-50" },
    { status: "completed", title: "Completed", headerBg: "text-emerald-700 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Site Progress & Daily Progress Reports (DPR)
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Manual Verification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verified site logs, manual camera progress capture, inspection diaries, and
            Kanban milestones for <span className="text-blue-600 font-semibold">{project.name}</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {canEdit && (
            <>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 px-4 py-2.5 shadow-xs transition"
              >
                <Plus className="h-4 w-4 text-blue-600" />
                <span>Create Task</span>
              </button>

              {/* Prominent Capture Onsite Progress Button */}
              <button
                onClick={() => setShowManualCaptureModal(true)}
                className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-xs font-bold text-white px-4 py-2.5 shadow-md transition ring-2 ring-blue-600/20 cursor-pointer"
                title="Open live camera to capture and attach onsite photo to DPR"
              >
                <Camera className="h-4 w-4 text-white animate-pulse" />
                <span>Capture Onsite Progress</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Prominent Manual Progress Action Bar / Card */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>100% User-Controlled Onsite Capture</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold">
            Record Daily Site Progress with Verified Field Photos
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Snap current site progress directly with your device camera. Photos are explicitly previewed,
            confirmed by you, and permanently stamped with location & timestamp metadata into the official DPR.
          </p>
        </div>

        {canEdit && (
          <div className="z-10 shrink-0">
            <button
              onClick={() => setShowManualCaptureModal(true)}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-5 py-3 shadow-xl transition active:scale-95 cursor-pointer"
            >
              <Camera className="h-4 w-4 text-blue-600" />
              <span>Capture Onsite Progress</span>
            </button>
          </div>
        )}

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Progress & Milestone Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Project Physical Progress
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {project.progressPercentage}% Completed
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium inline-block">
              Target Completion: {project.endDate}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {progressLogs.length} Verified DPR Entries
            </div>
          </div>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${project.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 sm:p-2 shadow-sm flex items-center gap-2 text-xs font-medium overflow-x-auto touch-scroll">
        <button
          onClick={() => setActiveTab("logs")}
          className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 transition flex items-center gap-1.5 ${
            activeTab === "logs"
              ? "bg-blue-600 text-white shadow-xs font-semibold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Daily Site Diary & DPRs</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === "logs" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-700"}`}>
            {progressLogs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("kanban")}
          className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 transition flex items-center gap-1.5 ${
            activeTab === "kanban"
              ? "bg-blue-600 text-white shadow-xs font-semibold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Task Kanban Board</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === "kanban" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-700"}`}>
            {tasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("gallery")}
          className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 transition flex items-center gap-1.5 ${
            activeTab === "gallery"
              ? "bg-blue-600 text-white shadow-xs font-semibold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Verified Site Photos</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === "gallery" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-700"}`}>
            {progressLogs.reduce((acc, l) => acc + (l.photos?.length || 0), 0)}
          </span>
        </button>
      </div>

      {/* TAB 1: Daily Site Logs */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {progressLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm">
                    {log.percentage}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Daily Site Diary Entry: {log.date}
                      </h3>
                      {log.workStatus && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {log.workStatus}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2.5 mt-0.5">
                      <span>Logged by: {log.addedBy}</span>
                      <span>•</span>
                      <span>Weather: {log.weather || "Clear, 30°C"}</span>
                      {log.areaLocation && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <MapPin className="h-3 w-3 text-blue-600" />
                            {log.areaLocation}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => pdfService.generateDailySiteReport(project, log, attendance, tasks)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-semibold shadow-xs transition"
                  title="Generate Official Site Diary PDF"
                >
                  <FileDown className="h-3.5 w-3.5 text-blue-600" />
                  <span>Download Daily Report PDF</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 leading-relaxed font-normal">{log.description}</p>

              {/* Tasks & Issues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {log.completedTasks && log.completedTasks.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Completed Milestone
                      Activities
                    </div>
                    <ul className="space-y-1 text-slate-700 text-[11px]">
                      {log.completedTasks.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {log.issues && log.issues.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                    <div className="font-bold text-red-800 flex items-center gap-1.5 mb-1.5 text-[11px]">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> Issues & Field
                      Impediments
                    </div>
                    <ul className="space-y-1 text-slate-700 text-[11px]">
                      {log.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-red-600 font-bold">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Remarks */}
              {log.remarks && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-800">Field Notes: </span>
                  {log.remarks}
                </div>
              )}

              {/* Workforce Attendance on Log Date */}
              {(() => {
                const dayAttendance = attendance.filter((a) => a.date === log.date);
                const presentWorkers = dayAttendance.filter((a) => a.status === "present" || a.status === "overtime");
                const bioCount = dayAttendance.filter((a) => a.method === "Biometric").length;
                const gpsCount = dayAttendance.filter((a) => a.method === "GPS").length;
                const totalDailyWages = dayAttendance.reduce((sum, a) => sum + (a.calculatedWage || 0), 0);

                if (dayAttendance.length === 0) return null;

                return (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">
                          Workforce Muster on {log.date}:
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {presentWorkers.length} Workers Present
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 font-semibold">
                        Daily Wage Outlay: ₹{totalDailyWages.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {presentWorkers.slice(0, 8).map((att) => (
                        <span
                          key={att.id}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1"
                        >
                          <span>{att.workerName}</span>
                          <span className="text-[9px] text-slate-400 font-mono">({att.workerRole})</span>
                          {att.method === "Biometric" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Biometric Verified" />
                          ) : att.method === "GPS" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="GPS Verified" />
                          ) : null}
                        </span>
                      ))}
                      {presentWorkers.length > 8 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                          +{presentWorkers.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Attached Photos with Badge */}
              {log.photos && log.photos.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>Attached Onsite Photos ({log.photos.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {log.photos.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPhotoPreview({ photo: p, log })}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 w-52 h-36 shadow-xs cursor-pointer bg-slate-900"
                      >
                        <img
                          src={p.url}
                          alt={p.caption}
                          className="h-full w-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />

                        {/* Top Watermark Badge */}
                        <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1 shadow-md">
                          <span>📷 Onsite Photo — Manually Captured</span>
                        </div>

                        {/* Bottom Metadata */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 text-[10px] text-white">
                          <div className="truncate font-semibold">{p.caption}</div>
                          <div className="text-[9px] text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{p.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {progressLogs.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 space-y-3">
              <Camera className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="font-bold text-slate-800">No Site Progress Logs Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Capture Onsite Progress" to take a live photo of ongoing work and log your first DPR.
              </p>
              {canEdit && (
                <button
                  onClick={() => setShowManualCaptureModal(true)}
                  className="rounded-xl bg-blue-600 text-white text-xs font-bold px-4 py-2 shadow-sm hover:bg-blue-700 transition"
                >
                  Capture Onsite Progress Now
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Kanban Board */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-800">{col.title}</span>
                    <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-xs">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2 text-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-slate-900">{task.title}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                              task.priority === "high" || task.priority === "critical"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : task.priority === "medium"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug">{task.description}</p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" /> {task.assignedToName}
                          </span>
                          <span>Due: {task.dueDate}</span>
                        </div>

                        {canEdit && (
                          <div className="pt-1 flex items-center justify-end gap-1">
                            {col.status !== "todo" && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, "todo")}
                                className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                              >
                                ← Todo
                              </button>
                            )}
                            {col.status !== "in_progress" && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, "in_progress")}
                                className="text-[9px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              >
                                In Progress
                              </button>
                            )}
                            {col.status !== "completed" && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, "completed")}
                                className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                ✓ Done
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs">No tasks in this lane</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Photo Stream */}
      {activeTab === "gallery" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {progressLogs.flatMap((l) =>
            (l.photos || []).map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPhotoPreview({ photo: p, log: l })}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="h-44 w-full relative bg-slate-900">
                  <img
                    src={p.url}
                    alt={p.caption}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                    referrerPolicy="no-referrer"
                  />

                  {/* Watermark badge */}
                  <div className="absolute top-2 left-2 rounded-md bg-slate-950/85 backdrop-blur-xs px-2 py-0.5 text-[9px] text-white font-bold border border-white/10 shadow-xs flex items-center gap-1">
                    <span>📷 Onsite Photo — Manually Captured</span>
                  </div>

                  <div className="absolute bottom-2 right-2 rounded bg-slate-950/80 px-2 py-0.5 text-[9px] text-slate-200 font-mono">
                    {p.timestamp || l.date}
                  </div>
                </div>

                <div className="p-3 text-xs space-y-1">
                  <div className="font-bold text-slate-900 truncate">{p.caption}</div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>By: {l.addedBy}</span>
                    {p.areaLocation && (
                      <span className="text-blue-600 font-medium truncate max-w-[100px]">
                        {p.areaLocation}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Full Resolution Photo Lightbox Modal */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-xs">
                    📷 Onsite Photo — Manually Captured
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-300 text-xs">
                    {selectedPhotoPreview.photo.timestamp || selectedPhotoPreview.log.date}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Project: {project.name} • {selectedPhotoPreview.photo.areaLocation || "General Site"}
                </div>
              </div>

              <button
                onClick={() => setSelectedPhotoPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black/50 max-h-[60vh] overflow-hidden">
              <img
                src={selectedPhotoPreview.photo.url}
                alt={selectedPhotoPreview.photo.caption}
                className="max-h-[56vh] w-auto max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs space-y-2">
              <div className="font-bold text-white text-sm">
                {selectedPhotoPreview.photo.caption}
              </div>
              <div className="text-slate-300 leading-relaxed">
                {selectedPhotoPreview.log.description}
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] flex items-center justify-between">
                <span>Site Engineer: {selectedPhotoPreview.log.addedBy}</span>
                <span>Project Progress: {selectedPhotoPreview.log.percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Onsite Capture Modal Workflow */}
      {(showManualCaptureModal || isOpenAddModal) && (
        <ManualOnsiteCaptureModal
          isOpen={showManualCaptureModal || isOpenAddModal}
          onClose={() => {
            setShowManualCaptureModal(false);
            onCloseAddModal();
          }}
          project={project}
          onSaveDPR={handleSaveDPR}
          currentUserName={currentUser?.name || "Active Site Engineer"}
          initialPercentage={project.progressPercentage}
        />
      )}

      {/* Create Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl safe-bottom max-h-[92vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Create Site Task</h2>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete bar bending for staircase landing"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Scope Description</label>
                <textarea
                  rows={2}
                  placeholder="Specification details, measurements or trade instructions..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Assigned Trade Lead</label>
                  <input
                    type="text"
                    value={newTaskData.assignedToName}
                    onChange={(e) => setNewTaskData({ ...newTaskData, assignedToName: e.target.value })}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={newTaskData.priority}
                    onChange={(e) =>
                      setNewTaskData({ ...newTaskData, priority: e.target.value as Task["priority"] })
                    }
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical Path</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={newTaskData.dueDate}
                  onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="min-h-[44px] flex items-center justify-center rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
