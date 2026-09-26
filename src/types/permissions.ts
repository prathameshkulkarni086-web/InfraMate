export type PermissionKey =
  // Dashboard & Analytics
  | "view_dashboard"
  | "view_analytics"

  // Projects
  | "view_projects"
  | "manage_projects"
  | "create_edit_delete_projects"

  // Expenses & Financials
  | "view_expenses"
  | "manage_expenses"
  | "create_edit_delete_expenses"

  // Materials & Inventory
  | "view_materials"
  | "manage_materials"
  | "create_edit_delete_materials"

  // Labor & Attendance
  | "view_labor"
  | "manage_labor"
  | "create_edit_delete_labor"
  | "manage_attendance"

  // Site Progress & Media & Quality Inspections
  | "manage_progress"
  | "upload_site_photos"
  | "manage_quality_inspections"

  // Equipment & Machinery
  | "view_equipment"
  | "manage_equipment"
  | "create_edit_delete_equipment"

  // Reports & Documentation
  | "generate_view_download_reports"

  // AI & Architecture
  | "use_ai_assistant"
  | "use_building_visualizer"

  // 24/7 Support & Transactions
  | "view_support"
  | "manage_support"
  | "view_transactions"
  | "manage_transactions"
  | "manage_returns"

  // Administration & Security
  | "manage_users"
  | "manage_roles_permissions"
  | "manage_settings";

