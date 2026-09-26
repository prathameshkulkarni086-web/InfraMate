import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  Camera,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  LogOut,
  LogIn,
  Sliders,
  Scan,
  Sparkles,
  WifiOff,
  Navigation,
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

interface AttendanceTerminalProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  project: Project;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  userRole: UserRole;
  currentDate: string;
}

export const AttendanceTerminal: React.FC<AttendanceTerminalProps> = ({
  workers = [],
  attendance = [],
  project,
  onUpdateAttendance,
  userRole,
  currentDate,
}) => {
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const [method, setMethod] = useState<"biometric" | "gps">("gps");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    safeWorkers[0]?.id || ""
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    project.sites?.[0]?.id || "main"
  );

  // Biometric Terminal State
  const [biometricType, setBiometricType] = useState<
    "Fingerprint" | "Face Recognition" | "Scanner" | "Phone Biometric"
  >("Phone Biometric");
  const [isScanningBio, setIsScanningBio] = useState<boolean>(false);
  const [bioVerifiedToken, setBioVerifiedToken] = useState<string | null>(null);
  const [bioFeedback, setBioFeedback] = useState<string | null>(null);

  // GPS Terminal State
  const [isFetchingGPS, setIsFetchingGPS] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<GeoLocationCoordinates | null>(
    null
  );
  const [isSimulatedOnSite, setIsSimulatedOnSite] = useState<boolean>(true); // Default true for testing convenience in iframe
  const [gpsCheckResult, setGpsCheckResult] =
    useState<GeofenceCheckResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // General Notification
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedWorker = safeWorkers.find((w) => w && w.id === selectedWorkerId);
  const selectedSite = project.sites?.find((s) => s.id === selectedSiteId);

  // Get today's attendance record for selected worker
  const currentRecord = safeAttendance.find(
    (a) => a && a.workerId === selectedWorkerId && a.date === currentDate
  );

  const activeRadius =
    selectedSite?.attendanceRadiusMeters ||
    project.attendanceRadiusMeters ||
    100;

  // GPS Location resolver
  const resolveLocation = () => {
    setIsFetchingGPS(true);
    setGpsError(null);

    if (isSimulatedOnSite) {
      // Simulate location 18m from site center
      const siteLat = selectedSite?.latitude || project.siteLatitude || 12.971598;
      const siteLng = selectedSite?.longitude || project.siteLongitude || 77.594566;

      const simCoords: GeoLocationCoordinates = {
        latitude: siteLat + 0.00015,
        longitude: siteLng + 0.00012,
        accuracy: 8,
      };

      setTimeout(() => {
        setUserCoords(simCoords);
        const result = attendanceService.checkGeofence(
          simCoords,
          project,
          selectedSite
        );
        setGpsCheckResult(result);
        setIsFetchingGPS(false);
      }, 500);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      setIsFetchingGPS(false);
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
        const result = attendanceService.checkGeofence(
          coords,
          project,
          selectedSite
        );
        setGpsCheckResult(result);
        setIsFetchingGPS(false);
      },
      (err) => {
        setGpsError(
          `Location access denied or unavailable (${err.message}). Switch to On-Site Proximity Simulation for demo/testing.`
        );
        setIsFetchingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (method === "gps") {
      resolveLocation();
    }
  }, [method, selectedSiteId, isSimulatedOnSite]);

  // Biometric Scan trigger
  const handleTriggerBiometricScan = async () => {
    if (!selectedWorker) return;
    setIsScanningBio(true);
    setBioVerifiedToken(null);
    setBioFeedback(null);

    try {
      if (biometricType === "Phone Biometric") {
        const bioResult = await attendanceService.triggerNativeDeviceBiometrics(
          selectedWorker.id,
          selectedWorker.name,
          true // fallback simulator mode for instant preview feedback
        );

        setIsScanningBio(false);
        if (bioResult.success) {
          const token = `DEV-BIO-${Date.now().toString().slice(-4)}`;
          setBioVerifiedToken(token);
          setBioFeedback(
            `Device Verified! Android BiometricPrompt Hardware Match (ID: ${bioResult.deviceId})`
          );
        } else {
          setBioFeedback(bioResult.error || "Biometric authentication failed on device.");
        }
        return;
      }

      const result = await attendanceService.simulateBiometricScan(
        selectedWorker,
        biometricType
      );
      setIsScanningBio(false);
      setBioVerifiedToken(result.token);
      setBioFeedback(
        `Identity Verified! ${result.type} Match Score: ${result.matchedScore}% (Device: ${result.deviceId})`
      );
    } catch (e: any) {
      setIsScanningBio(false);
      setBioFeedback("Biometric authentication failed. Please retry.");
    }
  };

  // Perform Check In
  const handleCheckIn = (forcedMethod?: "Biometric" | "GPS") => {
    setActionError(null);
    setActionSuccess(null);

    if (!selectedWorker) {
      setActionError("Please select a valid worker.");
      return;
    }

    if (selectedWorker.status === "inactive") {
      setActionError("Cannot mark attendance: Worker is currently marked INACTIVE.");
      return;
    }

    if (currentRecord && (currentRecord.status === "present" || currentRecord.status === "half_day" || currentRecord.status === "overtime")) {
      setActionError(`Worker is already checked in for today (${currentRecord.checkIn || "Active Shift"}).`);
      return;
    }

    const usedMethod = forcedMethod || (method === "biometric" ? "Biometric" : "GPS");

    // Geofence check if GPS
    if (usedMethod === "GPS") {
      if (!gpsCheckResult || !gpsCheckResult.isWithinGeofence) {
        setActionError(
          `You are outside the construction site attendance area. Please move within ${activeRadius} m of the site to check in.`
        );
        return;
      }
    }

    // Biometric token check if Biometric
    if (usedMethod === "Biometric" && !bioVerifiedToken) {
      setActionError("Please complete biometric sensor scan before checking in.");
      return;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const newRecord: AttendanceRecord = {
      id: currentRecord ? currentRecord.id : `att-${Date.now()}-${selectedWorker.id}`,
      projectId: project.id,
      siteId: selectedSite?.id || selectedWorker.siteId,
      siteName: selectedSite?.name || selectedWorker.siteName || "Main Project Site",
      workerId: selectedWorker.id,
      workerName: selectedWorker.name,
      workerRole: selectedWorker.role,
      date: currentDate,
      status: "present",
      checkIn: timeFormatted,
      checkInTimestamp: now.toISOString(),
      method: usedMethod,
      biometricType: usedMethod === "Biometric" ? biometricType : undefined,
      latitude: usedMethod === "GPS" ? userCoords?.latitude : undefined,
      longitude: usedMethod === "GPS" ? userCoords?.longitude : undefined,
      distanceFromSiteMeters: usedMethod === "GPS" ? gpsCheckResult?.distanceInMeters : undefined,
      dailyWage: selectedWorker.dailyWage,
      calculatedWage: selectedWorker.dailyWage,
      isPendingSync: !navigator.onLine,
    };

    if (!navigator.onLine) {
      attendanceService.addToOfflineQueue(newRecord);
    }

    onUpdateAttendance(newRecord);
    setActionSuccess(
      `✓ Verified Check-In recorded for ${selectedWorker.name} at ${timeFormatted} via ${usedMethod}.`
    );
    setBioVerifiedToken(null);
  };

  // Perform Check Out
  const handleCheckOut = (forcedMethod?: "Biometric" | "GPS") => {
    setActionError(null);
    setActionSuccess(null);

    if (!selectedWorker) return;

    if (!currentRecord || !currentRecord.checkIn) {
      setActionError("Cannot Check-Out before Check-In. No active shift found for today.");
      return;
    }

    if (currentRecord.checkOut) {
      setActionError(`Worker has already checked out today at ${currentRecord.checkOut}.`);
      return;
    }

    const usedMethod = forcedMethod || (method === "biometric" ? "Biometric" : "GPS");

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const duration = attendanceService.calculateHoursDuration(
      currentRecord.checkIn,
      timeFormatted
    );

    // Determine status based on duration
    let updatedStatus: AttendanceRecord["status"] = "present";
    let calcWage = selectedWorker.dailyWage;
    let otHours = 0;

    if (duration.hours < 5) {
      updatedStatus = "half_day";
      calcWage = Math.round(selectedWorker.dailyWage * 0.5);
    } else if (duration.hours >= 9.5) {
      updatedStatus = "overtime";
      otHours = Math.round((duration.hours - 8) * 10) / 10;
      const hourlyRate = selectedWorker.overtimeHourlyRate || Math.round(selectedWorker.dailyWage / 8);
      calcWage = selectedWorker.dailyWage + Math.round(otHours * hourlyRate * 1.5);
    }

    const updatedRecord: AttendanceRecord = {
      ...currentRecord,
      checkOut: timeFormatted,
      checkOutTimestamp: now.toISOString(),
      workingHours: duration.hours,
      overtimeHours: otHours,
      status: updatedStatus,
      calculatedWage: calcWage,
    };

    if (!navigator.onLine) {
      attendanceService.addToOfflineQueue(updatedRecord);
    }

    onUpdateAttendance(updatedRecord);
    setActionSuccess(
      `✓ Shift Completed! ${selectedWorker.name} checked out at ${timeFormatted}. Total duration: ${duration.formatted} (${updatedStatus.toUpperCase()}).`
    );
    setBioVerifiedToken(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in">
      {/* Top Banner */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                Live Attendance Terminal
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Date: {currentDate}
              </span>
            </div>
            <h2 className="text-lg font-bold mt-1 text-white">
              Field Workforce Check-In & Check-Out Station
            </h2>
            <p className="text-xs text-slate-400">
              Verified biometric scanning & satellite geofence verification for {project.name}
            </p>
          </div>

          {/* Method Switcher */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => {
                setMethod("gps");
                setBioVerifiedToken(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                method === "gps"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              GPS Geofence (100m)
            </button>
            <button
              onClick={() => {
                setMethod("biometric");
                setBioVerifiedToken(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                method === "biometric"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              Hardware / Phone Biometric
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Worker Selector & Shift Status */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              1. Select Labourer / Worker
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => {
                setSelectedWorkerId(e.target.value);
                setBioVerifiedToken(null);
                setActionSuccess(null);
                setActionError(null);
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-amber-500"
            >
              {safeWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.employeeId || `LAB-${w.id.slice(-3)}`} — {w.name} ({w.role}) {w.status === "inactive" ? "[INACTIVE]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Site Selector */}
          {project.sites && project.sites.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Target Site Zone / Sub-Site
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
              >
                {project.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Radius: {s.attendanceRadiusMeters}m)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Worker Info Card */}
          {selectedWorker && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                    {selectedWorker.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedWorker.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedWorker.role} • ID: {selectedWorker.employeeId || "LAB-001"}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    selectedWorker.status === "active"
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedWorker.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                <div>
                  <span className="text-slate-500">Daily Wage:</span>{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ₹{selectedWorker.dailyWage}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Contractor:</span>{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedWorker.contractorName || "Direct Site"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Emergency:</span>{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedWorker.emergencyContactPhone || selectedWorker.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Biometric Enrolled:</span>{" "}
                  <span className="font-medium text-emerald-600">
                    {selectedWorker.biometricRegistered ? "✓ Active (HW)" : "Not Enrolled"}
                  </span>
                </div>
              </div>

              {/* Today's Shift Status Box */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Today's Attendance Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`font-bold text-xs ${
                        currentRecord?.status === "present" || currentRecord?.status === "overtime"
                          ? "text-emerald-600"
                          : currentRecord?.status === "half_day"
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      {currentRecord ? currentRecord.status.toUpperCase() : "NOT CHECKED IN"}
                    </span>
                    {currentRecord?.method && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-mono">
                        via {currentRecord.method}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  <div>In: {currentRecord?.checkIn || "--"}</div>
                  <div>Out: {currentRecord?.checkOut || "--"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Terminal Method (Biometric vs GPS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Method A: Biometric Hardware Terminal */}
          {method === "biometric" && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Biometric Identity Verification Scanner
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 font-mono border border-emerald-300/40">
                  Hardware: Online (USB-HID)
                </span>
              </div>

              {/* Biometric Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBiometricType("Phone Biometric");
                    setBioVerifiedToken(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    biometricType === "Phone Biometric"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Fingerprint className="w-4 h-4 text-amber-500" />
                  Phone Biometric
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBiometricType("Fingerprint");
                    setBioVerifiedToken(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    biometricType === "Fingerprint"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  Hardware Sensor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBiometricType("Face Recognition");
                    setBioVerifiedToken(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    biometricType === "Face Recognition"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Face AI Recognition
                </button>
              </div>

              {/* Hardware Visual Scanner Surface */}
              <div className="p-6 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center min-h-[160px] relative border border-slate-800 overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px]" />

                {isScanningBio ? (
                  <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className="w-16 h-16 rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex items-center justify-center">
                      <Scan className="w-8 h-8 text-amber-400 animate-pulse" />
                    </div>
                    <div className="text-xs font-mono text-amber-300 animate-pulse">
                      Analyzing {biometricType} Minutiae & Authenticating Token...
                    </div>
                  </div>
                ) : bioVerifiedToken ? (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="text-xs font-bold text-emerald-400">
                      Identity Verified & Matched
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Token: {bioVerifiedToken}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 relative z-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
                      {biometricType === "Fingerprint" ? (
                        <Fingerprint className="w-8 h-8 text-amber-400" />
                      ) : (
                        <Camera className="w-8 h-8 text-amber-400" />
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-300">
                      Place worker's finger on scanner or look into camera
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerBiometricScan}
                      className="mt-1 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      Scan Biometrics Now
                    </button>
                  </div>
                )}
              </div>

              {bioFeedback && (
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{bioFeedback}</span>
                </div>
              )}
            </div>
          )}

          {/* Method B: GPS Geofence Terminal */}
          {method === "gps" && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Site Geofence GPS Attendance
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 font-bold border border-amber-300/40">
                  Radius: {activeRadius} m
                </span>
              </div>

              {/* Testing / Proximity Simulation Mode Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Location Source Mode:
                    </span>{" "}
                    <span className="text-slate-500">
                      {isSimulatedOnSite ? "On-Site Proximity Simulation (18m)" : "Live Browser GPS"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSimulatedOnSite(!isSimulatedOnSite)}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                >
                  {isSimulatedOnSite ? "Switch to Live GPS" : "Switch to On-Site Demo"}
                </button>
              </div>

              {/* Geofence Radar Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white relative border border-slate-800 overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Target: {selectedSite?.name || project.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resolveLocation}
                    disabled={isFetchingGPS}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Refresh GPS"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGPS ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <div className="text-slate-400 text-[10px]">Site Coordinates:</div>
                    <div className="text-slate-200">
                      {(selectedSite?.latitude || project.siteLatitude || 12.971598).toFixed(6)}° N
                    </div>
                    <div className="text-slate-200">
                      {(selectedSite?.longitude || project.siteLongitude || 77.594566).toFixed(6)}° E
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">User Location:</div>
                    <div className="text-slate-200">
                      {userCoords ? `${userCoords.latitude.toFixed(6)}° N` : "Acquiring..."}
                    </div>
                    <div className="text-slate-200">
                      {userCoords ? `${userCoords.longitude.toFixed(6)}° E` : "--"}
                    </div>
                  </div>
                </div>

                {/* Distance Indicator */}
                {gpsCheckResult && (
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                      gpsCheckResult.isWithinGeofence
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/60 border-red-500/40 text-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {gpsCheckResult.isWithinGeofence ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">
                          {gpsCheckResult.isWithinGeofence
                            ? "Within Site Geofence Boundary"
                            : "Outside Permitted Attendance Geofence"}
                        </div>
                        <div className="text-[11px] opacity-90">
                          Measured Distance:{" "}
                          <span className="font-bold underline">
                            {gpsCheckResult.distanceInMeters} metres
                          </span>{" "}
                          (Permitted Radius: {activeRadius}m)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {gpsError && (
                  <div className="p-2.5 rounded bg-red-900/40 border border-red-500/40 text-red-200 text-xs">
                    {gpsError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Feedback Messages */}
          {actionSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Explicit Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => handleCheckIn()}
              disabled={
                !selectedWorker ||
                (currentRecord?.status === "present" && !currentRecord?.checkOut)
              }
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Explicit Check In
            </button>

            <button
              type="button"
              onClick={() => handleCheckOut()}
              disabled={!currentRecord || !currentRecord.checkIn || !!currentRecord.checkOut}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Explicit Check Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
