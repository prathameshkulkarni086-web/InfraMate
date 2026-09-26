import React, { useState } from "react";
import {
  Equipment,
  EquipmentUsageLog,
  FuelLog,
  MaintenanceRecord,
  EquipmentInspection,
  Project,
  Worker,
  UserRole,
  User,
} from "../../types";
import {
  Truck,
  Plus,
  Activity,
  Fuel,
  Wrench,
  Search,
  Filter,
} from "lucide-react";
import { storage } from "../../services/storageService";
import { EquipmentDashboard } from "./EquipmentDashboard";
import { EquipmentList } from "./EquipmentList";
import { AddEquipmentModal } from "./AddEquipmentModal";
import { EquipmentProfile } from "./EquipmentProfile";

interface EquipmentViewProps {
  equipment: Equipment[];
  equipmentUsage: EquipmentUsageLog[];
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  inspections: EquipmentInspection[];
  projects: Project[];
  activeProject: Project;
  workers: Worker[];
  userRole: UserRole;
  currentUser: User;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipment,
  equipmentUsage,
  fuelLogs,
  maintenanceRecords,
  inspections,
  projects,
  activeProject,
  workers,
  userRole,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "directory">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  const selectedEquipment = selectedEquipmentId
    ? equipment.find((e) => e.id === selectedEquipmentId)
    : null;

  const handleSaveEquipment = (equip: Equipment) => {
    storage.saveEquipment(equip);
    window.dispatchEvent(new Event("infrasync_storage_update"));
    setIsAddModalOpen(false);
  };

  if (selectedEquipment) {
    return (
      <EquipmentProfile
        equipment={selectedEquipment}
        equipmentUsage={equipmentUsage.filter((u) => u.equipmentId === selectedEquipment.id)}
        fuelLogs={fuelLogs.filter((f) => f.equipmentId === selectedEquipment.id)}
        maintenanceRecords={maintenanceRecords.filter((m) => m.equipmentId === selectedEquipment.id)}
        inspections={inspections.filter((i) => i.equipmentId === selectedEquipment.id)}
        projects={projects}
        activeProject={activeProject}
        workers={workers}
        onBack={() => setSelectedEquipmentId(null)}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Equipment & Machinery
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage heavy machinery, vehicles, fuel logs, and maintenance tracking.
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(userRole === "admin" || userRole === "project_manager") && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto touch-scroll">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "dashboard"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          Overview Dashboard
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "directory"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          Equipment Directory
        </button>
      </div>

      {activeTab === "dashboard" ? (
        <EquipmentDashboard
          equipment={equipment}
          usage={equipmentUsage}
          fuelLogs={fuelLogs}
          maintenance={maintenanceRecords}
        />
      ) : (
        <EquipmentList
          equipment={equipment}
          searchQuery={searchQuery}
          onSelectEquipment={setSelectedEquipmentId}
        />
      )}

      {isAddModalOpen && (
        <AddEquipmentModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveEquipment}
          projects={projects}
          activeProject={activeProject}
          workers={workers}
        />
      )}
    </div>
  );
};
