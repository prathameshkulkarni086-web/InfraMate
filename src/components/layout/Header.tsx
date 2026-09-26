import React, { useState } from "react";
import {
  Menu,
  X,
  Building2,
  Bell,
  UserCheck,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Search,
  AlertTriangle,
  FileText,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { Project, User, SystemNotification } from "../../types";
import { storage } from "../../services/storageService";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  activeProject: Project;
  projects: Project[];
  onSelectProject: (id: string) => void;
  currentUser: User;
  onOpenRoleModal: () => void;
  notifications: SystemNotification[];
  onMarkNotificationRead: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeProject,
  projects,
  onSelectProject,
  currentUser,
  onOpenRoleModal,
  notifications,
  onMarkNotificationRead,
  onNavigateTab,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { signOut } = useAuth();
  const currentWorkspace = storage.getCurrentWorkspace();
  const isDemoMode = storage.getIsDemoMode();

  const handleLogout = async () => {
    try {
      storage.exitDemoMode();
      await signOut();
      window.location.reload();
    } catch (err) {
      console.error(err);
      window.location.reload();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: "Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
    project_manager: { label: "Project Manager", color: "bg-blue-100 text-blue-700 border-blue-200" },
    site_engineer: { label: "Site Engineer", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    supervisor: { label: "Supervisor", color: "bg-amber-100 text-amber-700 border-amber-200" },
    contractor: { label: "Contractor", color: "bg-orange-100 text-orange-700 border-orange-200" },
    client: { label: "Client", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    worker: { label: "Field Worker", color: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  const currentRoleConfig = roleLabels[currentUser.role] || roleLabels.admin;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 lg:px-8 shadow-xs safe-top select-none">
      {/* Left: Mobile ☰ Menu + Brand + Project Selector */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Toggle */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-slate-800" /> : <Menu className="h-5 w-5 text-slate-800" />}
          </button>
        )}

        {/* Mobile Brand Mark */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-xs">
            I
          </div>
          <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
            InfraMate
          </span>
        </div>

        {/* Desktop Workspace Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs shrink-0">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold max-w-[140px] truncate">{currentWorkspace.name}</span>
          {isDemoMode && (
            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
              Demo
            </span>
          )}
        </div>

        {/* Project Selector */}
        <div className="relative min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <h2 className="font-bold text-xs sm:text-sm lg:text-base text-slate-800 tracking-tight max-w-[120px] sm:max-w-[200px] lg:max-w-xs truncate">
              {activeProject?.id ? activeProject.name : "No Projects"}
            </h2>
            {activeProject?.id && (
              <span className="hidden sm:inline-block bg-blue-100 text-blue-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0">
                {activeProject?.status?.replace("_", " ") || "Active"}
              </span>
            )}
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
              title="Switch Project"
              aria-label="Switch Project"
            >
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {showProjectDropdown && (
            <div className="absolute left-0 mt-2 w-64 sm:w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Projects ({projects.length})</span>
                <button
                  onClick={() => {
                    onNavigateTab("projects");
                    setShowProjectDropdown(false);
                  }}
                  className="text-blue-600 hover:text-blue-700 normal-case font-semibold text-xs"
                >
                  + New Site
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  <p className="mb-2">No projects created yet.</p>
                  <button
                    onClick={() => {
                      onNavigateTab("portfolio");
                      setShowProjectDropdown(false);
                    }}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    + Create First Project
                  </button>
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p.id);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left rounded-lg p-2 text-xs transition-colors flex items-center justify-between ${
                        p.id === activeProject?.id
                          ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.location}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {p.progressPercentage}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Search, AI Shortcut, Notifications, User Avatar / Role */}
      <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5 shrink-0">
        {/* Search Bar (Tablet & Desktop) */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-100 border-none rounded-full py-1.5 pl-9 pr-3 text-xs w-36 lg:w-48 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:w-56 transition-all focus:outline-none"
          />
        </div>

        {/* AI Quick Button (Desktop/Tablet) */}
        <button
          onClick={() => onNavigateTab("ai_assistant")}
          className="hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1.5 text-xs font-semibold transition shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span className="hidden lg:inline">AI Health Check</span>
          <span className="lg:hidden">AI</span>
        </button>

        {/* Reset Demo */}
        <button
          onClick={() => {
            if (confirm("Reset all project records to initial demo state?")) {
              storage.resetAll();
            }
          }}
          title="Reset Demo Data"
          className="hidden xl:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-88 rounded-2xl sm:rounded-xl border border-slate-200 bg-white p-3 shadow-2xl z-50 max-h-[80vh] flex flex-col animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-800">Site Telemetry & Alerts</div>
                <span className="text-[10px] text-slate-400 font-medium">{unreadCount} unread</span>
              </div>
              <div className="mt-2 space-y-2 overflow-y-auto max-h-64 sm:max-h-72">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        if (n.linkTab) onNavigateTab(n.linkTab);
                        setShowNotifications(false);
                      }}
                      className={`cursor-pointer rounded-lg p-2.5 text-xs border transition ${
                        n.read ? "bg-slate-50/60 border-slate-100 opacity-60" : "bg-blue-50/50 border-blue-100 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === "warning" || n.type === "alert" ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        ) : n.type === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 text-xs">{n.title}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</div>
                          <div className="text-[9px] text-slate-400 mt-1">{n.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill & Role Switcher */}
        {/* Desktop View */}
        <button
          onClick={onOpenRoleModal}
          className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full py-1 px-2.5 transition cursor-pointer"
          title="Click to Switch User Persona & View Permissions"
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-slate-300 border border-slate-400/50 flex items-center justify-center text-[10px] font-bold text-slate-700">
              {currentUser.name.charAt(0)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
                currentUser.status === "active" ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
          </div>
          <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">{currentUser.name}</span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${currentRoleConfig.color}`}>
            {currentUser.customRoleName || currentRoleConfig.label}
          </span>
          <span className="text-[9px] font-mono text-slate-500 bg-slate-200/80 px-1 py-0.2 rounded hidden lg:inline">
            {currentUser.permissions?.length || 0} perms
          </span>
        </button>

        {/* Mobile Compact Avatar */}
        <button
          onClick={onOpenRoleModal}
          aria-label="User Profile & Role Switcher"
          className="flex md:hidden items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition"
          title={`Active: ${currentUser.name} (${currentRoleConfig.label})`}
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
                currentUser.status === "active" ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="flex items-center justify-center h-10 w-10 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

