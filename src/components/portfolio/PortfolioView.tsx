import React, { useState, useMemo } from "react";
import {
  Building2, Search, Filter, Star, Plus, MapPin, Calendar, TrendingUp, AlertTriangle, Layers, Activity, Users, DollarSign, ChevronRight
} from "lucide-react";
import { Project, UserRole, ProjectStatus } from "../../types";
import { storage } from "../../services/storageService";

interface PortfolioViewProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  userRole: UserRole;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ projects, onSelectProject, userRole }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    location: "",
    managerName: "Site Engineer",
    budget: 5000000,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
    plotAreaSqFt: 2500,
    floors: 3,
    description: "",
  });

  const handleCreateProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      return;
    }

    const newProj: Project = {
      id: "proj-" + Date.now(),
      name: formData.name.trim(),
      clientName: formData.clientName.trim() || "Direct Client",
      clientId: "usr-client-1",
      location: formData.location.trim(),
      managerName: formData.managerName.trim() || "Lead Engineer",
      managerId: "usr-pm-1",
      budget: Number(formData.budget) || 1000000,
      spentAmount: 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: "planning",
      progressPercentage: 0,
      plotAreaSqFt: Number(formData.plotAreaSqFt) || 2000,
      floors: Number(formData.floors) || 2,
      description: formData.description.trim() || "New construction site in active workspace.",
      milestones: [
        { id: `m-${Date.now()}-1`, title: "Excavation & Substructure", targetDate: formData.startDate, status: "pending", budgetSharePercentage: 20 },
        { id: `m-${Date.now()}-2`, title: "Superstructure Frame & Masonry", targetDate: formData.endDate, status: "pending", budgetSharePercentage: 40 },
        { id: `m-${Date.now()}-3`, title: "MEP, Finishing & Handover", targetDate: formData.endDate, status: "pending", budgetSharePercentage: 40 },
      ],
      createdAt: new Date().toISOString().split("T")[0],
    };

    storage.saveProject(newProj);
    onSelectProject(newProj.id);
    setShowCreateModal(false);
    setFormData({
      name: "",
      clientName: "",
      location: "",
      managerName: "Site Engineer",
      budget: 5000000,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
      plotAreaSqFt: 2500,
      floors: 3,
      description: "",
    });
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  if (projects.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 md:p-12">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">
              Welcome to InfraSync 👋
            </h1>
            <p className="text-lg text-slate-500 mb-8 max-w-lg leading-relaxed">
              Your construction workspace is ready and isolated. You haven't created any projects yet. Let's get started by creating your first site.
            </p>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-3 text-lg"
            >
              <Plus className="w-6 h-6" />
              Create Your First Project
            </button>
            
            <div className="mt-12 pt-10 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
                Once you create a project, you can manage:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {['Workers', 'Attendance', 'DPR', 'Site Progress', 'Photo Inspections', 'Materials', 'Expenses', 'Documents', 'Reports'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal for 0 projects */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Create Your First Project Site
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                  Close
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Project Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Skyline Heights Tower A"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Client / Developer Name</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Prestige Estates Ltd"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Site Location / City *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Sector 62, Gurgaon"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Total Project Budget (₹)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Project Manager / Lead</label>
                    <input
                      type="text"
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Target Completion Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl -mx-6 -mb-6 mt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                  >
                    Create Project Site
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }


  // Derived portfolio metrics
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spentAmount, 0);
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progressPercentage, 0) / projects.length) : 0;
  
  const statusCounts = {
    in_progress: projects.filter(p => p.status === "in_progress").length,
    delayed: projects.filter(p => p.status === "delayed").length,
    completed: projects.filter(p => p.status === "completed").length,
    planning: projects.filter(p => p.status === "planning").length,
    on_hold: projects.filter(p => p.status === "on_hold").length,
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "in_progress": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "delayed": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "on_hold": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "completed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "planning": return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Sites Portfolio</h1>
          <p className="text-sm text-slate-500 mt-1">Manage {projects.length} ongoing construction projects across all locations.</p>
        </div>
        {(userRole === "admin" || userRole === "project_manager") && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add New Site</span>
          </button>
        )}
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 mb-1">Total Active Sites</div>
            <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 mb-1">Avg. Portfolio Progress</div>
            <div className="text-2xl font-bold text-slate-900">{avgProgress}%</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 mb-1">Total Budget</div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalBudget)}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 mb-1">Delayed/Critical</div>
            <div className="text-2xl font-bold text-slate-900">{statusCounts.delayed + statusCounts.on_hold}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites by name, location, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">Ongoing ({statusCounts.in_progress})</option>
            <option value="delayed">Delayed ({statusCounts.delayed})</option>
            <option value="on_hold">On Hold ({statusCounts.on_hold})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
            <option value="planning">Planning ({statusCounts.planning})</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProjects.map((p) => (
          <div 
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(p.status)}`}>
                {p.status.replace("_", " ")}
              </div>
              {p.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
            </div>
            
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">{p.name}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" /> {p.location}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-900">{p.progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${p.status === 'delayed' ? 'bg-orange-500' : 'bg-blue-500'}`} 
                    style={{ width: `${p.progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="text-slate-500 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatCurrency(p.budget)}
                </div>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold">
                    PM
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-blue-700">
                    +4
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Sites Found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Create New Site
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Skyline Heights Tower A"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Client / Developer Name</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Prestige Estates Ltd"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Site Location / City *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Sector 62, Gurgaon"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Project Manager / Lead</label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target Completion Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl -mx-6 -mb-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                >
                  Create Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
