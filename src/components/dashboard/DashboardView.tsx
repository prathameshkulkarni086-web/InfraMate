import React from "react";
import {
  DollarSign,
  TrendingUp,
  Boxes,
  Users,
  AlertTriangle,
  FileDown,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Zap,
  Building2,
  Clock,
  Activity,
  HardHat,
  MapPin,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Project, Expense, Material, Worker, AttendanceRecord, ProgressLog, Task, UserRole } from "../../types";
import { pdfService } from "../../services/pdfService";
import { FEATURES } from "../../config/features";

interface DashboardViewProps {
  project: Project;
  projects?: Project[];
  onSelectProject?: (id: string) => void;
  expenses: Expense[];
  materials: Material[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  progressLogs: ProgressLog[];
  tasks: Task[];
  userRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddProgress: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  projects = [],
  onSelectProject,
  expenses = [],
  materials = [],
  workers = [],
  attendance = [],
  progressLogs = [],
  tasks = [],
  userRole,
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddProgress,
}) => {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const safeProgressLogs = Array.isArray(progressLogs) ? progressLogs : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const totalSpent = safeExpenses.reduce((acc, curr) => acc + (curr?.amount || 0), 0);
  const budgetVal = project.budget || 45000000;
  const budgetUtilization = Math.round((totalSpent / budgetVal) * 100);
  const remainingBudget = budgetVal - totalSpent;

  const lowStockItems = safeMaterials.filter((m) => m && m.quantity <= m.minimumStock);
  const presentWorkersCount = safeAttendance.filter((a) => a && (a.status === "present" || a.status === "overtime")).length;
  const attendanceRate = safeWorkers.length > 0 ? Math.round((presentWorkersCount / safeWorkers.length) * 100) : 92;

  // Expense breakdown for charts
  const categoryMap: Record<string, number> = {};
  safeExpenses.forEach((e) => {
    if (!e) return;
    categoryMap[e.category] = (categoryMap[e.category] || 0) + (e.amount || 0);
  });
  
  if (Object.keys(categoryMap).length === 0) {
    categoryMap["Material"] = 1850000;
    categoryMap["Labor"] = 920000;
    categoryMap["Equipment"] = 640000;
    categoryMap["Other"] = 330000;
  }

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  const COLORS = ["#f97316", "#2563eb", "#10b981", "#8b5cf6", "#ec4899"];

  // Progress timeline data
  const progressTimeline = [
    { stage: "Excavation", progress: 15, planned: 18 },
    { stage: "Foundation", progress: 28, planned: 30 },
    { stage: "Ground Slab", progress: 38, planned: 42 },
    { stage: "Upper Slab", progress: project.progressPercentage || 64, planned: 70 },
    { stage: "Roof Target", progress: 75, planned: 82 },
    { stage: "Finishing", progress: 100, planned: 100 },
  ];

  const canEdit = userRole === "admin" || userRole === "project_manager" || userRole === "site_engineer";

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. PROJECT HERO SECTION */}
      <div className="relative rounded-2xl bg-slate-900 text-white overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 z-0"></div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 bg-cover bg-center pointer-events-none hidden md:block" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1541888946425-d0fbb18f8f3b?auto=format&fit=crop&w=1200&q=80')` }}></div>
        
        <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {project.status?.replace("_", " ") || "ACTIVE"}
                </span>
                <span className="text-slate-400 text-xs font-mono">ID: {project.code || "INFRA-BLR-01"}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {project.location || "Bengaluru, India"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {project.name || "SkyLine Prestige Towers"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
                <span>Client: <strong className="text-white">Prestige Realty Group</strong></span>
                <span>•</span>
                <span>Contractor: <strong className="text-white">L&T Civil Infrastructure</strong></span>
                <span>•</span>
                <span>Manager: <strong className="text-white">{project.managerName}</strong></span>
              </div>
            </div>

            {/* Quick Hero Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              <button
                onClick={() => onNavigateTab("ai_assistant")}
                className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition transform active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-blue-200 animate-pulse shrink-0" />
                <span>Ask AI Site Assistant</span>
              </button>
              {FEATURES.visualizer2D3D && (
                <button
                  onClick={() => onNavigateTab("building_visualizer")}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                >
                  <Layers className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>2D/3D Visualizer</span>
                </button>
              )}
              {canEdit && (
                <button
                  onClick={onOpenAddProgress}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>+ Quick Entry</span>
                </button>
              )}
            </div>
          </div>

          {/* Switch Sites Horizontal Selector */}
          {safeProjects.length > 1 && (
            <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3 overflow-x-auto touch-scroll pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Switch Site:</span>
              <div className="flex items-center gap-2 overflow-x-auto touch-scroll">
                {safeProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProject && onSelectProject(p.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-2 border ${
                      p.id === project.id
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>{p.name.split(" ")[0]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 font-mono font-bold text-slate-300">
                      {p.progressPercentage}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. FOUR PREMIUM KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Site Progress */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Site Progress</p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 group-hover:text-blue-600 transition-colors">
                {project.progressPercentage || 64}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Target: 70%</span>
            <span className="font-semibold text-slate-700">1,85,000 sq.ft • 18 Floors</span>
          </div>
        </div>

        {/* Card 2: Budget Spent */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Budget Spent</p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 group-hover:text-orange-600 transition-colors">
                ₹{(totalSpent / 100000).toFixed(2)} L
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total: ₹{(budgetVal / 10000000).toFixed(2)} Cr</span>
            <span className="font-semibold text-emerald-600">Balance: ₹{(remainingBudget / 100000).toFixed(2)} L</span>
          </div>
        </div>

        {/* Card 3: Workforce Today */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Workforce Today</p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 group-hover:text-emerald-600 transition-colors">
                {presentWorkersCount || 42} <span className="text-sm font-normal text-slate-400">/ {workers.length || 50}</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Wage Tally: ₹43,600</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 95.2% PPE
            </span>
          </div>
        </div>

        {/* Card 4: Inventory & Punch */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Inventory & Punch</p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 group-hover:text-purple-600 transition-colors">
                {lowStockItems.length || 2} <span className="text-sm font-normal text-slate-400">Alerts</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-red-600 font-semibold">{lowStockItems.length} Stock Alerts</span>
            <span className="font-semibold text-slate-700">2 Punch Items</span>
          </div>
        </div>

      </div>

      {/* 3. ANALYTICS & FINANCIAL ALLOCATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Progress Overview Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Progress Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Planned vs Actual milestone completion across construction phases</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Actual
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span> Planned
              </div>
              <button
                onClick={() => onNavigateTab("progress")}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold transition ml-2"
              >
                View DPR
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressTimeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  formatter={(val: any, name: any) => [`${val}%`, name === "progress" ? "Actual Progress" : "Planned Progress"]}
                />
                <Bar dataKey="planned" fill="#e2e8f0" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="progress" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Budget Breakdown Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Budget Breakdown</h3>
              <button
                onClick={() => onNavigateTab("expenses")}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                View all
              </button>
            </div>
            <p className="text-xs text-slate-500">Expenditure across material, labor & plant</p>
          </div>

          <div className="h-48 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "12px", color: "#0f172a" }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Amount"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
            {categoryData.map((c, idx) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <div className="truncate">
                  <p className="text-slate-500 text-[10px]">{c.name}</p>
                  <p className="font-bold text-slate-800">₹{(c.value / 100000).toFixed(1)}L</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. RECENT SITE ACTIVITY & QUICK ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Site Activity</h3>
                <p className="text-xs text-slate-500">Live operational audit log across field engineers</p>
              </div>
              <button
                onClick={() => onNavigateTab("progress")}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View all activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900">Concrete work completed on 12th floor</h4>
                    <span className="text-[10px] text-slate-400">Today, 09:30 AM</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Slab casting finished successfully with 35 workers on site.</p>
                  <span className="text-[10px] text-blue-600 font-medium mt-1 inline-block">By Site Engineer • Rahul Sharma</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5">
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900">Steel material received - 5 Tons</h4>
                    <span className="text-[10px] text-slate-400">Today, 08:15 AM</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Verified grade TMT bars from Jindal Steel & Power.</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">By Store Incharge • Vikram Singh</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900">Muster roll submitted for 41 workers</h4>
                    <span className="text-[10px] text-slate-400">Today, 07:45 AM</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Morning biometric check-in verified and roster synced.</p>
                  <span className="text-[10px] text-purple-600 font-medium mt-1 inline-block">By Supervisor • Manoj Kumar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quick Actions:</span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onOpenAddExpense}
                className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-orange-600 shrink-0" /> Add Expense
              </button>
              <button
                onClick={() => onNavigateTab("materials")}
                className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Add Material
              </button>
              <button
                onClick={() => onNavigateTab("labor")}
                className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Mark Attendance
              </button>
              <button
                onClick={() => pdfService.generateCompleteProjectReport(project, expenses, materials, workers, tasks)}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" /> Export DPR
              </button>
            </div>
          </div>

        </div>

    </div>
  );
};
