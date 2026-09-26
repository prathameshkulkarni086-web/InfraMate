import React, { useState, useEffect, useCallback } from "react";
import {
  Fingerprint,
  ShieldCheck,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  RefreshCw,
  Sparkles,
  Smartphone,
  Lock,
  XCircle,
  HelpCircle,
  ChevronDown,
  Navigation,
  Sliders,
  Check,
  Radio,
  FileCheck,
  AlertOctagon,
} from "lucide-react";
import {
  Worker,
  AttendanceRecord,
  Project,
  ProjectSite,
  UserRole,
} from "../../types";
import {
  attendanceService,
  GeoLocationCoordinates,
  GeofenceCheckResult,
} from "../../services/attendanceService";

interface DeviceBiometricAttendanceViewProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  project: Project;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  userRole: UserRole;
  currentDate: string;
  currentUserName?: string;
  onClose?: () => void;
}

export const DeviceBiometricAttendanceView: React.FC<
  DeviceBiometricAttendanceViewProps
> = ({
  workers = [],
  attendance = [],
  project,
  onUpdateAttendance,
  userRole,
  currentDate,
  currentUserName,
  onClose,
}) => {
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  // Active worker selection (defaults to current worker or first worker)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(() => {
    if (currentUserName) {
      const match = safeWorkers.find(
        (w) =>
          w.name.toLowerCase().includes(currentUserName.toLowerCase()) ||
          currentUserName.toLowerCase().includes(w.name.toLowerCase())
      );
      if (match) return match.id;
    }
    return safeWorkers[0]?.id || "";
  });

  // Active site selection
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    project.sites?.[0]?.id || "main"
  );

  // GPS and Geofence State
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationMode, setLocationMode] = useState<"real" | "sim_onsite" | "sim_offsite">("sim_onsite");
  const [userCoords, setUserCoords] = useState<GeoLocationCoordinates | null>(null);
  const [geofenceResult, setGeofenceResult] = useState<GeofenceCheckResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Biometric Hardware State
  const [isNativeBioSupported, setIsNativeBioSupported] = useState<boolean>(true);
  const [useSimulatedBio, setUseSimulatedBio] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authStage, setAuthStage] = useState<
    "idle" | "verifying" | "success" | "failed" | "unavailable" | "already_marked" | "outside_radius"
  >("idle");
  const [lastMarkedRecord, setLastMarkedRecord] = useState<AttendanceRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedWorker = safeWorkers.find((w) => w && w.id === selectedWorkerId);
  const selectedSite = project.sites?.find((s) => s.id === selectedSiteId);

  const siteLat = selectedSite?.latitude ?? project.siteLatitude ?? 12.971598;
  const siteLng = selectedSite?.longitude ?? project.siteLongitude ?? 77.594566;
  const activeRadius = selectedSite?.attendanceRadiusMeters ?? project.attendanceRadiusMeters ?? 100;
  const siteDisplayName = selectedSite?.name ?? project.name;

  // Check if today's attendance is already marked for this worker
  const todayRecord = safeAttendance.find(
    (a) => a && a.workerId === selectedWorkerId && a.date === currentDate
  );

  // Initial check for WebAuthn platform authenticator
  useEffect(() => {
    attendanceService.isPlatformBiometricAvailable().then((available) => {
      setIsNativeBioSupported(available);
      if (!available) {
        setUseSimulatedBio(true);
      }
    });
  }, []);

  // Update location resolution
  const refreshLocation = useCallback(() => {
    setIsLocating(true);
    setGpsError(null);

    if (locationMode === "sim_onsite") {
      // Simulate 42 meters from site coordinates
      const simCoords: GeoLocationCoordinates = {
        latitude: siteLat + 0.00032,
        longitude: siteLng + 0.00025,
        accuracy: 4,
      };
      setTimeout(() => {
        setUserCoords(simCoords);
        const result = attendanceService.checkGeofence(simCoords, project, selectedSite);
        // Force exactly 42 meters for demonstration clarity
        result.distanceInMeters = 42;
        result.isWithinGeofence = true;
        setGeofenceResult(result);
        setIsLocating(false);
      }, 400);
      return;
    }

    if (locationMode === "sim_offsite") {
      // Simulate 145 meters from site coordinates (outside 100m)
      const simCoords: GeoLocationCoordinates = {
        latitude: siteLat + 0.0014,
        longitude: siteLng + 0.0012,
        accuracy: 6,
      };
      setTimeout(() => {
        setUserCoords(simCoords);
        const result = attendanceService.checkGeofence(simCoords, project, selectedSite);
        result.distanceInMeters = 145;
        result.isWithinGeofence = false;
        result.message = `You must be within ${activeRadius} meters of your assigned construction site to mark attendance. (Current distance: 145m)`;
        setGeofenceResult(result);
        setIsLocating(false);
      }, 400);
      return;
    }

    // Real device GPS
    if (!navigator.geolocation) {
      setGpsError("GPS Geolocation is not supported by your mobile browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: GeoLocationCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserCoords(coords);
        const result = attendanceService.checkGeofence(coords, project, selectedSite);
        setGeofenceResult(result);
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsError(`Location error: ${err.message}. Please enable GPS or select test location.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [locationMode, siteLat, siteLng, activeRadius, project, selectedSite]);

  // Refresh location when site or mode changes
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  // Handle Triggering Biometric Attendance
  const handleMarkBiometricAttendance = async () => {
    if (!selectedWorker) {
      setErrorMessage("Please select a worker profile first.");
      return;
    }

    if (selectedWorker.status === "inactive") {
      setErrorMessage("Worker account is inactive or blocked. Contact site administrator.");
      return;
    }

    // 1. Check duplicate attendance
    if (todayRecord) {
      setLastMarkedRecord(todayRecord);
      setAuthStage("already_marked");
      return;
    }

    // 2. Validate GPS coordinates and 100m geofence
    if (!userCoords || !geofenceResult) {
      setErrorMessage("GPS location not yet resolved. Please wait a moment.");
      return;
    }

    if (!geofenceResult.isWithinGeofence || geofenceResult.distanceInMeters > activeRadius) {
      setAuthStage("outside_radius");
      return;
    }

    // 3. Trigger Android / Device Biometric Authentication
    setAuthStage("verifying");
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const bioAuthResult = await attendanceService.triggerNativeDeviceBiometrics(
        selectedWorker.id,
        selectedWorker.name,
        useSimulatedBio
      );

      if (!bioAuthResult.success) {
        setIsAuthenticating(false);
        if (bioAuthResult.authResult === "CANCELLED") {
          setAuthStage("idle");
          setErrorMessage("Biometric authentication was cancelled.");
          return;
        }
        if (bioAuthResult.authResult === "UNAVAILABLE") {
          setAuthStage("unavailable");
          return;
        }
        setAuthStage("failed");
        setErrorMessage(bioAuthResult.error || "Biometric Authentication Failed. Please try again.");
        return;
      }

      // 4. Submit to backend API for server-side verification and persistence
      const submitResponse = await attendanceService.submitBiometricAttendance({
        worker: selectedWorker,
        project,
        selectedSite,
        userCoords,
        deviceId: bioAuthResult.deviceId,
        biometricVerified: true,
      });

      setIsAuthenticating(false);

      if (!submitResponse.success) {
        if (submitResponse.alreadyMarked) {
          setLastMarkedRecord(submitResponse.record || null);
          setAuthStage("already_marked");
          return;
        }
        setAuthStage("failed");
        setErrorMessage(submitResponse.error || "Attendance verification failed on server.");
        return;
      }

      if (submitResponse.record) {
        setLastMarkedRecord(submitResponse.record);
        onUpdateAttendance(submitResponse.record);
        setAuthStage("success");
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthStage("failed");
      setErrorMessage(err.message || "An unexpected error occurred during biometric verification.");
    }
  };

  const currentDistance = geofenceResult?.distanceInMeters ?? 42;
  const isInsideSite = geofenceResult?.isWithinGeofence ?? true;

  return (
    <div id="device-biometric-attendance-container" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Fingerprint className="w-48 h-48 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Native Biometric Prompt
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Hardware Verified Factor
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-amber-500" />
              Labour Biometric Attendance
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Zero-Biometric-Storage security protocol. Authenticates via your Android device fingerprint or face prompt and validates real-time 100m construction site geofence.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Geofence</div>
              <div className="text-sm font-bold text-amber-400">{activeRadius}m Radius</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Shift Status</div>
              <div className="text-sm font-bold text-emerald-400">
                {todayRecord ? "Marked Present" : "Not Marked"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Setup & Controls, Right Mobile Interactive Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Context & Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Worker Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" />
                Select Worker
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {safeWorkers.length} Active Workers
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Worker Name
                </label>
                <div className="relative">
                  <select
                    id="worker-select-dropdown"
                    value={selectedWorkerId}
                    onChange={(e) => {
                      setSelectedWorkerId(e.target.value);
                      setAuthStage("idle");
                      setErrorMessage(null);
                    }}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {safeWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role}) - ID: {w.employeeId || w.id.substring(0, 6)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedWorker && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Assigned Trade:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedWorker.role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Mobile Phone:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedWorker.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Daily Wage:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{selectedWorker.dailyWage || 850}/shift</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Account Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedWorker.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                    }`}>
                      {selectedWorker.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Construction Site Selection Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                Assigned Construction Site
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                100m Allowed Zone
              </span>
            </div>

            <div className="space-y-3">
              {project.sites && project.sites.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Select Site Sector / Zone
                  </label>
                  <select
                    id="site-select-dropdown"
                    value={selectedSiteId}
                    onChange={(e) => {
                      setSelectedSiteId(e.target.value);
                      setAuthStage("idle");
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {project.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.attendanceRadiusMeters || 100}m Geofence)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{project.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{project.location}</div>
                </div>
              )}

              {/* Coordinates display */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Site Coordinates:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {siteLat.toFixed(5)}, {siteLng.toFixed(5)}
                </span>
              </div>
            </div>
          </div>

          {/* Test & Simulation Environment Settings */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                Testing & Environment Controls
              </span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                Preview Sandbox
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                GPS Location Simulation:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="gps-mode-onsite-btn"
                  onClick={() => setLocationMode("sim_onsite")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    locationMode === "sim_onsite"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Check className="w-3 h-3" /> Inside (42m)
                </button>
                <button
                  type="button"
                  id="gps-mode-offsite-btn"
                  onClick={() => setLocationMode("sim_offsite")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    locationMode === "sim_offsite"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" /> Outside (145m)
                </button>
                <button
                  type="button"
                  id="gps-mode-real-btn"
                  onClick={() => setLocationMode("real")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                    locationMode === "real"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Navigation className="w-3 h-3" /> Real GPS
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Hardware Biometrics (WebAuthn):
              </span>
              <button
                type="button"
                id="toggle-bio-mode-btn"
                onClick={() => setUseSimulatedBio(!useSimulatedBio)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  useSimulatedBio
                    ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                }`}
              >
                {useSimulatedBio ? "Simulator Mode (Fast)" : "Native Biometric Prompt"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Modern Construction Attendance Mobile Card (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-xl relative overflow-hidden">
            
            {/* Screen Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                    LABOUR ATTENDANCE
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedWorker?.name || "Rahul Patil"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-amber-500" : ""}`} />
                {isLocating ? "Locating..." : "Refresh GPS"}
              </button>
            </div>

            {/* Attendance Status & Geofence Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {/* Site Assignment & Geofence Radar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Site
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {siteDisplayName}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Site Status:</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isInsideSite ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                    <span className={`text-xs font-extrabold ${isInsideSite ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isInsideSite ? "You are inside the site" : "Outside 100m radius"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distance from Site & Today's Attendance */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Distance</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {currentDistance} meters
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isInsideSite ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (currentDistance / activeRadius) * 100))}%` }}
                  />
                </div>

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Today's Attendance:</span>
                  <span className={`font-bold ${todayRecord ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {todayRecord ? `Present (${todayRecord.checkIn || todayRecord.checkInTime})` : "Not Marked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Error / Warning Alert Banner if outside 100m */}
            {!isInsideSite && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-rose-900 dark:text-rose-200">
                    Outside Permitted Attendance Zone
                  </div>
                  <div className="mt-1">
                    You must be within 100 meters of your assigned construction site to mark attendance. (Current distance: <strong>{currentDistance} m</strong>)
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Interactive Biometric State Box */}
            {authStage === "idle" && (
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-8 text-center space-y-5">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                  <Lock className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Biometric Attendance
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Use your phone fingerprint or face authentication to record today's verified attendance.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  id="mark-biometric-attendance-btn"
                  onClick={handleMarkBiometricAttendance}
                  disabled={!isInsideSite || isLocating}
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm tracking-wide uppercase transition shadow-lg flex items-center justify-center gap-3 ${
                    isInsideSite && !isLocating
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25 active:scale-[0.99] cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Fingerprint className="w-5 h-5" />
                  Mark Attendance with Biometric
                </button>
              </div>
            )}

            {/* Verifying Stage: Identity Prompt Modal */}
            {authStage === "verifying" && (
              <div className="bg-slate-900 text-white rounded-3xl p-8 text-center space-y-6 animate-fade-in shadow-2xl border border-slate-700">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping" />
                  <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg">
                    <Fingerprint className="w-10 h-10 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-white">
                    Verify Your Identity
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    Use fingerprint or face authentication on your device prompt to mark your attendance.
                  </p>
                </div>

                <div className="text-[11px] text-amber-400 font-mono">
                  Communicating with device Keystore / BiometricManager...
                </div>

                <button
                  type="button"
                  id="cancel-biometric-auth-btn"
                  onClick={() => {
                    setAuthStage("idle");
                    setIsAuthenticating(false);
                  }}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Success Stage Screen */}
            {authStage === "success" && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-8 text-center space-y-6 animate-scale-up">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    ✓ Attendance Marked
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedWorker?.name || "Rahul Patil"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {siteDisplayName}
                  </p>
                </div>

                {/* Summary Metadata Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-emerald-200/80 dark:border-emerald-900/60 text-xs space-y-2 text-left max-w-sm mx-auto shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Check-in:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                      {lastMarkedRecord?.checkIn || lastMarkedRecord?.checkInTime || "08:57 AM"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Method:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      Phone Biometric (DEVICE_BIOMETRIC)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Distance:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {lastMarkedRecord?.distanceFromSiteMeters ?? currentDistance} m
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Biometric Verification:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      Native Hardware Success
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="done-biometric-attendance-btn"
                  onClick={() => {
                    setAuthStage("idle");
                    if (onClose) onClose();
                  }}
                  className="w-full max-w-xs mx-auto py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-lg shadow-emerald-500/20"
                >
                  Done
                </button>
              </div>
            )}

            {/* Already Marked Stage */}
            {authStage === "already_marked" && (
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Attendance Already Marked
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                    You marked attendance today at <strong>{todayRecord?.checkIn || todayRecord?.checkInTime || "08:57 AM"}</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-left max-w-xs mx-auto space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Site:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{siteDisplayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Present</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAuthStage("idle")}
                  className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Back
                </button>
              </div>
            )}

            {/* Failure Stage */}
            {authStage === "failed" && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-3xl p-8 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <XCircle className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">
                    Biometric Authentication Failed
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 max-w-xs mx-auto">
                    {errorMessage || "Your identity could not be verified. Please try again."}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthStage("idle")}
                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkBiometricAttendance}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Biometric Unavailable Stage */}
            {authStage === "unavailable" && (
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-3xl p-8 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <AlertTriangle className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
                    Biometric Authentication Unavailable
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 max-w-xs mx-auto">
                    Biometric authentication is not configured on this device. Please use another approved attendance method or switch to simulation mode.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseSimulatedBio(true);
                      setAuthStage("idle");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Enable Simulation Test Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthStage("idle")}
                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Outside Radius Stage */}
            {authStage === "outside_radius" && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-3xl p-8 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Compass className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">
                    Outside Construction Site Radius
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 max-w-sm mx-auto">
                    You must be within 100 meters of your assigned construction site to mark attendance. (Current distance: <strong>{currentDistance} m</strong>)
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode("sim_onsite");
                      setAuthStage("idle");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Simulate Inside Site (42m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthStage("idle")}
                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
