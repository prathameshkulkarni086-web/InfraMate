import React from "react";
import {
  X,
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  RotateCcw,
  MessageSquare,
  User,
  Calendar,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Transaction } from "../../types";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRequestReturn?: (transaction: Transaction) => void;
  onAskAI?: (query: string) => void;
  onEscalate?: (transaction: Transaction) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose,
  onRequestReturn,
  onAskAI,
  onEscalate,
}) => {
  if (!transaction) return null;

  const handlePrintInvoice = () => {
    window.print();
  };

  const getStatusBadge = (status: Transaction["paymentStatus"]) => {
    switch (status) {
      case "Paid":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>;
      case "Pending":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case "Refunded":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Refunded</span>;
      case "Partially Paid":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Partial</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  const getDeliveryBadge = (delivery: Transaction["deliveryStatus"]) => {
    switch (delivery) {
      case "Delivered":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>;
      case "In Transit":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1"><Truck className="w-3.5 h-3.5 animate-pulse" /> In Transit</span>;
      case "Dispatched":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Dispatched</span>;
      case "Returned":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Returned</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {delivery}</span>;
    }
  };

  const canReturn = transaction.type === "Material Purchase" && (!transaction.returnStatus || transaction.returnStatus === "None");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        id="transaction-details-modal"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{transaction.id}</h3>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                  {transaction.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Created on {new Date(transaction.date).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Payment Status</span>
              <div className="mt-1.5">{getStatusBadge(transaction.paymentStatus)}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Delivery Status</span>
              <div className="mt-1.5">{getDeliveryBadge(transaction.deliveryStatus)}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Return State</span>
              <div className="mt-1.5">
                {transaction.returnStatus && transaction.returnStatus !== "None" ? (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 w-fit">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {transaction.returnStatus}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">Standard Purchase</span>
                )}
              </div>
            </div>
          </div>

          {/* Amount & Commercial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-100/80">
            <div>
              <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Total Transaction Value</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                ₹{Number(transaction.amount).toLocaleString("en-IN")}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Method: <strong>{transaction.paymentMethod}</strong></span>
              </div>
              {transaction.tax !== undefined && (
                <p className="text-xs text-slate-500 mt-1">Includes GST / Tax: ₹{Number(transaction.tax).toLocaleString("en-IN")}</p>
              )}
            </div>

            <div className="space-y-2 text-sm border-t md:border-t-0 md:border-l md:pl-6 border-blue-100/80 pt-3 md:pt-0">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-semibold text-slate-800 font-mono">{transaction.invoiceNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase Order:</span>
                <span className="font-semibold text-slate-800 font-mono">{transaction.purchaseOrderNumber || "PO-DIRECT"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project:</span>
                <span className="font-medium text-slate-800 truncate max-w-[180px]">{transaction.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recorded By:</span>
                <span className="font-medium text-slate-800">{transaction.createdByName || transaction.createdBy}</span>
              </div>
            </div>
          </div>

          {/* Material & Vendor Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Item & Procurement Specs</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{transaction.materialName || "Commercial Service / Item"}</p>
              {transaction.quantity !== undefined && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Quantity: <strong>{transaction.quantity} {transaction.unit || "units"}</strong></div>
                  {transaction.unitPrice && (
                    <div>Unit Price: <strong>₹{Number(transaction.unitPrice).toLocaleString("en-IN")}</strong> per {transaction.unit || "unit"}</div>
                  )}
                  {transaction.category && <div>Category: <span className="font-medium text-slate-800">{transaction.category}</span></div>}
                </div>
              )}
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Vendor / Trade Partner</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{transaction.vendorName}</p>
              {transaction.contractorName && (
                <div className="text-xs text-slate-600">
                  <span>Assigned Contractor: </span>
                  <strong className="text-slate-800">{transaction.contractorName}</strong>
                </div>
              )}
              <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1 w-fit">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Supplier Lot
              </div>
            </div>
          </div>

          {/* Notes & Verification */}
          {transaction.notes && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Site & Verification Remarks:</span>
              <p className="text-xs text-slate-600 leading-relaxed">{transaction.notes}</p>
            </div>
          )}

          {/* Quick AI & Return Options Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold">Need assistance with this transaction?</span>
              </div>
              <p className="text-xs text-slate-300">
                Ask our 24/7 AI Assistant, request a material return, or notify contractor Gurpreet Singh.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onAskAI && (
                <button
                  onClick={() => {
                    onClose();
                    onAskAI(`Tell me details and verification info about transaction ${transaction.id}`);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask AI
                </button>
              )}
              {canReturn && onRequestReturn && (
                <button
                  onClick={() => {
                    onClose();
                    onRequestReturn(transaction);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Raise Return
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handlePrintInvoice}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-slate-500" /> Print Digital Voucher
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
