import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  UserPlus,
  Key,
  Lock,
  Unlock,
  Check,
  X,
  Search,
  Filter,
  Sliders,
  Sparkles,
  AlertTriangle,
  History,
  FileCode,
  Copy,
  CheckCircle2,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  Info,
  ChevronDown,
  ChevronRight,
  Layers,
  Settings,
} from "lucide-react";
import {
  User,
  PermissionKey,
  PermissionCategory,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PRESETS,
  CustomRole,
  AuditLog,
  UserRole,
} from "../../types";
import { storage } from "../../services/storageService";
import { permissionService } from "../../services/permissionService";
import { FEATURES } from "../../config/features";

interface AccessControlViewProps {
  currentUser: User;
  onUserUpdated?: (user: User) => void;
  onSwitchUser?: (userId: string) => void;
}

export const AccessControlView: React.FC<AccessControlViewProps> = ({
  currentUser,
  onUserUpdated,
  onSwitchUser,
}) => {
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(storage.getCustomRoles());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(storage.getAuditLogs());
  const [activeSubTab, setActiveSubTab] = useState<"users" | "roles" | "security_rules" | "audit">("users");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  // Modals state
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<PermissionKey[]>([]);
  const [editingStatus, setEditingStatus] = useState<"active" | "disabled">("active");
  const [editingNotes, setEditingNotes] = useState("");
  const [editingRole, setEditingRole] = useState<UserRole>("project_manager");
  const [editingCustomRoleName, setEditingCustomRoleName] = useState("");

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "site_engineer" as UserRole,
    customRoleName: "",
    status: "active" as "active" | "disabled",
    permissions: [] as PermissionKey[],
    notes: "",
  });

  // New Custom Role Form State
  const [newRoleForm, setNewRoleForm] = useState({
    name: "",
    description: "",
    defaultPermissions: [] as PermissionKey[],
  });

  // Permission category filter for the edit modal
  const [permCategoryFilter, setPermCategoryFilter] = useState<string>("All");
  const [permSearchQuery, setPermSearchQuery] = useState<string>("");
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedMiddleware, setCopiedMiddleware] = useState(false);

  // Permission Categories List
  const categories: PermissionCategory[] = [
    "Dashboard & Analytics",
    "Project Operations",
    "Financial & Expenses",
    "Material & Inventory",
    "Workforce & Attendance",
    "Site Progress & Media",
    "Reports & Documentation",
    "AI & 3D Visualizer",
    "Security & Administration",
  ];

  // Refresh data helper
  const reloadData = () => {
    setUsers(storage.getUsers());
    setCustomRoles(storage.getCustomRoles());
    setAuditLogs(storage.getAuditLogs());
  };

  // Toggle user status (Active vs. Disabled)
  const handleToggleStatus = (user: User) => {
    const updated = storage.toggleUserStatus(user.id);
    if (updated) {
      reloadData();
      if (onUserUpdated && currentUser.id === user.id) {
        onUserUpdated(updated);
      }
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setEditingPermissions([...user.permissions]);
    setEditingStatus(user.status);
    setEditingNotes(user.notes || "");
    setEditingRole(user.role);
    setEditingCustomRoleName(user.customRoleName || "");
    setIsEditUserModalOpen(true);
  };

  // Save Permissions & User Info
  const handleSaveUserPermissions = () => {
    if (!selectedUserForEdit) return;

    const updatedUser: User = {
      ...selectedUserForEdit,
      role: editingRole,
      customRoleName: editingRole === "custom" ? editingCustomRoleName : undefined,
      status: editingStatus,
      permissions: editingPermissions,
      notes: editingNotes,
      overriddenFromRole: true,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    storage.saveUser(updatedUser);
    storage.addAuditLog(
      "Permissions Modified",
      updatedUser.name,
      updatedUser.id,
      `Admin updated permissions (${editingPermissions.length} granted) and status to ${editingStatus.toUpperCase()}`,
      "permission_change"
    );

    reloadData();
    setIsEditUserModalOpen(false);
    if (onUserUpdated && currentUser.id === updatedUser.id) {
      onUserUpdated(updatedUser);
    }
  };

  // Apply Role Template Preset to Editing Checkboxes
  const handleApplyPresetTemplate = (roleKey: string) => {
    const preset = DEFAULT_ROLE_PRESETS.find((p) => p.role === roleKey);
    const customRolePreset = customRoles.find((c) => c.id === roleKey);

    if (preset) {
      setEditingPermissions([...preset.defaultPermissions]);
    } else if (customRolePreset) {
      setEditingPermissions([...customRolePreset.defaultPermissions]);
    }
  };

  // Toggle single permission checkbox
  const handleTogglePermission = (key: PermissionKey) => {
    setEditingPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Select all / deselect all in current view
  const handleSelectAllPerms = () => {
    setEditingPermissions(ALL_PERMISSIONS.map((p) => p.key));
  };

  const handleClearAllPerms = () => {
    setEditingPermissions([]);
  };

  const handleSelectCategoryPerms = (cat: PermissionCategory) => {
    const catKeys = ALL_PERMISSIONS.filter((p) => p.category === cat).map((p) => p.key);
    setEditingPermissions((prev) => Array.from(new Set([...prev, ...catKeys])));
  };

  // Create User Handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const newUser: User = {
      id: `usr-custom-${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      phone: newUserForm.phone || "+91 99000 00000",
      role: newUserForm.role,
      customRoleName: newUserForm.role === "custom" ? newUserForm.customRoleName : undefined,
      status: newUserForm.status,
      permissions:
        newUserForm.permissions.length > 0
          ? newUserForm.permissions
          : DEFAULT_ROLE_PRESETS.find((p) => p.role === newUserForm.role)?.defaultPermissions || [
              "view_dashboard",
            ],
      notes: newUserForm.notes,
      assignedBy: currentUser.name,
      createdAt: new Date().toISOString().split("T")[0],
    };

    storage.saveUser(newUser);
    storage.addAuditLog(
      "User Created",
      newUser.name,
      newUser.id,
      `New user created with ${newUser.permissions.length} manually assigned permissions`,
      "user_create"
    );

    reloadData();
    setIsCreateUserModalOpen(false);
    setNewUserForm({
      name: "",
      email: "",
      phone: "",
      role: "site_engineer",
      customRoleName: "",
      status: "active",
      permissions: [],
      notes: "",
    });
  };

  // Create Custom Role Handler
  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name) return;

    const newRole: CustomRole = {
      id: `crole-${Date.now()}`,
      name: newRoleForm.name,
      description: newRoleForm.description || "Custom enterprise operational role",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      defaultPermissions:
        newRoleForm.defaultPermissions.length > 0
          ? newRoleForm.defaultPermissions
          : ["view_dashboard", "view_projects"],
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: currentUser.name,
    };

    storage.saveCustomRole(newRole);
    reloadData();
    setIsCreateRoleModalOpen(false);
    setNewRoleForm({
      name: "",
      description: "",
      defaultPermissions: [],
    });
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.customRoleName && u.customRoleName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered Permissions in Edit Modal
  const filteredPermissionsToDisplay = ALL_PERMISSIONS.filter((p) => {
    if (!FEATURES.visualizer2D3D && p.key === "use_building_visualizer") {
      return false;
    }
    const matchesCategory =
      permCategoryFilter === "All" || p.category === permCategoryFilter;
    const matchesSearch =
      p.label.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(permSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate high-level stats
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === "active").length;
  const disabledUsersCount = users.filter((u) => u.status === "disabled").length;
  const overriddenUsersCount = users.filter((u) => permissionService.isOverriddenFromTemplate(u)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Access Management & Granular IAM Controls
                </h1>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-800 border border-blue-200">
                  Admin Authority
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">
                Configure explicit, manual permission grants on a per-user basis. Roles serve strictly as
                organizational labels and starting templates — <strong>all module access and database read/writes are strictly verified against the user's manual permission array</strong>.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Create Custom Role</span>
            </button>

            <button
              onClick={() => setIsCreateUserModalOpen(true)}
              className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="text-[11px] font-medium text-slate-500">Total System Accounts</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{totalUsersCount}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
            <div className="text-[11px] font-medium text-emerald-700">Active Authorized Users</div>
            <div className="mt-1 text-lg font-bold text-emerald-800">{activeUsersCount}</div>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
            <div className="text-[11px] font-medium text-red-700">Disabled / Suspended</div>
            <div className="mt-1 text-lg font-bold text-red-800">{disabledUsersCount}</div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <div className="text-[11px] font-medium text-blue-700">Manual Permission Overrides</div>
            <div className="mt-1 text-lg font-bold text-blue-800">{overriddenUsersCount}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 shadow-xs overflow-x-auto no-scrollbar touch-scroll">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`min-h-[44px] shrink-0 whitespace-nowrap flex items-center gap-2 py-3 px-4 text-xs font-bold transition border-b-2 ${
            activeSubTab === "users"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Users & Permissions Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("roles")}
          className={`min-h-[44px] shrink-0 whitespace-nowrap flex items-center gap-2 py-3 px-4 text-xs font-bold transition border-b-2 ${
            activeSubTab === "roles"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Role Templates & Custom Presets ({DEFAULT_ROLE_PRESETS.length + customRoles.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("security_rules")}
          className={`min-h-[44px] shrink-0 whitespace-nowrap flex items-center gap-2 py-3 px-4 text-xs font-bold transition border-b-2 ${
            activeSubTab === "security_rules"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Backend & Firebase Security Rules</span>
        </button>

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`min-h-[44px] shrink-0 whitespace-nowrap flex items-center gap-2 py-3 px-4 text-xs font-bold transition border-b-2 ${
            activeSubTab === "audit"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <History className="h-4 w-4" />
          <span>IAM Security Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: USERS & PERMISSION MATRIX DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubTab === "users" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {DEFAULT_ROLE_PRESETS.map((p) => (
                  <option key={p.role} value={p.role}>
                    {p.title}
                  </option>
                ))}
                <option value="custom">Custom Roles</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="disabled">Disabled / Inactive</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">User Profile</th>
                    <th className="py-3 px-4">Role Label / Template</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Granted Permissions</th>
                    <th className="py-3 px-4">Template Status</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isOverridden = permissionService.isOverriddenFromTemplate(user);
                      const isCurrentLoggedIn = currentUser.id === user.id;

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-slate-50/80 transition ${
                            user.status === "disabled" ? "bg-slate-50/50 opacity-75" : ""
                          }`}
                        >
                          {/* User Profile */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-300">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isCurrentLoggedIn && (
                                    <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                                      You (Current)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500">{user.email}</div>
                                <div className="text-[10px] text-slate-400">{user.phone}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Label */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                              {user.customRoleName || user.role.replace("_", " ")}
                            </span>
                          </td>

                          {/* Account Status Switch */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isCurrentLoggedIn}
                              title={
                                isCurrentLoggedIn
                                  ? "Cannot disable your own active account"
                                  : "Click to toggle Active / Disabled status"
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                                user.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                              } ${isCurrentLoggedIn ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                            >
                              {user.status === "active" ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                  <span>Disabled</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Granted Permissions Count Badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-slate-900 text-xs">
                                {user.permissions?.length || 0}{" "}
                                <span className="text-slate-400 font-normal">
                                  / {ALL_PERMISSIONS.length}
                                </span>
                              </div>
                              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${((user.permissions?.length || 0) / ALL_PERMISSIONS.length) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                              {user.permissions?.slice(0, 3).join(", ")}
                              {(user.permissions?.length || 0) > 3 &&
                                ` +${(user.permissions?.length || 0) - 3} more`}
                            </div>
                          </td>

                          {/* Template Status */}
                          <td className="py-3.5 px-4">
                            {isOverridden ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Sparkles className="h-2.5 w-2.5" /> Custom Overridden
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Role Standard
                              </span>
                            )}
                          </td>

                          {/* Admin Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onSwitchUser && (
                                <button
                                  onClick={() => onSwitchUser(user.id)}
                                  title="Impersonate / Test this persona"
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditUser(user)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1.5 text-xs font-semibold transition"
                              >
                                <Key className="h-3.5 w-3.5" />
                                <span>Edit Permissions</span>
                              </button>

                              {!isCurrentLoggedIn && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete user ${user.name}? This will revoke all database access.`)) {
                                      storage.deleteUser(user.id);
                                      reloadData();
                                    }
                                  }}
                                  title="Delete User"
                                  className="p-1.5 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ROLE TEMPLATES & CUSTOM PRESETS */}
      {/* ========================================================================= */}
      {activeSubTab === "roles" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-slate-600 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Role Templates Architecture</div>
              <p className="mt-0.5 leading-relaxed">
                Role templates provide recommended bundles of permissions for fast initialization. When creating or updating a user, applying a template populates the manual checkboxes, but <strong>the Admin can customize or override any individual permission</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Built-in Role Presets */}
            {DEFAULT_ROLE_PRESETS.map((preset) => (
              <div
                key={preset.role}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${preset.color}`}>
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Standard Preset</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-snug">{preset.description}</p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Included Permissions</span>
                    <span className="font-bold text-slate-900">
                      {preset.defaultPermissions.length} / {ALL_PERMISSIONS.length}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preset.defaultPermissions.slice(0, 5).map((pKey) => (
                      <span
                        key={pKey}
                        className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                      >
                        {pKey}
                      </span>
                    ))}
                    {preset.defaultPermissions.length > 5 && (
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        +{preset.defaultPermissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Custom Roles Created by Admin */}
            {customRoles.map((crole) => (
              <div
                key={crole.id}
                className="rounded-2xl border border-indigo-200 bg-indigo-50/20 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {crole.name}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete custom role '${crole.name}'?`)) {
                          storage.deleteCustomRole(crole.id);
                          reloadData();
                        }
                      }}
                      className="text-red-400 hover:text-red-600 transition"
                      title="Delete Custom Role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-snug">{crole.description}</p>
                </div>

                <div className="mt-4 border-t border-indigo-100 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Included Permissions</span>
                    <span className="font-bold text-slate-900">
                      {crole.defaultPermissions.length} / {ALL_PERMISSIONS.length}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {crole.defaultPermissions.map((pKey) => (
                      <span
                        key={pKey}
                        className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-mono"
                      >
                        {pKey}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400">
                    Created by {crole.createdBy} on {crole.createdAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BACKEND & FIREBASE SECURITY RULES INSPECTOR */}
      {/* ========================================================================= */}
      {activeSubTab === "security_rules" && (
        <div className="space-y-6">
          {/* Architecture Visual Explainer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Two-Tier Security Architecture: UI + Database Enforcement
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              InfraSync implements manual permission enforcement at both layers to guarantee zero unauthorized access even if a client attempts to bypass the web interface:
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                    1
                  </div>
                  <span>Admin Manual Assignment</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                  Admin manually checks or unchecks granular permission keys. Permissions are stored directly in the user document and synchronized into Firebase Auth custom claims.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                    2
                  </div>
                  <span>UI Feature Gating</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                  Tabs, buttons, modals, and export utilities evaluate <code className="font-mono text-blue-700">hasPermission()</code> in real time. Unauthorized sections render Access Denied guards.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    3
                  </div>
                  <span>Backend & Firestore Rules</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                  Firestore rules inspect <code className="font-mono text-emerald-700">getUserData().permissions</code> on every document write. Backend APIs reject requests lacking required claims.
                </p>
              </div>
            </div>
          </div>

          {/* Firestore Security Rules Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-900 font-mono">firestore.rules</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(permissionService.getFirebaseSecurityRules());
                  setCopiedRules(true);
                  setTimeout(() => setCopiedRules(false), 2000);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {copiedRules ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Rules</span>
                  </>
                )}
              </button>
            </div>
            <pre className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
              {permissionService.getFirebaseSecurityRules()}
            </pre>
          </div>

          {/* Backend Express Authorization Middleware Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900 font-mono">
                  backend/middleware/authorize.ts
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(permissionService.getBackendMiddlewareCode());
                  setCopiedMiddleware(true);
                  setTimeout(() => setCopiedMiddleware(false), 2000);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {copiedMiddleware ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
              {permissionService.getBackendMiddlewareCode()}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SECURITY AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeSubTab === "audit" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Access Management Audit Trail
                </h3>
                <p className="text-[11px] text-slate-500">
                  Immutable log of all user account modifications, permission reassignments, and security events.
                </p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-semibold">
                {auditLogs.length} Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Admin Actor</th>
                    <th className="py-2.5 px-4">Target User</th>
                    <th className="py-2.5 px-4">Modification Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{log.actorName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.targetUserName}</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] leading-snug">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT USER & MANUAL PERMISSION MATRIX DRAWER */}
      {/* ========================================================================= */}
      {isEditUserModalOpen && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="relative w-full max-w-4xl rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col safe-bottom touch-scroll">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Key className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    Granular Access Control: {selectedUserForEdit.name}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedUserForEdit.email} • Manually configure authorizations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Template & Status Controls Bar */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {/* Role Template Applicator */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Apply Preset Template as Baseline:
                </label>
                <select
                  onChange={(e) => handleApplyPresetTemplate(e.target.value)}
                  defaultValue=""
                  className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    -- Select Role Preset to Load --
                  </option>
                  <optgroup label="Standard Role Presets">
                    {DEFAULT_ROLE_PRESETS.map((p) => (
                      <option key={p.role} value={p.role}>
                        {p.title} ({p.defaultPermissions.length} perms)
                      </option>
                    ))}
                  </optgroup>
                  {customRoles.length > 0 && (
                    <optgroup label="Custom Roles">
                      {customRoles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.defaultPermissions.length} perms)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Account Status Toggle */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Account Status:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStatus("active")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      editingStatus === "active"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStatus("disabled")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      editingStatus === "disabled"
                        ? "bg-red-600 text-white border-red-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Disabled
                  </button>
                </div>
              </div>

              {/* Permission Count & Quick Select */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Permissions Selected:</span>
                  <span className="font-extrabold text-blue-700">
                    {editingPermissions.length} / {ALL_PERMISSIONS.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleSelectAllPerms}
                    className="flex-1 rounded bg-blue-50 text-blue-700 border border-blue-200 py-1 text-[11px] font-bold hover:bg-blue-100 transition"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllPerms}
                    className="flex-1 rounded bg-slate-200 text-slate-700 py-1 text-[11px] font-bold hover:bg-slate-300 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions Search & Category Filters */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full text-[11px]">
                <button
                  type="button"
                  onClick={() => setPermCategoryFilter("All")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                    permCategoryFilter === "All"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({ALL_PERMISSIONS.length})
                </button>
                {categories.map((cat) => {
                  const countInCat = ALL_PERMISSIONS.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPermCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                        permCategoryFilter === cat
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat} ({countInCat})
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-48 shrink-0">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={permSearchQuery}
                  onChange={(e) => setPermSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 pl-8 pr-2.5 py-1 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Granular Permission Cards Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredPermissionsToDisplay.map((perm) => {
                const isChecked = editingPermissions.includes(perm.key);

                return (
                  <label
                    key={perm.key}
                    onClick={() => handleTogglePermission(perm.key)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                      isChecked
                        ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by container
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900">{perm.label}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            perm.dangerLevel === "high"
                              ? "bg-red-100 text-red-700"
                              : perm.dangerLevel === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {perm.dangerLevel}
                        </span>
                      </div>

                      <div className="mt-0.5">
                        <code className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-mono">
                          {perm.key}
                        </code>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-500 leading-snug">{perm.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Notes & Justification */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Admin Audit Notes / Justification (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Authorized by Project Director for Phase 2 Site Operations"
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                className="w-full rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-slate-100 pt-4 gap-3">
              <div className="text-xs text-slate-500">
                Changes take effect immediately across all sessions and Firebase security verifiers.
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserPermissions}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Manual Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE USER WITH MANUAL PERMISSION CONFIGURATION */}
      {/* ========================================================================= */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="relative w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">Create New System User</h3>
                  <p className="text-xs text-slate-500 truncate">
                    Add user and manually configure baseline permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunil Deshmukh"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sunil.site@infrasync.io"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98000 12345"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Role Template (Label)
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      const preset = DEFAULT_ROLE_PRESETS.find((p) => p.role === newRole);
                      setNewUserForm({
                        ...newUserForm,
                        role: newRole,
                        permissions: preset ? [...preset.defaultPermissions] : ["view_dashboard"],
                      });
                    }}
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DEFAULT_ROLE_PRESETS.map((p) => (
                      <option key={p.role} value={p.role}>
                        {p.title}
                      </option>
                    ))}
                    <option value="custom">Custom Role</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, status: e.target.value as "active" | "disabled" })
                    }
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled / Inactive</option>
                  </select>
                </div>
              </div>

              {newUserForm.role === "custom" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Custom Role Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Safety Inspector, Lead Auditor"
                    value={newUserForm.customRoleName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, customRoleName: e.target.value })}
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admin Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assigned to Whitefield Villa project team"
                  value={newUserForm.notes}
                  onChange={(e) => setNewUserForm({ ...newUserForm, notes: e.target.value })}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  <Check className="h-4 w-4" />
                  <span>Create User & Assign Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE CUSTOM ROLE TEMPLATE */}
      {/* ========================================================================= */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="relative w-full max-w-xl rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Sliders className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">Create Custom Role Template</h3>
                  <p className="text-xs text-slate-500 truncate">
                    Define a reusable bundle of permissions for fast user onboarding.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead MEP Quality Officer"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe operational responsibilities and default privileges..."
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Permission Checkbox List */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Default Permissions for this Template:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {ALL_PERMISSIONS.map((p) => {
                    const isChecked = newRoleForm.defaultPermissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-1 rounded hover:bg-white transition select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setNewRoleForm({
                              ...newRoleForm,
                              defaultPermissions: isChecked
                                ? newRoleForm.defaultPermissions.filter((k) => k !== p.key)
                                : [...newRoleForm.defaultPermissions, p.key],
                            });
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Role Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
