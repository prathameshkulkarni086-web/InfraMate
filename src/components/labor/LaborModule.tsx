import React, { useState } from "react";
import {
  Users,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  BarChart3,
  BellRing,
  Calculator,
  Compass,
  HardHat,
  Fingerprint,
  Truck,
} from "lucide-react";
import {
  Worker,
  AttendanceRecord,
  Project,
  ProjectSite,
  UserRole,
} from "../../types";
import { storageService } from "../../services/storageService";
import { OfflineSyncBanner } from "./OfflineSyncBanner";
import { LabourDirectoryView } from "./LabourDirectoryView";
import { RosterManagementView } from "./RosterManagementView";
import { WorkerTodayAttendanceView } from "./WorkerTodayAttendanceView";
import { AttendanceReportsView } from "./AttendanceReportsView";
import { AttendanceRemindersDashboard } from "./AttendanceRemindersDashboard";
import { GateVehicleEntryDashboard } from "./gate/GateVehicleEntryDashboard";
import { PayrollCalculator } from "./PayrollCalculator";
import { GeofenceSettingsModal } from "./GeofenceSettingsModal";
import { LabourProfileDrawer } from "./LabourProfileDrawer";

export type LaborSubTab =
  | "labour"
  | "roster"
  | "attendance"
  | "reports"
  | "gate"
  | "reminders"
  | "payroll";

interface LaborModuleProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  projects: Project[];
  activeProject: Project;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onSaveGeofence: (
    radiusMeters: number,
    siteLat: number,
    siteLng: number,
    sites?: ProjectSite[]
  ) => void;
  onApprovePayroll: (
    totalAmount: number,
    periodLabel: string,
    approvedBy: string
  ) => void;
  onManualOverride: (
    recordId: string,
    newStatus: string,
    reason: string
  ) => void;
  onTransferWorker: (
    workerId: string,
    newProjectId: string,
    newSiteId?: string,
    newSiteName?: string
  ) => void;
  userRole: UserRole;
  currentUserName: string;
  defaultSubTab?: LaborSubTab;
}

