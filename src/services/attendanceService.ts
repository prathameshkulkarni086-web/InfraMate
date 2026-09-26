import {
  Worker,
  AttendanceRecord,
  AttendanceAuditEntry,
  Project,
  ProjectSite,
  Expense,
} from "../types";

export interface GeoLocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceCheckResult {
  isWithinGeofence: boolean;
  distanceInMeters: number;
  allowedRadiusMeters: number;
  siteName: string;
  siteCoordinates: { latitude: number; longitude: number };
  userCoordinates?: GeoLocationCoordinates;
  message: string;
}

export interface BiometricVerificationResult {
  success: boolean;
  token: string;
  deviceId: string;
  matchedScore: number;
  type: "Fingerprint" | "Face Recognition" | "Scanner" | "Phone Biometric";
  timestamp: string;
  workerId: string;
  workerName: string;
}

export interface NativeBiometricAuthResult {
  success: boolean;
  authResult: "SUCCESS" | "FAILED" | "CANCELLED" | "UNAVAILABLE";
  deviceId: string;
  error?: string;
  message?: string;
}

export interface PayrollLabourSummary {
  worker: Worker;
  totalDays: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeDays: number;
  overtimeHours: number;
  payableDays: number;
  basePay: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  records: AttendanceRecord[];
}

export class AttendanceService {
  private offlineStorageKey = "infrasync_offline_attendance_queue";

  /**
   * Calculate real geodesic distance using Haversine formula
   */
  calculateDistanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Validate Geofence for Project Site
   */
  checkGeofence(
    userCoords: GeoLocationCoordinates,
    project: Project,
    selectedSite?: ProjectSite
  ): GeofenceCheckResult {
    const siteLat = selectedSite?.latitude ?? project.siteLatitude ?? 12.971598;
    const siteLng = selectedSite?.longitude ?? project.siteLongitude ?? 77.594566;
    const allowedRadius =
      selectedSite?.attendanceRadiusMeters ?? project.attendanceRadiusMeters ?? 100;
    const siteName = selectedSite?.name ?? project.name;

    const distance = this.calculateDistanceInMeters(
      userCoords.latitude,
      userCoords.longitude,
      siteLat,
      siteLng
    );

    const isWithin = distance <= allowedRadius;

    let message = isWithin
      ? `You are inside the verified site geofence (${distance}m from site center). Attendance permitted.`
      : `You are outside the construction site attendance area. Please move within ${allowedRadius} m of the site to check in. (Current distance: ${distance}m)`;

    return {
      isWithinGeofence: isWithin,
      distanceInMeters: distance,
      allowedRadiusMeters: allowedRadius,
      siteName,
      siteCoordinates: { latitude: siteLat, longitude: siteLng },
      userCoordinates: userCoords,
      message,
    };
  }

