import { User, Project, ProjectStatus,
  Expense,
  Material,
  Worker,
  AttendanceRecord,
  AttendanceAuditEntry,
  ProjectSite,
  ProgressLog,
  Task,
  Supplier,
  SystemNotification,
  UserRole,
  PermissionKey,
  CustomRole,
  AuditLog,
  VehicleGateMovement,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PRESETS,
} from "../types";

// Helper to get preset permissions for a role
const getPresetPerms = (role: string): PermissionKey[] => {
  const p = DEFAULT_ROLE_PRESETS.find((preset) => preset.role === role);
  return p ? [...p.defaultPermissions] : ["view_dashboard"];
};

// Seed Users with manually assigned permission arrays and active status
export const INITIAL_USERS: User[] = [
  {
    id: "usr-admin-1",
    name: "Vikram Singhania",
    email: "vikram@infrasync.io",
    phone: "+91 98201 54321",
    role: "admin",
    status: "active",
    permissions: ALL_PERMISSIONS.map((p) => p.key),
    createdAt: "2026-01-10",
    notes: "System Administrator & Principal Architect",
  },
  {
    id: "usr-pm-1",
    name: "Rajesh Sharma",
    email: "rajesh.pm@infrasync.io",
    phone: "+91 98450 12345",
    role: "project_manager",
    status: "active",
    permissions: getPresetPerms("project_manager"),
    createdAt: "2026-01-15",
    assignedBy: "Vikram Singhania",
    notes: "Lead Project Manager for Bangalore Urban cluster",
  },
  {
    id: "usr-eng-1",
    name: "Ananya Desai",
    email: "ananya.eng@infrasync.io",
    phone: "+91 97110 87654",
    role: "site_engineer",
    status: "active",
    permissions: getPresetPerms("site_engineer"),
    createdAt: "2026-02-01",
    assignedBy: "Vikram Singhania",
    notes: "Site Engineer & QA/QC Structural Inspector",
  },
  {
    id: "usr-sup-1",
    name: "Mohan Lal",
    email: "mohan.sup@infrasync.io",
    phone: "+91 94123 45678",
    role: "supervisor",
    status: "active",
    permissions: getPresetPerms("supervisor"),
    createdAt: "2026-02-10",
    assignedBy: "Rajesh Sharma",
    notes: "Field Supervisor for Villa Foundations",
  },
  {
    id: "usr-cont-1",
    name: "Gurpreet Singh (Apex Contractors)",
    email: "gurpreet@apexconstructions.in",
    phone: "+91 98888 99999",
    role: "contractor",
    status: "active",
    permissions: getPresetPerms("contractor"),
    createdAt: "2026-02-15",
    assignedBy: "Vikram Singhania",
    notes: "RCC Superstructure & Formwork Contractor",
  },
  {
    id: "usr-client-1",
    name: "Dr. Arvind Rao",
    email: "arvind.rao@medicare.org",
    phone: "+91 98190 23456",
    role: "client",
    status: "active",
    permissions: getPresetPerms("client"),
    createdAt: "2026-02-20",
    assignedBy: "Vikram Singhania",
    notes: "Property Owner & Investor",
  },
  {
    id: "usr-worker-1",
    name: "Ramesh Yadav",
    email: "ramesh.site@infrasync.io",
    phone: "+91 93210 11223",
    role: "worker",
    status: "active",
    permissions: getPresetPerms("worker"),
    createdAt: "2026-03-01",
    assignedBy: "Mohan Lal",
    notes: "Master Mason / Team Lead",
  },
];

const generateMockProjects = (): Project[] => {
  const generated: Project[] = [];
  const cities = ["Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Ahmedabad", "Kolkata", "Surat", "Nashik", "Kolhapur", "Nagpur"];
  const statuses: ProjectStatus[] = ["in_progress", "completed", "delayed", "planning", "on_hold"];
  
  for (let i = 3; i <= 42; i++) {
    const city = cities[i % cities.length];
    const status = statuses[i % statuses.length];
    const progress = status === "completed" ? 100 : (status === "planning" ? 0 : Math.floor(Math.random() * 95) + 5);
    const budget = 15000000 + Math.floor(Math.random() * 50000000);
    
    generated.push({
      id: `proj-${100 + i}`,
      name: `${city} ${i % 2 === 0 ? "Commercial Complex" : "Residential Tower"} ${i}`,
      description: `Large scale construction project in ${city}.`,
      location: `Sector ${i}, ${city}`,
      clientId: "usr-client-1",
      clientName: "Enterprise Client Corp",
      managerId: "usr-pm-1",
      managerName: "Rajesh Sharma",
      budget: budget,
      spentAmount: progress > 0 ? (progress / 100) * budget * (0.8 + Math.random() * 0.4) : 0,
      startDate: "2025-10-01",
      endDate: "2027-10-01",
      status: status,
      progressPercentage: progress,
      plotAreaSqFt: 5000 + (i * 1000),
      floors: 5 + (i % 15),
      isFavorite: i % 7 === 0,
      milestones: [],
      createdAt: "2025-09-15"
    });
  }
  return generated;
};

// Seed Projects
export const INITIAL_PROJECTS: Project[] = [
  ...generateMockProjects(),
  {
    id: "proj-101",
    name: "Skyline Horizon Luxury Villa (G+2)",
    description:
      "Premium 3-storey residential villa with cantilevered balconies, swimming pool deck, and smart solar roof integration.",
    location: "Plot 42, Palm Meadows Enclave, Whitefield, Bengaluru",
    clientId: "usr-client-1",
    clientName: "Dr. Arvind Rao",
    managerId: "usr-pm-1",
    managerName: "Rajesh Sharma",
    budget: 4850000,
    spentAmount: 2180000,
    startDate: "2026-03-01",
    endDate: "2026-10-30",
    status: "in_progress",
    progressPercentage: 45,
    plotAreaSqFt: 2400,
    floors: 3,
    siteLatitude: 12.971598,
    siteLongitude: 77.594566,
    attendanceRadiusMeters: 100,
    sites: [
      {
        id: "site-101-a",
        projectId: "proj-101",
        name: "Main Villa RCC & Structure",
        latitude: 12.971598,
        longitude: 77.594566,
        attendanceRadiusMeters: 100,
      },
      {
        id: "site-101-b",
        projectId: "proj-101",
        name: "Courtyard, Pool Deck & Landscaping",
        latitude: 12.97172,
        longitude: 77.59481,
        attendanceRadiusMeters: 80,
      },
      {
        id: "site-101-c",
        projectId: "proj-101",
        name: "Ancillary Block & Boundary Wall",
        latitude: 12.97145,
        longitude: 77.5943,
        attendanceRadiusMeters: 120,
      },
    ],
    milestones: [
      {
        id: "m-1",
        title: "Soil Excavation & Raft Foundation",
        targetDate: "2026-03-25",
        completedDate: "2026-03-22",
        status: "completed",
        budgetSharePercentage: 18,
      },
      {
        id: "m-2",
        title: "Ground Floor RCC Columns & Slab",
        targetDate: "2026-04-20",
        completedDate: "2026-04-18",
        status: "completed",
        budgetSharePercentage: 22,
      },
      {
        id: "m-3",
        title: "First & Second Floor RCC Superstructure",
        targetDate: "2026-06-15",
        status: "in_progress",
        budgetSharePercentage: 25,
      },
      {
        id: "m-4",
        title: "Masonry, AAC Brickwork & Plastering",
        targetDate: "2026-07-30",
        status: "pending",
        budgetSharePercentage: 15,
      },
      {
        id: "m-5",
        title: "MEP, Electrical, Flooring & Fixtures",
        targetDate: "2026-09-20",
        status: "pending",
        budgetSharePercentage: 12,
      },
      {
        id: "m-6",
        title: "Painting, Landscaping & Handover",
        targetDate: "2026-10-30",
        status: "pending",
        budgetSharePercentage: 8,
      },
    ],
    createdAt: "2026-02-25",
  },
  {
    id: "proj-102",
    name: "Emerald Heights Commercial Complex",
    description:
      "4-storey retail and co-working hub with basement parking and glass curtain facade.",
    location: "Sector 62, Golf Course Ext Road, Gurugram",
    clientId: "usr-client-1",
    clientName: "Dr. Arvind Rao",
    managerId: "usr-pm-1",
    managerName: "Rajesh Sharma",
    budget: 12500000,
    spentAmount: 4200000,
    startDate: "2026-01-15",
    endDate: "2026-12-15",
    status: "in_progress",
    progressPercentage: 32,
    plotAreaSqFt: 5500,
    floors: 4,
    milestones: [
      {
        id: "m-201",
        title: "Deep Piling & Basement Retaining Wall",
        targetDate: "2026-03-10",
        completedDate: "2026-03-08",
        status: "completed",
        budgetSharePercentage: 25,
      },
      {
        id: "m-202",
        title: "Podium & Ground Slab Casting",
        targetDate: "2026-05-15",
        status: "in_progress",
        budgetSharePercentage: 30,
      },
      {
        id: "m-203",
        title: "Structural Steel Truss & Floors 1-3",
        targetDate: "2026-08-30",
        status: "pending",
        budgetSharePercentage: 25,
      },
      {
        id: "m-204",
        title: "Glass Glazing, HVAC & Elevators",
        targetDate: "2026-12-15",
        status: "pending",
        budgetSharePercentage: 20,
      },
    ],
    createdAt: "2026-01-05",
  },
];

