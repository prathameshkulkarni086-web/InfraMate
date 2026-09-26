import React, { useState } from "react";
import {
  X,
  Truck,
  Camera,
  Upload,
  User,
  Phone,
  FileText,
  ShieldCheck,
  Clock,
  MapPin,
  Package,
  AlertCircle,
  Car,
  Bike,
  Tractor,
  Droplets,
  Container,
  HelpCircle,
} from "lucide-react";
import {
  Project,
  VehicleGateMovement,
  VehicleType,
  VisitPurpose,
  DEFAULT_SITE_GATES,
  VEHICLE_TYPE_CONFIG,
  VISIT_PURPOSE_CONFIG,
} from "../../../types";
import { VehiclePhotoCapture } from "./VehiclePhotoCapture";

interface ManualVehicleEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movement: VehicleGateMovement) => void;
  activeProject: Project;
  currentUserName: string;
}

export const ManualVehicleEntryModal: React.FC<ManualVehicleEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activeProject,
  currentUserName,
}) => {
  const nowStr = new Date().toISOString().slice(0, 16);
  const passId = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Form states
  const [gateNumber, setGateNumber] = useState<string>(DEFAULT_SITE_GATES[0].name);
  const [entryTime, setEntryTime] = useState<string>(nowStr);
  const [expectedDurationHours, setExpectedDurationHours] = useState<number>(2);

  // Vehicle info
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("transit_mixer");
  const [vehicleModel, setVehicleModel] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  // Driver info
  const [driverName, setDriverName] = useState<string>("");
  const [driverPhone, setDriverPhone] = useState<string>("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState<string>("");
  const [helperCount, setHelperCount] = useState<number>(0);
  const [helperNames, setHelperNames] = useState<string>("");

  // Purpose & Materials
  const [purpose, setPurpose] = useState<VisitPurpose>("material_delivery");
  const [purposeDetails, setPurposeDetails] = useState<string>("");
  const [itemDescription, setItemDescription] = useState<string>("");
  const [challanNumber, setChallanNumber] = useState<string>("");
  const [poNumber, setPoNumber] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [weightGrossKg, setWeightGrossKg] = useState<string>("");
  const [weightTareKg, setWeightTareKg] = useState<string>("");

  // Guard info
  const [entryRecordedBy, setEntryRecordedBy] = useState<string>(currentUserName || "Gate Security Officer");
  const [notes, setNotes] = useState<string>("");
  const [ppeChecked, setPpeChecked] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Remove unused legacy handlePhotoUpload if present

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!vehicleNumber.trim()) {
      newErrors.vehicleNumber = "Vehicle registration number is required";
    }
    if (!photoUrl || !photoUrl.trim()) {
      newErrors.photo = "Vehicle photo is required before submitting this gate entry.";
    }
    if (!driverName.trim()) {
      newErrors.driverName = "Driver full name is required";
    }
    if (!driverPhone.trim()) {
      newErrors.driverPhone = "Driver phone number is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const gross = weightGrossKg ? parseFloat(weightGrossKg) : undefined;
    const tare = weightTareKg ? parseFloat(weightTareKg) : undefined;
    const net = gross && tare && gross > tare ? gross - tare : undefined;

    const isMaterialRelated =
      purpose === "material_delivery" ||
      purpose === "concrete_pouring" ||
      purpose === "fuel_supply" ||
      itemDescription.trim().length > 0;

    const newMovement: VehicleGateMovement = {
      id: `vgm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      passNumber: passId,
      projectId: activeProject.id,
      siteId: activeProject.sites?.[0]?.id || "site-main",
      siteName: activeProject.sites?.[0]?.name || activeProject.name,
      movementType: "entry",
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      vehicleType,
      vehicleModel: vehicleModel.trim() || undefined,
      photoUrl: photoUrl || undefined,
      gateNumber,
      entryTime: new Date(entryTime).toISOString(),
      expectedDurationHours: Number(expectedDurationHours) || 2,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      driverLicenseNumber: driverLicenseNumber.trim() || undefined,
      helperCount: Number(helperCount) || 0,
      helperNames: helperNames.trim() || undefined,
      purpose,
      purposeDetails: purposeDetails.trim() || undefined,
      materialDetails: isMaterialRelated
        ? {
            itemDescription: itemDescription.trim() || undefined,
            challanNumber: challanNumber.trim() || undefined,
            poNumber: poNumber.trim() || undefined,
            supplierName: supplierName.trim() || undefined,
            quantity: quantity.trim() || undefined,
            weightGrossKg: gross,
            weightTareKg: tare,
            weightNetKg: net,
          }
        : undefined,
      status: "inside",
      entryRecordedBy: entryRecordedBy.trim() || "Security Officer",
      notes: notes.trim()
        ? `${notes.trim()}${ppeChecked ? " | Safety PPE Verified." : ""}`
        : ppeChecked
        ? "Driver PPE and vehicle safety verified at gate."
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newMovement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 to-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Manual Vehicle Gate Entry (Inward)</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  {passId}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Site: {activeProject.name} | Manual Gate Operator Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Gate & Time Allocation */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              1. Gate & Timestamp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Entry Gate *
                </label>
                <select
                  value={gateNumber}
                  onChange={(e) => setGateNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
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
                  Entry Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Est. Dwell Time
                </label>
                <select
                  value={expectedDurationHours}
                  onChange={(e) => setExpectedDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value={0.5}>30 Minutes (Quick delivery / Pickup)</option>
                  <option value={1}>1 Hour (Standard delivery)</option>
                  <option value={2}>2 Hours (Concrete / RMC pour)</option>
                  <option value={4}>4 Hours (Half Day Works / Heavy trailer)</option>
                  <option value={8}>8 Hours (Full Shift / Machinery)</option>
                  <option value={12}>12 Hours (Continuous Pouring)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Information & Manual Photo Upload */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              2. Vehicle Details & Manual Photo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Plate / Reg Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA-04-MJ-4589"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border ${
                    errors.vehicleNumber
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-slate-300 dark:border-slate-700"
                  } bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden`}
                />
                {errors.vehicleNumber && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.vehicleNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  {Object.entries(VEHICLE_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Make / Model (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Prima 2830 / Bolero"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Mobile-First Vehicle Photo Capture Section */}
            <VehiclePhotoCapture
              photoUrl={photoUrl}
              onPhotoChange={(url) => {
                setPhotoUrl(url);
                if (errors.photo) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.photo;
                    return next;
                  });
                }
              }}
              error={errors.photo}
              required={true}
            />
          </div>

          {/* Section 3: Driver & Passenger / Helper Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              3. Driver & Crew Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.driverName
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-slate-300 dark:border-slate-700"
                  } bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden`}
                />
                {errors.driverName && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.driverName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="+91 98450 12345"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.driverPhone
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-slate-300 dark:border-slate-700"
                  } bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden`}
                />
                {errors.driverPhone && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.driverPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Driving License / ID No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA04 20180004921"
                  value={driverLicenseNumber}
                  onChange={(e) => setDriverLicenseNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Helper / Passenger Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={helperCount}
                  onChange={(e) => setHelperCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Helper Names / Crew Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raju (Helper), Venkatesh (Unloader)"
                  value={helperNames}
                  onChange={(e) => setHelperNames(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Purpose & Material Details */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              4. Purpose of Visit & Material / Delivery Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Purpose *
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as VisitPurpose)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  {Object.entries(VISIT_PURPOSE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Visit / Pouring Location on Site
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Floor Slab Grid B4 / Material Yard Bay 2"
                  value={purposeDetails}
                  onChange={(e) => setPurposeDetails(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Inward Cargo Info (for materials/RMC) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Inward Delivery Details (if carrying material/cargo)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Material / Cargo Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. M30 Concrete / 16mm Rebar"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Delivery Challan / Invoice #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CH-88912"
                    value={challanNumber}
                    onChange={(e) => setChallanNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UltraTech / Tata Steel"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Quantity / Volume
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7.5 m³ / 18 MT"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Weighbridge Gross (Kg)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 28450"
                    value={weightGrossKg}
                    onChange={(e) => setWeightGrossKg(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    Weighbridge Tare (Kg)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10400"
                    value={weightTareKg}
                    onChange={(e) => setWeightTareKg(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Operator Log & Security Clearance */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              5. Operator Certification & Notes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recorded By (Gate Operator / Guard Name) *
                </label>
                <input
                  type="text"
                  value={entryRecordedBy}
                  onChange={(e) => setEntryRecordedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operator Remarks / Gate Check
                </label>
                <input
                  type="text"
                  placeholder="e.g. Slump checked, reverse horn functional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="ppeCheck"
                checked={ppeChecked}
                onChange={(e) => setPpeChecked(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
              />
              <label htmlFor="ppeCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Driver & crew verified with Site Safety PPE (Hardhat, High-vis jacket, Safety shoes)
              </label>
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
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Log Vehicle Inward Pass</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
