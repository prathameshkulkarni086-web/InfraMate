import React, { useState } from "react";
import {
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRightLeft,
  UserX,
  UserCheck,
  Phone,
  Shield,
  Fingerprint,
  HardHat,
  ChevronRight,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { Worker, Project, ProjectSite, UserRole } from "../../types";

interface LabourDirectoryProps {
  workers: Worker[];
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
}

export const LabourDirectory: React.FC<LabourDirectoryProps> = ({
  workers = [],
  projects = [],
  activeProject,
  onSaveWorker,
  onDeleteWorker,
  onTransferWorker,
  onSelectWorkerForProfile,
  userRole,
}) => {
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  const [searchQuery, setSearchQuery] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [workerToTransfer, setWorkerToTransfer] = useState<Worker | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>(activeProject?.id || "");
  const [targetSiteId, setTargetSiteId] = useState<string>("");

  // Form State
  const [formData, setFormData] = useState<Partial<Worker>>({
    name: "",
    role: "Mason",
    phone: "",
    dailyWage: 750,
    overtimeHourlyRate: 140,
    employeeId: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodGroup: "O+",
    contractorName: "Direct Site Hire",
    status: "active",
    biometricRegistered: true,
    address: "",
  });

  const canManage =
    userRole === "admin" ||
    userRole === "project_manager" ||
    userRole === "site_engineer";

  const tradesList = [
    "Mason",
    "Helper",
    "Carpenter",
    "Electrician",
    "Plumber",
    "Welder",
    "Painter",
    "Machine Operator",
    "Supervisor",
    "Steel Fixer",
    "Tile Layer",
    "Other",
  ];

  // Filtered workers
  const filteredWorkers = safeWorkers.filter((w) => {
    if (!w) return false;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.employeeId && w.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrade = tradeFilter === "all" || w.role === tradeFilter;
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;

    return matchesSearch && matchesTrade && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({
      name: "",
      role: "Mason",
      phone: "+91 9",
      dailyWage: 750,
      overtimeHourlyRate: 140,
      employeeId: `LAB-${String(Math.floor(100 + Math.random() * 900))}`,
      emergencyContactName: "",
      emergencyContactPhone: "",
      bloodGroup: "O+",
      contractorName: "Direct Site Hire",
      status: "active",
      biometricRegistered: true,
      address: "",
      projectId: activeProject.id,
      siteId: activeProject.sites?.[0]?.id,
      siteName: activeProject.sites?.[0]?.name || activeProject.name,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setEditingWorker(w);
    setFormData({ ...w });
    setIsAddEditModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const workerToSave: Worker = {
      id: editingWorker ? editingWorker.id : `wrk-${Date.now()}`,
      projectId: formData.projectId || activeProject.id,
      name: formData.name.trim(),
      role: formData.role || "Helper",
      phone: formData.phone || "+91 9876543210",
      dailyWage: Number(formData.dailyWage) || 600,
      overtimeHourlyRate: Number(formData.overtimeHourlyRate) || Math.round(Number(formData.dailyWage || 600) / 8),
      employeeId: formData.employeeId || `LAB-${Date.now().toString().slice(-4)}`,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      bloodGroup: formData.bloodGroup || "O+",
      contractorName: formData.contractorName || "Direct Site",
      joiningDate: formData.joiningDate || new Date().toISOString().split("T")[0],
      status: formData.status || "active",
      biometricRegistered: formData.biometricRegistered ?? true,
      biometricId: formData.biometricId || `BIO-${Date.now().toString().slice(-5)}`,
      address: formData.address,
      siteId: formData.siteId || activeProject.sites?.[0]?.id,
      siteName: formData.siteName || activeProject.sites?.[0]?.name || activeProject.name,
      productivityScore: editingWorker ? editingWorker.productivityScore : 88,
    };

    onSaveWorker(workerToSave);
    setIsAddEditModalOpen(false);
  };

  const handleOpenTransfer = (w: Worker) => {
    setWorkerToTransfer(w);
    setTargetProjectId(activeProject.id);
    setTargetSiteId("");
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerToTransfer) return;

    const targetProj = projects.find((p) => p.id === targetProjectId);
    const targetSite = targetProj?.sites?.find((s) => s.id === targetSiteId);

    onTransferWorker(
      workerToTransfer.id,
      targetProjectId,
      targetSiteId || targetProj?.sites?.[0]?.id,
      targetSite?.name || targetProj?.sites?.[0]?.name || targetProj?.name
    );

    setIsTransferModalOpen(false);
  };

  const handleToggleActive = (w: Worker) => {
    const updated: Worker = {
      ...w,
      status: w.status === "active" ? "inactive" : "active",
    };
    onSaveWorker(updated);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search labour by name, employee ID, or trade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filters & Action */}
        <div className="flex items-center flex-wrap gap-2.5">
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Trades ({safeWorkers.length})</option>
            {tradesList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Labourer
            </button>
          )}
        </div>
      </div>

      {/* Labour Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">ID & Labour Name</th>
                <th className="p-3">Trade / Category</th>
                <th className="p-3">Assigned Site / Zone</th>
                <th className="p-3">Wage Rates</th>
                <th className="p-3">Contact & Emergency</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No workforce members found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition group cursor-pointer"
                    onClick={() => onSelectWorkerForProfile(worker)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectWorkerForProfile(worker)}
                        className="text-left font-bold text-slate-900 dark:text-slate-100 hover:text-amber-600 transition flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <div>{worker.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {worker.employeeId || `LAB-${worker.id.slice(-4)}`}
                          </div>
                        </div>
                      </button>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                        {worker.role}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {worker.siteName || activeProject.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Contractor: {worker.contractorName || "Direct"}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        ₹{worker.dailyWage} / day
                      </div>
                      <div className="text-[10px] text-amber-600 font-mono">
                        OT: ₹{worker.overtimeHourlyRate || Math.round(worker.dailyWage / 8)}/hr
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {worker.phone}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ICE: {worker.emergencyContactPhone || "N/A"} ({worker.bloodGroup || "O+"})
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          worker.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {worker.status.toUpperCase()}
                      </span>
                    </td>

                    <td
                      className="p-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectWorkerForProfile(worker)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-600 dark:text-slate-300 hover:text-amber-600 text-[11px] font-medium transition"
                          title="View Attendance & Profile"
                        >
                          Profile
                        </button>

                        {canManage && (
                          <>
                            <button
                              onClick={() => handleOpenTransfer(worker)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Transfer to Site/Project"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(worker)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Edit Worker Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleActive(worker)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title={worker.status === "active" ? "Deactivate Worker" : "Activate Worker"}
                            >
                              {worker.status === "active" ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Labourer Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {editingWorker ? "Edit Labourer Details" : "Add New Labourer"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee / Labour ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g. LAB-1042"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Labour Category / Trade *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {tradesList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Daily Wage Rate (₹ / Day) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={formData.dailyWage}
                    onChange={(e) => {
                      const wage = Number(e.target.value);
                      setFormData({
                        ...formData,
                        dailyWage: wage,
                        overtimeHourlyRate: Math.round((wage / 8) * 1.5),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Overtime Rate (₹ / Hr)
                  </label>
                  <input
                    type="number"
                    min="20"
                    value={formData.overtimeHourlyRate}
                    onChange={(e) => setFormData({ ...formData, overtimeHourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Name & Relation
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="e.g. Geeta Kumar (Wife)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="+91 9876543211"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contractor / Sub-Contractor
                  </label>
                  <input
                    type="text"
                    value={formData.contractorName}
                    onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                    placeholder="e.g. Direct / Apex Labor Agency"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Residential / Local Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Local labour camp / temporary accommodation address"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.biometricRegistered}
                    onChange={(e) => setFormData({ ...formData, biometricRegistered: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Register for Biometric Terminal Hardware
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                >
                  {editingWorker ? "Save Changes" : "Create Labour Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Worker Modal */}
      {isTransferModalOpen && workerToTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Transfer Labourer Site
                </h3>
                <p className="text-xs text-slate-500">
                  {workerToTransfer.name} ({workerToTransfer.role})
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Project
                </label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Sub-Site / Zone
                </label>
                <select
                  value={targetSiteId}
                  onChange={(e) => setTargetSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Default Project Center</option>
                  {(projects.find((p) => p.id === targetProjectId)?.sites || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Radius: {s.attendanceRadiusMeters}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs">
                Transfers update workforce site assignments immediately and create an audit log entry for safety compliance.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