// Seed Materials
export const INITIAL_MATERIALS: Material[] = [
  {
    id: "mat-1",
    projectId: "proj-101",
    name: "UltraTech 53 Grade OPC Cement",
    category: "Structural Material",
    quantity: 34,
    unit: "bags",
    minimumStock: 50,
    purchasePrice: 390,
    supplierId: "sup-1",
    supplierName: "UltraTech Direct Depot",
    lastUpdated: "2026-08-30",
  },
  {
    id: "mat-2",
    projectId: "proj-101",
    name: "Tata Tiscon 550D TMT Rebar (12mm)",
    category: "Steel Reinforcement",
    quantity: 1.4,
    unit: "tons",
    minimumStock: 2.5,
    purchasePrice: 64500,
    supplierId: "sup-2",
    supplierName: "Tata Steel Regional Distributor",
    lastUpdated: "2026-08-29",
  },
  {
    id: "mat-3",
    projectId: "proj-101",
    name: "Tata Tiscon 550D TMT Rebar (16mm)",
    category: "Steel Reinforcement",
    quantity: 3.2,
    unit: "tons",
    minimumStock: 2.0,
    purchasePrice: 65200,
    supplierId: "sup-2",
    supplierName: "Tata Steel Regional Distributor",
    lastUpdated: "2026-08-28",
  },
  {
    id: "mat-4",
    projectId: "proj-101",
    name: "Manufactured Sand (M-Sand - Zone II)",
    category: "Aggregates",
    quantity: 680,
    unit: "cu.ft",
    minimumStock: 250,
    purchasePrice: 62,
    supplierId: "sup-3",
    supplierName: "Apex Aggregate Quarries",
    lastUpdated: "2026-08-31",
  },
  {
    id: "mat-5",
    projectId: "proj-101",
    name: "20mm Crushed Blue Granite Aggregate",
    category: "Aggregates",
    quantity: 520,
    unit: "cu.ft",
    minimumStock: 200,
    purchasePrice: 54,
    supplierId: "sup-3",
    supplierName: "Apex Aggregate Quarries",
    lastUpdated: "2026-08-31",
  },
  {
    id: "mat-6",
    projectId: "proj-101",
    name: "Birla Aerocon AAC Lightweight Blocks (8\")",
    category: "Masonry",
    quantity: 1200,
    unit: "units",
    minimumStock: 400,
    purchasePrice: 58,
    supplierId: "sup-4",
    supplierName: "Prime Brick & Block Co.",
    lastUpdated: "2026-08-25",
  },
  {
    id: "mat-7",
    projectId: "proj-101",
    name: "Astral CPVC Pro Water Pipes (1-inch)",
    category: "Plumbing",
    quantity: 18,
    unit: "bundles",
    minimumStock: 10,
    purchasePrice: 1450,
    supplierId: "sup-5",
    supplierName: "Metro Plumbing Hub",
    lastUpdated: "2026-08-20",
  },
  {
    id: "mat-8",
    projectId: "proj-101",
    name: "Polycab FRLS Copper Wire (2.5 sq.mm)",
    category: "Electrical",
    quantity: 8,
    unit: "bundles",
    minimumStock: 12,
    purchasePrice: 2200,
    supplierId: "sup-5",
    supplierName: "Metro Plumbing Hub",
    lastUpdated: "2026-08-22",
  },
];

// Seed Expenses
export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    projectId: "proj-101",
    category: "Materials",
    description: "Procured 200 bags of UltraTech 53G Cement for Ground Floor columns",
    amount: 78000,
    date: "2026-08-12",
    addedBy: "Ananya Desai (Site Engineer)",
    paymentMethod: "Bank Transfer (NEFT)",
    invoiceNumber: "UT-BGL-8821",
    vendorName: "UltraTech Direct Depot",
  },
  {
    id: "exp-2",
    projectId: "proj-101",
    category: "Materials",
    description: "4.5 Tons Tata Tiscon Fe550D TMT Rebars delivered for Slab 2",
    amount: 292500,
    date: "2026-08-16",
    addedBy: "Rajesh Sharma (PM)",
    paymentMethod: "Bank Transfer (NEFT)",
    invoiceNumber: "TS-89412",
    vendorName: "Tata Steel Regional Distributor",
  },
  {
    id: "exp-3",
    projectId: "proj-101",
    category: "Labor",
    description: "Weekly wage disbursement for 18 masons and helpers (Aug 10 - Aug 16)",
    amount: 88400,
    date: "2026-08-17",
    addedBy: "Mohan Lal (Supervisor)",
    paymentMethod: "UPI / Digital",
    vendorName: "Apex Contractors Workforce",
  },
  {
    id: "exp-4",
    projectId: "proj-101",
    category: "Equipment",
    description: "10-day rental for Hydraulic Concrete Mixer and Boom Pump",
    amount: 45000,
    date: "2026-08-20",
    addedBy: "Ananya Desai (Site Engineer)",
    paymentMethod: "Bank Transfer (NEFT)",
    invoiceNumber: "EQ-RENT-902",
    vendorName: "QuickBuild Machinery Rentals",
  },
  {
    id: "exp-5",
    projectId: "proj-101",
    category: "Labor",
    description: "Weekly wage disbursement (Aug 17 - Aug 23)",
    amount: 92600,
    date: "2026-08-24",
    addedBy: "Mohan Lal (Supervisor)",
    paymentMethod: "UPI / Digital",
    vendorName: "Apex Contractors Workforce",
  },
  {
    id: "exp-6",
    projectId: "proj-101",
    category: "Electricity",
    description: "Commercial temporary site electricity meter recharge and generator diesel",
    amount: 18500,
    date: "2026-08-26",
    addedBy: "Ananya Desai (Site Engineer)",
    paymentMethod: "UPI / Digital",
    vendorName: "BESCOM & Shell Fuel Station",
  },
  {
    id: "exp-7",
    projectId: "proj-101",
    category: "Transportation",
    description: "Heavy tipper truck freight charges for M-Sand and Blue Metal aggregates",
    amount: 24000,
    date: "2026-08-28",
    addedBy: "Mohan Lal (Supervisor)",
    paymentMethod: "Cash",
    vendorName: "Sri Balaji Transport Fleet",
  },
  {
    id: "exp-8",
    projectId: "proj-101",
    category: "Permits & Architectural",
    description: "Structural engineer site inspection sign-off and BBMP inspection fee",
    amount: 35000,
    date: "2026-08-29",
    addedBy: "Rajesh Sharma (PM)",
    paymentMethod: "Bank Transfer (NEFT)",
    invoiceNumber: "SE-INSP-2026",
    vendorName: "ArchVisions Engineering Consultancy",
  },
];

// Seed Workers
export const INITIAL_WORKERS: Worker[] = [
  {
    id: "w-1",
    employeeId: "LAB-101",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    name: "Ramesh Yadav",
    role: "Mason",
    phone: "+91 98111 22334",
    emergencyContactName: "Sunita Yadav (Wife)",
    emergencyContactPhone: "+91 98111 99881",
    bloodGroup: "O+",
    address: "Kalyan Nagar Labor Colony, Bengaluru",
    dailyWage: 950,
    overtimeHourlyRate: 150,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-05",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-FPR-001",
    productivityScore: 92,
  },
  {
    id: "w-2",
    employeeId: "LAB-102",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    name: "Dharmendra Kumar",
    role: "Mason",
    phone: "+91 98222 33445",
    emergencyContactName: "Manoj Kumar (Brother)",
    emergencyContactPhone: "+91 98222 88772",
    bloodGroup: "B+",
    address: "Whitefield Station Road, Bengaluru",
    dailyWage: 950,
    overtimeHourlyRate: 150,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-05",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-FPR-002",
    productivityScore: 88,
  },
  {
    id: "w-3",
    employeeId: "LAB-103",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    name: "Sanjay Mondal",
    role: "Steel Fixer / Barbender",
    phone: "+91 98333 44556",
    emergencyContactName: "Aloka Mondal (Wife)",
    emergencyContactPhone: "+91 98333 77663",
    bloodGroup: "A+",
    address: "Marathahalli Camp, Bengaluru",
    dailyWage: 900,
    overtimeHourlyRate: 140,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-08",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-CAM-001",
    productivityScore: 95,
  },
  {
    id: "w-4",
    employeeId: "LAB-104",
    projectId: "proj-101",
    siteId: "site-101-b",
    siteName: "Courtyard, Pool Deck & Landscaping",
    name: "Babulal Suthar",
    role: "Carpenter / Shuttering",
    phone: "+91 98444 55667",
    emergencyContactName: "Devi Suthar (Wife)",
    emergencyContactPhone: "+91 98444 66554",
    bloodGroup: "AB+",
    address: "KR Puram Sector 4, Bengaluru",
    dailyWage: 920,
    overtimeHourlyRate: 145,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-10",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-FPR-003",
    productivityScore: 90,
  },
  {
    id: "w-5",
    employeeId: "LAB-105",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    name: "Imran Khan",
    role: "Electrician",
    phone: "+91 98555 66778",
    emergencyContactName: "Farida Khan (Mother)",
    emergencyContactPhone: "+91 98555 55443",
    bloodGroup: "O-",
    address: "Shivajinagar, Bengaluru",
    dailyWage: 850,
    overtimeHourlyRate: 135,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-15",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-CAM-002",
    productivityScore: 86,
  },
  {
    id: "w-6",
    employeeId: "LAB-106",
    projectId: "proj-101",
    siteId: "site-101-c",
    siteName: "Ancillary Block & Boundary Wall",
    name: "Sunil Kumar",
    role: "Plumber",
    phone: "+91 98666 77889",
    emergencyContactName: "Geeta Devi (Wife)",
    emergencyContactPhone: "+91 98666 44332",
    bloodGroup: "B-",
    address: "Hoodi Circle, Bengaluru",
    dailyWage: 850,
    overtimeHourlyRate: 135,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-15",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-FPR-004",
    productivityScore: 89,
  },
  {
    id: "w-7",
    employeeId: "LAB-107",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    name: "Pappu Mahto",
    role: "General Helper / Laborer",
    phone: "+91 98777 88990",
    emergencyContactName: "Kishun Mahto (Father)",
    emergencyContactPhone: "+91 98777 33221",
    bloodGroup: "O+",
    address: "Kadugodi Transit Camp, Bengaluru",
    dailyWage: 600,
    overtimeHourlyRate: 95,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-05",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-FPR-005",
    productivityScore: 84,
  },
  {
    id: "w-8",
    employeeId: "LAB-108",
    projectId: "proj-101",
    siteId: "site-101-b",
    siteName: "Courtyard, Pool Deck & Landscaping",
    name: "Chhotu Lal",
    role: "General Helper / Laborer",
    phone: "+91 98888 99001",
    emergencyContactName: "Lalita Bai (Wife)",
    emergencyContactPhone: "+91 98888 22110",
    bloodGroup: "A-",
    address: "Kadugodi Transit Camp, Bengaluru",
    dailyWage: 600,
    overtimeHourlyRate: 95,
    contractorId: "usr-cont-1",
    contractorName: "Apex Contractors",
    joiningDate: "2026-03-05",
    status: "active",
    biometricRegistered: true,
    biometricDeviceId: "BIO-FPR-006",
    productivityScore: 82,
  },
];

