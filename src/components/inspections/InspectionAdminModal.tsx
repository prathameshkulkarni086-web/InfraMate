import React, { useState } from "react";
import { X, ShieldCheck, Settings, CheckCircle2 } from "lucide-react";
import { InspectionAdminConfig } from "../../types/inspection";
import { inspectionService } from "../../services/inspectionService";

interface InspectionAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: (config: InspectionAdminConfig) => void;
}

export const InspectionAdminModal: React.FC<InspectionAdminModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState<InspectionAdminConfig>(inspectionService.getAdminConfig());

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    inspectionService.saveAdminConfig(config);
    onConfigUpdated(config);
    alert("Quality Inspection administration configuration saved successfully.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 safe-bottom">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 safe-bottom max-h-[92vh] flex flex-col">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Inspection Settings & Anti-Fraud Rules
              </h2>
              <p className="text-xs text-slate-500 truncate">Configure GPS geofence and camera validation</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto touch-scroll flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Geofence Radius (Meters)
            </label>
            <input
              type="number"
              min={10}
              max={1000}
              value={config.geofenceRadiusMeters}
              onChange={(e) => setConfig({ ...config, geofenceRadiusMeters: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Maximum allowable distance from site coordinates for on-site verification.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.gpsVerificationRequired}
                onChange={(e) => setConfig({ ...config, gpsVerificationRequired: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Require Mandatory GPS Geofence Verification for Submissions
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.photoRequired}
                onChange={(e) => setConfig({ ...config, photoRequired: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Require Live Camera Photo Evidence for All Inspections
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.aiAnalysisEnabled}
                onChange={(e) => setConfig({ ...config, aiAnalysisEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Enable AI Quality Vision Assistant (Advisory Assistance Only)
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
