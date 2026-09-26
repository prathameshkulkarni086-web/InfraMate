import React, { useState } from "react";
import {
  X,
  LogOut,
  Clock,
  MapPin,
  Camera,
  User,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Truck,
} from "lucide-react";
import {
  VehicleGateMovement,
  DEFAULT_SITE_GATES,
  VEHICLE_TYPE_CONFIG,
} from "../../../types";
import { VehiclePhotoCapture } from "./VehiclePhotoCapture";

interface VehicleExitModalProps {
  movement: VehicleGateMovement | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: (
    id: string,
    exitData: {
      exitTime: string;
      exitGateNumber: string;
      exitRecordedBy: string;
      exitNotes?: string;
      exitPhotoUrl?: string;
    }
  ) => void;
  currentUserName: string;
}

export const VehicleExitModal: React.FC<VehicleExitModalProps> = ({
  movement,
  isOpen,
  onClose,
  onConfirmExit,
  currentUserName,
}) => {
  if (!isOpen || !movement) return null;

  const nowStr = new Date().toISOString().slice(0, 16);
  const [exitGateNumber, setExitGateNumber] = useState<string>(
    movement.gateNumber || DEFAULT_SITE_GATES[0].name
  );
  const [exitTime, setExitTime] = useState<string>(nowStr);
  const [exitRecordedBy, setExitRecordedBy] = useState<string>(
    currentUserName || "Gate Security Officer"
  );
  const [exitNotes, setExitNotes] = useState<string>(
    "Gate pass collected. Empty load inspected and cleared for departure."
  );
  const [exitPhotoUrl, setExitPhotoUrl] = useState<string>("");

  // Calculate dwell time
  const entryDate = new Date(movement.entryTime);
  const exitDate = new Date(exitTime);
  const dwellMs = Math.max(0, exitDate.getTime() - entryDate.getTime());
  const dwellHours = Math.floor(dwellMs / (1000 * 60 * 60));
  const dwellMins = Math.floor((dwellMs % (1000 * 60 * 60)) / (1000 * 60));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmExit(movement.id, {
      exitTime: new Date(exitTime).toISOString(),
      exitGateNumber,
      exitRecordedBy: exitRecordedBy.trim() || "Security Officer",
      exitNotes: exitNotes.trim() || undefined,
      exitPhotoUrl: exitPhotoUrl || undefined,
    });
    onClose();
  };

  const typeConfig = VEHICLE_TYPE_CONFIG[movement.vehicleType] || {
    label: movement.vehicleType,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-inner">
              <LogOut className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Vehicle Gate Exit (Outward)</h2>
              <p className="text-xs text-emerald-200">
                Pass #{movement.passNumber} | Fast Check-out
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Vehicle Inward Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                  {movement.vehicleNumber}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  {typeConfig.label}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Inside Site
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 block">Driver</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {movement.driverName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Entry Gate & Time</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(movement.entryTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Dwell Duration</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {dwellHours}h {dwellMins}m
                </span>
              </div>
            </div>

            {movement.materialDetails?.itemDescription && (
              <div className="text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Cargo Delivered: </span>
                {movement.materialDetails.itemDescription} ({movement.materialDetails.quantity || "N/A"})
                {movement.materialDetails.supplierName && ` from ${movement.materialDetails.supplierName}`}
              </div>
            )}
          </div>

          {/* Exit Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exit Gate *
                </label>
                <select
                  value={exitGateNumber}
                  onChange={(e) => setExitGateNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                >
                  {DEFAULT_SITE_GATES.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exit Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recorded By (Exit Operator / Guard) *
              </label>
              <input
                type="text"
                value={exitRecordedBy}
                onChange={(e) => setExitRecordedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exit Inspection Remarks
              </label>
              <input
                type="text"
                value={exitNotes}
                onChange={(e) => setExitNotes(e.target.value)}
                placeholder="e.g. Empty truck inspected, gate pass retrieved"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Optional Exit Photo */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <VehiclePhotoCapture
                photoUrl={exitPhotoUrl}
                onPhotoChange={setExitPhotoUrl}
                required={false}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Exit & Close Gate Pass</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