// Seed Attendance for Today
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-1",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    workerId: "w-1",
    workerName: "Ramesh Yadav",
    workerRole: "Mason",
    date: "2026-08-31",
    status: "present",
    checkIn: "08:15 AM",
    checkOut: "05:30 PM",
    checkInTimestamp: "2026-08-31T08:15:00.000Z",
    checkOutTimestamp: "2026-08-31T17:30:00.000Z",
    workingHours: 9.25,
    method: "GPS",
    latitude: 12.97161,
    longitude: 77.59458,
    distanceFromSiteMeters: 14,
    dailyWage: 950,
    calculatedWage: 950,
  },
  {
    id: "att-2",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    workerId: "w-2",
    workerName: "Dharmendra Kumar",
    workerRole: "Mason",
    date: "2026-08-31",
    status: "present",
    checkIn: "08:20 AM",
    checkOut: "05:30 PM",
    checkInTimestamp: "2026-08-31T08:20:00.000Z",
    checkOutTimestamp: "2026-08-31T17:30:00.000Z",
    workingHours: 9.17,
    method: "Biometric",
    biometricType: "Fingerprint",
    dailyWage: 950,
    calculatedWage: 950,
  },
  {
    id: "att-3",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    workerId: "w-3",
    workerName: "Sanjay Mondal",
    workerRole: "Steel Fixer / Barbender",
    date: "2026-08-31",
    status: "overtime",
    checkIn: "08:00 AM",
    checkOut: "07:30 PM",
    checkInTimestamp: "2026-08-31T08:00:00.000Z",
    checkOutTimestamp: "2026-08-31T19:30:00.000Z",
    workingHours: 11.5,
    overtimeHours: 2.5,
    method: "Biometric",
    biometricType: "Face Recognition",
    dailyWage: 900,
    calculatedWage: 1250,
  },
  {
    id: "att-4",
    projectId: "proj-101",
    siteId: "site-101-b",
    siteName: "Courtyard, Pool Deck & Landscaping",
    workerId: "w-4",
    workerName: "Babulal Suthar",
    workerRole: "Carpenter / Shuttering",
    date: "2026-08-31",
    status: "present",
    checkIn: "08:10 AM",
    checkOut: "05:30 PM",
    checkInTimestamp: "2026-08-31T08:10:00.000Z",
    checkOutTimestamp: "2026-08-31T17:30:00.000Z",
    workingHours: 9.33,
    method: "GPS",
    latitude: 12.97175,
    longitude: 77.59483,
    distanceFromSiteMeters: 18,
    dailyWage: 920,
    calculatedWage: 920,
  },
  {
    id: "att-5",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    workerId: "w-5",
    workerName: "Imran Khan",
    workerRole: "Electrician",
    date: "2026-08-31",
    status: "half_day",
    checkIn: "08:30 AM",
    checkOut: "01:00 PM",
    checkInTimestamp: "2026-08-31T08:30:00.000Z",
    checkOutTimestamp: "2026-08-31T13:00:00.000Z",
    workingHours: 4.5,
    method: "Biometric",
    biometricType: "Face Recognition",
    dailyWage: 850,
    calculatedWage: 425,
  },
  {
    id: "att-6",
    projectId: "proj-101",
    siteId: "site-101-c",
    siteName: "Ancillary Block & Boundary Wall",
    workerId: "w-6",
    workerName: "Sunil Kumar",
    workerRole: "Plumber",
    date: "2026-08-31",
    status: "present",
    checkIn: "08:15 AM",
    checkOut: "05:30 PM",
    checkInTimestamp: "2026-08-31T08:15:00.000Z",
    checkOutTimestamp: "2026-08-31T17:30:00.000Z",
    workingHours: 9.25,
    method: "GPS",
    latitude: 12.97148,
    longitude: 77.59432,
    distanceFromSiteMeters: 22,
    dailyWage: 850,
    calculatedWage: 850,
  },
  {
    id: "att-7",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    workerId: "w-7",
    workerName: "Pappu Mahto",
    workerRole: "General Helper / Laborer",
    date: "2026-08-31",
    status: "present",
    checkIn: "08:00 AM",
    checkOut: "05:30 PM",
    checkInTimestamp: "2026-08-31T08:00:00.000Z",
    checkOutTimestamp: "2026-08-31T17:30:00.000Z",
    workingHours: 9.5,
    method: "Biometric",
    biometricType: "Fingerprint",
    dailyWage: 600,
    calculatedWage: 600,
  },
  {
    id: "att-8",
    projectId: "proj-101",
    siteId: "site-101-b",
    siteName: "Courtyard, Pool Deck & Landscaping",
    workerId: "w-8",
    workerName: "Chhotu Lal",
    workerRole: "General Helper / Laborer",
    date: "2026-08-31",
    status: "absent",
    dailyWage: 600,
    calculatedWage: 0,
    notes: "Leave reported due to family event",
  },
];

// Seed Tasks
export const INITIAL_TASKS: Task[] = [
  {
    id: "tsk-1",
    projectId: "proj-101",
    title: "Second Floor Slab Rebar Tying & Inspection",
    description: "Verify cover blocks (25mm) and top extra rebar layout as per structural drawing Rev-3.",
    assignedTo: "usr-eng-1",
    assignedToName: "Ananya Desai",
    priority: "critical",
    status: "in_progress",
    startDate: "2026-08-29",
    dueDate: "2026-09-02",
    completionPercentage: 70,
  },
  {
    id: "tsk-2",
    projectId: "proj-101",
    title: "Ground Floor Electrical Concealed Pipe Routing",
    description: "Install 25mm heavy duty PVC conduits in living room and kitchen walls before plastering.",
    assignedTo: "usr-sup-1",
    assignedToName: "Mohan Lal",
    priority: "high",
    status: "in_progress",
    startDate: "2026-08-28",
    dueDate: "2026-09-03",
    completionPercentage: 50,
  },
  {
    id: "tsk-3",
    projectId: "proj-101",
    title: "Order 150 Bags OPC-53 Cement Replenishment",
    description: "Issue purchase order to UltraTech to prevent casting stoppage on Friday.",
    assignedTo: "usr-pm-1",
    assignedToName: "Rajesh Sharma",
    priority: "critical",
    status: "todo",
    startDate: "2026-08-31",
    dueDate: "2026-08-31",
    completionPercentage: 10,
  },
  {
    id: "tsk-4",
    projectId: "proj-101",
    title: "Plumbing Pressure Test on Master Bath Waste Lines",
    description: "Perform 10 bar hydraulic pressure test on CPVC drainage stack.",
    assignedTo: "usr-eng-1",
    assignedToName: "Ananya Desai",
    priority: "medium",
    status: "review",
    startDate: "2026-08-27",
    dueDate: "2026-08-30",
    completionPercentage: 90,
  },
  {
    id: "tsk-5",
    projectId: "proj-101",
    title: "Foundation Waterproofing Bitumen Coat Quality Check",
    description: "Double coat hot bitumen application over retaining perimeter walls.",
    assignedTo: "usr-sup-1",
    assignedToName: "Mohan Lal",
    priority: "high",
    status: "completed",
    startDate: "2026-08-10",
    dueDate: "2026-08-14",
    completionPercentage: 100,
  },
];

// Seed Progress Logs
export const INITIAL_PROGRESS: ProgressLog[] = [
  {
    id: "prog-1",
    projectId: "proj-101",
    date: "2026-08-30",
    description:
      "Completed formwork shuttering for Second Floor cantilevered balcony. Commenced barbending for column beam junctions. Concrete cube test reports from Day 14 arrived with 28.4 MPa compressive strength (passed).",
    percentage: 45,
    completedTasks: [
      "Balcony formwork",
      "Column beam junction rebar tying",
      "Cube test verification",
    ],
    issues: [
      "Cement inventory reached 34 bags, low stock warning triggered",
      "Rainfall delayed late evening curing",
    ],
    weather: "28°C, Partly Cloudy, Light evening breeze",
    addedBy: "Ananya Desai (Site Engineer)",
    areaLocation: "Second Floor Slab & Cantilever Balcony",
    workStatus: "In Progress",
    remarks: "Balcony shuttering aligned with laser level. Awaiting 150 bags OPC cement for Friday pour.",
    photos: [
      {
        id: "p-1",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
        caption: "Second floor slab shuttering with heavy duty jack props",
        timestamp: "Aug 30, 2026 04:30:12 PM",
        areaLocation: "2nd Floor Slab",
        workStatus: "In Progress",
        isManualCapture: true,
        capturedAt: "2026-08-30T11:00:12.000Z",
        projectName: "Skyline Horizon Luxury Villa (G+2)",
      },
      {
        id: "p-2",
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        caption: "TMT Rebar beam cages pre-assembled at ground fabrication yard",
        timestamp: "Aug 30, 2026 11:15:45 AM",
        areaLocation: "Ground Yard Rebar Fabrication",
        workStatus: "In Progress",
        isManualCapture: true,
        capturedAt: "2026-08-30T05:45:45.000Z",
        projectName: "Skyline Horizon Luxury Villa (G+2)",
      },
    ],
  },
  {
    id: "prog-2",
    projectId: "proj-101",
    date: "2026-08-25",
    description:
      "Completed Ground floor brickwork partition masonry up to lintel beam level. Concreting of 8 lintel bands finished with 1:1.5:3 mix ratio.",
    percentage: 42,
    completedTasks: ["Lintel beam concreting", "South wall AAC block laying"],
    issues: ["Delayed delivery of 12mm rebar by 1 day"],
    weather: "31°C, Sunny and Clear",
    addedBy: "Ananya Desai (Site Engineer)",
    areaLocation: "Ground Floor Blockwork Partition",
    workStatus: "Completed Milestone",
    remarks: "8 lintel bands cured with jute bags for 7 days.",
    photos: [
      {
        id: "p-3",
        url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
        caption: "Ground floor AAC block wall masonry and lintel beam curing",
        timestamp: "Aug 25, 2026 03:00:22 PM",
        areaLocation: "Ground Floor South Wing",
        workStatus: "Completed Milestone",
        isManualCapture: true,
        capturedAt: "2026-08-25T09:30:22.000Z",
        projectName: "Skyline Horizon Luxury Villa (G+2)",
      },
    ],
  },
];

