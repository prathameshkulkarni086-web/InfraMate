import React, { useState } from "react";
import { Equipment, EquipmentUsageLog, Project, Worker, User } from "../../types";
import { X, Activity } from "lucide-react";

interface Props {
  equipment: Equipment;
  onClose: () => void;
  onSave: (log: EquipmentUsageLog) => void;
  currentUser: User;
  activeProject: Project;
  workers: Worker[];
}

export const LogUsageModal: React.FC<Props> = ({ equipment, onClose, onSave, currentUser, activeProject, workers }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    operatorId: equipment.operatorId || "",
    startMeter: "",
    endMeter: "",
    activity: "",
    remarks: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseFloat(formData.startMeter);
    const end = parseFloat(formData.endMeter);
    if (isNaN(s) || isNaN(end) || end < s) {
      alert("Invalid meter reading");
      return;
    }
    onSave({
      id: `EU-${Date.now()}`,
      equipmentId: equipment.id,
      projectId: activeProject.id,
      operatorId: formData.operatorId,
      date: formData.date,
      startMeter: s,
      endMeter: end,
      totalHours: end - s,
      activity: formData.activity,
      remarks: formData.remarks,
      loggedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs safe-bottom animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col overflow-hidden safe-bottom">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Activity className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="truncate">Log Usage for {equipment.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto touch-scroll flex-1">
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Operator</label>
            <select
              value={formData.operatorId}
              onChange={e => setFormData({...formData, operatorId: e.target.value})}
              className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Operator</option>
              {workers.filter(w => w.role === "Machine Operator").map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Meter</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.startMeter}
                onChange={e => setFormData({...formData, startMeter: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Meter</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.endMeter}
                onChange={e => setFormData({...formData, endMeter: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Activity</label>
            <input
              type="text"
              required
              value={formData.activity}
              onChange={e => setFormData({...formData, activity: e.target.value})}
              placeholder="e.g. Excavation"
              className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
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
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center"
            >
              Save Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
