import React, { useState } from "react";
import { UserRole, User, ALL_PERMISSIONS } from "../../types";
import { X, Check, Shield, UserCheck, Lock, Key, Sliders, AlertTriangle } from "lucide-react";
import { storage } from "../../services/storageService";
import { permissionService } from "../../services/permissionService";

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectRole: (role: UserRole) => void;
  onSelectUser?: (userId: string) => void;
  onNavigateToIAM?: () => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectRole,
  onSelectUser,
  onNavigateToIAM,
}) => {
  const [activeTab, setActiveTab] = useState<"users" | "my_perms">("users");
  if (!isOpen) return null;

  const users = storage.getUsers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                User Session & Manual Permission Switcher
              </h2>
              <p className="text-xs text-slate-500">
                Switch user persona to test real-time granular authorizations, UI guards, and status controls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Switch User Persona ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("my_perms")}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === "my_perms"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Active User Permissions ({currentUser.permissions?.length || 0})
          </button>
        </div>

        {/* User Cards Grid */}
        {activeTab === "users" && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {users.map((item) => {
                const isSelected = currentUser.id === item.id;
                const isOverridden = permissionService.isOverriddenFromTemplate(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onSelectUser) {
                        onSelectUser(item.id);
                      } else {
                        onSelectRole(item.role);
                      }
                      onClose();
                    }}
                    className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between group ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/10 shadow-xs"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                          {item.name}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 rounded bg-blue-600 text-white px-1.5 py-0.5 text-[9px] font-bold uppercase">
                            <Check className="h-2.5 w-2.5" /> Active
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              item.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-[11px] text-slate-500 font-medium">{item.email}</div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        Role:{" "}
                        <span className="font-semibold text-slate-700 capitalize">
                          {item.customRoleName || item.role.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-200/60 pt-2 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-600">
                        {item.permissions?.length || 0} Permissions Granted
                      </span>
                      {isOverridden && (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-bold">
                          Admin Custom
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {onNavigateToIAM && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToIAM();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Open Full IAM Access Management & Permissions Editor →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Permissions Breakdown */}
        {activeTab === "my_perms" && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <div className="font-bold text-slate-900">
                Current User: {currentUser.name} ({currentUser.email})
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Account Status:{" "}
                <span
                  className={
                    currentUser.status === "active" ? "text-emerald-700 font-bold" : "text-red-700 font-bold"
                  }
                >
                  {currentUser.status.toUpperCase()}
                </span>{" "}
                • {currentUser.permissions?.length || 0} of {ALL_PERMISSIONS.length} granular privileges
                manually authorized.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              {ALL_PERMISSIONS.map((p) => {
                const hasPerm = currentUser.permissions?.includes(p.key);
                return (
                  <div
                    key={p.key}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      hasPerm
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                        : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[11px]">{p.label}</div>
                      <div className="font-mono text-[9px]">{p.key}</div>
                    </div>
                    {hasPerm ? (
                      <span className="text-emerald-600 font-bold text-xs">Granted</span>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs">Denied</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function renderStatusBadge(val: boolean | string) {
  if (val === true) {
    return <span className="inline-flex items-center text-emerald-600 font-bold text-xs">✓</span>;
  }
  if (val === false) {
    return <span className="inline-flex items-center text-slate-300 font-bold text-xs">—</span>;
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      {val}
    </span>
  );
}