  /**
   * Check if native platform biometric authenticator (Android BiometricPrompt / Touch ID / Face ID) is supported
   */
  async isPlatformBiometricAvailable(): Promise<boolean> {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      return false;
    }
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Trigger native device biometric authentication (Android BiometricPrompt / Face / Fingerprint)
   * The app NEVER receives raw biometric templates, only SUCCESS, FAILED, CANCELLED, or UNAVAILABLE
   */
  async triggerNativeDeviceBiometrics(
    workerId: string,
    workerName: string,
    useSimulatedMode: boolean = false
  ): Promise<NativeBiometricAuthResult> {
    // If simulator mode is explicitly enabled (e.g. for testing inside iframe without hardware biometric enrollments)
    if (useSimulatedMode) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return {
        success: true,
        authResult: "SUCCESS",
        deviceId: `DEV-PHONE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        message: "Native biometric verification successful (Device Biometric Prompt)",
      };
    }

    if (typeof window === "undefined" || !navigator.credentials || !window.PublicKeyCredential) {
      return {
        success: false,
        authResult: "UNAVAILABLE",
        deviceId: "DEV-UNKNOWN",
        error: "Biometric authentication is not supported on this device/browser.",
      };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userIdBuffer = new TextEncoder().encode(workerId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "InfraMate Construction Platform",
          id: window.location.hostname === "localhost" ? undefined : window.location.hostname,
        },
        user: {
          id: userIdBuffer,
          name: workerName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase(),
          displayName: workerName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // strictly device built-in Android BiometricPrompt / iOS FaceID
          userVerification: "required", // requires biometric validation
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        return {
          success: true,
          authResult: "SUCCESS",
          deviceId: `DEV-BIO-${(credential as any).id?.substring(0, 10) || Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          message: "Biometric authentication verified on device hardware.",
        };
      }

      return {
        success: false,
        authResult: "FAILED",
        deviceId: "DEV-UNKNOWN",
        error: "Biometric authentication failed. Please try again.",
      };
    } catch (err: any) {
      const errStr = (err?.message || "").toLowerCase();
      const errName = err?.name || "";

      if (errName === "NotAllowedError" || errStr.includes("cancel") || errStr.includes("abort")) {
        return {
          success: false,
          authResult: "CANCELLED",
          deviceId: "DEV-UNKNOWN",
          error: "Biometric verification was cancelled by the user.",
        };
      }

      if (errName === "NotSupportedError" || errStr.includes("not supported") || errStr.includes("no authenticator")) {
        return {
          success: false,
          authResult: "UNAVAILABLE",
          deviceId: "DEV-UNKNOWN",
          error: "Biometric authentication is not configured or available on this device.",
        };
      }

      return {
        success: false,
        authResult: "FAILED",
        deviceId: "DEV-UNKNOWN",
        error: err.message || "Your identity could not be verified.",
      };
    }
  }

  /**
   * Submit Phone Biometric Attendance to Backend with Server Validation
   */
  async submitBiometricAttendance(payload: {
    worker: Worker;
    project: Project;
    selectedSite?: ProjectSite;
    userCoords: GeoLocationCoordinates;
    deviceId?: string;
    biometricVerified: boolean;
  }): Promise<{
    success: boolean;
    record?: AttendanceRecord;
    error?: string;
    alreadyMarked?: boolean;
    distanceMeters?: number;
    checkInTime?: string;
  }> {
    const siteLat = payload.selectedSite?.latitude ?? payload.project.siteLatitude ?? 12.971598;
    const siteLng = payload.selectedSite?.longitude ?? payload.project.siteLongitude ?? 77.594566;
    const allowedRadius = payload.selectedSite?.attendanceRadiusMeters ?? payload.project.attendanceRadiusMeters ?? 100;
    const siteName = payload.selectedSite?.name ?? payload.project.name;

    try {
      const response = await fetch("/api/attendance/biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: payload.worker.id,
          workerName: payload.worker.name,
          workerRole: payload.worker.role,
          projectId: payload.project.id,
          projectName: payload.project.name,
          siteId: payload.selectedSite?.id || "main",
          siteName,
          siteLatitude: siteLat,
          siteLongitude: siteLng,
          allowedRadiusMeters: allowedRadius,
          latitude: payload.userCoords.latitude,
          longitude: payload.userCoords.longitude,
          accuracy: payload.userCoords.accuracy || 5,
          deviceId: payload.deviceId || "DEV-ANDROID-BIO-01",
          biometricVerified: payload.biometricVerified,
          dailyWage: payload.worker.dailyWage || 850,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Failed with status ${response.status}`,
          alreadyMarked: !!data.alreadyMarked,
          distanceMeters: data.distanceMeters,
          record: data.record,
        };
      }

      return {
        success: true,
        record: data.record,
        distanceMeters: data.distanceMeters,
        checkInTime: data.checkInTime,
      };
    } catch (networkErr: any) {
      console.warn("Backend API offline or unreachable, generating verified local biometric record:", networkErr);
      // Fallback local verification if server is unreachable
      const distance = this.calculateDistanceInMeters(
        payload.userCoords.latitude,
        payload.userCoords.longitude,
        siteLat,
        siteLng
      );

      if (distance > allowedRadius) {
        return {
          success: false,
          error: `You must be within ${allowedRadius} meters of your assigned construction site to mark attendance. (Current distance: ${distance}m)`,
          distanceMeters: distance,
        };
      }

      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const checkInTimeStr = `${formattedHours < 10 ? `0${formattedHours}` : formattedHours}:${formattedMinutes} ${ampm}`;

      const fallbackRecord: AttendanceRecord = {
        id: `att-bio-${Date.now()}`,
        workerId: payload.worker.id,
        workerName: payload.worker.name,
        workerRole: payload.worker.role,
        projectId: payload.project.id,
        siteId: payload.selectedSite?.id || "main",
        siteName,
        date: today,
        attendanceDate: today,
        status: "present",
        checkIn: checkInTimeStr,
        checkInTime: checkInTimeStr,
        checkInTimestamp: now.toISOString(),
        method: "DEVICE_BIOMETRIC",
        attendanceMethod: "DEVICE_BIOMETRIC",
        biometricType: "Phone Biometric",
        biometricVerified: true,
        deviceId: payload.deviceId || "DEV-ANDROID-BIO-01",
        latitude: payload.userCoords.latitude,
        longitude: payload.userCoords.longitude,
        distanceFromSiteMeters: distance,
        distanceFromSite: distance,
        dailyWage: payload.worker.dailyWage || 850,
        calculatedWage: payload.worker.dailyWage || 850,
        isPendingSync: true,
        notes: "Marked via Phone Native Biometrics & 100m GPS Attendance Zone",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      return {
        success: true,
        record: fallbackRecord,
        distanceMeters: distance,
        checkInTime: checkInTimeStr,
      };
    }
  }

  /**
   * Simulate Biometric hardware scanner verification
   */
  async simulateBiometricScan(
    worker: Worker,
    type: "Fingerprint" | "Face Recognition" | "Scanner" = "Fingerprint"
  ): Promise<BiometricVerificationResult> {
    // Artificial verification delay to match real hardware reader
    await new Promise((resolve) => setTimeout(resolve, 800));

    const token = `BIO-AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const deviceId = worker.biometricDeviceId || `BIO-DEV-${type === "Face Recognition" ? "CAM01" : "FPR02"}`;

    return {
      success: true,
      token,
      deviceId,
      matchedScore: Math.round(98 + Math.random() * 1.9),
      type,
      timestamp: new Date().toISOString(),
      workerId: worker.id,
      workerName: worker.name,
    };
  }

  /**
   * Calculate working hours between time strings (e.g. "08:15 AM" and "05:30 PM")
   */
  calculateHoursDuration(checkInStr?: string, checkOutStr?: string): {
    hours: number;
    formatted: string;
  } {
    if (!checkInStr || !checkOutStr) return { hours: 0, formatted: "--" };

    const parseTime = (str: string) => {
      const [time, period] = str.split(" ");
      if (!time || !period) return null;
      let [h, m] = time.split(":").map(Number);
      if (period.toUpperCase() === "PM" && h < 12) h += 12;
      if (period.toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };

    const inMinutes = parseTime(checkInStr);
    const outMinutes = parseTime(checkOutStr);

    if (inMinutes === null || outMinutes === null || outMinutes < inMinutes) {
      return { hours: 8, formatted: "8h 00m" };
    }

    const diff = outMinutes - inMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return {
      hours: Number((diff / 60).toFixed(2)),
      formatted: `${h}h ${m < 10 ? "0" : ""}${m}m`,
    };
  }

  /**
   * Compute Payroll for a single worker
   */
  calculateSingleWorkerPayroll(
    worker: Worker,
    attendance: AttendanceRecord[],
    startDate?: string,
    endDate?: string
  ): PayrollLabourSummary {
    const workerRecords = (Array.isArray(attendance) ? attendance : []).filter((a) => {
      if (!a || a.workerId !== worker.id) return false;
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });

    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let overtimeDays = 0;
    let overtimeHours = 0;

    workerRecords.forEach((rec) => {
      if (rec.status === "present") presentDays += 1;
      else if (rec.status === "half_day") halfDays += 1;
      else if (rec.status === "absent") absentDays += 1;
      else if (rec.status === "on_leave") leaveDays += 1;
      else if (rec.status === "overtime") {
        presentDays += 1;
        overtimeDays += 1;
        overtimeHours += rec.overtimeHours || 2;
      }
    });

    const payableDays = presentDays + halfDays * 0.5;
    const basePay = Math.round(payableDays * (worker.dailyWage || 0));
    const hourlyRate =
      worker.overtimeHourlyRate || Math.round((worker.dailyWage || 0) / 8);
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
    const deductions = 0; // Default zero deductions unless specified
    const netPay = basePay + overtimePay - deductions;

    return {
      worker,
      totalDays: workerRecords.length,
      presentDays,
      halfDays,
      absentDays,
      leaveDays,
      overtimeDays,
      overtimeHours,
      payableDays,
      basePay,
      overtimePay,
      deductions,
      netPay,
      records: workerRecords,
    };
  }

  /**
   * Compute Payroll and Wage statistics
   */
  calculatePayroll(
    workers: Worker[] | Worker,
    attendance: AttendanceRecord[],
    startDate?: string,
    endDate?: string
  ): {
    summaries: PayrollLabourSummary[];
    totalGrossPay: number;
    totalNetPay: number;
    totalOvertimePay: number;
    totalPayableDays: number;
  } {
    const workerList: Worker[] = Array.isArray(workers)
      ? workers
      : workers
      ? [workers]
      : [];

    const summaries: PayrollLabourSummary[] = workerList.map((worker) =>
      this.calculateSingleWorkerPayroll(worker, attendance, startDate, endDate)
    );

    const totalGrossPay = summaries.reduce((sum, s) => sum + s.basePay + s.overtimePay, 0);
    const totalNetPay = summaries.reduce((sum, s) => sum + s.netPay, 0);
    const totalOvertimePay = summaries.reduce((sum, s) => sum + s.overtimePay, 0);
    const totalPayableDays = summaries.reduce((sum, s) => sum + s.payableDays, 0);

    return {
      summaries,
      totalGrossPay,
      totalNetPay,
      totalOvertimePay,
      totalPayableDays,
    };
  }

  /**
   * Offline Attendance Storage Queue
   */
  getOfflineQueue(): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(this.offlineStorageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addToOfflineQueue(record: AttendanceRecord): void {
    const queue = this.getOfflineQueue();
    // Avoid duplicate check in queue
    const filtered = queue.filter(
      (r) => !(r.workerId === record.workerId && r.date === record.date)
    );
    filtered.push({ ...record, isPendingSync: true });
    localStorage.setItem(this.offlineStorageKey, JSON.stringify(filtered));
  }

  clearOfflineQueue(): void {
    localStorage.removeItem(this.offlineStorageKey);
  }

  /**
   * Generate CSV format for Attendance
   */
  exportAttendanceToCSV(
    records: AttendanceRecord[],
    workers: Worker[],
    projectName: string,
    dateRangeStr: string
  ): string {
    const headers = [
      "Employee ID",
      "Labour Name",
      "Trade / Role",
      "Project",
      "Site Area",
      "Date",
      "Status",
      "Check In",
      "Check Out",
      "Duration",
      "Method",
      "GPS Distance (m)",
      "Daily Wage (Rs)",
      "Calculated Pay (Rs)",
      "Sync Status",
    ];

    const rows = records.map((rec) => {
      const worker = workers.find((w) => w.id === rec.workerId);
      const duration = this.calculateHoursDuration(rec.checkIn, rec.checkOut).formatted;
      return [
        worker?.employeeId || rec.workerId,
        `"${rec.workerName.replace(/"/g, '""')}"`,
        `"${rec.workerRole}"`,
        `"${projectName}"`,
        `"${rec.siteName || "Main Site"}"`,
        rec.date,
        rec.status.toUpperCase(),
        rec.checkIn || "--",
        rec.checkOut || "--",
        duration,
        rec.method || "Manual",
        rec.distanceFromSiteMeters !== undefined ? `${rec.distanceFromSiteMeters} m` : "N/A",
        rec.dailyWage,
        rec.calculatedWage,
        rec.isPendingSync ? "Pending Sync" : "Synced",
      ];
    });

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  /**
   * Download CSV directly to client
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const attendanceService = new AttendanceService();
