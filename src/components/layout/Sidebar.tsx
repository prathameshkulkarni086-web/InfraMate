import React, { useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  Boxes,
  Users,
  TrendingUp,
  FileText,
  Bot,
  Calculator,
  Layers,
  Sparkles,
  ShieldCheck,
  Lock,
  Sliders,
  UserCheck,
  Truck,
  LifeBuoy,
  X,
} from "lucide-react";
import { User, UserRole } from "../../types";
import { permissionService } from "../../services/permissionService";
import { FEATURES } from "../../config/features";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  lowStockCount: number;
  activeTasksCount: number;
  currentUser: User;
  onOpenRoleModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
  activeTasksCount,
  currentUser,
  onOpenRoleModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const isAccountDisabled = currentUser.status === "disabled";

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const navSections = [
    {
      title: "Workspace",
      items: [
        { id: "portfolio", label: "All Sites / Portfolio", icon: Building2 },
      ],
    },
    {
      title: "Active Site Operations",
      items: [
        { id: "dashboard", label: "Site Dashboard", icon: LayoutDashboard },
        {
          id: "support",
          label: "24/7 Support & Ledger",
          icon: LifeBuoy,
          badge: "24/7",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        },
        { id: "expenses", label: "Expenses", icon: DollarSign },
        {
          id: "materials",
          label: "Materials",
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
          badgeColor: "bg-red-500/20 text-red-300 border border-red-500/30",
        },
        { id: "equipment", label: "Equipment & Machinery", icon: Truck },
        { id: "quality_inspections", label: "Quality Inspections", icon: ShieldCheck },
        { id: "labor", label: "Labour & Attendance", icon: Users },
        {
          id: "progress",
          label: "Progress & Tasks",
          icon: TrendingUp,
          badge: activeTasksCount > 0 ? `${activeTasksCount} Active` : undefined,
          badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        },
        { id: "reports", label: "PDF Reports", icon: FileText },
      ],
    },
    {
      title: "AI & Intelligence Suite",
      items: [
        { id: "ai_assistant", label: "AI Construction Bot", icon: Bot, isAi: true },
        { id: "ai_cost", label: "AI Cost Estimator", icon: Calculator, isAi: true },
        ...(FEATURES.visualizer2D3D
          ? [{ id: "building_visualizer", label: "2D/3D Visualizer", icon: Layers, isAi: true }]
          : []),
      ],
    },
    {
      title: "Security & Governance",
      items: [
        {
          id: "access_control",
          label: "IAM Access Control",
          icon: ShieldCheck,
          isSecurity: true,
          badge: "Admin",
          badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        },
      ],
    },
  ];

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isDrawer = false) => (
    <>
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm">
            I
          </div>
          <span className="text-xl font-bold tracking-tight text-white">InfraSync</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Pro
          </span>
          {isDrawer && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Account Status Alert if Disabled */}
      {isAccountDisabled && (
        <div className="mx-3 mt-3 rounded-lg bg-red-900/40 border border-red-500/40 p-2.5 text-[11px] text-red-200">
          <div className="font-bold flex items-center gap-1.5 text-red-300">
            <Lock className="h-3.5 w-3.5" />
            <span>Account Suspended</span>
          </div>
          <p className="mt-0.5 text-[10px] text-red-300/80 leading-tight">
            Admin marked your account as disabled. Access locked.
          </p>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto touch-scroll">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{section.title}</span>
              {section.title.includes("AI") && (
                <span className="flex items-center gap-1 text-[9px] text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                  <Sparkles className="h-2.5 w-2.5" /> gemini
                </span>
              )}
            </div>

            <nav className="space-y-1 mt-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isPermitted = permissionService.canAccessTab(currentUser, item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-xs font-medium transition-all group min-h-[44px] active:scale-[0.98] ${
                      isActive
                        ? "bg-blue-600 sm:bg-slate-800 text-white shadow-xs font-semibold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    } ${!isPermitted ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-white sm:text-blue-400"
                            : item.isSecurity
                            ? "text-blue-400"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {!isPermitted && (
                        <span title="Manual permission required">
                          <Lock className="h-3 w-3 text-slate-500" />
                        </span>
                      )}

                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer System Status & Active User Info */}
      <div className="p-4 bg-slate-950/90 mt-auto border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                currentUser.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
              {currentUser.name}
            </span>
          </div>
          <span
            className={`uppercase text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
              currentUser.status === "active"
                ? "bg-slate-800 text-blue-400 border border-slate-700"
                : "bg-red-950 text-red-400 border border-red-800"
            }`}
          >
            {currentUser.customRoleName || currentUser.role.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
          <span>{currentUser.permissions?.length || 0} Perms Granted</span>
          {onOpenRoleModal && (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onOpenRoleModal();
              }}
              className="text-blue-400 hover:text-blue-300 transition font-semibold p-1 -m-1"
            >
              Switch User ⇄
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col shrink-0 h-full border-r border-slate-800 select-none">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Responsive Navigation Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Drawer"
            className="fixed inset-y-0 left-0 w-[85vw] max-w-xs bg-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-800 select-none safe-top safe-bottom animate-in slide-in-from-left duration-200"
          >
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};


