export type InspectionStatus =
  | "Draft"
  | "Photo Captured"
  | "Location Verified"
  | "Submitted"
  | "Under Review"
  | "Passed"
  | "Failed"
  | "Reinspection Required"
  | "Closed";

export type InspectionSyncStatus = "synced" | "pending_sync";

export type InspectionCaptureMethod = "DEVICE_CAMERA" | "TESTING_FALLBACK_UPLOAD";

export interface InspectionPhoto {
  id: string;
  inspectionId: string;
  projectId: string;
  siteId: string;
  capturedBy: string;
  capturedByName: string;
  title: string; // e.g. "Photo 1 — Front view", "Photo 2 — Reinforcement"
  caption?: string;
  imageUrl: string; // Active display image (annotated if present, else original)
  originalImageUrl: string; // Immutable, original camera capture evidence
  annotatedImageUrl?: string; // Optional annotated copy
  capturedAt: string; // Original capture ISO timestamp
  latitude: number;
  longitude: number;
  gpsAccuracy: number; // in meters
  distanceFromSite: number; // in meters
  locationVerified: boolean;
  cameraCaptureVerified: boolean; // True if taken with real-time camera
  captureMethod: InspectionCaptureMethod;
  syncStatus: InspectionSyncStatus;
  aiAnalysisStatus: "not_requested" | "pending" | "completed" | "failed";
  aiAnalysisResult?: {
    observation: string;
    confidence: number;
    detectedIssues: string[];
    recommendation: string;
    analyzedAt: string;
  };
  annotationsData?: string; // JSON serialized canvas strokes / shapes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  category?: string;
  status: "pass" | "fail" | "na" | "pending";
  notes?: string;
}

export interface QualityInspection {
  id: string;
  workspaceId?: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  title: string; // e.g. "Column C-12 Reinforcement Check"
  category: string; // Concrete, Reinforcement, Brickwork, Plaster, Waterproofing, Electrical, Plumbing, Other
  subCategory: string; // e.g. Column reinforcement, Beam reinforcement, Pond test
  location: string; // e.g. "Tower 1 - 4th Floor Grid C-12"
  status: InspectionStatus;
  inspectorId: string;
  inspectorName: string;
  inspectorRole: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  photos: InspectionPhoto[];
  checklist: InspectionChecklistItem[];
  observations: string;
  actionRequired?: string;
  reinspectionNotes?: string;
  reviewRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  defectId?: string; // Linked defect if failed
  dprId?: string; // Attached DPR ID
  createdAt: string;
  updatedAt: string;
  syncStatus: InspectionSyncStatus;
}

export interface QualityDefect {
  id: string;
  inspectionId: string;
  photoId?: string;
  photoUrl?: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  location: string;
  issue: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "reinspected" | "closed";
  assignedToId: string;
  assignedToName: string;
  reportedById: string;
  reportedByName: string;
  reportedAt: string;
  correctiveAction?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  closedAt?: string;
  closedBy?: string;
}

export interface InspectionAdminConfig {
  geofenceRadiusMeters: number; // default 100
  gpsVerificationRequired: boolean; // default true
  photoRequired: boolean; // default true
  minimumPhotos: number; // default 1
  manualCameraOnly: boolean; // default true
  aiAnalysisEnabled: boolean; // default true
  allowedApproverRoles: string[];
  allowedDefectCreatorRoles: string[];
}

export interface InspectionAuditLog {
  id: string;
  inspectionId: string;
  action:
    | "CREATE"
    | "CAPTURE_PHOTO"
    | "ANNOTATE_PHOTO"
    | "SUBMIT"
    | "REVIEW_PASS"
    | "REVIEW_FAIL"
    | "REQUEST_REINSPECTION"
    | "REPORT_DEFECT"
    | "ATTACH_DPR"
    | "ARCHIVE"
    | "REVIEW"
    | "SYNC";
  performedBy: string;
  performedByName: string;
  details: string;
  timestamp: string;
}

export interface CategorySpec {
  name: string;
  icon: string;
  subcategories: string[];
  defaultChecklist: string[];
}

