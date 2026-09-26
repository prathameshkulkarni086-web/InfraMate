export * from "./permissions";
export * from "./vehicleGate";
import { PermissionKey } from "./permissions";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  companyName?: string;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

export interface AccountUser {
  userId: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  companyName: string;
  defaultWorkspaceId: string;
  createdAt: string;
}

export type UserRole =
  | "admin"
  | "project_manager"
  | "site_engineer"
  | "supervisor"
  | "contractor"
  | "client"
  | "worker"
  | "custom";

export type UserStatus = "active" | "disabled";

export interface User {
  id: string;
  workspaceId?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  customRoleName?: string;
  status: UserStatus;
  permissions: PermissionKey[];
  overriddenFromRole?: boolean;
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  assignedBy?: string;
  notes?: string;
}

export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed" | "delayed";

export type ProjectType =
  | "Residential"
  | "Commercial"
  | "Infrastructure / Road"
  | "Industrial / Factory"
  | "Institutional / Healthcare"
  | "Other";

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
  status: "pending" | "in_progress" | "completed";
  budgetSharePercentage: number;
}

export interface ProjectSite {
  id: string;
  projectId: string;
  workspaceId?: string;
  name: string;
  latitude: number;
  longitude: number;
  attendanceRadiusMeters: number;
}

export interface Project {
  id: string;
  workspaceId?: string;
  createdBy?: string;
  name: string;
  projectType?: ProjectType | string;
  description: string;
  location: string;
  siteAddress?: string;
  clientId: string;
  clientName?: string;
  managerId: string;
  managerName?: string;
  budget: number;
  spentAmount: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progressPercentage: number;
  targetProgress?: number;
  plotAreaSqFt?: number;
  floors?: number;
  isFavorite?: boolean;
  milestones: Milestone[];
  createdAt: string;
  siteLatitude?: number;
  siteLongitude?: number;
  attendanceRadiusMeters?: number;
  sites?: ProjectSite[];
  code?: string;
}

export type ExpenseCategory =
  | "Materials"
  | "Labor"
  | "Equipment"
  | "Transportation"
  | "Electricity"
  | "Permits & Architectural"
  | "Other";

export type PaymentMethod = "UPI / Digital" | "Bank Transfer (NEFT)" | "Cash" | "Cheque";

export interface Expense {
  id: string;
  workspaceId?: string;
  projectId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  addedBy: string;
  createdBy?: string;
  receiptUrl?: string;
  paymentMethod: PaymentMethod;
  invoiceNumber?: string;
  vendorName?: string;
}

export interface Material {
  id: string;
  workspaceId?: string;
  projectId: string;
  name: string;
  category: string;
  quantity: number;
  unit: "bags" | "tons" | "cu.ft" | "units" | "liters" | "sq.ft" | "bundles" | string;
  minimumStock: number;
  purchasePrice?: number;
  unitPrice?: number;
  supplierId?: string;
  supplierName?: string;
  supplier?: string;
  location?: string;
  lastUpdated: string;
  createdBy?: string;
}

export type WorkerRole =
  | "Mason"
  | "Helper"
  | "General Helper / Laborer"
  | "Carpenter"
  | "Carpenter / Shuttering"
  | "Steel Fixer / Barbender"
  | "Electrician"
  | "Plumber"
  | "Welder"
  | "Painter"
  | "Machine Operator"
  | "Supervisor"
  | "Other"
  | (string & {});

export interface Worker {
  id: string;
  workspaceId?: string;
  employeeId?: string;
  projectId: string;
  siteId?: string;
  siteName?: string;
  name: string;
  role: WorkerRole;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  address?: string;
  dailyWage: number;
  overtimeHourlyRate?: number;
  contractorId?: string;
  contractorName?: string;
  joiningDate: string;
  status: "active" | "inactive" | "on_leave" | "leave";
  productivityScore?: number;
  safetyCertified?: boolean;
  biometricRegistered?: boolean;
  biometricDeviceId?: string;
  biometricId?: string;
  notes?: string;
  createdBy?: string;
}

