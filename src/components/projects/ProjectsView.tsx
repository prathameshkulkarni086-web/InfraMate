import React, { useState } from "react";
import {
  Building2,
  Plus,
  Calendar,
  DollarSign,
  MapPin,
  User,
  CheckCircle2,
  Clock,
  Layers,
  FileDown,
  X,
} from "lucide-react";
import { Project, Milestone, UserRole } from "../../types";
import { pdfService } from "../../services/pdfService";

interface ProjectsViewProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onSaveProject: (project: Project) => void;
  userRole: UserRole;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onSaveProject,
  userRole,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    location: "",
    clientName: "",
    managerName: "Rajesh Sharma (PM)",
    budget: 3500000,
    startDate: "2026-09-01",
    endDate: "2027-04-30",
    plotAreaSqFt: 2000,
    floors: 2,
  });

  const canCreate = userRole === "admin" || userRole === "project_manager";

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.location) return;

    const defaultMilestones: Milestone[] = [
      { id: `m-${Date.now()}-1`, title: "Soil Excavation & Foundation", targetDate: "2026-09-30", status: "in_progress", budgetSharePercentage: 20 },
      { id: `m-${Date.now()}-2`, title: "Ground Floor RCC Superstructure", targetDate: "2026-11-15", status: "pending", budgetSharePercentage: 25 },
      { id: `m-${Date.now()}-3`, title: "Upper Floor Slab & Brick Masonry", targetDate: "2027-01-20", status: "pending", budgetSharePercentage: 25 },
      { id: `m-${Date.now()}-4`, title: "MEP, Flooring & Plastering", targetDate: "2027-03-15", status: "pending", budgetSharePercentage: 18 },
      { id: `m-${Date.now()}-5`, title: "Painting, Fixtures & Handover", targetDate: "2027-04-30", status: "pending", budgetSharePercentage: 12 },
    ];

    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      location: newProject.location,
      clientId: "usr-client-1",
      clientName: newProject.clientName || "Direct Client",
      managerId: "usr-pm-1",
      managerName: newProject.managerName,
      budget: Number(newProject.budget),
      spentAmount: 0,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      status: "in_progress",
      progressPercentage: 5,
      plotAreaSqFt: Number(newProject.plotAreaSqFt),
      floors: Number(newProject.floors),
      milestones: defaultMilestones,
      createdAt: new Date().toISOString().split("T")[0],
    };

    onSaveProject(project);
    onSelectProject(project.id);
    setShowCreateModal(false);
    setNewProject({
      name: "",
      description: "",
      location: "",
      clientName: "",
      managerName: "Rajesh Sharma (PM)",
      budget: 3500000,
      startDate: "2026-09-01",
      endDate: "2027-04-30",
      plotAreaSqFt: 2000,
      floors: 2,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Create Project Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project Portfolio Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, track budgets, milestones, and site locations across all construction sites.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white px-3.5 py-2 transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((p) => {
          const isSelected = p.id === activeProject.id;
          const spentPct = Math.round((p.spentAmount / (p.budget || 1)) * 100);

          return (
            <div
              key={p.id}
              onClick={() => onSelectProject(p.id)}
              className={`rounded-xl border p-5 transition cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-sm ${
                isSelected
                  ? "border-blue-600 bg-white ring-2 ring-blue-600/10 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 rounded-bl-lg bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Active Workspace
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      p.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {p.status.replace("_", " ")}
                  </span>
                  {p.floors && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-slate-400" /> G+{p.floors - 1} Floors ({p.plotAreaSqFt} sq.ft)
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" /> Client: {p.clientName || "Direct"}
                    </span>
                    <span>Manager: {p.managerName || "Unassigned"}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Financial Stats */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                {/* Physical Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Physical Progress</span>
                    <span className="text-blue-600 font-bold">{p.progressPercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${p.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Financial Burn */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Spent</span>
                    <div className="font-bold text-slate-900">₹{p.spentAmount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget</span>
                    <div className="font-bold text-slate-700">₹{p.budget.toLocaleString()} ({spentPct}%)</div>
                  </div>
                </div>

                {/* Milestones count */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{(p.milestones || []).filter((m) => m.status === "completed").length} / {(p.milestones || []).length} Milestones Completed</span>
                  <span className="text-slate-600 font-medium">{p.startDate} → {p.endDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Project Milestones Detailed Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Milestone Schedule for: <span className="text-blue-600">{activeProject.name}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Scheduled structural phases and budget share allocations</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium border border-slate-200">
            {activeProject.milestones?.length || 0} Phases
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(activeProject.milestones || []).map((m, idx) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                m.status === "completed"
                  ? "border-emerald-200 bg-emerald-50/50"
                  : m.status === "in_progress"
                  ? "border-blue-200 bg-blue-50/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phase {idx + 1}</span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      m.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : m.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {m.status.replace("_", " ")}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1.5">{m.title}</h4>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Target: {m.targetDate}</span>
                <span className="font-semibold text-slate-700">{m.budgetSharePercentage}% Budget</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Create New Construction Project</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aura Crest Luxury Residences"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Location & Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 18, Jubilee Hills, Hyderabad"
                  value={newProject.location}
                  onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Project Scope & Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief architectural scope and specifications..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Sanctioned Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    min={100000}
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Plot Area (sq.ft)</label>
                  <input
                    type="number"
                    min={500}
                    value={newProject.plotAreaSqFt}
                    onChange={(e) => setNewProject({ ...newProject, plotAreaSqFt: Number(e.target.value) })}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Target Completion Date</label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Arvind Rao"
                    value={newProject.clientName}
                    onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Floors (G+N)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newProject.floors}
                    onChange={(e) => setNewProject({ ...newProject, floors: Number(e.target.value) })}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto min-h-[44px] flex items-center justify-center rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-xs transition"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