export const INSPECTION_CATEGORIES: CategorySpec[] = [
  {
    name: "Reinforcement",
    icon: "Layers",
    subcategories: [
      "Column reinforcement",
      "Beam reinforcement",
      "Slab reinforcement",
      "Footing reinforcement",
      "Stirrups & tie spacing",
      "Cover block placement",
      "Lap length & stagger",
    ],
    defaultChecklist: [
      "Rebar diameter and spacing as per structural drawings",
      "Cover blocks placed at required minimum thickness (40mm/50mm)",
      "Lap lengths & staggering comply with IS 456 / ACI code",
      "Ties and stirrups securely bound with 18-gauge binding wire",
      "Surface clean from oil, excessive rust, or debris before pour",
    ],
  },
  {
    name: "Concrete",
    icon: "Box",
    subcategories: [
      "Slab",
      "Column",
      "Beam",
      "Foundation",
      "Retaining wall",
      "Slump test & batching",
      "Curing verification",
    ],
    defaultChecklist: [
      "Slump test verified within specified range (100-120mm)",
      "Formwork rigidity and release agent application checked",
      "Adequate needle vibrator compaction without segregation",
      "Cube samples cast for 7-day and 28-day compressive tests",
      "Ponding/burlap curing initiated within 24 hours of casting",
    ],
  },
  {
    name: "Brickwork",
    icon: "Grid",
    subcategories: [
      "Wall alignment",
      "Joint thickness",
      "Openings",
      "Damp proof course (DPC)",
      "Lintel bearing",
      "Mortar mix ratio",
    ],
    defaultChecklist: [
      "Plumb line and verticality checked with spirit level",
      "Mortar joint thickness maintained between 10mm-12mm",
      "Proper racking of joints for plaster keying",
      "Lintel bearing length exceeds minimum 150mm on both sides",
      "Brick pre-soaking in water prior to laying confirmed",
    ],
  },
  {
    name: "Plaster",
    icon: "Paintbrush",
    subcategories: [
      "Surface",
      "Thickness",
      "Finishing",
      "Chicken mesh at RCC-masonry joints",
      "Groove cutting & bull marks",
    ],
    defaultChecklist: [
      "Hacking of RCC surfaces completed for mechanical bond",
      "GI Chicken wire mesh fixed at RCC-brickwork junctions",
      "Bull marks / leveling dots established across walls",
      "Plaster thickness conforms to 12mm internal / 18mm external",
      "Surface finish is uniform without waviness or shrinkage cracks",
    ],
  },
  {
    name: "Waterproofing",
    icon: "Droplet",
    subcategories: [
      "Application",
      "Joint treatment",
      "Pond test",
      "Basement membrane",
      "Terrace coving / chamfering",
      "Sunken slab sealing",
    ],
    defaultChecklist: [
      "Corner coving / angle fillets constructed at all 90° joints",
      "Primer coat applied uniformly on dried, dust-free surface",
      "Waterproofing membrane / coating applied in cross layers",
      "48-hour standing water pond test conducted without dampness",
      "Protective screed laid over cured waterproofing membrane",
    ],
  },
  {
    name: "Electrical",
    icon: "Zap",
    subcategories: [
      "Conduit",
      "Wiring",
      "DB",
      "Earthing / Grounding",
      "Switch boxes & alignment",
      "Insulation resistance",
    ],
    defaultChecklist: [
      "Heavy-duty FRLS PVC conduits laid before slab casting",
      "Conduit joints sealed watertight with solvent cement",
      "Proper color coding followed for Phase, Neutral, and Earth",
      "Distribution board (DB) height and earthing pit resistance verified",
      "Megger insulation test values exceed minimum 1 Megaohm",
    ],
  },
  {
    name: "Plumbing",
    icon: "Wrench",
    subcategories: [
      "Pipe installation",
      "Pressure testing",
      "Leakage testing",
      "Drainage slope & venting",
      "Shaft piping clamps",
      "Sanitary fixture fixing",
    ],
    defaultChecklist: [
      "CPVC / UPVC pipes clamped at required 1.2m intervals",
      "Hydrostatic pressure testing at 10 bar for 2 hours with zero drop",
      "Gravity drainage lines laid with minimum 1:50 gradient slope",
      "Trap water seals and cleanout access points installed",
      "No leaks observed at threaded joints or solvent welds",
    ],
  },
];
