import React, { useState } from "react";
import {
  DollarSign,
  Calculator,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Worker, AttendanceRecord, Project, UserRole } from "../../types";
import { attendanceService } from "../../services/attendanceService";
import { pdfService } from "../../services/pdfService";

interface PayrollCalculatorProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  project: Project;
  onApprovePayroll: (
    totalAmount: number,
    periodLabel: string,
    approvedBy: string
  ) => void;
  userRole: UserRole;
  currentUserName: string;
}

export const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({
  workers,
  attendance,
  project,
  onApprovePayroll,
  userRole,
  currentUserName,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-08");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [approvalNote, setApprovalNote] = useState<string>("");
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  // Compute payroll for all active workers for selected period
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const summaries = safeWorkers.map((worker) => {
    // Filter records for this worker and period (e.g., month "2026-08")
    const workerAtt = safeAttendance.filter((a) => {
      if (!a || a.workerId !== worker.id) return false;
      if (selectedPeriod !== "all" && !a.date.startsWith(selectedPeriod)) return false;
      return true;
    });

    return attendanceService.calculateSingleWorkerPayroll(worker, workerAtt);
  });

  const totalBasePay = summaries.reduce((sum, s) => sum + s.basePay, 0);
  const totalOvertimePay = summaries.reduce((sum, s) => sum + s.overtimePay, 0);
  const totalDeductions = summaries.reduce((sum, s) => sum + s.deductions, 0);
  const totalNetPay = summaries.reduce((sum, s) => sum + s.netPay, 0);
  const totalPayableDays = summaries.reduce((sum, s) => sum + s.payableDays, 0);

  const canApprove = userRole === "admin" || userRole === "project_manager";

  const handleExportPDF = () => {
    const periodLabel =
      selectedPeriod === "all"
        ? "All-Time Lifetime"
        : new Date(selectedPeriod + "-01").toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
    pdfService.generatePayrollReport(project, summaries, periodLabel);
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Trade",
      "Daily Wage (INR)",
      "Present Days",
      "Half Days",
      "Absent Days",
      "Overtime Hours",
      "Payable Days",
      "Base Pay (INR)",
      "Overtime Pay (INR)",
      "Deductions (INR)",
      "Net Pay (INR)",
    ];

    const rows = summaries.map((s) => [
      s.worker.employeeId || s.worker.id,
      `"${s.worker.name}"`,
      `"${s.worker.role}"`,
      s.worker.dailyWage,
      s.presentDays,
      s.halfDays,
      s.absentDays,
      s.overtimeHours,
      s.payableDays,
      s.basePay,
      s.overtimePay,
      s.deductions,
      s.netPay,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Workforce_Payroll_${project.name.substring(0, 10)}_${selectedPeriod}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    const periodLabel =
      selectedPeriod === "all"
        ? "Lifetime Payout"
        : new Date(selectedPeriod + "-01").toLocaleString("default", {
            month: "long",
            year: "numeric",
          });

    onApprovePayroll(totalNetPay, periodLabel, currentUserName);
    setIsApproveModalOpen(false);
    setApprovalSuccess(
      `✓ Workforce payroll of ₹${totalNetPay.toLocaleString("en-IN")} successfully approved and synced as Project Expense!`
    );

    setTimeout(() => {
      setApprovalSuccess(null);
    }, 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Muster Roll & Wages
            </span>
            <span className="text-xs text-slate-500">
              Project: {project.name}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            Workforce Payroll & Wage Disbursal Calculator
          </h2>
          <p className="text-xs text-slate-500">
            Calculated from verified daily biometric and geofence attendance records.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="all">All Dates (Cumulative)</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            Muster PDF
          </button>

          {/* Approve Payroll Action */}
          {canApprove && (
            <button
              onClick={() => setIsApproveModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve & Sync Expense
            </button>
          )}
        </div>
      </div>

      {approvalSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{approvalSuccess}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Total Net Payroll
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalNetPay.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {summaries.length} Workers Included
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Base Wages Outlay
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalBasePay.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500">
            {totalPayableDays} Total Man-Days
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Overtime Wages
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalOvertimePay.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">
            1.5× Premium Rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Average Wage / Day
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ₹{Math.round(totalNetPay / (totalPayableDays || 1))}
          </div>
          <span className="text-[11px] text-slate-500">
            Per Verified Shift
          </span>
        </div>
      </div>

      {/* Detailed Payroll Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Workforce Compensation Ledger
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Formula: (Daily Rate × Payable Days) + (OT Hours × Rate × 1.5) − Deductions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Labour ID & Name</th>
                <th className="p-3">Trade / Role</th>
                <th className="p-3 text-right">Daily Rate</th>
                <th className="p-3 text-center">Pres / Half / Abs</th>
                <th className="p-3 text-center">OT (Hrs)</th>
                <th className="p-3 text-right">Payable Days</th>
                <th className="p-3 text-right">Base Pay</th>
                <th className="p-3 text-right">OT Pay</th>
                <th className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  Net Disbursal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {summaries.map((s) => (
                <tr
                  key={s.worker.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                >
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {s.worker.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {s.worker.employeeId || `LAB-${s.worker.id}`}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      {s.worker.role}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold">
                    ₹{s.worker.dailyWage}
                  </td>
                  <td className="p-3 text-center font-mono">
                    <span className="text-emerald-600 font-bold">{s.presentDays}</span> /{" "}
                    <span className="text-amber-600">{s.halfDays}</span> /{" "}
                    <span className="text-red-500">{s.absentDays}</span>
                  </td>
                  <td className="p-3 text-center font-mono">
                    {s.overtimeHours > 0 ? (
                      <span className="font-bold text-amber-600">{s.overtimeHours} hrs</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {s.payableDays} days
                  </td>
                  <td className="p-3 text-right">
                    ₹{s.basePay.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 text-right text-amber-600 font-medium">
                    +₹{s.overtimePay.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100 text-sm">
                    ₹{s.netPay.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/70 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="p-3">
                  Workforce Total ({summaries.length} Personnel)
                </td>
                <td className="p-3 text-right">--</td>
                <td className="p-3 text-center">--</td>
                <td className="p-3 text-center">--</td>
                <td className="p-3 text-right">{totalPayableDays} Days</td>
                <td className="p-3 text-right">₹{totalBasePay.toLocaleString("en-IN")}</td>
                <td className="p-3 text-right text-amber-600">₹{totalOvertimePay.toLocaleString("en-IN")}</td>
                <td className="p-3 text-right text-sm text-emerald-600">
                  ₹{totalNetPay.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Approve Workforce Payroll
                </h3>
                <p className="text-xs text-slate-500">
                  Period: {selectedPeriod} • Project: {project.name}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Net Amount:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  ₹{totalNetPay.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Approved By:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentUserName} ({userRole.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expense Category:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Labor / Workforce Disbursal
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Upon approval, this ₹{totalNetPay.toLocaleString("en-IN")} wage disbursement will automatically create a verified entry under <strong>Project Expenses & Finance</strong>, updating the project's financial utilization and audit logs.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Approval & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
