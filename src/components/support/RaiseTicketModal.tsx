import React, { useState } from "react";
import {
  X,
  LifeBuoy,
  AlertCircle,
  Package,
  Receipt,
  RotateCcw,
  Send,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import {
  User,
  Project,
  TicketCategory,
  TicketPriority,
  Transaction,
  ReturnRequest,
} from "../../types";
import { supportService } from "../../services/supportService";

interface RaiseTicketModalProps {
  currentUser: User;
  projects: Project[];
  activeProject?: Project;
  transactions: Transaction[];
  returns: ReturnRequest[];
  prefilledTransactionId?: string;
  prefilledReturnId?: string;
  onClose: () => void;
  onSuccess: (ticketId: string) => void;
}

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  currentUser,
  projects,
  activeProject,
  transactions,
  returns,
  prefilledTransactionId,
  prefilledReturnId,
  onClose,
  onSuccess,
}) => {
  const [projectId, setProjectId] = useState<string>(
    activeProject?.id || (projects.length > 0 ? projects[0].id : "proj-1")
  );
  const [category, setCategory] = useState<TicketCategory>("Transaction");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [relatedTxnId, setRelatedTxnId] = useState<string>(prefilledTransactionId || "");
  const [relatedRetId, setRelatedRetId] = useState<string>(prefilledReturnId || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProj = projects.find((p) => p.id === projectId) || activeProject;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Please enter a subject or title for your support query.");
      return;
    }
    if (!description.trim()) {
      setError("Please explain your inquiry or problem in detail.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newTicket = supportService.createTicket({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: currentUser.phone,
        userRole: currentUser.role,
        projectId: projectId,
        projectName: selectedProj?.name || "Project Site",
        contractorId: "usr-cont-1",
        contractorName: "Gurpreet Singh (Apex Contractors)",
        category,
        priority,
        subject,
        description,
        relatedTransactionId: relatedTxnId || undefined,
        relatedReturnId: relatedRetId || undefined,
        source: "web",
        initialMessage: description,
      });

      onSuccess(newTicket.id);
    } catch (err: any) {
      setError(err?.message || "Failed to create support ticket.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        id="raise-ticket-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Raise Support Query</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Our 24/7 AI System and assigned contractor will review and address your inquiry.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Project Site <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Inquiry Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Transaction">Transaction / Commercial Ledger</option>
                <option value="Payment">Payment & Billing Milestone</option>
                <option value="Material">Material Quality & Supply</option>
                <option value="Purchase Order">Purchase Order (PO)</option>
                <option value="Delivery">Delivery & Transit Delay</option>
                <option value="Return">Material Return Request</option>
                <option value="Refund">Refund / Credit Processing</option>
                <option value="Invoice">Invoice / Tax GST Query</option>
                <option value="Contractor">Contractor Coordination</option>
                <option value="Technical Issue">Technical Site Issue</option>
                <option value="Other">Other Query</option>
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Urgency / Priority Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["Low", "Medium", "High", "Urgent"] as TicketPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    priority === p
                      ? p === "Urgent"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : p === "High"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Subject / Short Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Discrepancy in cement bag count for TXN-2026-004821"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Query Details & Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details so our 24/7 AI and contractor can investigate..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Linked Transaction / Return (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Link to Transaction (Optional)
              </label>
              <select
                value={relatedTxnId}
                onChange={(e) => setRelatedTxnId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="">-- None --</option>
                {transactions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.materialName || t.type} (₹{Number(t.amount).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Link to Return Request (Optional)
              </label>
              <select
                value={relatedRetId}
                onChange={(e) => setRelatedRetId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="">-- None --</option>
                {returns.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.materialName} ({r.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Creating Ticket...</>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Raise Support Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
