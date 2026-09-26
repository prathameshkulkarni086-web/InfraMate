import React, { useState } from "react";
import { Equipment, Project, Worker } from "../../types";
import { X, Truck, Calendar, DollarSign, Briefcase } from "lucide-react";

interface AddEquipmentModalProps {
  onClose: () => void;
  onSave: (equip: Equipment) => void;
  projects: Project[];
  activeProject: Project;
  workers: Worker[];
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  onClose,
  onSave,
  projects,
  activeProject,
  workers,
}) => {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: "",
    assetId: "",
    type: "Excavator",
    brand: "",
    model: "",
    ownership: "Owned",
    status: "Available",
    projectId: activeProject.id,
  });

  const equipmentTypes = [
    "JCB", "Crane", "Excavator", "Concrete Mixer", "Truck", "Generator",
    "Bulldozer", "Forklift", "Loader", "Tractor", "Water Tanker", "Compactor", "Other"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.assetId) return;

    const newEquip: Equipment = {
      id: `EQ-${Date.now()}`,
      name: formData.name,
      assetId: formData.assetId,
      type: formData.type || "Other",
      brand: formData.brand || "",
      model: formData.model || "",
      registrationNumber: formData.registrationNumber || "",
      serialNumber: formData.serialNumber || "",
      ownership: formData.ownership as any,
      status: formData.status as any,
      vendor: formData.vendor || "",
      projectId: formData.projectId,
      siteId: formData.siteId,
      purchaseDate: formData.purchaseDate,
      purchaseCost: formData.purchaseCost,
    };

    onSave(newEquip);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col safe-bottom">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Add Equipment</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 touch-scroll">
          <form id="add-equip-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Heavy Duty JCB"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asset ID *</label>
                <input
                  type="text"
                  required
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white text-sm font-mono"
                  placeholder="e.g. JCB-001"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Equipment Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white text-sm"
                >
                  {equipmentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brand / Make</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Caterpillar"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. CAT 320"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ownership</label>
                <select
                  value={formData.ownership}
                  onChange={(e) => setFormData({ ...formData, ownership: e.target.value as any })}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white text-sm"
                >
                  <option value="Owned">Owned</option>
                  <option value="Rented">Rented</option>
                  <option value="Leased">Leased</option>
                </select>
              </div>
              
              {formData.ownership !== "Owned" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vendor / Rental Company</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white text-sm"
                    placeholder="e.g. United Rentals"
                  />
                </div>
              )}
              
            </div>
            
          </form>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-equip-form"
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
          >
            Save Equipment
          </button>
        </div>
      </div>
    </div>
  );
};
