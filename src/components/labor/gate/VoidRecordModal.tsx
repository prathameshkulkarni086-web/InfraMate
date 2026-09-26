import React, { useState } from "react";
import { X, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { VehicleGateMovement } from "../../../types";

interface VoidRecordModalProps {
  movement: VehicleGateMovement | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmVoid: (id: string, reason: string) => void;
  currentUserName: string;
}

export const VoidRecordModal: React.FC<VoidRecordModalProps> = ({
  movement,
  isOpen,
  onClose,
  onConfirmVoid,
  currentUserName,
}) => {
  const [reason, setReason] = useState<string>("Duplicate entry logged by mistake");
  const [customReason, setCustomReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen || !movement) return null;

  const REASON_PRESETS = [
    "Duplicate entry logged by mistake",
    "Incorrect vehicle registration plate entered",
    "Wrong project site / gate selected",
    "Vehicle turned back before entering site gate",
    "Clerical data entry correction",
    "Other administrative correction",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Other administrative correction" ? customReason.trim() : reason;
    if (!finalReason) {
      setError("Please specify the correction / void reason.");
      return;
    }
    onConfirmVoid(movement.id, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-red-900/90 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Void / Correct Gate Movement</h2>
              <p className="text-xs text-red-200">
                Pass #{movement.passNumber} — {movement.vehicleNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-red-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">Immutable Audit Trail Policy:</span> Vehicle movement records
              cannot be deleted to ensure construction site security compliance. This action will flag
              the pass as <strong>VOIDED</strong> with your timestamp and reason.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Void / Correction Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 outline-hidden"
            >
              {REASON_PRESETS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === "Other administrative correction" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Reason *
              </label>
              <textarea
                rows={3}
                placeholder="Explain why this vehicle gate record is being voided..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 outline-hidden"
                required
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Operator logging correction: <strong>{currentUserName}</strong>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Confirm Void Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
