import React, { useState } from "react";
import { Equipment, FuelLog, Project, User } from "../../types";
import { X, Fuel } from "lucide-react";

interface Props {
  equipment: Equipment;
  onClose: () => void;
  onSave: (log: FuelLog) => void;
  currentUser: User;
  activeProject: Project;
}

export const LogFuelModal: React.FC<Props> = ({ equipment, onClose, onSave, currentUser, activeProject }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    fuelType: "Diesel",
    quantity: "",
    rate: "",
    meterReading: "",
    pumpName: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formData.quantity);
    const rate = parseFloat(formData.rate);
    const meter = parseFloat(formData.meterReading);
    if (isNaN(qty) || isNaN(rate) || isNaN(meter)) {
      alert("Invalid numbers");
      return;
    }
    onSave({
      id: `FL-${Date.now()}`,
      equipmentId: equipment.id,
      projectId: activeProject.id,
      date: formData.date,
      fuelType: formData.fuelType as any,
      quantity: qty,
      totalCost: qty * rate,
      meterReading: meter,
      pumpName: formData.pumpName,
      loggedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs safe-bottom animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col overflow-hidden safe-bottom">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Fuel className="w-5 h-5 text-red-600 shrink-0" />
            <span className="truncate">Add Fuel for {equipment.name}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={e => setFormData({...formData, fuelType: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Meter Reading</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.meterReading}
                onChange={e => setFormData({...formData, meterReading: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity (Liters)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rate per Liter (₹)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.rate}
                onChange={e => setFormData({...formData, rate: e.target.value})}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center"
            >
              Save Fuel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