export const LaborModule: React.FC<LaborModuleProps> = ({
  workers = [],
  attendance = [],
  projects = [],
  activeProject,
  onUpdateWorker,
  onDeleteWorker,
  onUpdateAttendance,
  onSaveGeofence,
  onApprovePayroll,
  onManualOverride,
  onTransferWorker,
  userRole,
  currentUserName,
  defaultSubTab = "attendance",
}) => {
  const [activeSubTab, setActiveSubTab] = useState<LaborSubTab>(defaultSubTab);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] =
    useState<Worker | null>(null);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState<boolean>(false);

  const canConfigureGeofence =
    userRole === "admin" || userRole === "project_manager" || userRole === "contractor";

  // Filter workers for current active project
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const projectWorkers = safeWorkers.filter((w) => w && w.projectId === activeProject.id);
  const projectAttendance = safeAttendance.filter((a) => a && a.projectId === activeProject.id);

  return (
    <div className="space-y-6">
      {/* Offline Sync Banner */}
      <OfflineSyncBanner
        onSyncComplete={(count) => {
          // auto-synced
        }}
        storageServiceSync={(records) =>
          storageService.syncOfflineAttendance(records)
        }
      />

      {/* Module Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* 1. Labour */}
          <button
            onClick={() => setActiveSubTab("labour")}
            id="tab-labor-directory"
            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeSubTab === "labour"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Labour</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-current">
              {projectWorkers.length}
            </span>
          </button>

          {/* 2. Roster */}
          <button
            onClick={() => setActiveSubTab("roster")}
            id="tab-labor-roster"
            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeSubTab === "roster"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Roster</span>
          </button>

          {/* 3. Attendance */}
          <button
            onClick={() => setActiveSubTab("attendance")}
            id="tab-labor-attendance"
            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeSubTab === "attendance"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Attendance</span>
          </button>

          {/* 4. Attendance Reports */}
          <button
            onClick={() => setActiveSubTab("reports")}
            id="tab-labor-reports"
            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeSubTab === "reports"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Attendance Reports</span>
          </button>

          {/* 5. Gate & Vehicle Entry */}
          <button
            onClick={() => setActiveSubTab("gate")}
            id="tab-labor-gate-vehicle"
            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeSubTab === "gate"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Gate & Vehicle Entry</span>
          </button>

          {/* 6. Attendance Reminders */}
          <button
            onClick={() => setActiveSubTab("reminders")}
            id="tab-labor-reminders"
            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeSubTab === "reminders"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BellRing className="w-4 h-4 text-amber-300" />
            <span>Attendance Reminders</span>
          </button>

          {/* 7. Wages & Payroll */}
          <button
            onClick={() => setActiveSubTab("payroll")}
            id="tab-labor-payroll"
            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeSubTab === "payroll"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Payroll</span>
          </button>
        </div>

        {/* Geofence Shortcut */}
        <button
          onClick={() => setIsGeofenceModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          Geofence ({activeProject.attendanceRadiusMeters || 100}m)
        </button>
      </div>

      {/* Active Sub-Tab Views */}
      {/* 1. Labour Directory */}
      {activeSubTab === "labour" && (
        <LabourDirectoryView
          workers={projectWorkers}
          attendance={projectAttendance}
          projects={projects}
          activeProject={activeProject}
          onSaveWorker={onUpdateWorker}
          onDeleteWorker={onDeleteWorker}
          onTransferWorker={onTransferWorker}
          onSelectWorkerForProfile={(w) => setSelectedWorkerForProfile(w)}
          userRole={userRole}
          currentDate={selectedDate}
        />
      )}

      {/* 2. Roster Management */}
      {activeSubTab === "roster" && (
        <RosterManagementView
          workers={projectWorkers}
          project={activeProject}
          userRole={userRole}
          currentUserName={currentUserName}
        />
      )}

      {/* 3. Today's Attendance Punch & Biometric Terminal */}
      {activeSubTab === "attendance" && (
        <WorkerTodayAttendanceView
          workers={projectWorkers}
          attendance={projectAttendance}
          activeProject={activeProject}
          userRole={userRole}
          currentUserName={currentUserName}
          onSaveAttendance={onUpdateAttendance}
        />
      )}

      {/* 4. Attendance Reports */}
      {activeSubTab === "reports" && (
        <AttendanceReportsView
          workers={projectWorkers}
          attendance={projectAttendance}
          projects={projects}
          activeProject={activeProject}
          userRole={userRole}
          currentUserName={currentUserName}
        />
      )}

      {/* 5. Gate & Vehicle Entry Management */}
      {activeSubTab === "gate" && (
        <GateVehicleEntryDashboard
          project={activeProject}
          userRole={userRole}
          currentUserName={currentUserName}
        />
      )}

      {/* 6. Smartphone Attendance Reminders */}
      {activeSubTab === "reminders" && (
        <AttendanceRemindersDashboard
          workers={projectWorkers}
          attendance={projectAttendance}
          activeProject={activeProject}
          userRole={userRole}
          currentUserName={currentUserName}
        />
      )}

      {/* 6. Payroll Calculator */}
      {activeSubTab === "payroll" && (
        <PayrollCalculator
          workers={projectWorkers}
          attendance={projectAttendance}
          project={activeProject}
          onApprovePayroll={onApprovePayroll}
          userRole={userRole}
          currentUserName={currentUserName}
        />
      )}

      {/* Geofence Configuration Modal */}
      <GeofenceSettingsModal
        project={activeProject}
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        onSaveGeofence={onSaveGeofence}
        canConfigure={canConfigureGeofence}
      />

      {/* Labour Profile Drawer */}
      <LabourProfileDrawer
        worker={selectedWorkerForProfile}
        isOpen={!!selectedWorkerForProfile}
        onClose={() => setSelectedWorkerForProfile(null)}
        project={activeProject}
        attendanceHistory={projectAttendance}
        onManualOverride={onManualOverride}
        userRole={userRole}
        currentUserName={currentUserName}
      />
    </div>
  );
};
