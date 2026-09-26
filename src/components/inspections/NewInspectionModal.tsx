import React, { useState } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckSquare,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Project, User, ProjectSite } from "../../types";
import {
  QualityInspection,
  InspectionPhoto,
  INSPECTION_CATEGORIES,
} from "../../types/inspection";
import { inspectionService } from "../../services/inspectionService";
import { CameraCaptureModal } from "./CameraCaptureModal";

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUser: User;
  onSave: (inspection: QualityInspection) => void;
}

export const NewInspectionModal: React.FC<NewInspectionModalProps> = ({
  isOpen,
  onClose,
  project,
  currentUser,
  onSave,
}) => {
  const adminConfig = inspectionService.getAdminConfig();

  // Selected Site
  const sites: ProjectSite[] = project.sites || [
    { id: "site-1", projectId: project.id, name: "Tower 1 - Main Structure", latitude: 12.971598, longitude: 77.594566, attendanceRadiusMeters: 100 },
    { id: "site-2", projectId: project.id, name: "Podium & Parking Level", latitude: 12.972598, longitude: 77.595566, attendanceRadiusMeters: 100 },
  ];
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || "site-1");

  // Category & Subcategory
  const [selectedCategory, setSelectedCategory] = useState<string>(INSPECTION_CATEGORIES[0].name);
  const catSpec = INSPECTION_CATEGORIES.find((c) => c.name === selectedCategory) || INSPECTION_CATEGORIES[0];
  const [subCategory, setSubCategory] = useState<string>(catSpec.subcategories[0] || "");
  const [inspectionTitle, setInspectionTitle] = useState<string>(`${catSpec.name} Inspection - ${catSpec.subcategories[0] || "General"}`);
  const [locationDetail, setLocationDetail] = useState<string>(sites[0]?.name ? `${sites[0].name} - Grid A-1` : "Main Site Grid");

  // Checklist state
  const [checklist, setChecklist] = useState<
    { id: string; label: string; status: "pass" | "fail" | "na" | "pending"; notes?: string }[]
  >(
    catSpec.defaultChecklist.map((item, idx) => ({
      id: `chk-${idx}`,
      label: item,
      status: "pending",
      notes: "",
    }))
  );

  // Photos captured list
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [activePhotoTitle, setActivePhotoTitle] = useState<string>("Photo 1 — Front view");
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // GPS / Geofence state
  const [isVerifyingLocation, setIsVerifyingLocation] = useState<boolean>(false);
  const [locationVerificationResult, setLocationVerificationResult] = useState<{
    verified: boolean;
    distance: number;
    latitude: number;
    longitude: number;
    accuracy: number;
    message: string;
  } | null>(null);

  // Notes & Action
  const [observations, setObservations] = useState<string>("");
  const [actionRequired, setActionRequired] = useState<string>("");

  // AI Analysis state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<{
    observation: string;
    confidence: number;
    detectedIssues: string[];
    recommendation: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    const found = INSPECTION_CATEGORIES.find((c) => c.name === catName) || INSPECTION_CATEGORIES[0];
    setSubCategory(found.subcategories[0] || "");
    setInspectionTitle(`${catName} Inspection - ${found.subcategories[0] || "General"}`);
    setChecklist(
      found.defaultChecklist.map((item, idx) => ({
        id: `chk-${idx}`,
        label: item,
        status: "pending",
        notes: "",
      }))
    );
  };

  const handlePhotoCapturedFromCamera = async (blob: Blob, previewUrl: string) => {
    setIsVerifyingLocation(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 5);

          const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
          const siteLat = currentSite.latitude || 12.971598;
          const siteLon = currentSite.longitude || 77.594566;
          const radius = currentSite.attendanceRadiusMeters || adminConfig.geofenceRadiusMeters;

          const distance = inspectionService.calculateDistance(lat, lon, siteLat, siteLon);
          const isInside = distance <= radius;

          setLocationVerificationResult({
            verified: isInside,
            distance,
            latitude: lat,
            longitude: lon,
            accuracy,
            message: isInside
              ? `Site location verified. You are ${distance}m from site coordinates (within ${radius}m perimeter).`
              : `You are outside the permitted inspection area (${distance}m from site). Please move to the construction site and capture the inspection photo there.`,
          });

          const reader = new FileReader();
          reader.onload = async () => {
            const base64Url = reader.result as string;
            const photoId = `PHO-${Date.now().toString().slice(-6)}`;
            const nowIso = new Date().toISOString();

            const newPhoto: InspectionPhoto = {
              id: photoId,
              inspectionId: `INSP-TEMP`,
              projectId: project.id,
              siteId: selectedSiteId,
              capturedBy: currentUser.id,
              capturedByName: currentUser.name,
              title: activePhotoTitle || `Photo ${photos.length + 1} — Live Camera Capture`,
              caption: observations || `Inspection evidence captured at ${locationDetail}`,
              imageUrl: base64Url,
              originalImageUrl: base64Url,
              capturedAt: nowIso,
              latitude: lat,
              longitude: lon,
              gpsAccuracy: accuracy,
              distanceFromSite: distance,
              locationVerified: isInside,
              cameraCaptureVerified: true,
              captureMethod: "DEVICE_CAMERA",
              syncStatus: navigator.onLine ? "synced" : "pending_sync",
              aiAnalysisStatus: "pending",
              notes: observations,
              createdAt: nowIso,
              updatedAt: nowIso,
            };

            setPhotos((prev) => [...prev, newPhoto]);
            setActivePhotoTitle(`Photo ${photos.length + 2} — Detail view`);
            setIsVerifyingLocation(false);

            if (adminConfig.aiAnalysisEnabled) {
              setIsAnalyzingAI(true);
              try {
                const aiRes = await inspectionService.analyzeInspectionWithAI({
                  photoBase64: base64Url,
                  category: selectedCategory,
                  subCategory,
                  title: inspectionTitle,
                  notes: observations,
                });

                setAiInsight(aiRes);
                newPhoto.aiAnalysisStatus = "completed";
                newPhoto.aiAnalysisResult = {
                  ...aiRes,
                  analyzedAt: new Date().toISOString(),
                };
              } catch (e) {
                console.warn("AI analysis failed:", e);
                newPhoto.aiAnalysisStatus = "failed";
              } finally {
                setIsAnalyzingAI(false);
              }
            }
          };
          reader.readAsDataURL(blob);
        },
        (error) => {
          setIsVerifyingLocation(false);
          alert(`Location Error: ${error.message}. GPS permission is required for site verification.`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsVerifyingLocation(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (adminConfig.photoRequired && photos.length < adminConfig.minimumPhotos) {
      alert(`Please capture at least ${adminConfig.minimumPhotos} inspection photo(s) using the camera.`);
      return;
    }

    if (adminConfig.gpsVerificationRequired && locationVerificationResult && !locationVerificationResult.verified) {
      alert("Location verification failed. You are outside the site geofence perimeter. Cannot submit as verified on-site evidence.");
      return;
    }

    const inspectionId = `INSP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const currentSite = sites.find((s) => s.id === selectedSiteId);

    const finalPhotos = photos.map((p) => ({ ...p, inspectionId }));

    const newInspection: QualityInspection = {
      id: inspectionId,
      projectId: project.id,
      projectName: project.name,
      siteId: selectedSiteId,
      siteName: currentSite?.name || "Main Construction Site",
      title: inspectionTitle,
      category: selectedCategory,
      subCategory,
      location: locationDetail,
      status: "Submitted",
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
      inspectorRole: currentUser.role,
      assignedEngineerId: currentUser.id,
      assignedEngineerName: currentUser.name,
      photos: finalPhotos,
      checklist,
      observations: observations || "Inspection completed on-site with photographic evidence.",
      actionRequired: actionRequired || "Review by lead engineer required.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: navigator.onLine ? "synced" : "pending_sync",
    };

    onSave(newInspection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto safe-bottom">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 safe-bottom">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                New Quality Inspection & Site Capture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Project: <span className="font-semibold text-slate-700 dark:text-slate-300">{project.name}</span>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 touch-scroll">
          
          {/* Site & Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Construction Site / Zone
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.attendanceRadiusMeters || 100}m Geofence)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Inspection Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {INSPECTION_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Sub-Category Item
              </label>
              <select
                value={subCategory}
                onChange={(e) => {
                  setSubCategory(e.target.value);
                  setInspectionTitle(`${selectedCategory} - ${e.target.value}`);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {catSpec.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Inspection Title / Element
              </label>
              <input
                type="text"
                value={inspectionTitle}
                onChange={(e) => setInspectionTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Column C-12 Reinforcement Tie & Cover Check"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Specific On-Site Location / Grid Ref
            </label>
            <input
              type="text"
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Tower 1 - 4th Floor Slab Grid C-12"
            />
          </div>

          {/* Camera Capture Section (Primary Rule) */}
          <div className="rounded-2xl border-2 border-dashed border-blue-500/40 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 p-6 text-center space-y-4">
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3 animate-pulse">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mandatory On-Site Camera Capture
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mt-1">
                Inspection evidence must be captured live at the ongoing construction site using your device camera. Old gallery uploads and file picking are disabled.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm transition transform active:scale-95"
              >
                <Camera className="w-5 h-5" />
                📷 Capture Inspection Photo
              </button>
            </div>

            {isVerifyingLocation && (
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Obtaining GPS coordinates & verifying 100m site geofence...
              </div>
            )}
          </div>

          {/* Camera Capture Modal */}
          <CameraCaptureModal
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onPhotoCaptured={(blob, previewUrl) => {
              handlePhotoCapturedFromCamera(blob, previewUrl);
              setIsCameraOpen(false);
            }}
          />

          {/* Location & Geofence Verification Status */}
          {locationVerificationResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                locationVerificationResult.verified
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-900 dark:text-emerald-200"
                  : "bg-red-50 dark:bg-red-950/30 border-red-500/40 text-red-900 dark:text-red-200"
              }`}
            >
              <div className="mt-0.5">
                {locationVerificationResult.verified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>
                    {locationVerificationResult.verified ? "📍 Site Location Verified (On-site)" : "🔴 Outside Permitted Inspection Area"}
                  </span>
                  <span className="font-mono text-[11px]">
                    Distance: {locationVerificationResult.distance}m | GPS Acc: ±{locationVerificationResult.accuracy}m
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {locationVerificationResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Captured Photos Timeline Grid */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Captured Inspection Photos ({photos.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Capture Another Photo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="relative group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 shadow-sm space-y-2"
                  >
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 relative">
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono font-bold">
                        Photo {idx + 1}
                      </span>
                      {p.locationVerified && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> On-site Verified
                        </span>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhotos((prev) => prev.map((item) => (item.id === p.id ? { ...item, title: val } : item)));
                        }}
                        className="w-full text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        {new Date(p.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {p.distanceFromSite}m from site
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((item) => item.id !== p.id))}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Optional Assistant Banner */}
          {isAnalyzingAI && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30 flex items-center gap-3 text-blue-800 dark:text-blue-200 text-xs">
              <Sparkles className="w-5 h-5 animate-pulse text-blue-600" />
              <div>
                <span className="font-bold">AI Quality Assistant analyzing physical photo...</span>
                <p className="text-[11px] opacity-80">Evaluating alignment, cover blocks, and surface condition.</p>
              </div>
            </div>
          )}

          {aiInsight && (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>AI-generated observation — Manual verification required.</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  Confidence: {aiInsight.confidence}%
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Observation:</span> {aiInsight.observation}
              </p>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Recommendation:</span> {aiInsight.recommendation}
              </p>
            </div>
          )}

          {/* Checklist Verification Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Inspection Quality Checklist ({selectedCategory})
            </h4>
            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex-1">
                    {idx + 1}. {item.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setChecklist((prev) =>
                          prev.map((c) => (c.id === item.id ? { ...c, status: "pass" } : c))
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        item.status === "pass"
                          ? "bg-emerald-600 text-white shadow"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100"
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setChecklist((prev) =>
                          prev.map((c) => (c.id === item.id ? { ...c, status: "fail" } : c))
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        item.status === "fail"
                          ? "bg-red-600 text-white shadow"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100"
                      }`}
                    >
                      Fail
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setChecklist((prev) =>
                          prev.map((c) => (c.id === item.id ? { ...c, status: "na" } : c))
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        item.status === "na"
                          ? "bg-slate-600 text-white shadow"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspection Notes & Action Required */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Observation Notes
              </label>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Describe physical findings, measurements, or site conditions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Action Required / Corrective Instructions
              </label>
              <textarea
                rows={3}
                value={actionRequired}
                onChange={(e) => setActionRequired(e.target.value)}
                placeholder="Action required by contractor or site engineer..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={photos.length === 0}
              className={`w-full sm:w-auto min-h-[44px] justify-center px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center gap-2 ${
                photos.length === 0
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 active:scale-95"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Inspection ({photos.length} Photo{photos.length === 1 ? "" : "s"})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
