import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  Plus,
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Package,
  CreditCard,
  Calendar,
  DollarSign,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Transaction, TransactionType, PaymentStatus, DeliveryStatus, ReturnStatus, Project, User } from "../../types";

interface TransactionHistoryTableProps {
  transactions: Transaction[];
  projects: Project[];
  currentUser: User;
  onViewDetails: (transaction: Transaction) => void;
  onRequestReturn: (transaction: Transaction) => void;
  onNewTransaction?: () => void;
  onAskAI?: (query: string) => void;
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  transactions,
  projects,
  currentUser,
  onViewDetails,
  onRequestReturn,
  onNewTransaction,
  onAskAI,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState<string>("all");
  const [selectedReturnStatus, setSelectedReturnStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Project filter
      if (selectedProjectId !== "all" && t.projectId !== selectedProjectId) return false;

      // Type filter
      if (selectedType !== "all" && t.type !== selectedType) return false;

      // Payment status
      if (selectedPaymentStatus !== "all" && t.paymentStatus !== selectedPaymentStatus) return false;

      // Delivery status
      if (selectedDeliveryStatus !== "all" && t.deliveryStatus !== selectedDeliveryStatus) return false;

      // Return status
      if (selectedReturnStatus !== "all") {
        if (selectedReturnStatus === "has_return" && (!t.returnStatus || t.returnStatus === "None")) return false;
        if (selectedReturnStatus !== "has_return" && t.returnStatus !== selectedReturnStatus) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          t.id.toLowerCase().includes(q) ||
          t.materialName?.toLowerCase().includes(q) ||
          t.vendorName.toLowerCase().includes(q) ||
          t.invoiceNumber?.toLowerCase().includes(q) ||
          t.purchaseOrderNumber?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    transactions,
    selectedProjectId,
    selectedType,
    selectedPaymentStatus,
    selectedDeliveryStatus,
    selectedReturnStatus,
    searchQuery,
  ]);

  // Metric computations
  const totalAmount = useMemo(() => filtered.reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [filtered]);
  const totalPurchases = useMemo(
    () => filtered.filter((t) => t.type === "Material Purchase").reduce((acc, t) => acc + (Number(t.amount) || 0), 0),
    [filtered]
  );
  const activeReturnsCount = useMemo(
    () => filtered.filter((t) => t.returnStatus && t.returnStatus !== "None" && t.returnStatus !== "Refund Completed").length,
    [filtered]
  );
  const inTransitCount = useMemo(() => filtered.filter((t) => t.deliveryStatus === "In Transit").length, [filtered]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "Project",
      "Type",
      "Item / Service",
      "Vendor",
      "Quantity",
      "Unit",
      "Unit Price",
      "Tax",
      "Amount",
      "Payment Method",
      "Payment Status",
      "Invoice Number",
      "PO Number",
      "Delivery Status",
      "Return Status",
    ];

    const rows = filtered.map((t) => [
      t.id,
      t.date,
      t.projectName,
      t.type,
      `"${(t.materialName || "").replace(/"/g, '""')}"`,
      `"${t.vendorName.replace(/"/g, '""')}"`,
      t.quantity || "",
      t.unit || "",
      t.unitPrice || "",
      t.tax || "",
      t.amount,
      t.paymentMethod,
      t.paymentStatus,
      t.invoiceNumber || "",
      t.purchaseOrderNumber || "",
      t.deliveryStatus,
      t.returnStatus || "None",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `infrasync_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "Paid":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">Paid</span>;
      case "Pending":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-200">Pending</span>;
      case "Refunded":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-800 rounded-full border border-purple-200">Refunded</span>;
      case "Partially Paid":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">Partial</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-800 rounded-full">{status}</span>;
    }
  };

  const getDeliveryStatusBadge = (delivery: DeliveryStatus) => {
    switch (delivery) {
      case "Delivered":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
      case "In Transit":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-200 flex items-center gap-1 w-fit"><Truck className="w-3 h-3" /> In Transit</span>;
      case "Returned":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 rounded-full border border-rose-200 flex items-center gap-1 w-fit"><RotateCcw className="w-3 h-3" /> Returned</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-50 text-slate-700 rounded-full border border-slate-200">{delivery}</span>;
    }
  };

  return (
    <div id="transaction-history-view" className="space-y-6">
      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtered Value</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalAmount.toLocaleString("en-IN")}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{filtered.length} total records</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Procurement</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{totalPurchases.toLocaleString("en-IN")}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Supplies & Raw Materials</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Return Claims</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {activeReturnsCount}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Under review or pickup</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Transit Deliveries</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-700 mt-2">
            {inTransitCount}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Live logistics on site</span>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by TXN ID, item, vendor, invoice #..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                showFilters || selectedProjectId !== "all" || selectedType !== "all"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(selectedProjectId !== "all" || selectedType !== "all" || selectedPaymentStatus !== "all") && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {onNewTransaction && (
              <button
                onClick={onNewTransaction}
                className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record Purchase</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Project Site</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Transaction Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="all">All Types</option>
                <option value="Material Purchase">Material Purchase</option>
                <option value="Material Sale">Material Sale</option>
                <option value="Payment">Payment</option>
                <option value="Expense">Expense</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Refund">Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Status</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Delivery Status</label>
              <select
                value={selectedDeliveryStatus}
                onChange={(e) => setSelectedDeliveryStatus(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="all">All Deliveries</option>
                <option value="Delivered">Delivered</option>
                <option value="In Transit">In Transit</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Return Status</label>
              <select
                value={selectedReturnStatus}
                onChange={(e) => setSelectedReturnStatus(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="all">All Returns</option>
                <option value="has_return">Any Active Return</option>
                <option value="Return Requested">Return Requested</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Refund Completed">Refund Completed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Item / Description</th>
                <th className="py-3.5 px-4">Vendor / Trade</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-center">Delivery</th>
                <th className="py-3.5 px-4 text-center">Return</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">No transactions found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* ID & Type */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{t.id}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{t.type}</span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Item / Material */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-slate-800 block truncate">{t.materialName || t.type}</span>
                      {t.quantity !== undefined && (
                        <span className="text-[11px] text-slate-500 block">
                          Qty: {t.quantity} {t.unit || "units"}
                        </span>
                      )}
                    </td>

                    {/* Vendor */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-medium">
                      {t.vendorName}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 block">
                        ₹{Number(t.amount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.invoiceNumber || "INV-NONE"}</span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getPaymentStatusBadge(t.paymentStatus)}
                    </td>

                    {/* Delivery Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex justify-center">{getDeliveryStatusBadge(t.deliveryStatus)}</div>
                    </td>

                    {/* Return State */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {t.returnStatus && t.returnStatus !== "None" ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          {t.returnStatus}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewDetails(t)}
                          title="View Digital Voucher"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {t.type === "Material Purchase" && (!t.returnStatus || t.returnStatus === "None") && (
                          <button
                            onClick={() => onRequestReturn(t)}
                            title="Request Return / Replacement"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {onAskAI && (
                          <button
                            onClick={() => onAskAI(`What is the status and verification details for ${t.id}?`)}
                            title="Ask 24/7 AI Support"
                            className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filtered.length} of {transactions.length} commercial transactions</span>
          <span>Click any eye icon to inspect invoices and GST vouchers</span>
        </div>
      </div>
    </div>
  );
};
