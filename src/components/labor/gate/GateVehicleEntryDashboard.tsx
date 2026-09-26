import React, { useState, useMemo, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  User,
  Phone,
  FileText,
  Boxes,
  Camera,
  Layers,
  ArrowRightLeft,
  XCircle,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Droplets,
  Container,
  Tractor,
  Car,
  Bike,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import {
  Project,
  VehicleGateMovement,
  VehicleType,
  VehicleStatus,
  VisitPurpose,
  DEFAULT_SITE_GATES,
  VEHICLE_TYPE_CONFIG,
  VISIT_PURPOSE_CONFIG,
  UserRole,
} from "../../../types";
import { storage } from "../../../services/storageService";
import { ManualVehicleEntryModal } from "./ManualVehicleEntryModal";
import { VehicleExitModal } from "./VehicleExitModal";
import { GatePassPrintModal } from "./GatePassPrintModal";
import { VoidRecordModal } from "./VoidRecordModal";

interface GateVehicleEntryDashboardProps {
  project: Project;
  userRole: UserRole;
  currentUserName: string;
}

export const GateVehicleEntryDashboard: React.FC<GateVehicleEntryDashboardProps> = ({
  project,
  userRole,
  currentUserName,
}) => {
  const [movements, setMovements] = useState<VehicleGateMovement[]>(
    storage.getVehicleGateMovements(project.id)
  );
  const [activeSubView, setActiveSubView] = useState<"inside" | "register" | "analytics">(
    "inside"
  );

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedExitMovement, setSelectedExitMovement] = useState<VehicleGateMovement | null>(
    null
  );
  const [selectedPrintMovement, setSelectedPrintMovement] = useState<VehicleGateMovement | null>(
    null
  );
  const [selectedVoidMovement, setSelectedVoidMovement] = useState<VehicleGateMovement | null>(
    null
  );
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gateFilter, setGateFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today"); // today, week, all, custom
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Timer for live dwell calculation ticker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync with storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      setMovements(storage.getVehicleGateMovements(project.id));
    };
    window.addEventListener("infrasync_storage_update", handleStorageUpdate);
    return () => window.removeEventListener("infrasync_storage_update", handleStorageUpdate);
  }, [project.id]);

  const refreshData = () => {
    setMovements(storage.getVehicleGateMovements(project.id));
  };

  // Handlers
  const handleSaveEntry = (movement: VehicleGateMovement) => {
    storage.saveVehicleGateMovement(movement);
    refreshData();
    // Dispatch custom event for system reactivity
    window.dispatchEvent(new Event("infrasync_storage_update"));
  };

  const handleConfirmExit = (
    id: string,
    exitData: {
      exitTime: string;
      exitGateNumber: string;
      exitRecordedBy: string;
      exitNotes?: string;
      exitPhotoUrl?: string;
    }
  ) => {
    storage.recordVehicleExit(id, exitData);
    refreshData();
    window.dispatchEvent(new Event("infrasync_storage_update"));
  };

  const handleConfirmVoid = (id: string, reason: string) => {
    storage.voidVehicleGateMovement(id, {
      voidReason: reason,
      voidedBy: currentUserName,
    });
    refreshData();
    window.dispatchEvent(new Event("infrasync_storage_update"));
  };

  // Calculations & KPIs
  const todayStr = new Date().toISOString().split("T")[0];

  const todayMovements = useMemo(() => {
    return movements.filter((m) => m.entryTime.startsWith(todayStr));
  }, [movements, todayStr]);

  const currentlyInsideVehicles = useMemo(() => {
    return movements.filter((m) => m.status === "inside");
  }, [movements]);

  const overstayVehicles = useMemo(() => {
    return currentlyInsideVehicles.filter((m) => {
      const entryTimeMs = new Date(m.entryTime).getTime();
      const diffHours = (currentTime.getTime() - entryTimeMs) / (1000 * 60 * 60);
      const expected = m.expectedDurationHours || 3;
      return diffHours > expected || diffHours >= 4;
    });
  }, [currentlyInsideVehicles, currentTime]);

  const exitedMovements = useMemo(() => {
    return movements.filter((m) => m.status === "exited");
  }, [movements]);

  const avgTurnaroundMins = useMemo(() => {
    const validExits = exitedMovements.filter((m) => m.exitTime);
    if (validExits.length === 0) return 45;
    const totalMins = validExits.reduce((acc, m) => {
      const diff =
        new Date(m.exitTime!).getTime() - new Date(m.entryTime).getTime();
      return acc + Math.max(10, Math.floor(diff / (1000 * 60)));
    }, 0);
    return Math.round(totalMins / validExits.length);
  }, [exitedMovements]);

  // Filtered movements for Register / Audit Table
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPlate = m.vehicleNumber.toLowerCase().includes(q);
        const matchDriver = m.driverName.toLowerCase().includes(q);
        const matchPhone = m.driverPhone.toLowerCase().includes(q);
        const matchPass = m.passNumber.toLowerCase().includes(q);
        const matchChallan = m.materialDetails?.challanNumber?.toLowerCase().includes(q);
        const matchSupplier = m.materialDetails?.supplierName?.toLowerCase().includes(q);
        const matchItem = m.materialDetails?.itemDescription?.toLowerCase().includes(q);
        if (!matchPlate && !matchDriver && !matchPhone && !matchPass && !matchChallan && !matchSupplier && !matchItem) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // Gate
      if (gateFilter !== "all" && m.gateNumber !== gateFilter) {
        return false;
      }

      // Vehicle Type
      if (typeFilter !== "all" && m.vehicleType !== typeFilter) {
        return false;
      }

      // Purpose
      if (purposeFilter !== "all" && m.purpose !== purposeFilter) {
        return false;
      }

      // Date
      if (dateFilter === "today") {
        if (!m.entryTime.startsWith(todayStr)) return false;
      } else if (dateFilter === "custom") {
        if (!m.entryTime.startsWith(customDate)) return false;
      }

      return true;
    });
  }, [
    movements,
    searchQuery,
    statusFilter,
    gateFilter,
    typeFilter,
    purposeFilter,
    dateFilter,
    customDate,
    todayStr,
  ]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Pass Number",
      "Vehicle Plate",
      "Vehicle Type",
      "Status",
      "Gate In",
      "Entry Time",
      "Gate Out",
      "Exit Time",
      "Dwell Duration (Mins)",
      "Driver Name",
      "Driver Phone",
      "Driver License",
      "Helper Count",
      "Visit Purpose",
      "Material Description",
      "Challan / Inv No",
      "Supplier Name",
      "Quantity",
      "Gross Wt (Kg)",
      "Tare Wt (Kg)",
      "Net Wt (Kg)",
      "Recorded By",
      "Remarks",
    ];

    const rows = filteredMovements.map((m) => {
      const entryDate = new Date(m.entryTime);
      const exitDate = m.exitTime ? new Date(m.exitTime) : null;
      const dwellMins = exitDate
        ? Math.round((exitDate.getTime() - entryDate.getTime()) / 60000)
        : Math.round((currentTime.getTime() - entryDate.getTime()) / 60000);

      return [
        m.passNumber,
        m.vehicleNumber,
        VEHICLE_TYPE_CONFIG[m.vehicleType]?.label || m.vehicleType,
        m.status,
        m.gateNumber,
        m.entryTime,
        m.exitGateNumber || "",
        m.exitTime || "",
        dwellMins,
        m.driverName,
        m.driverPhone,
        m.driverLicenseNumber || "",
        m.helperCount,
        VISIT_PURPOSE_CONFIG[m.purpose]?.label || m.purpose,
        m.materialDetails?.itemDescription || "",
        m.materialDetails?.challanNumber || "",
        m.materialDetails?.supplierName || "",
        m.materialDetails?.quantity || "",
        m.materialDetails?.weightGrossKg || "",
        m.materialDetails?.weightTareKg || "",
        m.materialDetails?.weightNetKg || "",
        m.entryRecordedBy,
        m.notes || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Vehicle_Gate_Register_${project.name.replace(/\s+/g, "_")}_${todayStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDwellTime = (entryIso: string, exitIso?: string) => {
    const entryDate = new Date(entryIso);
    const endDate = exitIso ? new Date(exitIso) : currentTime;
    const diffMs = Math.max(0, endDate.getTime() - entryDate.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Gate & Vehicle Entry Register
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Manual Entry System
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log, monitor, and audit construction vehicle inward/outward movements at site gates.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            title="Export full vehicle register to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            title="Print daily gate muster"
          >
            <Printer className="w-4 h-4" />
            <span>Print Muster</span>
          </button>

          <button
            onClick={() => setIsEntryModalOpen(true)}
            id="btn-manual-vehicle-entry"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Manual Vehicle Entry (Inward)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Currently Inside */}
        <div
          onClick={() => setActiveSubView("inside")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubView === "inside"
              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Currently Inside Site
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {currentlyInsideVehicles.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">Live in Yard</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {currentlyInsideVehicles.filter((v) => v.vehicleType === "transit_mixer").length} RMC mixers active
          </div>
        </div>

        {/* Card 2: Total Movements Today */}
        <div
          onClick={() => {
            setActiveSubView("register");
            setDateFilter("today");
          }}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-slate-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Today's Movements
            </span>
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {todayMovements.length}
            </span>
            <span className="text-[11px] text-slate-500">Inward passes</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {todayMovements.filter((m) => m.status === "exited").length} completed exits
          </div>
        </div>

        {/* Card 3: Avg Turnaround Time */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Avg. Turnaround Time
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {avgTurnaroundMins}m
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold">Dwell / Trip</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Target: &lt;60m for material trucks</div>
        </div>

        {/* Card 4: Overstay / Flagged */}
        <div
          onClick={() => {
            setActiveSubView("inside");
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            overstayVehicles.length > 0
              ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Overstay / Flagged
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                overstayVehicles.length > 0 ? "text-amber-600 animate-bounce" : "text-slate-400"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-2xl font-extrabold ${
                overstayVehicles.length > 0
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {overstayVehicles.length}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold">Vehicles &gt;4h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {overstayVehicles.length > 0 ? "Requires security verification" : "All within est. duration"}
          </div>
        </div>

        {/* Card 5: Active Gate Operations */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Gates
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {DEFAULT_SITE_GATES.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">Manned & Monitored</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            North Main, Material Yard, South Gate
          </div>
        </div>
      </div>

      {/* Sub-Views Switcher (Inside Yard vs Full Register vs Analytics) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView("inside")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubView === "inside"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>Currently Inside Yard</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-current">
              {currentlyInsideVehicles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView("register")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubView === "register"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Gate Movement Register / Muster</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {movements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView("analytics")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubView === "analytics"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Traffic & Cargo Breakdown</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Last sync: {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* VIEW 1: CURRENTLY INSIDE YARD (LIVE YARD VIEW) */}
      {activeSubView === "inside" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live Vehicles On-Site ({currentlyInsideVehicles.length})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by vehicle type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-hidden"
              >
                <option value="all">All Vehicle Types</option>
                {Object.entries(VEHICLE_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>

              {/* Filter by gate */}
              <select
                value={gateFilter}
                onChange={(e) => setGateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-hidden"
              >
                <option value="all">All Gates</option>
                {DEFAULT_SITE_GATES.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentlyInsideVehicles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Vehicles Currently Inside Site
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All inward vehicle passes have completed exit check-out. Log incoming trucks using "+ Manual Vehicle Entry".
              </p>
              <button
                onClick={() => setIsEntryModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
              >
                Log Inward Vehicle Pass
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyInsideVehicles
                .filter((v) => (typeFilter === "all" ? true : v.vehicleType === typeFilter))
                .filter((v) => (gateFilter === "all" ? true : v.gateNumber === gateFilter))
                .map((v) => {
                  const entryTimeMs = new Date(v.entryTime).getTime();
                  const diffHours = (currentTime.getTime() - entryTimeMs) / (1000 * 60 * 60);
                  const isOverstay = diffHours > (v.expectedDurationHours || 3) || diffHours >= 4;
                  const typeConfig = VEHICLE_TYPE_CONFIG[v.vehicleType] || { label: v.vehicleType };
                  const purposeConfig = VISIT_PURPOSE_CONFIG[v.purpose] || {
                    label: v.purpose,
                    badgeColor: "bg-slate-100 text-slate-800",
                  };

                  return (
                    <div
                      key={v.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                        isOverstay
                          ? "border-amber-400 dark:border-amber-600/80 ring-1 ring-amber-400/40"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {/* Card Top */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {v.vehicleNumber}
                              </span>
                              {isOverstay && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                                  <AlertTriangle className="w-3 h-3" /> Overstay
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 font-medium">
                              {typeConfig.label} {v.vehicleModel ? `• ${v.vehicleModel}` : ""}
                            </span>
                          </div>

                          {/* Photo Thumbnail */}
                          {v.photoUrl ? (
                            <img
                              src={v.photoUrl}
                              alt="Vehicle Thumbnail"
                              onClick={() => setSelectedPhotoPreview(v.photoUrl || null)}
                              className="w-14 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs hover:opacity-90"
                              title="Click to view full photo"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                              <Camera className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Purpose & Gate */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${purposeConfig.badgeColor}`}>
                              {purposeConfig.label}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              #{v.passNumber}
                            </span>
                          </div>

                          {v.materialDetails?.itemDescription && (
                            <div className="text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                Cargo:{" "}
                              </span>
                              {v.materialDetails.itemDescription}
                              {v.materialDetails.quantity ? ` (${v.materialDetails.quantity})` : ""}
                            </div>
                          )}
                        </div>

                        {/* Driver & Entry Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Driver</span>
                            <span className="font-semibold truncate block">
                              {v.driverName}
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                              {v.driverPhone}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Dwell Time</span>
                            <span className={`font-bold text-sm block ${isOverstay ? "text-amber-600" : "text-emerald-600"}`}>
                              ⏱️ {formatDwellTime(v.entryTime)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              In at {new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{v.gateNumber}</span>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedPrintMovement(v)}
                          className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1"
                          title="View / Print Gate Pass"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Slip</span>
                        </button>

                        <button
                          onClick={() => setSelectedExitMovement(v)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Record Exit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: GATE MOVEMENT REGISTER / FULL AUDIT LOG */}
      {activeSubView === "register" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search plate #, driver, phone, pass #, challan #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden"
                >
                  <option value="all">All Movement Statuses</option>
                  <option value="inside">Currently Inside Site</option>
                  <option value="exited">Exited / Closed Passes</option>
                  <option value="void">Voided / Corrected</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden"
                >
                  <option value="today">Today ({todayStr})</option>
                  <option value="all">All Dates History</option>
                  <option value="custom">Specific Date</option>
                </select>
              </div>

              {/* Vehicle Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden"
                >
                  <option value="all">All Vehicle Types</option>
                  {Object.entries(VEHICLE_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-semibold">Filter Date:</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th className="py-3.5 px-4">Pass & Plate No.</th>
                    <th className="py-3.5 px-3">Vehicle Type</th>
                    <th className="py-3.5 px-3">Driver & Phone</th>
                    <th className="py-3.5 px-3">Purpose & Cargo</th>
                    <th className="py-3.5 px-3">Gate In / Time</th>
                    <th className="py-3.5 px-3">Gate Out / Time</th>
                    <th className="py-3.5 px-3">Dwell Time</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-500">
                        No vehicle movements match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const typeConfig = VEHICLE_TYPE_CONFIG[m.vehicleType] || { label: m.vehicleType };
                      const purposeConfig = VISIT_PURPOSE_CONFIG[m.purpose] || {
                        label: m.purpose,
                        badgeColor: "bg-slate-100 text-slate-800",
                      };

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                            m.status === "void" ? "opacity-60 bg-red-50/20 dark:bg-red-950/10" : ""
                          }`}
                        >
                          {/* Pass & Plate */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {m.photoUrl ? (
                                <img
                                  src={m.photoUrl}
                                  alt="Thumb"
                                  onClick={() => setSelectedPhotoPreview(m.photoUrl || null)}
                                  className="w-10 h-8 rounded object-cover border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                                  title="View photo"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                  <Truck className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white block">
                                  {m.vehicleNumber}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {m.passNumber}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Vehicle Type */}
                          <td className="py-3 px-3">
                            <span className="font-medium">{typeConfig.label}</span>
                            {m.vehicleModel && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                                {m.vehicleModel}
                              </span>
                            )}
                          </td>

                          {/* Driver & Phone */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {m.driverName}
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                              {m.driverPhone}
                            </span>
                            {m.helperCount > 0 && (
                              <span className="text-[9px] text-slate-400 block">
                                +{m.helperCount} helper
                              </span>
                            )}
                          </td>

                          {/* Purpose & Cargo */}
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${purposeConfig.badgeColor}`}>
                              {purposeConfig.label}
                            </span>
                            {m.materialDetails?.itemDescription && (
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5 truncate max-w-[140px]" title={m.materialDetails.itemDescription}>
                                {m.materialDetails.itemDescription}
                              </span>
                            )}
                          </td>

                          {/* Gate In */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {new Date(m.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[110px]" title={m.gateNumber}>
                              {m.gateNumber.split("-")[0]}
                            </span>
                          </td>

                          {/* Gate Out */}
                          <td className="py-3 px-3">
                            {m.exitTime ? (
                              <>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                  {new Date(m.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">
                                  {m.exitGateNumber?.split("-")[0] || "Exit Gate"}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-600 italic">
                                Inside Site
                              </span>
                            )}
                          </td>

                          {/* Dwell Time */}
                          <td className="py-3 px-3 font-semibold">
                            {formatDwellTime(m.entryTime, m.exitTime)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            {m.status === "inside" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                Inside
                              </span>
                            )}
                            {m.status === "exited" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                Exited
                              </span>
                            )}
                            {m.status === "void" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700" title={m.voidReason}>
                                Voided
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedPrintMovement(m)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                title="Print / View Pass"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {m.status === "inside" && (
                                <button
                                  onClick={() => setSelectedExitMovement(m)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                                  title="Record Vehicle Departure"
                                >
                                  <LogOut className="w-3 h-3" />
                                  <span>Exit</span>
                                </button>
                              )}

                              {m.status !== "void" && (
                                <button
                                  onClick={() => setSelectedVoidMovement(m)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                  title="Void / Correct Record"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: GATE TRAFFIC & CARGO ANALYTICS */}
      {activeSubView === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Types Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Vehicle Type Distribution
            </h3>
            <div className="space-y-3 pt-2">
              {Object.entries(VEHICLE_TYPE_CONFIG).map(([typeKey, config]) => {
                const count = movements.filter((m) => m.vehicleType === typeKey).length;
                if (count === 0 && movements.length > 5) return null;
                const pct = movements.length > 0 ? Math.round((count / movements.length) * 100) : 0;

                return (
                  <div key={typeKey} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{config.label}</span>
                      <span>
                        {count} visits ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gate Throughput & Purpose Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Gate Channel Throughput
            </h3>
            <div className="space-y-3 pt-2">
              {DEFAULT_SITE_GATES.map((g) => {
                const count = movements.filter((m) => m.gateNumber === g.name).length;
                const pct = movements.length > 0 ? Math.round((count / movements.length) * 100) : 0;

                return (
                  <div key={g.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {g.name}
                      </span>
                      <span className="text-[11px] text-slate-500">{g.locationDescription}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-600">{count} movements</span>
                      <span className="text-[10px] text-slate-400 block">{pct}% of site traffic</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Vehicle Entry */}
      <ManualVehicleEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry}
        activeProject={project}
        currentUserName={currentUserName}
      />

      {/* Modal: Vehicle Exit Check-out */}
      <VehicleExitModal
        movement={selectedExitMovement}
        isOpen={!!selectedExitMovement}
        onClose={() => setSelectedExitMovement(null)}
        onConfirmExit={handleConfirmExit}
        currentUserName={currentUserName}
      />

      {/* Modal: Gate Pass Slip Print Preview */}
      <GatePassPrintModal
        movement={selectedPrintMovement}
        project={project}
        isOpen={!!selectedPrintMovement}
        onClose={() => setSelectedPrintMovement(null)}
      />

      {/* Modal: Void Record */}
      <VoidRecordModal
        movement={selectedVoidMovement}
        isOpen={!!selectedVoidMovement}
        onClose={() => setSelectedVoidMovement(null)}
        onConfirmVoid={handleConfirmVoid}
        currentUserName={currentUserName}
      />

      {/* Photo Preview Modal */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs cursor-pointer animate-fadeIn"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl">
            <img
              src={selectedPhotoPreview}
              alt="Full Vehicle Record"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <div className="p-3 text-center text-xs text-slate-300">
              Vehicle Visual Record • Tap anywhere to dismiss
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
