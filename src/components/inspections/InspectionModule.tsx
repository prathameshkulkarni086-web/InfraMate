import React, { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  MapPin,
  Settings,
  Sparkles,
  RefreshCw,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Project, User } from "../../types";
import { QualityInspection, QualityDefect, InspectionAdminConfig } from "../../types/inspection";
import { inspectionService } from "../../services/inspectionService";
import { NewInspectionModal } from "./NewInspectionModal";
import { InspectionDetailModal } from "./InspectionDetailModal";
import { InspectionAdminModal } from "./InspectionAdminModal";

interface InspectionModuleProps {
  project: Project;
  currentUser: User;
}

export const InspectionModule: React.FC<InspectionModuleProps> = ({ project, currentUser }) => {
  const [inspections, setInspections] = useState<QualityInspection[]>(inspectionService.getInspections(project.id));
  const [defects, setDefects] = useState<QualityDefect[]>(inspectionService.getDefects(project.id));
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Handlers
  const handleSaveNewInspection = (newInsp: QualityInspection) => {
    inspectionService.saveInspection(newInsp);
    setInspections(inspectionService.getInspections(project.id));
  };

  const handleUpdateStatus = (inspectionId: string, status: QualityInspection["status"], remarks?: string) => {
    inspectionService.updateInspectionStatus(inspectionId, status, currentUser.name, remarks);
    setInspections(inspectionService.getInspections(project.id));
    if (selectedInspection && selectedInspection.id === inspectionId) {
      const updated = inspectionService.getInspections(project.id).find((i) => i.id === inspectionId);
      if (updated) setSelectedInspection(updated);
    }
  };

  const handleCreateDefect = (defect: QualityDefect) => {
    inspectionService.saveDefect(defect);
    setDefects(inspectionService.getDefects(project.id));
  };

  const filteredInspections = inspections.filter((insp) => {
    const matchesSearch =
      insp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.inspectorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || insp.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = categoryFilter === "all" || insp.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const passedCount = inspections.filter((i) => i.status === "Passed").length;
  const failedCount = inspections.filter((i) => i.status === "Failed").length;
  const pendingCount = inspections.filter((i) => i.status === "Submitted" || i.status === "Under Review").length;
  const openDefectsCount = defects.filter((d) => d.status === "open").length;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quality Inspections & Physical Evidence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {project.name}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mandatory on-site camera capture, 100m GPS geofence anti-fraud verification, and quality audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="min-h-[44px] min-w-[44px] p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition shadow-sm flex items-center justify-center shrink-0"
            title="Inspection Settings & Geofence"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex-1 sm:flex-initial min-h-[44px] px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm transition transform active:scale-95"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span className="truncate">New Inspection & Photo Capture</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inspections</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{inspections.length}</h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
              {passedCount} Passed
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
            <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</h3>
            <span className="text-xs text-slate-500 mt-1 inline-block">Requires engineer sign-off</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed / Reinspect</span>
            <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">{failedCount}</h3>
            <span className="text-xs text-red-500 mt-1 inline-block">Action required</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Quality Defects</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{openDefectsCount}</h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 inline-block">Linked to inspections</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspections, ID, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="reinspection required">Reinspection Required</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="reinforcement">Reinforcement</option>
            <option value="concrete casting">Concrete Casting</option>
            <option value="waterproofing">Waterproofing</option>
            <option value="brickwork & masonry">Brickwork & Masonry</option>
            <option value="electrical conduit">Electrical Conduit</option>
          </select>
        </div>
      </div>

      {/* Inspections Table / Cards Grid */}
      {filteredInspections.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Quality Inspections Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Capture your first on-site inspection photo with geofence verification using the button above.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow inline-flex items-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" /> New Inspection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInspections.map((insp) => {
            const firstPhoto = insp.photos[0];
            return (
              <div
                key={insp.id}
                onClick={() => setSelectedInspection(insp)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 relative">
                    {firstPhoto ? (
                      <img src={firstPhoto.imageUrl} alt={insp.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Photo</div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white text-[10px] font-bold">
                      {insp.category}
                    </span>
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow ${
                        insp.status === "Passed"
                          ? "bg-emerald-600 text-white"
                          : insp.status === "Failed"
                          ? "bg-red-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {insp.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                      {insp.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {insp.location}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{insp.inspectorName}</span>
                    <p className="text-[10px]">{new Date(insp.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <NewInspectionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        project={project}
        currentUser={currentUser}
        onSave={handleSaveNewInspection}
      />

      {selectedInspection && (
        <InspectionDetailModal
          isOpen={true}
          onClose={() => setSelectedInspection(null)}
          inspection={selectedInspection}
          currentUser={currentUser}
          onUpdateStatus={handleUpdateStatus}
          onCreateDefect={handleCreateDefect}
        />
      )}

      <InspectionAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onConfigUpdated={(cfg) => console.log("Config updated:", cfg)}
      />

    </div>
  );
};