export type AttendanceStatus = "present" | "absent" | "half_day" | "overtime" | "on_leave" | "leave";
export type AttendanceMethod = "DEVICE_BIOMETRIC" | "GPS_100M" | "MANUAL" | "ADMIN_OVERRIDE" | "Biometric" | "GPS" | "Manual";

export interface DeviceBiometricPayload {
  workerId: string;
  projectId: string;
  siteId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  deviceId?: string;
  authResult?: "SUCCESS" | "FAILED" | "CANCELLED" | "UNAVAILABLE";
  biometricVerified: boolean;
}

export interface AttendanceAuditEntry {
  id: string;
  changedBy: string;
  changedAt: string;
  originalStatus: string;
  newStatus: string;
  reason: string;
  action: string;
}

export interface AttendanceRecord {
  id: string;
  workspaceId?: string;
  projectId: string;
  siteId?: string;
  siteName?: string;
  workerId: string;
  workerName: string;
  workerRole: WorkerRole;
  date: string;
  attendanceDate?: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInTimestamp?: string;
  checkOutTimestamp?: string;
  workingHours?: number;
  overtimeHours?: number;
  method?: AttendanceMethod;
  attendanceMethod?: AttendanceMethod;
  biometricType?: "Fingerprint" | "Face Recognition" | "Scanner" | "Phone Biometric";
  biometricVerified?: boolean;
  deviceId?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  distanceFromSiteMeters?: number;
  distanceFromSite?: number;
  dailyWage: number;
  calculatedWage: number;
  isPendingSync?: boolean;
  notes?: string;
  auditTrail?: AttendanceAuditEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SitePhoto {
  id: string;
  workspaceId?: string;
  projectId?: string;
  url: string;
  caption: string;
  timestamp: string;
  areaLocation?: string;
  workStatus?: string;
  progressPercentage?: number;
  remarks?: string;
  isManualCapture?: boolean;
  capturedAt?: string;
  projectName?: string;
  uploadedBy?: string;
}

export interface ProgressLog {
  id: string;
  workspaceId?: string;
  projectId: string;
  date: string;
  description: string;
  percentage: number;
  completedTasks: string[];
  issues: string[];
  weather?: string;
  photos: SitePhoto[];
  addedBy: string;
  createdBy?: string;
  areaLocation?: string;
  workStatus?: string;
  remarks?: string;
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "review" | "completed";

export interface Task {
  id: string;
  workspaceId?: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  completionPercentage: number;
  createdBy?: string;
}

export interface Supplier {
  id: string;
  workspaceId?: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  materialsSupplied: string[];
  createdBy?: string;
}

export interface SystemNotification {
  id: string;
  workspaceId?: string;
  userId?: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success" | "alert";
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface RoomLayout {
  name: string;
  dimensions: string;
  areaSqFt: number;
  zone: "Public" | "Private" | "Service" | "Sanitary" | "Outdoor" | "Courtyard" | "Semi-Public";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FloorPlanLevel {
  level: string;
  rooms: RoomLayout[];
}

export interface BuildingConcept {
  id: string;
  title: string;
  tagline: string;
  architecturalStyle: string;
  carpetAreaSqFt: number;
  builtUpAreaSqFt: number;
  estimatedCost: string;
  designHighlights: string[];
  exteriorPalette: {
    facade: string;
    accent: string;
    roof: string;
    glazing: string;
  };
  floorPlanLevels: FloorPlanLevel[];
  structuralSpecs: {
    columnGrid: string;
    slabThickness: string;
    energyEfficiencyRating: string;
    ventilationScore: string;
  };
}

export interface BoqEstimate {
  totalEstimatedCostINR: number;
  totalEstimatedCostUSD: number;
  costPerSqFtINR: number;
  breakdown: {
    materials: { amountINR: number; percentage: number; description: string };
    labor: { amountINR: number; percentage: number; description: string };
    equipment: { amountINR: number; percentage: number; description: string };
    permitsAndArchitect: { amountINR: number; percentage: number; description: string };
    contingency: { amountINR: number; percentage: number; description: string };
  };
  keyMaterialQuantities: {
    item: string;
    quantity: string;
    estimatedRate: string;
    totalCost: string;
  }[];
  milestoneCashflow: {
    stage: string;
    durationWeeks: number;
    costPercentage: number;
    estimatedAmountINR: number;
  }[];
  costSavingRecommendations: string[];
}

export type EquipmentStatus = "Available" | "In Use" | "Under Maintenance" | "Maintenance Due" | "Out of Service" | "Retired";
export type EquipmentOwnership = "Owned" | "Rented" | "Leased";
export type EquipmentAvailability = "Available" | "In Use" | "Maintenance Due" | "Under Maintenance" | "Out of Service";

export interface Equipment {
  id: string;
  name: string;
  assetId: string;
  type: string;
  brand: string;
  model: string;
  registrationNumber?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  ownership: EquipmentOwnership;
  vendor?: string;
  contactNumber?: string;
  photoUrl?: string;
  status: EquipmentStatus;
  
  // Assignment
  projectId?: string;
  siteId?: string;
  operatorId?: string;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  assignmentPurpose?: string;
  
  // Rental Info
  rentalCompany?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalRate?: number;
  rentalRateType?: "Daily" | "Weekly" | "Monthly";
  securityDeposit?: number;
  
  // Meta
  totalOperatingHours?: number;
  totalFuelConsumed?: number;
  totalFuelCost?: number;
  totalMaintenanceCost?: number;
  nextServiceDate?: string;
  nextServiceMeterReading?: number;
}

export interface EquipmentUsageLog {
  id: string;
  equipmentId: string;
  projectId: string;
  siteId?: string;
  operatorId?: string;
  date: string;
  startMeter: number;
  endMeter: number;
  totalHours: number;
  activity: string;
  remarks?: string;
  loggedBy: string;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  equipmentId: string;
  projectId?: string;
  siteId?: string;
  date: string;
  fuelType: string;
  quantity: number;
  pricePerLitre?: number;
  totalCost: number;
  meterReading: number;
  pumpName?: string;
  vendor?: string;
  invoiceNumber?: string;
  remarks?: string;
  loggedBy: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  maintenanceType: string;
  date: string;
  meterReading: number;
  problem?: string;
  workPerformed: string;
  partsReplaced?: string | string[];
  serviceProvider?: string;
  technician?: string;
  vendor?: string;
  cost: number;
  nextServiceDate?: string;
  nextServiceMeterReading?: number;
  invoiceUrl?: string;
  photoUrl?: string;
  remarks?: string;
  loggedBy: string;
  createdAt: string;
}

export interface EquipmentInspection {
  id: string;
  equipmentId: string;
  projectId?: string;
  siteId?: string;
  date: string;
  inspector: string;
  
  // Checklist
  engineCondition?: "Pass" | "Fail" | "N/A";
  oilLevel?: "Pass" | "Fail" | "N/A";
  hydraulicSystem?: "Pass" | "Fail" | "N/A";
  hydraulics?: "Pass" | "Fail" | "N/A";
  tyres?: "Pass" | "Fail" | "N/A";
  tiresTracks?: "Pass" | "Fail" | "N/A";
  brakes?: "Pass" | "Fail" | "N/A";
  lights?: "Pass" | "Fail" | "N/A";
  battery?: "Pass" | "Fail" | "N/A";
  electrical?: "Pass" | "Fail" | "N/A";
  fluids?: "Pass" | "Fail" | "N/A";
  safetyEquipment?: "Pass" | "Fail" | "N/A";
  visibleDamage?: "Pass" | "Fail" | "N/A";
  leakage?: "Pass" | "Fail" | "N/A";
  generalCondition?: "Pass" | "Fail" | "N/A";
  
  result: "Passed" | "Passed with Issues" | "Failed";
  failureReason?: string;
  remarks?: string;
  photoUrl?: string;
  createdAt: string;
}

export * from "./inspection";
export * from "./support";
export * from "./laborRoster";