// Seed Suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name: "UltraTech Direct Depot",
    company: "UltraTech Cement Ltd",
    phone: "+91 80 2845 0001",
    email: "orders.bgl@ultratech.com",
    address: "Plot 12, KIADB Industrial Area, Hoodi, Bengaluru",
    rating: 4.8,
    materialsSupplied: ["OPC 53G Cement", "PPC Cement", "Ready Mix Concrete (RMC)"],
  },
  {
    id: "sup-2",
    name: "Tata Steel Regional Distributor",
    company: "Tata Tiscon Central Logistics",
    phone: "+91 80 4120 7788",
    email: "tiscon.sales@tatasteel.com",
    address: "Warehouse 4A, Peenya 2nd Stage, Bengaluru",
    rating: 4.9,
    materialsSupplied: ["Fe550D TMT Rebar (8mm-32mm)", "Binding Wire", "Structural Steel C-Channels"],
  },
  {
    id: "sup-3",
    name: "Apex Aggregate Quarries",
    company: "Apex Stone & Sand Infraworks",
    phone: "+91 98451 99000",
    email: "quarry@apexinfra.in",
    address: "Hoskote Quarry Cluster, Bengaluru Rural",
    rating: 4.6,
    materialsSupplied: ["M-Sand", "P-Sand", "20mm Coarse Aggregate", "40mm Stone Ballast"],
  },
  {
    id: "sup-4",
    name: "Prime Brick & Block Co.",
    company: "Prime AAC Block Manufacturers",
    phone: "+91 98110 54321",
    email: "dispatch@primeblocks.com",
    address: "Dabaspet Industrial Estate, NH-4",
    rating: 4.7,
    materialsSupplied: ["AAC Lightweight Blocks (4\", 6\", 8\")", "Block Jointing Mortar", "Wire-cut Clay Bricks"],
  },
  {
    id: "sup-5",
    name: "Metro Plumbing & Electrical Hub",
    company: "Metro MEP Supplies Corp",
    phone: "+91 80 2660 3412",
    email: "sales@metromep.com",
    address: "SP Road Wholesale Market, Bengaluru",
    rating: 4.5,
    materialsSupplied: ["CPVC Pipes & Fittings", "PVC Conduits", "FRLS Copper Cables", "Distribution Boards"],
  },
];

// Seed Notifications
export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif-1",
    title: "Low Material Alert: UltraTech Cement",
    message: "Stock has fallen to 34 bags (below threshold of 50 bags). Re-order immediately.",
    type: "warning",
    timestamp: "10 mins ago",
    read: false,
    linkTab: "materials",
  },
  {
    id: "notif-2",
    title: "Low Material Alert: 12mm TMT Rebar",
    message: "12mm Rebar stock is 1.4 Tons (minimum required: 2.5 Tons).",
    type: "alert",
    timestamp: "1 hour ago",
    read: false,
    linkTab: "materials",
  },
  {
    id: "notif-3",
    title: "Task Approaching Due Date",
    message: "Second Floor Slab Rebar Tying inspection is due on Sep 02.",
    type: "info",
    timestamp: "3 hours ago",
    read: false,
    linkTab: "progress",
  },
  {
    id: "notif-4",
    title: "Daily Attendance Submitted",
    message: "Supervisor Mohan Lal marked attendance for 8 site workers today.",
    type: "success",
    timestamp: "Today at 08:35 AM",
    read: true,
    linkTab: "labor",
  },
];

export const INITIAL_EQUIPMENT: any[] = [];
export const INITIAL_EQUIPMENT_USAGE: any[] = [];
export const INITIAL_FUEL_LOGS: any[] = [];
export const INITIAL_MAINTENANCE_RECORDS: any[] = [];
export const INITIAL_EQUIPMENT_INSPECTIONS: any[] = [];

// Seed Manual Vehicle Gate Entry/Exit Records
const todayStr = new Date().toISOString().split("T")[0];
export const INITIAL_VEHICLE_MOVEMENTS: VehicleGateMovement[] = [
  {
    id: "vgm-001",
    passNumber: "GP-2026-0812",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    movementType: "entry",
    vehicleNumber: "KA-04-AB-7721",
    vehicleType: "transit_mixer",
    vehicleModel: "Tata Prima 2830 RMC",
    photoUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80",
    gateNumber: "Gate 2 - Heavy Material & RMC Gate",
    entryTime: `${todayStr}T08:15:00.000Z`,
    expectedDurationHours: 2,
    driverName: "Ramchandra Gowda",
    driverPhone: "+91 98450 67123",
    driverLicenseNumber: "KA04 20180004921",
    helperCount: 1,
    helperNames: "Venkatesh (Discharge Assistant)",
    purpose: "concrete_pouring",
    purposeDetails: "Ready-mix concrete delivery for 2nd Floor Slab Pouring Grid B-4",
    materialDetails: {
      itemDescription: "Ready-Mix Concrete Grade M30 with Flyash 20%",
      challanNumber: "UTC-BLR-88412",
      poNumber: "PO-2026-CONC-042",
      supplierName: "UltraTech Concrete Direct",
      quantity: "7.5 m³",
      weightGrossKg: 28450,
      weightTareKg: 10400,
      weightNetKg: 18050,
    },
    status: "inside",
    entryRecordedBy: "Security Guard - Dilip Kumar",
    entryOperatorId: "usr-guard-1",
    notes: "Slump test verified by Site Engineer Ananya (110mm). Discharge chute checked.",
    createdAt: `${todayStr}T08:15:00.000Z`,
    updatedAt: `${todayStr}T08:15:00.000Z`,
  },
  {
    id: "vgm-002",
    passNumber: "GP-2026-0813",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    movementType: "entry",
    vehicleNumber: "KA-51-MD-9082",
    vehicleType: "dump_truck",
    vehicleModel: "Ashok Leyland 2820 Tipper",
    photoUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80",
    gateNumber: "Gate 2 - Heavy Material & RMC Gate",
    entryTime: `${todayStr}T09:05:00.000Z`,
    expectedDurationHours: 1.5,
    driverName: "Manjunath Swamy",
    driverPhone: "+91 97401 22890",
    driverLicenseNumber: "KA51 20200009182",
    helperCount: 1,
    helperNames: "Raju B",
    purpose: "material_delivery",
    purposeDetails: "20mm Coarse Aggregate delivery for batching & backfilling",
    materialDetails: {
      itemDescription: "20mm Graded Blue Metal Coarse Aggregate",
      challanNumber: "APX-AGG-5521",
      poNumber: "PO-2026-MAT-108",
      supplierName: "Apex Aggregate Quarries",
      quantity: "16 Metric Tons",
      weightGrossKg: 26200,
      weightTareKg: 10200,
      weightNetKg: 16000,
    },
    status: "inside",
    entryRecordedBy: "Security Guard - Dilip Kumar",
    entryOperatorId: "usr-guard-1",
    notes: "Unloading at Stockyard Bay 3. Tare weightslip checked at weighbridge.",
    createdAt: `${todayStr}T09:05:00.000Z`,
    updatedAt: `${todayStr}T09:05:00.000Z`,
  },
  {
    id: "vgm-003",
    passNumber: "GP-2026-0810",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    movementType: "entry",
    vehicleNumber: "MH-12-PQ-3344",
    vehicleType: "trailer_flatbed",
    vehicleModel: "BharatBenz 4028T Heavy Multi-Axle",
    photoUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80",
    gateNumber: "Gate 2 - Heavy Material & RMC Gate",
    entryTime: `${todayStr}T06:30:00.000Z`,
    expectedDurationHours: 3,
    driverName: "Sukhwinder Singh",
    driverPhone: "+91 98881 77234",
    driverLicenseNumber: "PB10 20150003819",
    helperCount: 2,
    helperNames: "Baljit Singh, Jarnail Singh",
    purpose: "material_delivery",
    purposeDetails: "16mm & 20mm Fe550D TMT Rebar Bundles for Tower Columns",
    materialDetails: {
      itemDescription: "Tata Tiscon Fe550D High Ductility TMT Steel Rebar",
      challanNumber: "TTS-LR-99210",
      poNumber: "PO-2026-STL-019",
      supplierName: "Tata Steel Regional Distributor",
      quantity: "24.5 Metric Tons",
      weightGrossKg: 38500,
      weightTareKg: 14000,
      weightNetKg: 24500,
    },
    status: "inside",
    entryRecordedBy: "Security Guard - Mahendra Singh",
    entryOperatorId: "usr-guard-2",
    notes: "Crane unloading initiated at 07:15 AM. Mill test certificates verified.",
    createdAt: `${todayStr}T06:30:00.000Z`,
    updatedAt: `${todayStr}T06:30:00.000Z`,
  },
  {
    id: "vgm-004",
    passNumber: "GP-2026-0814",
    projectId: "proj-101",
    siteId: "site-101-b",
    siteName: "Courtyard, Pool Deck & Landscaping",
    movementType: "entry",
    vehicleNumber: "KA-01-EQ-5512",
    vehicleType: "water_tanker",
    vehicleModel: "Eicher Pro 3015 Water Tanker",
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80",
    gateNumber: "Gate 1 - North Main Entry",
    entryTime: `${todayStr}T09:30:00.000Z`,
    expectedDurationHours: 1,
    driverName: "Santosh Naik",
    driverPhone: "+91 99002 44312",
    driverLicenseNumber: "KA01 20190001290",
    helperCount: 0,
    purpose: "material_delivery",
    purposeDetails: "6,000 Litres treated water for structural concrete curing",
    materialDetails: {
      itemDescription: "Clean Curing Water Supply",
      challanNumber: "H2O-9821",
      supplierName: "Apex Water Solutions",
      quantity: "6,000 Ltr",
    },
    status: "inside",
    entryRecordedBy: "Security Guard - Dilip Kumar",
    entryOperatorId: "usr-guard-1",
    notes: "Direct pumping to Ground Overhead Storage Tank.",
    createdAt: `${todayStr}T09:30:00.000Z`,
    updatedAt: `${todayStr}T09:30:00.000Z`,
  },
  {
    id: "vgm-005",
    passNumber: "GP-2026-0808",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    movementType: "entry",
    vehicleNumber: "KA-03-NV-1109",
    vehicleType: "pickup_commercial",
    vehicleModel: "Mahindra Bolero Maxi Truck Plus",
    photoUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
    gateNumber: "Gate 1 - North Main Entry",
    exitGateNumber: "Gate 1 - North Main Entry",
    entryTime: `${todayStr}T07:45:00.000Z`,
    exitTime: `${todayStr}T09:15:00.000Z`,
    expectedDurationHours: 1.5,
    driverName: "Vinod Chandran",
    driverPhone: "+91 98455 33211",
    driverLicenseNumber: "KA03 20170005510",
    helperCount: 1,
    helperNames: "Kiran R",
    purpose: "subcontractor_work",
    purposeDetails: "Electrical PVC conduit pipes, junction boxes, and wire pulling reels",
    materialDetails: {
      itemDescription: "25mm Heavy Duty PVC Conduits & Copper Wire Reels",
      challanNumber: "METRO-MEP-4401",
      supplierName: "Metro MEP Supplies Corp",
      quantity: "50 Bundles",
    },
    status: "exited",
    entryRecordedBy: "Security Guard - Mahendra Singh",
    entryOperatorId: "usr-guard-2",
    exitRecordedBy: "Security Guard - Dilip Kumar",
    exitOperatorId: "usr-guard-1",
    notes: "Conduits offloaded at Electrical Basement Store.",
    exitNotes: "Vehicle gate pass returned. Empty vehicle inspected before release.",
    createdAt: `${todayStr}T07:45:00.000Z`,
    updatedAt: `${todayStr}T09:15:00.000Z`,
  },
  {
    id: "vgm-006",
    passNumber: "GP-2026-0809",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    movementType: "entry",
    vehicleNumber: "KA-05-ST-4040",
    vehicleType: "staff_vehicle",
    vehicleModel: "Toyota Fortuner 4x4 (White)",
    gateNumber: "Gate 1 - North Main Entry",
    entryTime: `${todayStr}T08:00:00.000Z`,
    expectedDurationHours: 4,
    driverName: "Rajesh Sharma (Project Manager)",
    driverPhone: "+91 98450 12345",
    helperCount: 1,
    helperNames: "Ananya Desai (Site Engineer)",
    purpose: "site_inspection",
    purposeDetails: "Morning site walk, structural inspection of rebar cages, and contractor QA review",
    status: "inside",
    entryRecordedBy: "Security Guard - Mahendra Singh",
    notes: "Parked at Resident Engineers Bay 1.",
    createdAt: `${todayStr}T08:00:00.000Z`,
    updatedAt: `${todayStr}T08:00:00.000Z`,
  },
  {
    id: "vgm-007",
    passNumber: "GP-2026-0802",
    projectId: "proj-101",
    siteId: "site-101-a",
    siteName: "Main Villa RCC & Structure",
    movementType: "entry",
    vehicleNumber: "KA-02-JK-8820",
    vehicleType: "pickup_commercial",
    vehicleModel: "Force Traveller Subcontractor Van",
    gateNumber: "Gate 3 - South Contractor / Staff Gate",
    entryTime: `${todayStr}T05:30:00.000Z`,
    expectedDurationHours: 3,
    driverName: "Dinesh Patel",
    driverPhone: "+91 99801 66554",
    helperCount: 4,
    helperNames: "Plumbing crew (4 technicians)",
    purpose: "subcontractor_work",
    purposeDetails: "Plumbing pressure testing equipment & core drilling tools",
    status: "inside",
    entryRecordedBy: "Security Guard - Night Shift",
    notes: "Overstay warning: Crew still on site past expected 3hr window. Verify with site engineer.",
    createdAt: `${todayStr}T05:30:00.000Z`,
    updatedAt: `${todayStr}T05:30:00.000Z`,
  }
];

