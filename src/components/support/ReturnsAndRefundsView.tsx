import React, { useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
  DollarSign,
  Package,
  Eye,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";
import { ReturnRequest, RefundRecord, ReturnStatus, User, Project } from "../../types";
import { supportService } from "../../services/supportService";

interface ReturnsAndRefundsViewProps {
  returns: ReturnRequest[];
  refunds: RefundRecord[];
  currentUser: User;
  projects: Project[];
  onNewReturn: () => void;
  onAskAI?: (query: string) => void;
}

export const ReturnsAndRefundsView: React.FC<ReturnsAndRefundsViewProps> = ({
  returns,
  refunds,
  currentUser,
  projects,
  onNewReturn,
  onAskAI,
}) => {
  const [activeTab, setActiveTab] = useState<"returns" | "refunds">("returns");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    returns.length > 0 ? returns[0] : null
  );
  const [actionNotes, setActionNotes] = useState<string>("");

  const isContractorOrPM =
    currentUser.role === "contractor" ||
    currentUser.role === "project_manager" ||
    currentUser.role === "admin";

  const filteredReturns = returns.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const handleApprove = (returnId: string) => {
    supportService.updateReturnStatus(
      returnId,
      "Approved",
      currentUser.name,
      actionNotes || "Return approved for pickup and warehouse quality verification."
    );
    setActionNotes("");
    const updated = supportService.getReturns().find((r) => r.id === returnId);
    if (updated) setSelectedReturn(updated);
  };

  const handleUpdateLogistics = (returnId: string, nextStatus: ReturnStatus) => {
    supportService.updateReturnStatus(
      returnId,
      nextStatus,
      currentUser.name,
      actionNotes || `Material logistics updated to ${nextStatus}.`
    );
    setActionNotes("");
    const updated = supportService.getReturns().find((r) => r.id === returnId);
    if (updated) setSelectedReturn(updated);
  };

  const handleProcessRefund = (ret: ReturnRequest) => {
    supportService.updateReturnStatus(
      ret.id,
      "Refund Completed",
      currentUser.name,
      "Quality inspection passed. Refund credit processed directly to project commercial ledger."
    );

    supportService.createRefundRecord({
      id: `REF-2026-000${Math.floor(100 + Math.random() * 900)}`,
      returnId: ret.id,
      returnNumber: ret.id,
      transactionId: ret.transactionId,
      transactionNumber: ret.transactionNumber,
      projectId: ret.projectId,
      projectName: ret.projectName,
      amount: ret.requestedRefundAmount,
      method: "Bank Transfer (NEFT/RTGS)",
      status: "Completed",
      requestedDate: ret.createdAt.split("T")[0],
      completedDate: new Date().toISOString().split("T")[0],
      processedBy: currentUser.name,
      notes: "Commercial refund credit released following warehouse return inspection.",
    });

    const updated = supportService.getReturns().find((r) => r.id === ret.id);
    if (updated) setSelectedReturn(updated);
  };

  const handleReject = (returnId: string) => {
    supportService.updateReturnStatus(
      returnId,
      "Rejected",
      currentUser.name,
      actionNotes || "Return rejected after site review."
    );
    setActionNotes("");
    const updated = supportService.getReturns().find((r) => r.id === returnId);
    if (updated) setSelectedReturn(updated);
  };

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case "Approved":
      case "Refund Completed":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case "Under Review":
      case "Return Requested":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> {status}</span>;
      case "Material Pickup / Return":
      case "Inspection":
      case "Refund Processing":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1 w-fit"><Truck className="w-3.5 h-3.5" /> {status}</span>;
      case "Rejected":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div id="returns-refunds-view" className="space-y-6">
      {/* View Header with Sub-tabs & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("returns")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "returns"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Material Returns ({returns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("refunds")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "refunds"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Refund Records ({refunds.length})</span>
          </button>
        </div>

        <button
          onClick={onNewReturn}
          className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Raise New Return
        </button>
      </div>

      {activeTab === "returns" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Returns List */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-600">Filter by Pipeline:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value="all">All ({returns.length})</option>
                <option value="Return Requested">Return Requested</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Material Picked Up">Material Picked Up</option>
                <option value="Refund Completed">Refund Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredReturns.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                  <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">No return requests found</p>
                </div>
              ) : (
                filteredReturns.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReturn(r)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      selectedReturn?.id === r.id
                        ? "bg-amber-50/40 border-amber-300 ring-2 ring-amber-400/20 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{r.id}</span>
                      {getStatusBadge(r.status)}
                    </div>
                    <div className="font-bold text-sm text-slate-800 mt-2 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{r.materialName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <span>Claim: ₹{Number(r.requestedRefundAmount).toLocaleString("en-IN")}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Selected Return Pipeline & Inspector */}
          <div className="lg:col-span-7">
            {selectedReturn ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{selectedReturn.id}</h3>
                      {getStatusBadge(selectedReturn.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Linked Transaction: <strong className="font-mono text-slate-700">{selectedReturn.transactionNumber}</strong>
                    </p>
                  </div>

                  {onAskAI && (
                    <button
                      onClick={() => onAskAI(`What is the progress and timeline of return ${selectedReturn.id}?`)}
                      className="px-3 py-1.5 text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-colors"
                    >
                      Ask AI About Return
                    </button>
                  )}
                </div>

                {/* Return Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity</span>
                    <span className="font-bold text-slate-800">{selectedReturn.quantity} {selectedReturn.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Claim Value</span>
                    <span className="font-bold text-slate-800">₹{Number(selectedReturn.requestedRefundAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Reason</span>
                    <span className="font-bold text-slate-800 truncate block">{selectedReturn.reason}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Condition</span>
                    <span className="font-bold text-slate-800 truncate block">{selectedReturn.condition}</span>
                  </div>
                </div>

                {/* Description & Impact */}
                <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-950 block">Site Observation & Defect Notes:</span>
                  <p className="text-slate-700 leading-relaxed">{selectedReturn.description}</p>
                </div>

                {/* Visual Pipeline Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Return Progression Timeline
                  </h4>
                  <div className="space-y-3">
                    {selectedReturn.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-full mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{step.status}</span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(step.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1">{step.notes}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">Updated by: {step.actor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contractor / Admin Action Panel */}
                {isContractorOrPM && selectedReturn.status !== "Refund Completed" && selectedReturn.status !== "Rejected" && (
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold">Contractor / Manager Action Desk</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Current Role: {currentUser.role}</span>
                    </div>

                    <input
                      type="text"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Add resolution or dispatch notes..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {selectedReturn.status === "Under Review" || selectedReturn.status === "Return Requested" ? (
                        <>
                          <button
                            onClick={() => handleApprove(selectedReturn.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Return Claim
                          </button>
                          <button
                            onClick={() => handleReject(selectedReturn.id)}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject Claim
                          </button>
                        </>
                      ) : selectedReturn.status === "Approved" ? (
                        <button
                          onClick={() => handleUpdateLogistics(selectedReturn.id, "Material Pickup / Return")}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" /> Confirm Material Pickup
                        </button>
                      ) : selectedReturn.status === "Material Pickup / Return" ? (
                        <button
                          onClick={() => handleUpdateLogistics(selectedReturn.id, "Inspection")}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete QC Inspection
                        </button>
                      ) : (
                        <button
                          onClick={() => handleProcessRefund(selectedReturn)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Authorize & Release Refund (₹{Number(selectedReturn.requestedRefundAmount).toLocaleString("en-IN")})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-slate-600">Select a return request from the left</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Refunds Ledger Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Refund ID</th>
                  <th className="py-3.5 px-4">Processed Date</th>
                  <th className="py-3.5 px-4">Return ID / TXN</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Bank UTR / Ref</th>
                  <th className="py-3.5 px-4 text-right">Refund Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No refund records processed yet.
                    </td>
                  </tr>
                ) : (
                  refunds.map((rf) => (
                    <tr key={rf.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{rf.id}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {rf.processedDate || rf.requestedDate || "Processed"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        <div>{rf.returnId}</div>
                        <span className="text-[10px] text-slate-400">{rf.transactionNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">{rf.projectName}</td>
                      <td className="py-3.5 px-4 text-slate-700">{rf.method}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{rf.referenceNumber || "BANK-CONFIRMED"}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                        ₹{Number(rf.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          {rf.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
