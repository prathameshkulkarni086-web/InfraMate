import React, { useState } from "react";
import {
  DollarSign,
  Plus,
  Filter,
  Search,
  FileDown,
  Trash2,
  Receipt,
  CreditCard,
  Building,
  Upload,
  Calendar,
  X,
  TrendingUp,
} from "lucide-react";
import { Expense, ExpenseCategory, PaymentMethod, Project, UserRole } from "../../types";
import { pdfService } from "../../services/pdfService";

interface ExpensesViewProps {
  expenses: Expense[];
  project: Project;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  userRole: UserRole;
  isOpenAddModal: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  project,
  onSaveExpense,
  onDeleteExpense,
  userRole,
  isOpenAddModal,
  onCloseAddModal,
  onOpenAddModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [formData, setFormData] = useState<{
    category: ExpenseCategory;
    description: string;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    invoiceNumber: string;
    vendorName: string;
  }>({
    category: "Materials",
    description: "",
    amount: 25000,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer (NEFT)",
    invoiceNumber: "",
    vendorName: "",
  });

  const categories: (ExpenseCategory | "All")[] = [
    "All",
    "Materials",
    "Labor",
    "Equipment",
    "Transportation",
    "Electricity",
    "Permits & Architectural",
    "Other",
  ];

  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.vendorName && e.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalFilteredSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProjectSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const canManageExpenses = userRole === "admin" || userRole === "project_manager" || userRole === "site_engineer";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      projectId: project.id,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      addedBy: "Active User",
      paymentMethod: formData.paymentMethod,
      invoiceNumber: formData.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName: formData.vendorName || "Direct Vendor",
    };

    onSaveExpense(newExpense);
    onCloseAddModal();
    setFormData({
      category: "Materials",
      description: "",
      amount: 25000,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer (NEFT)",
      invoiceNumber: "",
      vendorName: "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project Expenditure & Petty Cash Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track vendor payments, GST invoices, equipment rentals, and labor disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => pdfService.generateExpenseReport(project, expenses)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <FileDown className="h-3.5 w-3.5 text-blue-600" />
            <span>Audit PDF</span>
          </button>

          {canManageExpenses && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Spent</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">₹{totalProjectSpent.toLocaleString()}</div>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            {Math.round((totalProjectSpent / (project.budget || 1)) * 100)}% of ₹{project.budget.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining Budget</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ₹{(project.budget - totalProjectSpent).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">Balance allocation across upcoming phases</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filtered Total</span>
          <div className="mt-2 text-2xl font-bold text-blue-600">₹{totalFilteredSpent.toLocaleString()}</div>
          <div className="mt-2 text-xs text-slate-500">{filteredExpenses.length} transactions matched</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, invoice, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Expenses List: Desktop Table + Mobile Cards */}
      {/* 1. Desktop & Tablet Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3.5">Date & Invoice</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Vendor / Payee</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5 text-right">Amount (₹)</th>
                {canManageExpenses && <th className="px-4 py-3.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No expense records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{exp.date}</div>
                      <div className="text-[10px] text-slate-400">{exp.invoiceNumber || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 line-clamp-1">{exp.description}</div>
                      <div className="text-[10px] text-slate-400">By: {exp.addedBy}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {exp.vendorName || "Direct Site Expense"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{exp.paymentMethod}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-900">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    {canManageExpenses && (
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No expense records found matching filters.
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5 transition active:bg-slate-50/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                    {exp.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">{exp.date}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  ₹{exp.amount.toLocaleString()}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800 leading-snug">{exp.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span>{exp.vendorName || "Direct Site Expense"}</span>
                  {exp.invoiceNumber && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400">{exp.invoiceNumber}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">{exp.paymentMethod}</span>
                {canManageExpenses && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete expense "${exp.description}"?`)) {
                        onDeleteExpense(exp.id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 min-h-[36px] px-2 py-1 -mr-2 rounded-lg hover:bg-red-50 transition font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      {isOpenAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Construction Expense</h3>
                <p className="text-xs text-slate-500">Log material receipts, plant rentals or contractor payments</p>
              </div>
              <button
                onClick={onCloseAddModal}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  >
                    {categories
                      .filter((c) => c !== "All")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Item Detail</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., 200 bags Grade 53 OPC Cement delivery for footing"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    placeholder="e.g., UltraTech Hub"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice / Receipt No.</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="e.g., INV-8492"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  >
                    <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                    <option value="UPI / Instant">UPI / Instant</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseAddModal}
                  className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 min-h-[44px] transition flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs min-h-[44px] transition flex items-center justify-center"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
