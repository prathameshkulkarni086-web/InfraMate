import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { hasSupabaseConfig } from "./lib/supabase";
import { WelcomeScreen } from "./components/auth/WelcomeScreen";
import { ResetPassword } from "./components/auth/ResetPassword";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { RoleSelectorModal } from "./components/auth/RoleSelectorModal";
import { PortfolioView } from "./components/portfolio/PortfolioView";
import { DashboardView } from "./components/dashboard/DashboardView";
import { ProjectsView } from "./components/projects/ProjectsView";
import { ExpensesView } from "./components/expenses/ExpensesView";
import { MaterialsView } from "./components/materials/MaterialsView";
import { LaborView } from "./components/labor/LaborView";
import { EquipmentView } from "./components/equipment/EquipmentView";
import { ProgressView } from "./components/progress/ProgressView";
import { ReportsView } from "./components/reports/ReportsView";
import { AIAssistantView } from "./components/ai/AIAssistantView";
import { AICostEstimatorView } from "./components/ai/AICostEstimatorView";
import { BuildingVisualizerView } from "./components/visualizer/BuildingVisualizerView";
import { InspectionModule } from "./components/inspections/InspectionModule";
import { AccessControlView } from "./components/access/AccessControlView";
import { AccessDeniedView } from "./components/common/AccessDeniedView";
import { SupportCenterView } from "./components/support/SupportCenterView";
import { NetworkStatusBar } from "./components/common/NetworkStatusBar";
import { storage } from "./services/storageService";
import { permissionService } from "./services/permissionService";
import { FEATURES } from "./config/features";
import {
  Project,
  Expense,
  Material,
  Worker,
  AttendanceRecord,
  ProgressLog,
  Task,
  User,
  UserRole,
  SystemNotification,
  ProjectSite,
} from "./types";

