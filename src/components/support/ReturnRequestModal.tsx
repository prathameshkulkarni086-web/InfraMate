import React, { useState } from "react";
import {
  X,
  RotateCcw,
  AlertTriangle,
  Camera,
  Upload,
  CheckCircle2,
  DollarSign,
  Package,
  Building2,
  Info,
} from "lucide-react";
import { Transaction, ReturnReason, ReturnCondition, ReturnResolution, User } from "../../types";
import { supportService } from "../../services/supportService";

interface ReturnRequestModalProps {
  transaction?: Transaction | null;
  transactions: Transaction[];
  currentUser: User;
  onClose: () => void;
  onSuccess: (returnId: string) => void;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  transaction: initialTransaction,
  transactions,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const eligibleTransactions = transactions.filter(
    (t) => t.type === "Material Purchase" && (!t.returnStatus || t.returnStatus === "None")
  );

  const [selectedTxnId, setSelectedTxnId] = useState<string>(
    initialTransaction?.id || eligibleTransactions[0]?.id || ""
  );

  const activeTxn =
    transactions.find((t) => t.id === selectedTxnId) || initialTransaction || eligibleTransactions[0];

  const maxQty = activeTxn?.quantity || 1;
  const [returnQty, setReturnQty] = useState<number>(Math.min(1, maxQty));
  const [reason, setReason] = useState<ReturnReason>("Damaged material");
  const [condition, setCondition] = useState<ReturnCondition>("Physically Damaged");
  const [preferredResolution, setPreferredResolution] = useState<ReturnResolution>("Replacement Material");
  const [description, setDescription] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const unitPrice = activeTxn?.unitPrice || (activeTxn?.quantity ? activeTxn.amount / activeTxn.quantity : activeTxn?.amount || 0);
  const estimatedRefund = Math.round(unitPrice * returnQty);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxn) {
      setError("Please select a valid transaction.");
      return;
    }
    if (returnQty <= 0 || returnQty > maxQty) {
      setError(`Return quantity must be between 1 and ${maxQty} ${activeTxn.unit || "units"}.`);
      return;
    }
    if (!description.trim()) {
      setError("Please provide a brief description of the defect or reason for return.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newReturn = supportService.createReturnRequest({
        transactionId: activeTxn.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        reason,
        condition,
        quantity: returnQty,
        description,
        photos,
        preferredResolution,
        contractorId: activeTxn.contractorId,
        contractorName: activeTxn.contractorName,
      });

      onSuccess(newReturn.id);
    } catch (err: any) {
      setError(err?.message || "Failed to submit return request.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        id="return-request-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Raise Material Return Request</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit damage or return claim for verification, replacement, or refund credit.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Transaction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Procurement Transaction <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTxnId}
              onChange={(e) => {
                setSelectedTxnId(e.target.value);
                const t = transactions.find((x) => x.id === e.target.value);
                if (t && t.quantity) {
                  setReturnQty(Math.min(returnQty, t.quantity));
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {eligibleTransactions.length === 0 && (
                <option value="">No eligible purchase transactions found</option>
              )}
              {eligibleTransactions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.materialName} ({t.quantity || 1} {t.unit || "units"}) — ₹{Number(t.amount).toLocaleString("en-IN")} — {t.vendorName}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Transaction Summary Card */}
          {activeTxn && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  {activeTxn.materialName}
                </span>
                <span className="font-mono text-slate-500">{activeTxn.invoiceNumber || "INV-DIRECT"}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Vendor</span>
                  <span className="font-medium text-slate-800 truncate block">{activeTxn.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Purchased</span>
                  <span className="font-medium text-slate-800">{activeTxn.quantity || 1} {activeTxn.unit || "units"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Unit Rate</span>
                  <span className="font-medium text-slate-800">₹{Number(unitPrice).toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contractor</span>
                  <span className="font-medium text-slate-800 truncate block">{activeTxn.contractorName || "Gurpreet Singh"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Return Quantity & Reason Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Quantity to Return <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                  {activeTxn?.unit || "units"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Maximum returnable: {maxQty} {activeTxn?.unit || "units"}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Primary Return Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Damaged material">Damaged material / In-transit defect</option>
                <option value="Defective product">Defective product / Failed QC check</option>
                <option value="Wrong material">Wrong material / Specification mismatch</option>
                <option value="Wrong quantity">Wrong quantity / Excess delivery</option>
                <option value="Delivery issue">Delivery delayed / Unfit for site use</option>
                <option value="Duplicate order">Duplicate order</option>
                <option value="Other">Other reason</option>
              </select>
            </div>
          </div>

          {/* Condition & Resolution Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Material Physical Condition <span className="text-rose-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ReturnCondition)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Physically Damaged">Physically Damaged / Corroded / Broken</option>
                <option value="Defective Batch">Defective Batch / Mismatched Grade</option>
                <option value="Unopened / In Original Packaging">Unopened / In Original Packaging</option>
                <option value="Opened / Intact">Opened / Intact</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Preferred Resolution <span className="text-rose-500">*</span>
              </label>
              <select
                value={preferredResolution}
                onChange={(e) => setPreferredResolution(e.target.value as ReturnResolution)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Replacement Material">Replacement Material (Same Spec)</option>
                <option value="Full Refund">Full Refund to Account / Bank</option>
                <option value="Store Credit / Adjustment">Store Credit / Vendor Credit Note</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Detailed Observation & Site Impact <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Unloaded bundle #B-19 had severe rust oxidation and failed IS 1786 bend testing. Need immediate replacement for Friday casting."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Photo Upload / Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Photo Evidence / Defect Proof (Optional)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Attach Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photos.map((url, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={url} alt={`proof-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Refund Summary Callout */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-950 block">Estimated Claim Value</span>
                <span className="text-xs text-amber-800">
                  {returnQty} {activeTxn?.unit || "units"} @ ₹{Number(unitPrice).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="text-xl font-extrabold text-amber-950">
              ₹{estimatedRefund.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !activeTxn}
              className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" /> Submit Return Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