// Storage Helper Class with Full Multi-Tenant Workspace & Project Isolation
import { Workspace, WorkspaceMember, AccountUser } from "../types";
import { safeStorage } from "../lib/safeStorage";

class StorageService {
  private workspaceId: string = "demo_workspace";
  private isDemoMode: boolean = false;
  private activeUserId: string = "usr-admin-1";

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const activeSessionStr = safeStorage.getItem("infrasync_active_session");
      if (activeSessionStr) {
        const session = JSON.parse(activeSessionStr);
        if (session.workspaceId) {
          this.workspaceId = session.workspaceId;
          this.activeUserId = session.userId || this.activeUserId;
          this.isDemoMode = session.isDemoMode === true;
        }
      }
    } catch (e) {
      console.warn("Could not restore storage session", e);
    }
  }

  // Workspaces & Accounts Registry
  getAccounts(): AccountUser[] {
    try {
      const item = safeStorage.getItem("infrasync_accounts");
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  saveAccount(account: AccountUser): void {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.userId === account.userId || a.email.toLowerCase() === account.email.toLowerCase());
    if (idx >= 0) {
      accounts[idx] = account;
    } else {
      accounts.push(account);
    }
    safeStorage.setItem("infrasync_accounts", JSON.stringify(accounts));
  }

  getWorkspaces(userId?: string): Workspace[] {
    try {
      const item = safeStorage.getItem("infrasync_workspaces");
      const list: Workspace[] = item ? JSON.parse(item) : [];
      if (userId) {
        return list.filter((w) => w.ownerId === userId);
      }
      return list;
    } catch {
      return [];
    }
  }

  saveWorkspace(workspace: Workspace): void {
    const list = this.getWorkspaces();
    const idx = list.findIndex((w) => w.id === workspace.id);
    if (idx >= 0) {
      list[idx] = workspace;
    } else {
      list.push(workspace);
    }
    safeStorage.setItem("infrasync_workspaces", JSON.stringify(list));
  }

  createWorkspace(name: string, ownerId: string, companyName?: string): Workspace {
    const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newWs: Workspace = {
      id: wsId,
      name: name || `${companyName || "Organization"} Workspace`,
      ownerId,
      companyName: companyName || name,
      createdAt: new Date().toISOString().split("T")[0],
    };
    this.saveWorkspace(newWs);
    return newWs;
  }

  getCurrentWorkspace(): Workspace {
    if (this.isDemoMode) {
      return {
        id: "demo_workspace",
        name: "InfraSync Demo Workspace",
        ownerId: "usr-admin-1",
        companyName: "InfraSync Corp (Demo)",
        createdAt: "2026-01-01",
      };
    }
    const list = this.getWorkspaces();
    const current = list.find((w) => w.id === this.workspaceId);
    if (current) return current;

    return {
      id: this.workspaceId,
      name: "My Construction Workspace",
      ownerId: this.activeUserId,
      createdAt: new Date().toISOString().split("T")[0],
    };
  }

  getCurrentWorkspaceId(): string {
    return this.workspaceId;
  }

  getIsDemoMode(): boolean {
    return this.isDemoMode;
  }

  enterDemoMode(): void {
    this.workspaceId = "demo_workspace";
    this.isDemoMode = true;
    this.activeUserId = "usr-admin-1";
    safeStorage.setItem(
      "infrasync_active_session",
      JSON.stringify({ workspaceId: "demo_workspace", userId: "usr-admin-1", isDemoMode: true })
    );
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
  }

  exitDemoMode(targetWorkspaceId?: string, targetUserId?: string): void {
    this.isDemoMode = false;
    if (targetWorkspaceId) {
      this.workspaceId = targetWorkspaceId;
      this.activeUserId = targetUserId || this.activeUserId;
    } else {
      const accounts = this.getAccounts();
      if (accounts.length > 0) {
        this.workspaceId = accounts[0].defaultWorkspaceId;
        this.activeUserId = accounts[0].userId;
      }
    }
    safeStorage.setItem(
      "infrasync_active_session",
      JSON.stringify({ workspaceId: this.workspaceId, userId: this.activeUserId, isDemoMode: false })
    );
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
  }

  initWorkspace(workspaceId: string, email: string, name: string, companyName?: string) {
    if (!workspaceId) return;

    this.workspaceId = workspaceId;
    this.isDemoMode = workspaceId === "demo_workspace";
    this.activeUserId = workspaceId;

    // Check if workspace exists in registry
    const workspaces = this.getWorkspaces();
    if (!workspaces.some((w) => w.id === workspaceId) && !this.isDemoMode) {
      const newWs: Workspace = {
        id: workspaceId,
        name: companyName ? `${companyName} Workspace` : `${name || "My"}'s Workspace`,
        ownerId: workspaceId,
        companyName: companyName || name,
        createdAt: new Date().toISOString().split("T")[0],
      };
      this.saveWorkspace(newWs);
    }

    // Ensure user profile exists in this workspace
    const users = this.get<User[]>("users", []);
    if (users.length === 0 && !this.isDemoMode) {
      const initialAdmin: User = {
        id: workspaceId,
        workspaceId,
        name: name || "Workspace Owner",
        email: email || "",
        phone: "+91 00000 00000",
        role: "admin",
        status: "active",
        permissions: ALL_PERMISSIONS.map((p) => p.key),
        createdAt: new Date().toISOString().split("T")[0],
        notes: "Workspace Administrator",
      };
      this.set("users", [initialAdmin]);
      this.set("active_user", initialAdmin);
    }

    safeStorage.setItem(
      "infrasync_active_session",
      JSON.stringify({ workspaceId: this.workspaceId, userId: this.activeUserId, isDemoMode: this.isDemoMode })
    );

    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
  }

  private getNamespaceKey(key: string): string {
    return `infrasync_ws_${this.workspaceId}_${key}`;
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = safeStorage.getItem(this.getNamespaceKey(key));
      if (!item) return defaultValue;
      const parsed = JSON.parse(item);
      if (Array.isArray(defaultValue)) {
        if (!Array.isArray(parsed)) {
          return defaultValue;
        }
        return parsed as T;
      }
      if (typeof defaultValue === "object" && defaultValue !== null) {
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          return defaultValue;
        }
      }
      return parsed !== undefined && parsed !== null ? (parsed as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      safeStorage.setItem(this.getNamespaceKey(key), JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("infrasync_storage_update", { detail: { key, workspaceId: this.workspaceId } }));
    } catch (e) {
      console.error("Storage write error", e);
    }
  }

  // Users & IAM Access Management
  getUsers(): User[] {
    const list = this.get<User[]>("users", this.isDemoMode ? INITIAL_USERS : []);
    return list.map((u) => {
      if (u.role === "admin") {
        return { ...u, permissions: ALL_PERMISSIONS.map((p) => p.key) };
      }
      return u;
    });
  }

  getUser(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  saveUser(user: User): User {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    const updatedUser: User = {
      ...user,
      workspaceId: this.workspaceId,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    if (idx >= 0) {
      list[idx] = updatedUser;
    } else {
      list.push(updatedUser);
    }
    this.set("users", list);

    const active = this.getActiveUser();
    if (active.id === user.id) {
      this.setActiveUser(updatedUser);
    }

    return updatedUser;
  }

  deleteUser(id: string): void {
    const list = this.getUsers().filter((u) => u.id !== id);
    this.set("users", list);
  }

  toggleUserStatus(id: string): User | undefined {
    const user = this.getUser(id);
    if (!user) return undefined;
    const newStatus = user.status === "active" ? "disabled" : "active";
    const updated = { ...user, status: newStatus as "active" | "disabled" };
    this.saveUser(updated);
    this.addAuditLog(
      newStatus === "active" ? "User Reactivated" : "User Disabled",
      user.name,
      user.id,
      `Account status changed to ${newStatus.toUpperCase()} by Administrator`,
      "user_status"
    );
    return updated;
  }

  updateUserPermissions(userId: string, permissions: PermissionKey[]): User | undefined {
    const user = this.getUser(userId);
    if (!user) return undefined;
    const updated = {
      ...user,
      permissions,
      overriddenFromRole: true,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    this.saveUser(updated);
    this.addAuditLog(
      "Permissions Updated",
      user.name,
      user.id,
      `Manually assigned ${permissions.length} granular permissions (Admin Override)`,
      "permission_change"
    );
    return updated;
  }

  // Active User & Session Switcher
  getActiveUser(): User {
    const users = this.getUsers();
    const defaultUser: User = {
      id: this.activeUserId || "usr-admin",
      workspaceId: this.workspaceId,
      name: "Workspace Admin",
      email: "",
      phone: "",
      role: "admin",
      status: "active",
      permissions: ALL_PERMISSIONS.map((p) => p.key),
      createdAt: new Date().toISOString().split("T")[0],
    };

    const stored = this.get<User>("active_user", users[0] || (this.isDemoMode ? INITIAL_USERS[0] : defaultUser));
    const matched = users.find((u) => u.id === stored?.id);
    return matched || stored || users[0] || (this.isDemoMode ? INITIAL_USERS[0] : defaultUser);
  }

  getCurrentUser(): User {
    return this.getActiveUser();
  }

  setActiveUser(user: User): void {
    this.activeUserId = user.id;
    this.set("active_user", user);
  }

  switchUser(userId: string): User {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId) || (this.isDemoMode ? INITIAL_USERS[0] : this.getActiveUser());
    this.setActiveUser(user);
    return user;
  }

  setCurrentUserRole(role: UserRole): User {
    return this.switchRole(role);
  }

  switchRole(role: UserRole): User {
    const users = this.getUsers();
    const matched = users.find((u) => u.role === role);
    if (matched) {
      this.setActiveUser(matched);
      return matched;
    }
    const current = this.getActiveUser();
    const updated: User = {
      ...current,
      role,
    };
    this.setActiveUser(updated);
    return updated;
  }

  // Custom Roles & Templates
  getCustomRoles(): CustomRole[] {
    return this.get<CustomRole[]>("custom_roles", this.isDemoMode ? [
      {
        id: "crole-1",
        name: "Safety & Quality Auditor",
        description: "Focuses on QA/QC inspections, defect reporting, safety photo logging and progress review.",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        defaultPermissions: [
          "view_dashboard",
          "view_projects",
          "manage_progress",
          "upload_site_photos",
          "generate_view_download_reports",
          "use_ai_assistant",
        ],
        createdAt: "2026-02-15",
        createdBy: "Vikram Singhania",
      },
      {
        id: "crole-2",
        name: "Quantity Surveyor / Billing",
        description: "Specialized in BOQ materials verification, expense invoice audit, and cost forecasting.",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        defaultPermissions: [
          "view_dashboard",
          "view_projects",
          "view_expenses",
          "manage_expenses",
          "view_materials",
          "manage_materials",
          "generate_view_download_reports",
          "use_ai_assistant",
        ],
        createdAt: "2026-02-20",
        createdBy: "Vikram Singhania",
      },
    ] : []);
  }

  saveCustomRole(role: CustomRole): void {
    const list = this.getCustomRoles();
    const idx = list.findIndex((r) => r.id === role.id);
    if (idx >= 0) {
      list[idx] = role;
    } else {
      list.push(role);
    }
    this.set("custom_roles", list);
    this.addAuditLog("Custom Role Saved", role.name, role.id, `Created/Updated role preset '${role.name}' with ${role.defaultPermissions.length} permissions`, "role_create");
  }

  deleteCustomRole(id: string): void {
    const list = this.getCustomRoles().filter((r) => r.id !== id);
    this.set("custom_roles", list);
  }

  // Audit Logging
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>("audit_logs", this.isDemoMode ? [
      {
        id: "aud-1",
        timestamp: "2026-08-31 10:30 AM",
        actorName: "Vikram Singhania (Admin)",
        actorId: "usr-admin-1",
        action: "Grant Permissions",
        targetUserName: "Rajesh Sharma",
        targetUserId: "usr-pm-1",
        details: "Assigned full project planning and expense management privileges.",
        type: "permission_change",
      },
      {
        id: "aud-2",
        timestamp: "2026-08-30 04:15 PM",
        actorName: "Vikram Singhania (Admin)",
        actorId: "usr-admin-1",
        action: "Account Verification",
        targetUserName: "Ananya Desai",
        targetUserId: "usr-eng-1",
        details: "Enabled photo upload and material adjustment permissions.",
        type: "permission_change",
      },
      {
        id: "aud-3",
        timestamp: "2026-08-29 11:00 AM",
        actorName: "Vikram Singhania (Admin)",
        actorId: "usr-admin-1",
        action: "Create Custom Role",
        targetUserName: "Quantity Surveyor / Billing",
        targetUserId: "crole-2",
        details: "Configured custom permission preset for procurement auditor.",
        type: "role_create",
      },
    ] : []);
  }

  addAuditLog(action: string, targetUserName: string, targetUserId: string, details: string, type: AuditLog["type"] = "permission_change"): void {
    const list = this.getAuditLogs();
    const actor = this.getActiveUser();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }),
      actorName: `${actor.name} (${actor.role.toUpperCase()})`,
      actorId: actor.id,
      action,
      targetUserName,
      targetUserId,
      details,
      type,
    };
    list.unshift(newLog);
    this.set("audit_logs", list.slice(0, 50));
  }

  // Active Project & Isolation
  getActiveProjectId(): string {
    const projects = this.getProjects();
    const stored = this.get<string>("active_project_id", projects[0]?.id || "");
    if (stored && projects.some((p) => p.id === stored)) {
      return stored;
    }
    return projects[0]?.id || "";
  }

  setActiveProjectId(id: string): void {
    this.set("active_project_id", id);
  }

  // Projects
  getProjects(): Project[] {
    const projects = this.get<Project[]>("projects", this.isDemoMode ? INITIAL_PROJECTS : []);
    return Array.isArray(projects) ? projects : [];
  }

  getActiveProject(): Project {
    const projects = this.getProjects();
    const activeId = this.getActiveProjectId();
    const matched = projects.find((p) => p.id === activeId);
    if (matched) return matched;
    if (projects.length > 0) return projects[0];
    return {
      id: "",
      workspaceId: this.workspaceId,
      name: "",
      description: "",
      location: "",
      clientId: "",
      managerId: "",
      budget: 0,
      spentAmount: 0,
      startDate: "",
      endDate: "",
      status: "planning",
      progressPercentage: 0,
      milestones: [],
      createdAt: "",
    };
  }

  saveProject(project: Project): Project {
    const projects = this.getProjects();
    const stampedProject: Project = {
      ...project,
      workspaceId: this.workspaceId,
      createdBy: project.createdBy || this.activeUserId,
    };

    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = stampedProject;
    } else {
      projects.unshift(stampedProject);
    }
    this.set("projects", projects);
    this.setActiveProjectId(stampedProject.id);
    return stampedProject;
  }

  deleteProject(projectId: string): void {
    const projects = this.getProjects().filter((p) => p.id !== projectId);
    this.set("projects", projects);

    // Cascade delete project-scoped resources in this workspace
    const expenses = this.get<Expense[]>("expenses", []).filter((e) => e.projectId !== projectId);
    this.set("expenses", expenses);

    const materials = this.get<Material[]>("materials", []).filter((m) => m.projectId !== projectId);
    this.set("materials", materials);

    const workers = this.get<Worker[]>("workers", []).filter((w) => w.projectId !== projectId);
    this.set("workers", workers);

    const attendance = this.get<AttendanceRecord[]>("attendance", []).filter((a) => a.projectId !== projectId);
    this.set("attendance", attendance);

    const progressLogs = this.get<ProgressLog[]>("progress_logs", []).filter((p) => p.projectId !== projectId);
    this.set("progress_logs", progressLogs);

    const tasks = this.get<Task[]>("tasks", []).filter((t) => t.projectId !== projectId);
    this.set("tasks", tasks);

    const equipment = this.get<import("../types").Equipment[]>("equipment", []).filter((e) => e.projectId !== projectId);
    this.set("equipment", equipment);

    if (this.getActiveProjectId() === projectId) {
      this.setActiveProjectId(projects[0]?.id || "");
    }
  }

  // Materials
  getMaterials(projectId?: string): Material[] {
    const all = this.get<Material[]>("materials", this.isDemoMode ? INITIAL_MATERIALS : []);
    return projectId ? all.filter((m) => m.projectId === projectId) : all;
  }

  saveMaterial(mat: Material): void {
    const list = this.get<Material[]>("materials", this.isDemoMode ? INITIAL_MATERIALS : []);
    const stampedMat: Material = {
      ...mat,
      workspaceId: this.workspaceId,
      createdBy: mat.createdBy || this.activeUserId,
    };
    const idx = list.findIndex((m) => m.id === mat.id);
    if (idx >= 0) {
      list[idx] = stampedMat;
    } else {
      list.unshift(stampedMat);
    }
    this.set("materials", list);
  }

  updateMaterialStock(id: string, newQuantity: number): void {
    const list = this.get<Material[]>("materials", this.isDemoMode ? INITIAL_MATERIALS : []);
    const mat = list.find((m) => m.id === id);
    if (mat) {
      mat.quantity = newQuantity;
      mat.lastUpdated = new Date().toISOString().split("T")[0];
      this.set("materials", list);
    }
  }

  deleteMaterial(id: string): void {
    const list = this.get<Material[]>("materials", this.isDemoMode ? INITIAL_MATERIALS : []).filter((m) => m.id !== id);
    this.set("materials", list);
  }

  // Expenses
  getExpenses(projectId?: string): Expense[] {
    const all = this.get<Expense[]>("expenses", this.isDemoMode ? INITIAL_EXPENSES : []);
    return projectId ? all.filter((e) => e.projectId === projectId) : all;
  }

  saveExpense(expense: Expense): void {
    const list = this.get<Expense[]>("expenses", this.isDemoMode ? INITIAL_EXPENSES : []);
    const stampedExpense: Expense = {
      ...expense,
      workspaceId: this.workspaceId,
      createdBy: expense.createdBy || this.activeUserId,
    };
    const idx = list.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      list[idx] = stampedExpense;
    } else {
      list.unshift(stampedExpense);
    }
    this.set("expenses", list);

    // Update project spent amount automatically
    const project = this.getActiveProject();
    if (project && project.id === expense.projectId) {
      const totalSpent = list
        .filter((e) => e.projectId === project.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      project.spentAmount = totalSpent;
      this.saveProject(project);
    }
  }

  deleteExpense(id: string): void {
    const list = this.get<Expense[]>("expenses", this.isDemoMode ? INITIAL_EXPENSES : []).filter((e) => e.id !== id);
    this.set("expenses", list);

    const project = this.getActiveProject();
    if (project && project.id) {
      const totalSpent = list
        .filter((e) => e.projectId === project.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      project.spentAmount = totalSpent;
      this.saveProject(project);
    }
  }

  // Workers
  getWorkers(projectId?: string): Worker[] {
    const all = this.get<Worker[]>("workers", this.isDemoMode ? INITIAL_WORKERS : []);
    return projectId ? all.filter((w) => w && w.projectId === projectId) : all;
  }

  saveWorker(worker: Worker): void {
    const list = this.getWorkers();
    const stampedWorker: Worker = {
      ...worker,
      workspaceId: this.workspaceId,
      createdBy: worker.createdBy || this.activeUserId,
    };
    const idx = list.findIndex((w) => w.id === worker.id);
    if (idx >= 0) {
      list[idx] = stampedWorker;
    } else {
      list.unshift(stampedWorker);
    }
    this.set("workers", list);
  }

  deleteWorker(id: string): void {
    const list = this.getWorkers().filter((w) => w.id !== id);
    this.set("workers", list);
  }

  // Attendance
  getAttendance(projectId?: string, date?: string): AttendanceRecord[] {
    const all = this.get<AttendanceRecord[]>("attendance", this.isDemoMode ? INITIAL_ATTENDANCE : []);
    return all.filter((a) => {
      if (!a) return false;
      if (projectId && a.projectId !== projectId) return false;
      if (date && a.date !== date) return false;
      return true;
    });
  }

  saveAttendanceRecord(record: AttendanceRecord): void {
    const list = this.get<AttendanceRecord[]>("attendance", this.isDemoMode ? INITIAL_ATTENDANCE : []);
    const stampedRecord: AttendanceRecord = {
      ...record,
      workspaceId: this.workspaceId,
    };
    const idx = list.findIndex((a) => a.id === record.id);
    if (idx >= 0) {
      list[idx] = stampedRecord;
    } else {
      list.unshift(stampedRecord);
    }
    this.set("attendance", list);
  }

  updateAttendance(record: AttendanceRecord): void {
    this.saveAttendanceRecord(record);
  }

  syncOfflineAttendance(records: AttendanceRecord[]): number {
    const list = this.get<AttendanceRecord[]>("attendance", this.isDemoMode ? INITIAL_ATTENDANCE : []);
    let syncedCount = 0;
    records.forEach((incoming) => {
      const idx = list.findIndex((a) => a.id === incoming.id || (a.workerId === incoming.workerId && a.date === incoming.date));
      const cleaned: AttendanceRecord = { ...incoming, workspaceId: this.workspaceId, isPendingSync: false };
      if (idx >= 0) {
        list[idx] = cleaned;
      } else {
        list.unshift(cleaned);
      }
      syncedCount++;
    });
    this.set("attendance", list);
    return syncedCount;
  }

  recordAttendanceAudit(
    recordId: string,
    changedBy: string,
    originalStatus: string,
    newStatus: string,
    reason: string
  ): AttendanceRecord | undefined {
    const list = this.get<AttendanceRecord[]>("attendance", this.isDemoMode ? INITIAL_ATTENDANCE : []);
    const record = list.find((a) => a.id === recordId);
    if (!record) return undefined;

    const auditEntry: AttendanceAuditEntry = {
      id: `aud-att-${Date.now()}`,
      changedBy,
      changedAt: new Date().toISOString(),
      originalStatus,
      newStatus,
      reason,
      action: "Status Manual Override",
    };

    record.status = newStatus as any;
    record.auditTrail = record.auditTrail ? [auditEntry, ...record.auditTrail] : [auditEntry];
    this.saveAttendanceRecord(record);

    this.addAuditLog(
      "Attendance Manual Correction",
      record.workerName,
      record.workerId,
      `Status changed from ${originalStatus.toUpperCase()} to ${newStatus.toUpperCase()}. Reason: ${reason}`
    );

    return record;
  }

  transferWorker(
    workerId: string,
    newProjectId: string,
    newSiteId?: string,
    newSiteName?: string
  ): Worker | undefined {
    const workers = this.getWorkers();
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return undefined;

    const prevSite = worker.siteName || "Unassigned Site";
    worker.projectId = newProjectId;
    worker.siteId = newSiteId;
    worker.siteName = newSiteName;
    this.saveWorker(worker);

    this.addAuditLog(
      "Labour Site Transfer",
      worker.name,
      worker.id,
      `Transferred from ${prevSite} to ${newSiteName || "New Project Site"}`
    );

    return worker;
  }

  updateProjectGeofence(
    projectId: string,
    radiusMeters: number,
    siteLat?: number,
    siteLng?: number,
    subSites?: ProjectSite[]
  ): Project | undefined {
    const projects = this.getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;

    project.attendanceRadiusMeters = radiusMeters;
    if (siteLat !== undefined) project.siteLatitude = siteLat;
    if (siteLng !== undefined) project.siteLongitude = siteLng;
    if (subSites) project.sites = subSites;

    this.saveProject(project);
    this.addAuditLog(
      "Site Geofence Updated",
      project.name,
      project.id,
      `Attendance radius configured to ${radiusMeters} meters (Lat: ${project.siteLatitude}, Lng: ${project.siteLongitude})`
    );

    return project;
  }

  approveLabourPayroll(
    projectId: string,
    totalWageAmount: number,
    periodDescription: string,
    approvedByName: string
  ): Expense {
    const newExpense: Expense = {
      id: `exp-labor-${Date.now()}`,
      workspaceId: this.workspaceId,
      projectId,
      category: "Labor",
      description: `Approved Workforce Payroll (${periodDescription}) - Verified Muster Roll`,
      amount: totalWageAmount,
      date: new Date().toISOString().split("T")[0],
      addedBy: approvedByName,
      createdBy: this.activeUserId,
      paymentMethod: "Bank Transfer (NEFT)",
      vendorName: "Workforce Payroll Disbursal",
      invoiceNumber: `PAY-${Date.now().toString().slice(-6)}`,
    };

    this.saveExpense(newExpense);
    this.addAuditLog(
      "Labour Payroll Approved",
      "Workforce Payroll",
      projectId,
      `Approved ₹${totalWageAmount.toLocaleString("en-IN")} wage payout for ${periodDescription}`
    );

    return newExpense;
  }

  // Tasks
  getTasks(projectId?: string): Task[] {
    const all = this.get<Task[]>("tasks", this.isDemoMode ? INITIAL_TASKS : []);
    return projectId ? all.filter((t) => t.projectId === projectId) : all;
  }

  saveTask(task: Task): void {
    const list = this.get<Task[]>("tasks", this.isDemoMode ? INITIAL_TASKS : []);
    const stampedTask: Task = {
      ...task,
      workspaceId: this.workspaceId,
      createdBy: task.createdBy || this.activeUserId,
    };
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      list[idx] = stampedTask;
    } else {
      list.unshift(stampedTask);
    }
    this.set("tasks", list);
  }

  updateTaskStatus(taskId: string, status: Task["status"]): void {
    const list = this.get<Task[]>("tasks", this.isDemoMode ? INITIAL_TASKS : []);
    const t = list.find((item) => item.id === taskId);
    if (t) {
      t.status = status;
      if (status === "completed") {
        t.completionPercentage = 100;
      }
      this.set("tasks", list);
    }
  }

  // Progress Logs & DPR
  getProgressLogs(projectId?: string): ProgressLog[] {
    const all = this.get<ProgressLog[]>("progress_logs", this.isDemoMode ? INITIAL_PROGRESS : []);
    return projectId ? all.filter((p) => p.projectId === projectId) : all;
  }

  saveProgressLog(log: ProgressLog): void {
    const list = this.get<ProgressLog[]>("progress_logs", this.isDemoMode ? INITIAL_PROGRESS : []);
    const stampedLog: ProgressLog = {
      ...log,
      workspaceId: this.workspaceId,
      createdBy: log.createdBy || this.activeUserId,
    };
    const idx = list.findIndex((p) => p.id === log.id);
    if (idx >= 0) {
      list[idx] = stampedLog;
    } else {
      list.unshift(stampedLog);
    }
    this.set("progress_logs", list);

    const project = this.getActiveProject();
    if (project && project.id === log.projectId && log.percentage > project.progressPercentage) {
      project.progressPercentage = log.percentage;
      this.saveProject(project);
    }
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    return this.get<Supplier[]>("suppliers", this.isDemoMode ? INITIAL_SUPPLIERS : []);
  }

  saveSupplier(sup: Supplier): void {
    const list = this.get<Supplier[]>("suppliers", this.isDemoMode ? INITIAL_SUPPLIERS : []);
    const stampedSup: Supplier = {
      ...sup,
      workspaceId: this.workspaceId,
      createdBy: sup.createdBy || this.activeUserId,
    };
    const idx = list.findIndex((s) => s.id === sup.id);
    if (idx >= 0) {
      list[idx] = stampedSup;
    } else {
      list.unshift(stampedSup);
    }
    this.set("suppliers", list);
  }

  // Notifications
  getNotifications(): SystemNotification[] {
    return this.get<SystemNotification[]>("notifications", this.isDemoMode ? INITIAL_NOTIFICATIONS : []);
  }

  addNotification(notification: {
    id?: string;
    title: string;
    message: string;
    type?: "warning" | "info" | "success" | "alert";
    timestamp?: string;
    read?: boolean;
    linkTab?: string;
    workspaceId?: string;
    userId?: string;
  }): void {
    const list = this.getNotifications();
    const newNotif: SystemNotification = {
      id: notification.id || `notif-${Date.now()}`,
      title: notification.title,
      message: notification.message,
      type: notification.type || "info",
      timestamp: notification.timestamp || new Date().toISOString(),
      read: notification.read || false,
      linkTab: notification.linkTab,
      workspaceId: notification.workspaceId,
      userId: notification.userId,
    };
    list.unshift(newNotif);
    this.set("notifications", list);
  }

  markNotificationRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.set("notifications", list);
  }

  // Equipment
  getEquipment(projectId?: string): import("../types").Equipment[] {
    const all = this.get<import("../types").Equipment[]>("equipment", this.isDemoMode ? INITIAL_EQUIPMENT : []);
    return projectId ? all.filter((e) => e && (!e.projectId || e.projectId === projectId)) : all;
  }

  saveEquipment(equip: import("../types").Equipment): void {
    const list = this.getEquipment();
    const idx = list.findIndex((e) => e.id === equip.id);
    if (idx >= 0) {
      list[idx] = equip;
    } else {
      list.unshift(equip);
    }
    this.set("equipment", list);
  }

  deleteEquipment(id: string): void {
    const list = this.getEquipment().filter((e) => e.id !== id);
    this.set("equipment", list);
  }

  // Equipment Usage Logs
  getEquipmentUsage(equipmentId?: string): import("../types").EquipmentUsageLog[] {
    const all = this.get<import("../types").EquipmentUsageLog[]>("equipment_usage", this.isDemoMode ? INITIAL_EQUIPMENT_USAGE : []);
    return equipmentId ? all.filter((u) => u && u.equipmentId === equipmentId) : all;
  }

  saveEquipmentUsage(usage: import("../types").EquipmentUsageLog): void {
    const list = this.getEquipmentUsage();
    list.unshift(usage);
    this.set("equipment_usage", list);
  }

  // Fuel Logs
  getFuelLogs(equipmentId?: string): import("../types").FuelLog[] {
    const all = this.get<import("../types").FuelLog[]>("fuel_logs", this.isDemoMode ? INITIAL_FUEL_LOGS : []);
    return equipmentId ? all.filter((f) => f && f.equipmentId === equipmentId) : all;
  }

  saveFuelLog(log: import("../types").FuelLog): void {
    const list = this.getFuelLogs();
    list.unshift(log);
    this.set("fuel_logs", list);
  }

  // Maintenance Records
  getMaintenanceRecords(equipmentId?: string): import("../types").MaintenanceRecord[] {
    const all = this.get<import("../types").MaintenanceRecord[]>("maintenance_records", this.isDemoMode ? INITIAL_MAINTENANCE_RECORDS : []);
    return equipmentId ? all.filter((m) => m && m.equipmentId === equipmentId) : all;
  }

  saveMaintenanceRecord(record: import("../types").MaintenanceRecord): void {
    const list = this.getMaintenanceRecords();
    list.unshift(record);
    this.set("maintenance_records", list);
  }

  // Equipment Inspections
  getEquipmentInspections(equipmentId?: string): import("../types").EquipmentInspection[] {
    const all = this.get<import("../types").EquipmentInspection[]>("equipment_inspections", this.isDemoMode ? INITIAL_EQUIPMENT_INSPECTIONS : []);
    return equipmentId ? all.filter((i) => i && i.equipmentId === equipmentId) : all;
  }

  saveEquipmentInspection(inspection: import("../types").EquipmentInspection): void {
    const list = this.getEquipmentInspections();
    list.unshift(inspection);
    this.set("equipment_inspections", list);
  }

  // Vehicle Gate Movements (Manual Gate Entry & Exit Register)
  getVehicleGateMovements(projectId?: string): VehicleGateMovement[] {
    const all = this.get<VehicleGateMovement[]>("vehicle_gate_movements", INITIAL_VEHICLE_MOVEMENTS);
    return projectId ? all.filter((v) => v && v.projectId === projectId) : all;
  }

  saveVehicleGateMovement(movement: VehicleGateMovement): void {
    const list = this.get<VehicleGateMovement[]>("vehicle_gate_movements", INITIAL_VEHICLE_MOVEMENTS);
    const stamped: VehicleGateMovement = {
      ...movement,
      vehicleNumber: (movement.vehicleNumber || "").toUpperCase().trim(),
      updatedAt: new Date().toISOString(),
    };
    const idx = list.findIndex((m) => m.id === movement.id);
    if (idx >= 0) {
      list[idx] = stamped;
    } else {
      list.unshift(stamped);
    }
    this.set("vehicle_gate_movements", list);

    this.addAuditLog(
      stamped.movementType === "exit" ? "Vehicle Gate Exit Recorded" : "Vehicle Gate Entry Logged",
      stamped.vehicleNumber,
      stamped.projectId,
      `Pass #${stamped.passNumber} - ${stamped.vehicleType} driven by ${stamped.driverName} at ${stamped.gateNumber}`
    );
  }

  recordVehicleExit(
    id: string,
    exitData: {
      exitTime: string;
      exitGateNumber: string;
      exitRecordedBy: string;
      exitOperatorId?: string;
      exitNotes?: string;
      exitPhotoUrl?: string;
    }
  ): VehicleGateMovement | null {
    const list = this.get<VehicleGateMovement[]>("vehicle_gate_movements", INITIAL_VEHICLE_MOVEMENTS);
    const idx = list.findIndex((m) => m.id === id);
    if (idx < 0) return null;

    const entryRecord = list[idx];
    const updated: VehicleGateMovement = {
      ...entryRecord,
      exitTime: exitData.exitTime || new Date().toISOString(),
      exitGateNumber: exitData.exitGateNumber || entryRecord.gateNumber,
      exitRecordedBy: exitData.exitRecordedBy,
      exitOperatorId: exitData.exitOperatorId,
      exitNotes: exitData.exitNotes,
      exitPhotoUrl: exitData.exitPhotoUrl || entryRecord.exitPhotoUrl,
      status: "exited",
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    this.set("vehicle_gate_movements", list);

    this.addAuditLog(
      "Vehicle Gate Exit Verified",
      updated.vehicleNumber,
      updated.projectId,
      `Vehicle checked out at ${updated.exitGateNumber} by ${exitData.exitRecordedBy}`
    );

    return updated;
  }

  voidVehicleGateMovement(
    id: string,
    voidData: {
      voidReason: string;
      voidedBy: string;
      voidedAt?: string;
    }
  ): VehicleGateMovement | null {
    const list = this.get<VehicleGateMovement[]>("vehicle_gate_movements", INITIAL_VEHICLE_MOVEMENTS);
    const idx = list.findIndex((m) => m.id === id);
    if (idx < 0) return null;

    const record = list[idx];
    const updated: VehicleGateMovement = {
      ...record,
      status: "void",
      isVoided: true,
      voidReason: voidData.voidReason,
      voidedBy: voidData.voidedBy,
      voidedAt: voidData.voidedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    this.set("vehicle_gate_movements", list);

    this.addAuditLog(
      "Vehicle Gate Record Voided/Corrected",
      record.vehicleNumber,
      record.projectId,
      `Pass #${record.passNumber} voided by ${voidData.voidedBy}. Reason: ${voidData.voidReason}`
    );

    return updated;
  }

  deleteVehicleGateMovement(id: string): void {
    const list = this.get<VehicleGateMovement[]>("vehicle_gate_movements", INITIAL_VEHICLE_MOVEMENTS).filter(
      (m) => m.id !== id
    );
    this.set("vehicle_gate_movements", list);
  }

  // Reset demo / clean state
  resetAll(): void {
    const keysToRemove = safeStorage.getAllKeys().filter((key) => key.startsWith("infrasync_"));
    keysToRemove.forEach((k) => safeStorage.removeItem(k));
    window.location.reload();
  }
}

export const storage = new StorageService();
export const storageService = storage;
