import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  UserCheck,
  FileText,
  CheckSquare,
  MessageSquare,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { QualityInspection, QualityDefect, InspectionPhoto } from "../../types/inspection";
import { User } from "../../types";

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: QualityInspection;
  currentUser: User;
  onUpdateStatus: (inspectionId: string, status: QualityInspection["status"], remarks?: string) => void;
  onCreateDefect: (defect: QualityDefect) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  isOpen,
  onClose,
  inspection,
  currentUser,
  onUpdateStatus,
  onCreateDefect,
}) => {
  const [reviewRemarks, setReviewRemarks] = useState<string>("");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [showDefectForm, setShowDefectForm] = useState<boolean>(false);
  const [defectIssue, setDefectIssue] = useState<string>("");
  const [defectDescription, setDefectDescription] = useState<string>("");
  const [defectSeverity, setDefectSeverity] = useState<"low" | "medium" | "high" | "critical">("high");

  if (!isOpen) return null;

  const currentPhoto = inspection.photos[activePhotoIndex] || inspection.photos[0];

  const handleCreateDefectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectIssue.trim()) return;

    const newDefect: QualityDefect = {
      id: `DEF-${Date.now().toString().slice(-6)}`,
      inspectionId: inspection.id,
      photoId: currentPhoto?.id,
      photoUrl: currentPhoto?.imageUrl,
      projectId: inspection.projectId,
      projectName: inspection.projectName,
      siteId: inspection.siteId,
      siteName: inspection.siteName,
      location: inspection.location,
      issue: defectIssue,
      description: defectDescription,
      severity: defectSeverity,
      priority: defectSeverity === "critical" ? "urgent" : "high",
      status: "open",
      assignedToId: currentUser.id,
      assignedToName: currentUser.name,
      reportedById: currentUser.id,
      reportedByName: currentUser.name,
      reportedAt: new Date().toISOString(),
      correctiveAction: inspection.actionRequired || "Rectify as per structural specifications.",
    };

    onCreateDefect(newDefect);
    setShowDefectForm(false);
    setDefectIssue("");
    setDefectDescription("");
    alert("Quality Defect successfully reported and logged.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto safe-bottom">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 safe-bottom">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {inspection.title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {inspection.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {inspection.projectName} &bull; Site: <span className="font-semibold">{inspection.siteName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 touch-scroll">
          
          {/* Left Column: Photos & AI Analysis */}
          <div className="lg:col-span-7 space-y-4">
            {currentPhoto ? (
              <div className="space-y-3">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 relative border border-slate-800 shadow-inner">
                  <img
                    src={currentPhoto.imageUrl}
                    alt={currentPhoto.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {currentPhoto.distanceFromSite}m from site
                    {currentPhoto.locationVerified && (
                      <span className="text-emerald-400 font-sans ml-1">(&#10003; On-site)</span>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-mono">
                    Accuracy: ±{currentPhoto.gpsAccuracy}m
                  </div>
                </div>

                {/* Photo Thumbnails Selector */}
                {inspection.photos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {inspection.photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-20 aspect-video rounded-lg overflow-hidden border-2 transition shrink-0 ${
                          activePhotoIndex === idx
                            ? "border-blue-600 ring-2 ring-blue-600/30"
                            : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* AI Analysis Result for Selected Photo */}
                {currentPhoto.aiAnalysisResult && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>AI Quality Insight (Advisory)</span>
                      <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900">
                        {currentPhoto.aiAnalysisResult.confidence}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentPhoto.aiAnalysisResult.observation}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium pt-1">
                      💡 <span className="font-semibold">Recommendation:</span> {currentPhoto.aiAnalysisResult.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-sm">
                No inspection photos attached.
              </div>
            )}

            {/* Observations & Action Required */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Observation Notes
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                  {inspection.observations}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Action Required
                </span>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mt-1">
                  {inspection.actionRequired}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Checklist & Engineer Review */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Inspector Details */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inspector</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{inspection.inspectorName}</h4>
                <p className="text-xs text-slate-500 font-mono capitalize">{inspection.inspectorRole}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Captured At</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(inspection.createdAt).toLocaleDateString()}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  {new Date(inspection.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Checklist Results ({inspection.checklist.length})
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {inspection.checklist.map((item, idx) => (
                  <div key={item.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {idx + 1}. {item.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        item.status === "pass"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : item.status === "fail"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineer Review Actions */}
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Engineer Approval & Review
              </h4>

              <textarea
                rows={2}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Enter review remarks or corrective instructions..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(inspection.id, "Passed", reviewRemarks);
                    alert("Inspection approved and marked PASSED.");
                  }}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(inspection.id, "Failed", reviewRemarks);
                    alert("Inspection marked FAILED.");
                  }}
                  className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Fail
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(inspection.id, "Reinspection Required", reviewRemarks);
                    alert("Marked for Reinspection.");
                  }}
                  className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" /> Reinspect
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDefectForm(!showDefectForm)}
                className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-xs flex items-center justify-center gap-1.5 transition"
              >
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {showDefectForm ? "Cancel Defect Report" : "⚠️ Report Quality Defect"}
              </button>
            </div>

            {/* Inline Defect Reporting Form */}
            {showDefectForm && (
              <form onSubmit={handleCreateDefectSubmit} className="p-4 rounded-xl border border-red-500/40 bg-red-50/50 dark:bg-red-950/30 space-y-3 animate-in fade-in">
                <h5 className="text-xs font-bold uppercase tracking-wider text-red-900 dark:text-red-300">
                  Log Quality Defect from Inspection
                </h5>
                <input
                  type="text"
                  value={defectIssue}
                  onChange={(e) => setDefectIssue(e.target.value)}
                  placeholder="Defect title (e.g., Honeycomb on Column C-12)"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
                <textarea
                  rows={2}
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  placeholder="Detailed description of defect..."
                  className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={defectSeverity}
                    onChange={(e: any) => setDefectSeverity(e.target.value)}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="low">Severity: Low</option>
                    <option value="medium">Severity: Medium</option>
                    <option value="high">Severity: High</option>
                    <option value="critical">Severity: Critical</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow transition"
                  >
                    Submit Defect
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
