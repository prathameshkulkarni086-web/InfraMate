import React, { useState } from "react";
import { Equipment, EquipmentInspection, Project, User } from "../../types";
import { X, CheckSquare } from "lucide-react";

interface Props {
  equipment: Equipment;
  onClose: () => void;
  onSave: (inspection: EquipmentInspection) => void;
  currentUser: User;
  activeProject: Project;
}

export const LogInspectionModal: React.FC<Props> = ({ equipment, onClose, onSave, currentUser, activeProject }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    inspector: currentUser.name,
    result: "Passed",
    engineCondition: "Pass",
    hydraulics: "Pass",
    tiresTracks: "Pass",
    brakes: "Pass",
    electrical: "Pass",
    fluids: "Pass",
    remarks: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `EI-${Date.now()}`,
      equipmentId: equipment.id,
      projectId: activeProject.id,
      date: formData.date,
      inspector: formData.inspector,
      result: formData.result as any,
      engineCondition: formData.engineCondition as any,
      hydraulics: formData.hydraulics as any,
      tiresTracks: formData.tiresTracks as any,
      brakes: formData.brakes as any,
      electrical: formData.electrical as any,
      fluids: formData.fluids as any,
      remarks: formData.remarks,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs safe-bottom animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col overflow-hidden safe-bottom">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="truncate">Inspection for {equipment.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto touch-scroll flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Overall Result</label>
              <select
                value={formData.result}
                onChange={e => setFormData({...formData, result: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Action Required">Action Required</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {["engineCondition", "hydraulics", "tiresTracks", "brakes", "electrical", "fluids"].map((field) => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 capitalize truncate">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <select
                  value={(formData as any)[field]}
                  onChange={e => setFormData({...formData, [field]: e.target.value})}
                  className="w-full min-h-[44px] px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={e => setFormData({...formData, remarks: e.target.value})}
              placeholder="Inspection findings, defects, or observations..."
              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center"
            >
              Save Inspection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
