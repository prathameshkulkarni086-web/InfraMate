import React from "react";
import {
  FileText,
  FileDown,
  Building2,
  DollarSign,
  Boxes,
  Users,
  Calendar,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { Project, Expense, Material, Worker, AttendanceRecord, ProgressLog, Task } from "../../types";
import { pdfService } from "../../services/pdfService";

interface ReportsViewProps {
  project: Project;
  expenses: Expense[];
  materials: Material[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  progressLogs: ProgressLog[];
  tasks: Task[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  project,
  expenses = [],
  materials = [],
  workers = [],
  attendance = [],
  progressLogs = [],
  tasks = [],
}) => {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const safeProgressLogs = Array.isArray(progressLogs) ? progressLogs : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const latestLog: ProgressLog = safeProgressLogs[0] || {
    id: "log-def",
    projectId: project.id,
    date: new Date().toISOString().split("T")[0],
    percentage: project.progressPercentage,
    description: "Daily site progress recorded.",
    completedTasks: [],
    issues: [],
    photos: [],
    addedBy: "Site Engineer",
  };

  const reportCards = [
    {
      id: "full_dossier",
      title: "Executive Project Management Dossier",
      subtitle: "Comprehensive project review with milestones, financial burn curve, site diary and health score",
      icon: Building2,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      action: () => pdfService.generateCompleteProjectReport(project, safeExpenses, safeMaterials, safeWorkers, safeTasks),
      tags: ["Executive", "Board Audit", "Client Ready"],
    },
    {
      id: "daily_site",
      title: "Daily Site Progress & Diary Report",
      subtitle: "Detailed daily operations, weather conditions, workforce deployment, and issue registers",
      icon: Calendar,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      action: () => pdfService.generateDailySiteReport(project, latestLog, safeAttendance, safeTasks),
      tags: ["Site Engineers", "Field Diary", `Date: ${latestLog.date}`],
    },
    {
      id: "financial_audit",
      title: "Financial & Expense Audit Report",
      subtitle: "Category-wise expenditure breakdowns, vendor payout logs, and budget variance reconciliation",
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      action: () => pdfService.generateExpenseReport(project, safeExpenses),
      tags: ["Accounts", `${safeExpenses.length} Invoices`, "Tax/Audit"],
    },
    {
      id: "material_inventory",
      title: "Material Inventory & Stock Valuation",
      subtitle: "Live SKU ledger, low stock safety thresholds, unit rates, and on-site asset valuation",
      icon: Boxes,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      action: () => pdfService.generateMaterialReport(project, safeMaterials),
      tags: ["Supply Chain", `${safeMaterials.length} SKUs`, "Storekeeper"],
    },
    {
      id: "labor_muster",
      title: "Labor Muster Roll & Wage Disbursement",
      subtitle: "Trade roster, daily check-in timestamps, contractor allocations, and calculated wage payouts",
      icon: Users,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      action: () => pdfService.generateLaborReport(project, safeWorkers, safeAttendance),
      tags: ["HR & Payroll", `${safeWorkers.length} Workers`, "Contractors"],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Automated PDF Report Generation Hub</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate audit-compliant, professionally formatted PDF documentation for{" "}
          <span className="text-blue-600 font-semibold">{project.name}</span>.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportCards.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 ${r.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <button
                    onClick={r.action}
                    className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold px-4 py-2.5 text-xs transition shadow-xs w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3.5">{r.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.subtitle}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {r.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready to Print
                </span>
                <span>Auto-signed by InfraSync Engine</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