export type PermissionCategory =
  | "Dashboard & Analytics"
  | "Project Operations"
  | "Financial & Expenses"
  | "Material & Inventory"
  | "Workforce & Attendance"
  | "Equipment & Machinery"
  | "Site Progress & Media"
  | "Quality Inspections"
  | "Reports & Documentation"
  | "AI & 3D Visualizer"
  | "24/7 Support & Transactions"
  | "Security & Administration";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: PermissionCategory;
  description: string;
  dangerLevel: "low" | "medium" | "high";
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard & Analytics
  {
    key: "view_dashboard",
    label: "View Dashboard",
    category: "Dashboard & Analytics",
    description: "Access executive project health KPIs, live progress %, cash flow summaries, and site activity streams.",
    dangerLevel: "low",
  },
  {
    key: "view_analytics",
    label: "View Analytics",
    category: "Dashboard & Analytics",
    description: "Inspect detailed financial burn charts, workforce productivity statistics, and material consumption trends.",
    dangerLevel: "low",
  },

  // Project Operations
  {
    key: "view_projects",
    label: "View Projects",
    category: "Project Operations",
    description: "Browse the active projects catalog, timeline milestones, location specifications, and client details.",
    dangerLevel: "low",
  },
  {
    key: "manage_projects",
    label: "Manage Projects",
    category: "Project Operations",
    description: "Assign project managers, reallocate project phases, and adjust high-level milestone target schedules.",
    dangerLevel: "medium",
  },
  {
    key: "create_edit_delete_projects",
    label: "Create / Edit / Delete Projects",
    category: "Project Operations",
    description: "Full architectural authority to initialize new construction sites, modify budgets, or archive completed sites.",
    dangerLevel: "high",
  },

  // Financial & Expenses
  {
    key: "view_expenses",
    label: "View Expenses",
    category: "Financial & Expenses",
    description: "Examine itemized financial disbursements, vendor invoices, payment methods, and ledger logs.",
    dangerLevel: "low",
  },
  {
    key: "manage_expenses",
    label: "Manage Expenses",
    category: "Financial & Expenses",
    description: "Approve vendor claims, reconcile bank transfers / NEFT entries, and verify accounting categories.",
    dangerLevel: "medium",
  },
  {
    key: "create_edit_delete_expenses",
    label: "Create / Edit / Delete Expenses",
    category: "Financial & Expenses",
    description: "Log new material or labor expenditures, upload invoice receipts, and delete fraudulent/duplicate records.",
    dangerLevel: "high",
  },

  // Material & Inventory
  {
    key: "view_materials",
    label: "View Materials",
    category: "Material & Inventory",
    description: "Inspect warehouse stock levels, unit purchase prices, supplier directories, and reorder thresholds.",
    dangerLevel: "low",
  },
  {
    key: "manage_materials",
    label: "Manage Materials",
    category: "Material & Inventory",
    description: "Perform daily stock adjustments (inward deliveries, site consumption) and draft purchase orders.",
    dangerLevel: "medium",
  },
  {
    key: "create_edit_delete_materials",
    label: "Create / Edit / Delete Materials",
    category: "Material & Inventory",
    description: "Add new inventory catalog items, configure baseline stock safety margins, and delete obsolete materials.",
    dangerLevel: "high",
  },

  // Workforce & Attendance
  {
    key: "view_labor",
    label: "View Labor",
    category: "Workforce & Attendance",
    description: "Browse worker roster lists, skill trades (masons, electricians, barbenders), and daily wage rates.",
    dangerLevel: "low",
  },
  {
    key: "manage_labor",
    label: "Manage Labor",
    category: "Workforce & Attendance",
    description: "Assign workers to specific contractor packages, update trade classifications, and track productivity scores.",
    dangerLevel: "medium",
  },
  {
    key: "create_edit_delete_labor",
    label: "Create / Edit / Delete Labor",
    category: "Workforce & Attendance",
    description: "Onboard new laborers into the muster roll, modify base daily wage contracts, or remove worker profiles.",
    dangerLevel: "high",
  },
  {
    key: "manage_attendance",
    label: "Manage Attendance",
    category: "Workforce & Attendance",
    description: "Mark daily site check-in/out timestamps, log half-day or overtime hours, and compute wage payouts.",
    dangerLevel: "medium",
  },

  // Site Progress & Media
  {
    key: "manage_progress",
    label: "Manage Progress",
    category: "Site Progress & Media",
    description: "Submit daily site progress diaries, update milestone completion percentages, and create field tasks.",
    dangerLevel: "medium",
  },
  {
    key: "upload_site_photos",
    label: "Upload Site Photos",
    category: "Site Progress & Media",
    description: "Capture and attach geo-tagged structural inspection photos, formwork verifications, and safety snapshots.",
    dangerLevel: "low",
  },
  {
    key: "manage_quality_inspections",
    label: "Manage Quality Inspections",
    category: "Quality Inspections",
    description: "Perform on-site quality audits, GPS geofence verification, live camera capture, and defect resolution sign-offs.",
    dangerLevel: "medium",
  },

  // Equipment & Machinery
  {
    key: "view_equipment",
    label: "View Equipment",
    category: "Equipment & Machinery",
    description: "View the master list of machinery, assigned sites, fuel logs, and equipment profiles.",
    dangerLevel: "low",
  },
  {
    key: "manage_equipment",
    label: "Manage Equipment Operations",
    category: "Equipment & Machinery",
    description: "Log daily usage hours, update fuel consumption records, assign equipment to sites, and log inspections.",
    dangerLevel: "medium",
  },
  {
    key: "create_edit_delete_equipment",
    label: "Create / Edit / Delete Equipment",
    category: "Equipment & Machinery",
    description: "Register new heavy machinery, edit asset specifications, update financial/rental details, and remove assets.",
    dangerLevel: "high",
  },

  // Reports & Documentation
  {
    key: "generate_view_download_reports",
    label: "Generate / View / Download Reports",
    category: "Reports & Documentation",
    description: "Compile and download formal executive PDF audit dossiers, financial summaries, and site progress certificates.",
    dangerLevel: "low",
  },

  // AI & 3D Visualizer
  {
    key: "use_ai_assistant",
    label: "Use AI Assistant",
    category: "AI & 3D Visualizer",
    description: "Interact with Gemini construction intelligence for BOQ estimation, real-time context analysis, and engineering queries.",
    dangerLevel: "low",
  },
  {
    key: "use_building_visualizer",
    label: "Use 2D/3D Building Visualizer",
    category: "AI & 3D Visualizer",
    description: "Explore interactive Three.js 3D structural building models, floor layouts, and architectural elevation specs.",
    dangerLevel: "low",
  },

  // 24/7 Support & Transactions
  {
    key: "view_support",
    label: "Access 24/7 AI Support & Help Center",
    category: "24/7 Support & Transactions",
    description: "Access the 24/7 conversational AI support bot, raise support queries, view ticket threads, and initiate WhatsApp support.",
    dangerLevel: "low",
  },
  {
    key: "manage_support",
    label: "Manage Support Tickets & Escalations",
    category: "24/7 Support & Transactions",
    description: "Respond to customer/site queries, review AI escalation summaries, reassign tickets, and update ticket resolution statuses.",
    dangerLevel: "medium",
  },
  {
    key: "view_transactions",
    label: "View Transaction History & Invoices",
    category: "24/7 Support & Transactions",
    description: "Inspect commercial purchases, sales, invoices, payment statuses, and detailed vendor transaction records.",
    dangerLevel: "low",
  },
  {
    key: "manage_transactions",
    label: "Manage Transactions & Payments",
    category: "24/7 Support & Transactions",
    description: "Record purchases, update payment statuses, link purchase orders, and adjust transaction ledgers.",
    dangerLevel: "high",
  },
  {
    key: "manage_returns",
    label: "Manage Material Returns & Refunds",
    category: "24/7 Support & Transactions",
    description: "Submit return requests, inspect damaged materials, approve/reject return claims, and disburse refund records.",
    dangerLevel: "high",
  },

  // Security & Administration
  {
    key: "manage_users",
    label: "Manage Users",
    category: "Security & Administration",
    description: "Create new user accounts, toggle active/disabled statuses, and update contact profiles.",
    dangerLevel: "high",
  },
  {
    key: "manage_roles_permissions",
    label: "Manage Roles & Permissions",
    category: "Security & Administration",
    description: "Fully customize, grant, or revoke individual granular permissions for any user in the system.",
    dangerLevel: "high",
  },
  {
    key: "manage_settings",
    label: "Manage Settings",
    category: "Security & Administration",
    description: "Configure system-wide parameters, currency defaults, audit log retention, and cloud integration keys.",
    dangerLevel: "high",
  },
];

