import React, { useState } from "react";
import {
  Equipment,
  EquipmentUsageLog,
  FuelLog,
  MaintenanceRecord,
  EquipmentInspection,
  Project,
  Worker,
  User,
} from "../../types";
import { ArrowLeft, Truck, Activity, Fuel, Wrench, FileText, CheckSquare, Plus } from "lucide-react";
import { LogUsageModal } from "./LogUsageModal";
import { LogFuelModal } from "./LogFuelModal";
import { LogMaintenanceModal } from "./LogMaintenanceModal";
import { LogInspectionModal } from "./LogInspectionModal";
import { storage } from "../../services/storageService";

interface EquipmentProfileProps {
  equipment: Equipment;
  equipmentUsage: EquipmentUsageLog[];
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  inspections: EquipmentInspection[];
  projects: Project[];
  activeProject: Project;
  workers: Worker[];
  currentUser: User;
  onBack: () => void;
}

export const EquipmentProfile: React.FC<EquipmentProfileProps> = ({
  equipment,
  equipmentUsage,
  fuelLogs,
  maintenanceRecords,
  inspections,
  projects,
  activeProject,
  workers,
  currentUser,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "usage" | "fuel" | "maintenance" | "inspections">("overview");
  
  const [isLogUsageOpen, setIsLogUsageOpen] = useState(false);
  const [isLogFuelOpen, setIsLogFuelOpen] = useState(false);
  const [isLogMaintenanceOpen, setIsLogMaintenanceOpen] = useState(false);
  const [isLogInspectionOpen, setIsLogInspectionOpen] = useState(false);

  const handleSaveUsage = (log: EquipmentUsageLog) => {
    storage.saveEquipmentUsage(log);
    window.dispatchEvent(new Event("infrasync_storage_update"));
    setIsLogUsageOpen(false);
  };

  const handleSaveFuel = (log: FuelLog) => {
    storage.saveFuelLog(log);
    window.dispatchEvent(new Event("infrasync_storage_update"));
    setIsLogFuelOpen(false);
  };

  const handleSaveMaintenance = (record: MaintenanceRecord) => {
    storage.saveMaintenanceRecord(record);
    window.dispatchEvent(new Event("infrasync_storage_update"));
    setIsLogMaintenanceOpen(false);
  };

  const handleSaveInspection = (inspection: EquipmentInspection) => {
    storage.saveEquipmentInspection(inspection);
    window.dispatchEvent(new Event("infrasync_storage_update"));
    setIsLogInspectionOpen(false);
  };

  const totalHours = equipmentUsage.reduce((acc, u) => acc + u.totalHours, 0);
  const totalFuelCost = fuelLogs.reduce((acc, f) => acc + f.totalCost, 0);
  const totalFuelQty = fuelLogs.reduce((acc, f) => acc + f.quantity, 0);
  const totalMaintCost = maintenanceRecords.reduce((acc, m) => acc + m.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="p-2 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span className="truncate">{equipment.name}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {equipment.assetId}
              </span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">
              {equipment.brand} {equipment.model} • {equipment.type} • {equipment.ownership}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setIsLogUsageOpen(true)} className="min-h-[44px] px-3.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 flex items-center justify-center">Log Usage</button>
          <button onClick={() => setIsLogFuelOpen(true)} className="min-h-[44px] px-3.5 py-2 text-xs font-bold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-xl hover:bg-red-100 flex items-center justify-center">Add Fuel</button>
          <button onClick={() => setIsLogMaintenanceOpen(true)} className="min-h-[44px] px-3.5 py-2 text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-xl hover:bg-amber-100 flex items-center justify-center">Maintenance</button>
          <button onClick={() => setIsLogInspectionOpen(true)} className="min-h-[44px] px-3.5 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 flex items-center justify-center">Inspect</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Total Operating Hours</p>
                <p className="font-semibold text-slate-900 dark:text-white">{totalHours.toLocaleString()} hrs</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Fuel Consumed</p>
                <p className="font-semibold text-slate-900 dark:text-white">{totalFuelQty.toLocaleString()} L</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Fuel Cost</p>
                <p className="font-semibold text-slate-900 dark:text-white">₹{totalFuelCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Maintenance Cost</p>
                <p className="font-semibold text-slate-900 dark:text-white">₹{totalMaintCost.toLocaleString()}</p>
              </div>
              {totalHours > 0 && (
                <div>
                  <p className="text-xs text-slate-500">Cost per Hour</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    ₹{((totalFuelCost + totalMaintCost) / totalHours).toFixed(2)} / hr
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: FileText },
                { id: "usage", label: "Usage Logs", icon: Activity },
                { id: "fuel", label: "Fuel Logs", icon: Fuel },
                { id: "maintenance", label: "Maintenance", icon: Wrench },
                { id: "inspections", label: "Inspections", icon: CheckSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Asset Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="block text-slate-500">Asset ID</span>
                        <span className="font-medium text-slate-900 dark:text-white">{equipment.assetId}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Type</span>
                        <span className="font-medium text-slate-900 dark:text-white">{equipment.type}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Registration No</span>
                        <span className="font-medium text-slate-900 dark:text-white">{equipment.registrationNumber || "--"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Serial No</span>
                        <span className="font-medium text-slate-900 dark:text-white">{equipment.serialNumber || "--"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Ownership</span>
                        <span className="font-medium text-slate-900 dark:text-white">{equipment.ownership}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Vendor</span>
                        <span className="font-medium text-slate-900 dark:text-white">{equipment.vendor || "--"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {equipment.ownership === "Rented" && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                       <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Rental Details</h4>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                         <div>
                            <span className="block text-slate-500">Rental Rate</span>
                            <span className="font-medium text-slate-900 dark:text-white">₹{equipment.rentalRate?.toLocaleString()} / {equipment.rentalRateType}</span>
                         </div>
                         <div>
                            <span className="block text-slate-500">Rental Start</span>
                            <span className="font-medium text-slate-900 dark:text-white">{equipment.rentalStartDate || "--"}</span>
                         </div>
                         <div>
                            <span className="block text-slate-500">Rental End</span>
                            <span className="font-medium text-slate-900 dark:text-white">{equipment.rentalEndDate || "--"}</span>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "usage" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-medium">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Operator</th>
                        <th className="pb-3 pr-4">Activity</th>
                        <th className="pb-3 pr-4">Start Meter</th>
                        <th className="pb-3 pr-4">End Meter</th>
                        <th className="pb-3 pr-4 text-right">Total Hrs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {equipmentUsage.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-slate-500">No usage logs recorded yet.</td></tr>}
                      {equipmentUsage.map((u) => {
                        const operator = workers.find((w) => w.id === u.operatorId);
                        return (
                          <tr key={u.id}>
                            <td className="py-3 pr-4">{u.date}</td>
                            <td className="py-3 pr-4">{operator?.name || "--"}</td>
                            <td className="py-3 pr-4">{u.activity}</td>
                            <td className="py-3 pr-4">{u.startMeter}</td>
                            <td className="py-3 pr-4">{u.endMeter}</td>
                            <td className="py-3 pr-4 text-right font-medium text-slate-900 dark:text-white">{u.totalHours}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {activeTab === "fuel" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-medium">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Meter</th>
                        <th className="pb-3 pr-4">Fuel Type</th>
                        <th className="pb-3 pr-4">Qty</th>
                        <th className="pb-3 pr-4 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {fuelLogs.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-slate-500">No fuel logs recorded yet.</td></tr>}
                      {fuelLogs.map((f) => (
                        <tr key={f.id}>
                          <td className="py-3 pr-4">{f.date}</td>
                          <td className="py-3 pr-4">{f.meterReading}</td>
                          <td className="py-3 pr-4">{f.fuelType}</td>
                          <td className="py-3 pr-4">{f.quantity} L</td>
                          <td className="py-3 pr-4 text-right font-medium text-slate-900 dark:text-white">₹{f.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "maintenance" && (
                <div className="space-y-4">
                  {maintenanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No maintenance records yet.</div>
                  ) : (
                    maintenanceRecords.map((m) => (
                      <div key={m.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-slate-900 dark:text-white">{m.maintenanceType}</span>
                          <span className="text-slate-500 text-sm">{m.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{m.workPerformed}</p>
                        <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                          <span>Meter: {m.meterReading}</span>
                          <span>Cost: ₹{m.cost.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === "inspections" && (
                <div className="space-y-4">
                  {inspections.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No inspections logged yet.</div>
                  ) : (
                    inspections.map((i) => (
                      <div key={i.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{i.date}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              i.result === "Passed" ? "bg-emerald-100 text-emerald-700" :
                              i.result === "Failed" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{i.result}</span>
                          </div>
                          <span className="text-sm text-slate-500">Inspector: {i.inspector}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 py-1">
                            <span className="text-slate-500">Engine</span>
                            <span className={i.engineCondition === "Fail" ? "text-red-600" : "text-slate-900 dark:text-white"}>{i.engineCondition}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 py-1">
                            <span className="text-slate-500">Brakes</span>
                            <span className={i.brakes === "Fail" ? "text-red-600" : "text-slate-900 dark:text-white"}>{i.brakes}</span>
                          </div>
                        </div>
                        {i.remarks && <p className="mt-3 text-sm text-slate-600">{i.remarks}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {isLogUsageOpen && (
        <LogUsageModal equipment={equipment} onClose={() => setIsLogUsageOpen(false)} onSave={handleSaveUsage} currentUser={currentUser} activeProject={activeProject} workers={workers} />
      )}
      
      {isLogFuelOpen && (
        <LogFuelModal equipment={equipment} onClose={() => setIsLogFuelOpen(false)} onSave={handleSaveFuel} currentUser={currentUser} activeProject={activeProject} />
      )}
      
      {isLogMaintenanceOpen && (
        <LogMaintenanceModal equipment={equipment} onClose={() => setIsLogMaintenanceOpen(false)} onSave={handleSaveMaintenance} currentUser={currentUser} />
      )}
      
      {isLogInspectionOpen && (
        <LogInspectionModal equipment={equipment} onClose={() => setIsLogInspectionOpen(false)} onSave={handleSaveInspection} currentUser={currentUser} activeProject={activeProject} />
      )}

    </div>
  );
};
