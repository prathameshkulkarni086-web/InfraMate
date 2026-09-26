import React from "react";
import { ShieldAlert, Lock, UserX, ArrowLeft, Key, UserCheck } from "lucide-react";
import { User, PermissionKey, ALL_PERMISSIONS } from "../../types";

interface AccessDeniedViewProps {
  currentUser: User;
  requiredPermissionKey?: PermissionKey;
  customTitle?: string;
  customDescription?: string;
  onNavigateHome?: () => void;
  onOpenRoleModal?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  currentUser,
  requiredPermissionKey,
  customTitle,
  customDescription,
  onNavigateHome,
  onOpenRoleModal,
}) => {
  const isAccountDisabled迷 = currentUser.status === "disabled";
  const permDef = requiredPermissionKey
    ? ALL_PERMISSIONS.find((p) => p.key === requiredPermissionKey)
    : null;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200 shadow-xs mb-5">
          {isAccountDisabled迷 ? (
            <UserX className="h-8 w-8" />
          ) : (
            <ShieldAlert className="h-8 w-8" />
          )}
        </div>

        {/* Heading */}
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {customTitle ||
            (isAccountDisabled迷
              ? "Account Access Suspended"
              : "Manual Permission Required")}
        </h2>

        {/* Description */}
        <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          {customDescription ||
            (isAccountDisabled迷
              ? `Your account (${currentUser.email}) is marked as Inactive/Disabled by the Administrator. All database read/write actions are currently locked.`
              : "InfraSync uses an Admin-controlled manual permission architecture. Role titles do not automatically grant module access; permissions must be explicitly assigned by the Admin.")}
        </p>

        {/* Required Permission Highlight Card */}
        {permDef && !isAccountDisabled迷 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-left text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Key className="h-3.5 w-3.5 text-amber-600" />
              <span>Missing Required Permission:</span>
            </div>
            <div className="mt-1 font-semibold text-slate-900 text-xs">
              {permDef.label}{" "}
              <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-amber-300 text-amber-800 font-mono">
                {permDef.key}
              </code>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 leading-snug">
              {permDef.description}
            </p>
          </div>
        )}

        {/* User Context Details */}
        <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-slate-800">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">
                {currentUser.customRoleName || currentUser.role.replace("_", " ")} •{" "}
                <span
                  className={
                    currentUser.status === "active"
                      ? "text-emerald-600 font-bold"
                      : "text-red-600 font-bold"
                  }
                >
                  {currentUser.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded border border-slate-200">
              {currentUser.permissions?.length || 0} Permissions Granted
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}

          {onOpenRoleModal && (
            <button
              onClick={onOpenRoleModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Switch User Persona (Admin Demo)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