export interface RolePreset {
  role: string;
  title: string;
  description: string;
  color: string;
  defaultPermissions: PermissionKey[];
  isCustom?: boolean;
}

export const DEFAULT_ROLE_PRESETS: RolePreset[] = [
  {
    role: "admin",
    title: "Super Admin",
    description: "Unrestricted master authority across all financial, project, workforce, AI, and IAM security controls.",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    defaultPermissions: ALL_PERMISSIONS.map((p) => p.key),
  },
  {
    role: "project_manager",
    title: "Project Manager",
    description: "Oversees site operations, expense budgets, project schedules, AI estimators, and PDF reporting.",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    defaultPermissions: [
      "view_dashboard",
      "view_analytics",
      "view_projects",
      "manage_projects",
      "create_edit_delete_projects",
      "view_expenses",
      "manage_expenses",
      "create_edit_delete_expenses",
      "view_materials",
      "manage_materials",
      "view_equipment",
      "manage_equipment",
      "create_edit_delete_equipment",
      "view_labor",
      "manage_labor",
      "manage_attendance",
      "manage_progress",
      "upload_site_photos",
      "generate_view_download_reports",
      "use_ai_assistant",
      "use_building_visualizer",
      "view_support",
      "manage_support",
      "view_transactions",
      "manage_transactions",
      "manage_returns",
    ],
  },
  {
    role: "site_engineer",
    title: "Site Engineer",
    description: "Manages technical execution, material stock adjustments, daily progress diaries, and photo logs.",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    defaultPermissions: [
      "view_dashboard",
      "view_projects",
      "view_expenses",
      "view_materials",
      "manage_materials",
      "create_edit_delete_materials",
      "view_equipment",
      "manage_equipment",
      "view_labor",
      "manage_attendance",
      "manage_progress",
      "upload_site_photos",
      "generate_view_download_reports",
      "use_ai_assistant",
      "use_building_visualizer",
      "view_support",
      "view_transactions",
      "manage_returns",
    ],
  },
  {
    role: "safety_officer",
    title: "Safety Officer",
    description: "Manages safety inspections, hazard observations, PPE compliance, and toolbox safety logs.",
    color: "bg-rose-100 text-rose-800 border-rose-200",
    defaultPermissions: [
      "view_dashboard",
      "view_projects",
      "upload_site_photos",
      "generate_view_download_reports",
      "view_support",
    ],
  },
  {
    role: "qa_qc_engineer",
    title: "QA/QC Engineer",
    description: "Performs on-site quality audits, geofence verification, defect resolution, and inspection sign-offs.",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    defaultPermissions: [
      "view_dashboard",
      "view_projects",
      "manage_quality_inspections",
      "upload_site_photos",
      "generate_view_download_reports",
      "use_building_visualizer",
      "view_support",
      "manage_returns",
    ],
  },
  {
    role: "finance_manager",
    title: "Finance Manager",
    description: "Manages budget allocations, expense ledgers, contractor billing approvals, and financial reports.",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    defaultPermissions: [
      "view_dashboard",
      "view_analytics",
      "view_projects",
      "view_expenses",
      "manage_expenses",
      "create_edit_delete_expenses",
      "generate_view_download_reports",
      "view_support",
      "manage_support",
      "view_transactions",
      "manage_transactions",
      "manage_returns",
    ],
  },
  {
    role: "store_manager",
    title: "Store Manager",
    description: "Manages material inventory, inward/outward stock entries, warehouse supply lots, and material requests.",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    defaultPermissions: [
      "view_dashboard",
      "view_projects",
      "view_materials",
      "manage_materials",
      "create_edit_delete_materials",
      "generate_view_download_reports",
      "view_support",
      "view_transactions",
      "manage_transactions",
      "manage_returns",
    ],
  },
  {
    role: "equipment_manager",
    title: "Equipment Manager",
    description: "Manages machinery assignment, equipment maintenance schedules, fuel consumption, and breakdown logs.",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    defaultPermissions: [
      "view_dashboard",
      "view_projects",
      "view_equipment",
      "manage_equipment",
      "create_edit_delete_equipment",
      "generate_view_download_reports",
      "view_support",
    ],
  },
  {
    role: "supervisor",
    title: "Field Supervisor",
    description: "Conducts morning roll call, logs material inward entries, updates task statuses, and snaps site photos.",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    defaultPermissions: [
      "view_dashboard",
      "view_projects",
      "view_materials",
      "manage_materials",
      "view_equipment",
      "manage_equipment",
      "view_labor",
      "manage_attendance",
      "manage_progress",
      "upload_site_photos",
      "view_support",
    ],
  },
  {
    role: "contractor",
    title: "Trade Contractor",
    description: "Tracks assigned labor workforce, views material availability, and submits completed milestone progress.",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    defaultPermissions: [
      "view_dashboard",
      "view_projects",
      "view_materials",
      "view_equipment",
      "view_labor",
      "manage_attendance",
      "manage_progress",
      "upload_site_photos",
      "view_support",
      "manage_support",
      "view_transactions",
      "manage_returns",
    ],
  },
  {
    role: "client",
    title: "Client / Investor",
    description: "High-level transparency: Inspect live milestone completion %, expense summaries, reports, and 3D models.",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    defaultPermissions: [
      "view_dashboard",
      "view_analytics",
      "view_projects",
      "view_expenses",
      "view_materials",
      "view_equipment",
      "generate_view_download_reports",
      "use_building_visualizer",
      "view_support",
      "view_transactions",
    ],
  },
  {
    role: "worker",
    title: "Field Worker",
    description: "Check personal check-in records, daily wage computations, and assigned task checklists.",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    defaultPermissions: ["view_dashboard", "view_labor", "view_equipment", "manage_progress", "view_support"],
  },
];

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  color: string;
  defaultPermissions: PermissionKey[];
  createdAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorId: string;
  action: string;
  targetUserName: string;
  targetUserId: string;
  details: string;
  type: "permission_change" | "user_status" | "user_create" | "user_delete" | "role_create";
}