export default function App() {
  const { 
    isAuthenticated, 
    loading: authLoading, 
    isPasswordRecovery, 
    schemaMissing, 
    user: authUser, 
    profile, 
    isLocalMode, 
    loginAsLocalUser 
  } = useAuth();
  
  const [currentTab, setCurrentTab] = useState<string>("portfolio");
  const [currentUser, setCurrentUser] = useState<User>(storage.getCurrentUser());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  // Redirect if currentTab is disabled by feature flag
  useEffect(() => {
    if (currentTab === "building_visualizer" && !FEATURES.visualizer2D3D) {
      setCurrentTab("dashboard");
    }
  }, [currentTab]);

  const handleNavigateTab = (tab: string) => {
    setIsMobileMenuOpen(false);
    if (tab === "building_visualizer" && !FEATURES.visualizer2D3D) {
      setCurrentTab("dashboard");
      return;
    }
    setCurrentTab(tab);
  };

  // State data from storage
  const [projects, setProjects] = useState<Project[]>(storage.getProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(
    storage.getProjects()[0]?.id || "proj-101"
  );
  const [expenses, setExpenses] = useState<Expense[]>(storage.getExpenses());
  const [materials, setMaterials] = useState<Material[]>(storage.getMaterials());
  const [workers, setWorkers] = useState<Worker[]>(storage.getWorkers());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(storage.getAttendance());
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>(storage.getProgressLogs());
  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());
  const [notifications, setNotifications] = useState<SystemNotification[]>(storage.getNotifications());
  
  // Equipment State
  const [equipment, setEquipment] = useState<import("./types").Equipment[]>(storage.getEquipment());
  const [equipmentUsage, setEquipmentUsage] = useState<import("./types").EquipmentUsageLog[]>(storage.getEquipmentUsage());
  const [fuelLogs, setFuelLogs] = useState<import("./types").FuelLog[]>(storage.getFuelLogs());
  const [maintenanceRecords, setMaintenanceRecords] = useState<import("./types").MaintenanceRecord[]>(storage.getMaintenanceRecords());
  const [equipmentInspections, setEquipmentInspections] = useState<import("./types").EquipmentInspection[]>(storage.getEquipmentInspections());

  // Global modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddProgressOpen, setIsAddProgressOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      const compName = profile?.company_name || authUser.user_metadata?.company_name || 'InfraSync Sites';
      storage.initWorkspace(authUser.id, authUser.email || '', profile?.full_name || authUser.user_metadata?.full_name || 'Admin', compName);
      // Trigger update manually after init
      const event = new Event("infrasync_storage_update");
      window.dispatchEvent(event);
    }
  }, [isAuthenticated, authUser, profile]);

  // Keep state synchronized with storage events
  useEffect(() => {
    const handleStorageUpdate = () => {
      setCurrentUser(storage.getCurrentUser());
      setProjects(storage.getProjects());
      setExpenses(storage.getExpenses());
      setMaterials(storage.getMaterials());
      setWorkers(storage.getWorkers());
      setAttendance(storage.getAttendance());
      setProgressLogs(storage.getProgressLogs());
      setTasks(storage.getTasks());
      setNotifications(storage.getNotifications());
      setEquipment(storage.getEquipment());
      setEquipmentUsage(storage.getEquipmentUsage());
      setFuelLogs(storage.getFuelLogs());
      setMaintenanceRecords(storage.getMaintenanceRecords());
      setEquipmentInspections(storage.getEquipmentInspections());
    };

    window.addEventListener("infrasync_storage_update", handleStorageUpdate);
    return () => window.removeEventListener("infrasync_storage_update", handleStorageUpdate);
  }, []);

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const safeProgressLogs = Array.isArray(progressLogs) ? progressLogs : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  
  const safeEquipment = Array.isArray(equipment) ? equipment : [];
  const safeEquipmentUsage = Array.isArray(equipmentUsage) ? equipmentUsage : [];
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeMaintenanceRecords = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
  const safeEquipmentInspections = Array.isArray(equipmentInspections) ? equipmentInspections : [];

  const activeProject =
    safeProjects.find((p) => p && p.id === activeProjectId) || safeProjects[0] || ({} as Project);

  // Filter project-specific data
  const projectExpenses = safeExpenses.filter((e) => e && e.projectId === activeProject?.id);
  const projectMaterials = safeMaterials.filter((m) => m && m.projectId === activeProject?.id);
  const projectProgress = safeProgressLogs.filter((p) => p && p.projectId === activeProject?.id);
  const projectTasks = safeTasks.filter((t) => t && t.projectId === activeProject?.id);
  const projectAttendance = safeAttendance.filter((a) => a && a.projectId === activeProject?.id);
  const projectEquipment = safeEquipment.filter((e) => e && (!e.projectId || e.projectId === activeProject?.id));

  const lowStockCount = projectMaterials.filter((m) => m && m.quantity <= m.minimumStock).length;
  const activeTasksCount = projectTasks.filter((t) => t && t.status !== "completed").length;

  // Handlers
  const handleSelectRole = (role: UserRole) => {
    const switched = storage.setCurrentUserRole(role);
    setCurrentUser(switched);
  };

  const handleSelectUser = (userId: string) => {
    const switched = storage.switchUser(userId);
    setCurrentUser(switched);
  };

  const handleSaveProject = (project: Project) => {
    storage.saveProject(project);
    setProjects(storage.getProjects());
    setActiveProjectId(project.id);
  };

  const handleSaveExpense = (expense: Expense) => {
    storage.saveExpense(expense);
    setExpenses(storage.getExpenses());
    setProjects(storage.getProjects());
  };

  const handleDeleteExpense = (id: string) => {
    storage.deleteExpense(id);
    setExpenses(storage.getExpenses());
    setProjects(storage.getProjects());
  };

  const handleSaveMaterial = (material: Material) => {
    storage.saveMaterial(material);
    setMaterials(storage.getMaterials());
  };

  const handleUpdateStock = (id: string, newQuantity: number) => {
    storage.updateMaterialStock(id, newQuantity);
    setMaterials(storage.getMaterials());
  };

  const handleSaveWorker = (worker: Worker) => {
    storage.saveWorker(worker);
    setWorkers(storage.getWorkers());
  };

  const handleDeleteWorker = (id: string) => {
    storage.deleteWorker(id);
    setWorkers(storage.getWorkers());
  };

  const handleTransferWorker = (
    workerId: string,
    newProjectId: string,
    newSiteId?: string,
    newSiteName?: string
  ) => {
    storage.transferWorker(workerId, newProjectId, newSiteId, newSiteName);
    setWorkers(storage.getWorkers());
  };

  const handleUpdateAttendance = (record: AttendanceRecord) => {
    storage.updateAttendance(record);
    setAttendance(storage.getAttendance());
  };

  const handleSaveGeofence = (
    radiusMeters: number,
    siteLat: number,
    siteLng: number,
    sites?: ProjectSite[]
  ) => {
    storage.updateProjectGeofence(
      activeProjectId,
      radiusMeters,
      siteLat,
      siteLng,
      sites
    );
    setProjects(storage.getProjects());
  };

  const handleApprovePayroll = (
    totalAmount: number,
    periodLabel: string,
    approvedBy: string
  ) => {
    storage.approveLabourPayroll(
      activeProjectId,
      totalAmount,
      periodLabel,
      approvedBy
    );
    setExpenses(storage.getExpenses());
    setProjects(storage.getProjects());
  };

  const handleManualAttendanceOverride = (
    recordId: string,
    newStatus: string,
    reason: string
  ) => {
    storage.recordAttendanceAudit(
      recordId,
      currentUser.name,
      "unspecified",
      newStatus,
      reason
    );
    setAttendance(storage.getAttendance());
  };

  const handleSaveProgressLog = (log: ProgressLog) => {
    storage.saveProgressLog(log);
    setProgressLogs(storage.getProgressLogs());
    setProjects(storage.getProjects());
  };

  const handleSaveTask = (task: Task) => {
    storage.saveTask(task);
    setTasks(storage.getTasks());
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task["status"]) => {
    storage.updateTaskStatus(taskId, status);
    setTasks(storage.getTasks());
  };

  const handleMarkNotificationRead = (id: string) => {
    storage.markNotificationRead(id);
    setNotifications(storage.getNotifications());
  };

  // Check if current tab is permitted for current user
  const isTabPermitted = permissionService.canAccessTab(currentUser, currentTab);
  const tabRequirement = permissionService.getRequiredPermissionForTab(currentTab);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 mb-4 z-10 animate-pulse">
          <span className="text-white font-bold text-2xl">I</span>
        </div>
        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin z-10"></div>
        <p className="text-slate-600 mt-4 z-10 text-sm font-medium">Loading Workspace...</p>
      </div>
    );
  }

  if (schemaMissing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Database Migration Notice</h2>
          <p className="text-slate-600 text-sm mb-5">
            Cloud database tables are being configured. You can reload the application or continue in offline workspace mode.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition shadow-xs text-sm"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <ResetPassword />;
  }

  if (!isAuthenticated) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen h-[100dvh] bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeProject={activeProject}
        projects={projects}
        onSelectProject={(id) => setActiveProjectId(id)}
        currentUser={currentUser}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onNavigateTab={handleNavigateTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Network & Offline Sync Status Bar */}
      <NetworkStatusBar />

      {/* Main Content Area: Sidebar + Active Tab View */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleNavigateTab}
          lowStockCount={lowStockCount}
          activeTasksCount={activeTasksCount}
          currentUser={currentUser}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-50 safe-bottom safe-left safe-right touch-scroll">
          <div className="mx-auto max-w-7xl">
            {/* If tab is forbidden by manual permissions or user is disabled, show AccessDeniedView */}
            {!isTabPermitted ? (
              <AccessDeniedView
                currentUser={currentUser}
                requiredPermissionKey={tabRequirement.key}
                onNavigateHome={() => setCurrentTab("dashboard")}
                onOpenRoleModal={() => setIsRoleModalOpen(true)}
              />
            ) : (
              <>
                {currentTab === "portfolio" && (
                  <PortfolioView
                    projects={safeProjects}
                    onSelectProject={(id) => {
                      setActiveProjectId(id);
                      setCurrentTab("dashboard");
                    }}
                    userRole={currentUser.role}
                  />
                )}
                {currentTab === "dashboard" && (
                  <DashboardView
                    project={activeProject}
                    projects={safeProjects}
                    onSelectProject={(id) => setActiveProjectId(id)}
                    expenses={projectExpenses}
                    materials={projectMaterials}
                    workers={workers}
                    attendance={projectAttendance}
                    progressLogs={projectProgress}
                    tasks={projectTasks}
                    userRole={currentUser.role}
                    onNavigateTab={handleNavigateTab}
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    onOpenAddProgress={() => setIsAddProgressOpen(true)}
                  />
                )}

                {currentTab === "support" && (
                  <SupportCenterView
                    currentUser={currentUser}
                    projects={safeProjects}
                    activeProject={activeProject}
                  />
                )}

                {currentTab === "projects" && (
                  <ProjectsView
                    projects={projects}
                    activeProject={activeProject}
                    onSelectProject={(id) => setActiveProjectId(id)}
                    onSaveProject={handleSaveProject}
                    userRole={currentUser.role}
                  />
                )}

                {currentTab === "expenses" && (
                  <ExpensesView
                    expenses={projectExpenses}
                    project={activeProject}
                    onSaveExpense={handleSaveExpense}
                    onDeleteExpense={handleDeleteExpense}
                    userRole={currentUser.role}
                    isOpenAddModal={isAddExpenseOpen}
                    onCloseAddModal={() => setIsAddExpenseOpen(false)}
                    onOpenAddModal={() => setIsAddExpenseOpen(true)}
                  />
                )}

                {currentTab === "materials" && (
                  <MaterialsView
                    materials={projectMaterials}
                    project={activeProject}
                    onSaveMaterial={handleSaveMaterial}
                    onUpdateStock={handleUpdateStock}
                    userRole={currentUser.role}
                  />
                )}

                {currentTab === "equipment" && (
                  <EquipmentView
                    equipment={projectEquipment}
                    equipmentUsage={safeEquipmentUsage}
                    fuelLogs={safeFuelLogs}
                    maintenanceRecords={safeMaintenanceRecords}
                    inspections={safeEquipmentInspections}
                    projects={safeProjects}
                    activeProject={activeProject}
                    workers={safeWorkers}
                    userRole={currentUser.role}
                    currentUser={currentUser}
                  />
                )}

                {currentTab === "quality_inspections" && (
                  <InspectionModule
                    project={activeProject}
                    currentUser={currentUser}
                  />
                )}

                {currentTab === "labor" && (
                  <LaborView
                    workers={workers}
                    attendance={projectAttendance}
                    projects={projects}
                    activeProject={activeProject}
                    onSaveWorker={handleSaveWorker}
                    onDeleteWorker={handleDeleteWorker}
                    onUpdateAttendance={handleUpdateAttendance}
                    onSaveGeofence={handleSaveGeofence}
                    onApprovePayroll={handleApprovePayroll}
                    onManualOverride={handleManualAttendanceOverride}
                    onTransferWorker={handleTransferWorker}
                    userRole={currentUser.role}
                    currentUserName={currentUser.name}
                  />
                )}

                {currentTab === "progress" && (
                  <ProgressView
                    progressLogs={projectProgress}
                    tasks={projectTasks}
                    project={activeProject}
                    attendance={projectAttendance}
                    onSaveProgressLog={handleSaveProgressLog}
                    onSaveTask={handleSaveTask}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    userRole={currentUser.role}
                    currentUser={currentUser}
                    isOpenAddModal={isAddProgressOpen}
                    onCloseAddModal={() => setIsAddProgressOpen(false)}
                    onOpenAddModal={() => setIsAddProgressOpen(true)}
                  />
                )}

                {currentTab === "reports" && (
                  <ReportsView
                    project={activeProject}
                    expenses={projectExpenses}
                    materials={projectMaterials}
                    workers={workers}
                    attendance={projectAttendance}
                    progressLogs={projectProgress}
                    tasks={projectTasks}
                  />
                )}

                {currentTab === "ai_assistant" && (
                  <AIAssistantView
                    project={activeProject}
                    materials={projectMaterials}
                    expenses={projectExpenses}
                    labor={workers}
                    progressLogs={projectProgress}
                    tasks={projectTasks}
                  />
                )}

                {currentTab === "ai_cost" && <AICostEstimatorView />}

                {currentTab === "building_visualizer" && FEATURES.visualizer2D3D && (
                  <BuildingVisualizerView />
                )}

                {currentTab === "access_control" && (
                  <AccessControlView
                    currentUser={currentUser}
                    onUserUpdated={(u) => setCurrentUser(u)}
                    onSwitchUser={handleSelectUser}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Role & User Session Access Switcher Modal */}
      <RoleSelectorModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        onSelectUser={handleSelectUser}
        onNavigateToIAM={() => setCurrentTab("access_control")}
      />
    </div>
  );
}
