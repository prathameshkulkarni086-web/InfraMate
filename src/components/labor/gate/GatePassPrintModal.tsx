import React from "react";
import {
  X,
  Printer,
  ShieldCheck,
  Truck,
  MapPin,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  VehicleGateMovement,
  Project,
  VEHICLE_TYPE_CONFIG,
  VISIT_PURPOSE_CONFIG,
} from "../../../types";

interface GatePassPrintModalProps {
  movement: VehicleGateMovement | null;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export const GatePassPrintModal: React.FC<GatePassPrintModalProps> = ({
  movement,
  project,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !movement) return null;

  const handlePrint = () => {
    window.print();
  };

  const typeConfig = VEHICLE_TYPE_CONFIG[movement.vehicleType] || {
    label: movement.vehicleType,
  };
  const purposeConfig = VISIT_PURPOSE_CONFIG[movement.purpose] || {
    label: movement.purpose,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn print:p-0 print:bg-white">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none print:max-w-none print:my-0">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Site Gate Pass Slip — {movement.passNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Gate Pass Document */}
        <div className="p-8 space-y-6 text-slate-900 bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center font-black text-2xl text-white">
                I
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase">
                  InfraMate Site Gate Movement Pass
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  Official Site Security & Logistics Inward/Outward Document
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-black text-blue-800 tracking-wider">
                {movement.passNumber}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                STATUS: {movement.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Project & Gate Metadata */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Project & Construction Site
              </span>
              <span className="font-bold text-slate-900 text-sm">{project.name}</span>
              <span className="text-slate-600 block mt-0.5">
                {project.location || project.siteAddress || "Site Main Premises"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Gate & Movement Channel
              </span>
              <span className="font-bold text-slate-900">{movement.gateNumber}</span>
              {movement.exitGateNumber && (
                <span className="text-slate-600 block mt-0.5">
                  Exit Gate: {movement.exitGateNumber}
                </span>
              )}
            </div>
          </div>

          {/* Vehicle & Driver Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Vehicle Details */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                Vehicle Specification
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plate Number:</span>
                  <span className="font-mono font-bold text-slate-950 text-sm">
                    {movement.vehicleNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Type:</span>
                  <span className="font-semibold text-slate-800">{typeConfig.label}</span>
                </div>
                {movement.vehicleModel && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model/Make:</span>
                    <span className="text-slate-800">{movement.vehicleModel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Visit Purpose:</span>
                  <span className="font-semibold text-blue-800">{purposeConfig.label}</span>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                Driver & Crew
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver Name:</span>
                  <span className="font-bold text-slate-900">{movement.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile Phone:</span>
                  <span className="font-mono text-slate-800">{movement.driverPhone}</span>
                </div>
                {movement.driverLicenseNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">License / ID:</span>
                    <span className="font-mono text-slate-800">
                      {movement.driverLicenseNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Helper / Crew:</span>
                  <span className="text-slate-800">
                    {movement.helperCount > 0
                      ? `${movement.helperCount} (${movement.helperNames || "Present"})`
                      : "Solo Driver"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Material & Inward Cargo Section (if any) */}
          {movement.materialDetails && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Consignment & Weighbridge Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Item Delivered</span>
                  <span className="font-bold text-slate-900">
                    {movement.materialDetails.itemDescription || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Challan / Inv #</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {movement.materialDetails.challanNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Supplier</span>
                  <span className="text-slate-800">
                    {movement.materialDetails.supplierName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Declared Quantity</span>
                  <span className="font-bold text-blue-700">
                    {movement.materialDetails.quantity || "N/A"}
                  </span>
                </div>
              </div>

              {(movement.materialDetails.weightGrossKg || movement.materialDetails.weightNetKg) && (
                <div className="flex items-center gap-4 pt-2 border-t border-slate-200 text-xs">
                  {movement.materialDetails.weightGrossKg && (
                    <span>
                      <strong className="text-slate-600">Gross:</strong>{" "}
                      {movement.materialDetails.weightGrossKg.toLocaleString()} kg
                    </span>
                  )}
                  {movement.materialDetails.weightTareKg && (
                    <span>
                      <strong className="text-slate-600">Tare:</strong>{" "}
                      {movement.materialDetails.weightTareKg.toLocaleString()} kg
                    </span>
                  )}
                  {movement.materialDetails.weightNetKg && (
                    <span className="font-bold text-emerald-700">
                      <strong>Net Payload:</strong>{" "}
                      {movement.materialDetails.weightNetKg.toLocaleString()} kg
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200 py-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Inward Check-in
              </span>
              <span className="font-bold text-slate-900">
                {new Date(movement.entryTime).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Recorded by: {movement.entryRecordedBy}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Outward Check-out
              </span>
              {movement.exitTime ? (
                <>
                  <span className="font-bold text-slate-900">
                    {new Date(movement.exitTime).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Recorded by: {movement.exitRecordedBy || "Security"}
                  </span>
                </>
              ) : (
                <span className="text-amber-700 font-bold italic">
                  Vehicle Currently Inside Site Yard
                </span>
              )}
            </div>
          </div>

          {/* Signatures & Authorizations */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-6">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <span className="text-[10px] font-bold uppercase text-slate-600">
                Driver Signature
              </span>
            </div>
            <div className="space-y-6">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <span className="text-[10px] font-bold uppercase text-slate-600">
                Gate Security Officer
              </span>
            </div>
            <div className="space-y-6">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <span className="text-[10px] font-bold uppercase text-slate-600">
                Store / QC Engineer
              </span>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 text-center pt-4 border-t border-slate-100">
            InfraMate Autonomous Gate Register Module • Non-transferable Gate Slip • Retain for site audit
          </div>
        </div>
      </div>
    </div>
  );
};
