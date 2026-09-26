export type VehicleMovementType = "entry" | "exit";

export type VehicleStatus = "inside" | "exited" | "void";

export type VehicleType =
  | "transit_mixer"
  | "dump_truck"
  | "trailer_flatbed"
  | "water_tanker"
  | "pickup_commercial"
  | "heavy_machinery"
  | "staff_vehicle"
  | "visitor_vendor"
  | "two_wheeler"
  | "emergency"
  | "other";

export type VisitPurpose =
  | "material_delivery"
  | "concrete_pouring"
  | "debris_disposal"
  | "machinery_mobilization"
  | "site_inspection"
  | "subcontractor_work"
  | "fuel_supply"
  | "client_management"
  | "emergency"
  | "other";

export interface VehicleMaterialDetails {
  itemDescription?: string;
  challanNumber?: string;
  poNumber?: string;
  supplierName?: string;
  quantity?: string;
  weightGrossKg?: number;
  weightTareKg?: number;
  weightNetKg?: number;
}

export interface VehicleGateMovement {
  id: string;
  passNumber: string;
  projectId: string;
  siteId?: string;
  siteName?: string;
  movementType: VehicleMovementType;
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleModel?: string;
  photoUrl?: string;
  exitPhotoUrl?: string;
  gateNumber: string;
  exitGateNumber?: string;
  entryTime: string; // ISO String
  exitTime?: string; // ISO String
  expectedDurationHours?: number;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber?: string;
  helperCount: number;
  helperNames?: string;
  purpose: VisitPurpose;
  purposeDetails?: string;
  materialDetails?: VehicleMaterialDetails;
  status: VehicleStatus;
  entryRecordedBy: string;
  entryOperatorId?: string;
  exitRecordedBy?: string;
  exitOperatorId?: string;
  linkedEntryId?: string;
  linkedExitId?: string;
  notes?: string;
  exitNotes?: string;
  isVoided?: boolean;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GateOption {
  id: string;
  name: string;
  code: string;
  locationDescription?: string;
}

export const DEFAULT_SITE_GATES: GateOption[] = [
  { id: "gate-1", name: "Gate 1 - North Main Entry", code: "GATE-01", locationDescription: "North Perimeter Highway Access" },
  { id: "gate-2", name: "Gate 2 - Heavy Material & RMC Gate", code: "GATE-02", locationDescription: "East Material Yard / Batching Point" },
  { id: "gate-3", name: "Gate 3 - South Contractor / Staff Gate", code: "GATE-03", locationDescription: "South Worker & Staff Parking" },
  { id: "gate-4", name: "Gate 4 - West Emergency Exit", code: "GATE-04", locationDescription: "West Evacuation & Heavy Plant Ramp" },
];

export const VEHICLE_TYPE_CONFIG: Record<
  VehicleType,
  { label: string; icon: string; category: "Heavy" | "Commercial" | "Machinery" | "Light" | "Emergency" }
> = {
  transit_mixer: { label: "Transit / Concrete Mixer", icon: "Truck", category: "Heavy" },
  dump_truck: { label: "Dump Truck / Tipper (10-12 Wheeler)", icon: "Truck", category: "Heavy" },
  trailer_flatbed: { label: "Heavy Trailer / Flatbed (Steel/Cement)", icon: "Container", category: "Heavy" },
  water_tanker: { label: "Water Tanker (Site Curing)", icon: "Droplets", category: "Commercial" },
  pickup_commercial: { label: "Pickup / LCV / Bolero Maxi", icon: "Car", category: "Commercial" },
  heavy_machinery: { label: "JCB / Excavator / Crane / Roller", icon: "Tractor", category: "Machinery" },
  staff_vehicle: { label: "Site Staff SUV / Four Wheeler", icon: "Car", category: "Light" },
  visitor_vendor: { label: "Visitor / Vendor Car", icon: "Car", category: "Light" },
  two_wheeler: { label: "Two Wheeler / Bike (Worker/Visitor)", icon: "Bike", category: "Light" },
  emergency: { label: "Ambulance / Fire / Emergency Service", icon: "ShieldAlert", category: "Emergency" },
  other: { label: "Other Vehicle", icon: "HelpCircle", category: "Commercial" },
};

export const VISIT_PURPOSE_CONFIG: Record<VisitPurpose, { label: string; badgeColor: string }> = {
  material_delivery: { label: "Material Delivery", badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  concrete_pouring: { label: "Concrete / RMC Pouring", badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  debris_disposal: { label: "Debris & Soil Waste Disposal", badgeColor: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300" },
  machinery_mobilization: { label: "Machinery Mobilization / Demob", badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  site_inspection: { label: "Site Quality / Safety Inspection", badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  subcontractor_work: { label: "Subcontractor Work Crew & Tools", badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" },
  fuel_supply: { label: "Fuel / Diesel Delivery", badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  client_management: { label: "Client / Executive Visit", badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300" },
  emergency: { label: "Emergency / Medical Response", badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  other: { label: "General Site Visit", badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
};
