import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  RefreshCw,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  Building,
  CheckCircle2,
  FileText,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Upload,
  Settings,
} from "lucide-react";
import { Project, ProgressLog, SitePhoto } from "../../types";

interface ManualOnsiteCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSaveDPR: (log: ProgressLog) => void;
  currentUserName?: string;
  initialPercentage?: number;
}

type Step = "camera" | "preview" | "details" | "review";

export const ManualOnsiteCaptureModal: React.FC<ManualOnsiteCaptureModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveDPR,
  currentUserName = "Active Site Engineer",
  initialPercentage = 0,
}) => {
  const [step, setStep] = useState<Step>("camera");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  // Captured Photo State
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState<string>("");
  const [captureISO, setCaptureISO] = useState<string>("");

  // DPR Form Fields
  const [workDescription, setWorkDescription] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [workStatus, setWorkStatus] = useState<
    "In Progress" | "Completed Milestone" | "Quality Review" | "Halted / Blocked"
  >("In Progress");
  const [progressPercentage, setProgressPercentage] = useState<number>(
    initialPercentage || project.progressPercentage || 0
  );
  const [remarks, setRemarks] = useState("");
  const [weather, setWeather] = useState("Sunny, 30°C");
  const [completedActivities, setCompletedActivities] = useState("");
  const [issues, setIssues] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream utility
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera stream only when in 'camera' step and modal is open
  const startCameraStream = async (preferredMode: "environment" | "user" = facingMode) => {
    stopCameraStream();
    setCameraError(null);

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Camera API is not supported on this browser or environment. You may use manual file capture below."
      );
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: preferredMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera permissions in your browser or device settings to capture onsite photos."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No hardware camera device was found on this system.");
      } else {
        setCameraError(
          `Unable to start camera stream: ${err.message || "Unknown error"}. You may use manual photo upload instead.`
        );
      }
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && step === "camera") {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, step, facingMode]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep("camera");
      setCapturedPhotoUrl(null);
      setCameraError(null);
      setProgressPercentage(project.progressPercentage || 0);
      setWorkDescription("");
      setLocationArea("");
      setRemarks("");
      setCompletedActivities("");
      setIssues("");
    }
  }, [isOpen, project]);

  // Handle Manual Capture Click
  const handleManualTakePhoto = () => {
    if (!videoRef.current || !isCameraActive) return;

    // Trigger visual shutter flash
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const now = new Date();
    const formattedTimestamp = now.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    });

    setCapturedPhotoUrl(dataUrl);
    setCaptureTimestamp(formattedTimestamp);
    setCaptureISO(now.toISOString());

    // Stop stream and go to preview
    stopCameraStream();
    setStep("preview");
  };

  // Handle Fallback File Upload (User manually selects a file)
  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        const now = new Date();
        setCapturedPhotoUrl(event.target.result);
        setCaptureTimestamp(
          now.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "medium",
          })
        );
        setCaptureISO(now.toISOString());
        stopCameraStream();
        setStep("preview");
      }
    };
    reader.readAsDataURL(file);
  };

  // Switch Facing Mode
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  // Retake Photo
  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    setStep("camera");
  };

  // Use Photo -> Proceed to Details
  const handleUsePhoto = () => {
    setStep("details");
  };

  // Delete Image Action
  const handleDeleteImage = () => {
    setCapturedPhotoUrl(null);
    setCaptureTimestamp("");
    setCaptureISO("");
  };

  // Replace Image Action
  const handleReplaceImage = () => {
    setCapturedPhotoUrl(null);
    setStep("camera");
  };

  // Final Submit DPR
  const handleSubmitDPR = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const photos: SitePhoto[] = [];
    if (capturedPhotoUrl) {
      photos.push({
        id: `photo-manual-${Date.now()}`,
        url: capturedPhotoUrl,
        caption: workDescription || `Onsite Progress at ${locationArea || project.name}`,
        timestamp: captureTimestamp || new Date().toLocaleTimeString(),
        areaLocation: locationArea,
        workStatus: workStatus,
        progressPercentage: progressPercentage,
        remarks: remarks,
        isManualCapture: true,
        capturedAt: captureISO || new Date().toISOString(),
        projectName: project.name,
      });
    }

    const dprLog: ProgressLog = {
      id: `dpr-${Date.now()}`,
      projectId: project.id,
      date: new Date().toISOString().split("T")[0],
      percentage: progressPercentage,
      description: workDescription || "Daily onsite construction activity logged.",
      weather: weather,
      addedBy: currentUserName,
      areaLocation: locationArea,
      workStatus: workStatus,
      remarks: remarks,
      photos: photos,
      completedTasks: completedActivities ? completedActivities.split("\n").filter(Boolean) : [],
      issues: issues ? issues.split("\n").filter(Boolean) : [],
    };

    onSaveDPR(dprLog);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto safe-bottom">
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleManualFileSelect}
      />

      <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col my-0 sm:my-auto max-h-[92vh] safe-bottom touch-scroll">
        {/* Modal Header with Step Indicator */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Manual Onsite Progress & DPR Logger
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  User Controlled
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[220px] sm:max-w-none">
                {project.name} • {project.location}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progression Breadcrumb */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-600 overflow-x-auto touch-scroll">
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 ${
              step === "camera"
                ? "bg-blue-600 text-white font-bold"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            1. Camera
          </span>
          <span>→</span>
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 ${
              step === "preview"
                ? "bg-blue-600 text-white font-bold"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            2. Preview
          </span>
          <span>→</span>
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 ${
              step === "details"
                ? "bg-blue-600 text-white font-bold"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            3. Details
          </span>
          <span>→</span>
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 ${
              step === "review"
                ? "bg-blue-600 text-white font-bold"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            4. Review
          </span>
        </div>

        {/* STEP 1: Live Manual Camera Viewfinder */}
        {step === "camera" && (
          <div className="p-5 flex-1 flex flex-col space-y-4">
            {cameraError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3 my-auto">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Camera Access Notice</h3>
                  <p className="mt-1 text-xs text-amber-800 max-w-md mx-auto">{cameraError}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => startCameraStream(facingMode)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Camera Stream</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-3.5 py-2 text-xs font-bold transition shadow-xs"
                  >
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>Select Onsite Photo Manually</span>
                  </button>

                  <button
                    onClick={() => setStep("details")}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
                  >
                    Skip Photo & Fill DPR Form
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center aspect-4/3 sm:aspect-16/10 shadow-inner">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Shutter Flash Animation */}
                {isFlashActive && (
                  <div className="absolute inset-0 bg-white opacity-80 animate-ping transition" />
                )}

                {/* Viewfinder Target Reticle Overlay */}
                <div className="absolute inset-4 pointer-events-none border border-white/25 rounded-xl flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <div className="bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>LIVE SITE CAMERA</span>
                    </div>

                    <div className="bg-slate-900/70 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1 font-semibold">
                      <Building className="h-3 w-3 text-blue-400" />
                      <span className="truncate max-w-[120px]">{project.name}</span>
                    </div>
                  </div>

                  {/* Center Alignment Reticle */}
                  <div className="mx-auto w-14 h-14 border-2 border-white/40 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/70 rounded-full" />
                  </div>

                  {/* Bottom Guide */}
                  <div className="text-center">
                    <span className="bg-slate-900/70 backdrop-blur-xs text-white/90 text-[10px] font-medium px-3 py-1 rounded-full border border-white/10">
                      Align construction progress in frame and click "Take Photo"
                    </span>
                  </div>
                </div>

                {/* Camera Control Strip */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between px-3">
                  <button
                    onClick={handleToggleFacingMode}
                    className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 shadow-lg backdrop-blur-xs transition"
                    title="Switch Camera (Front / Rear)"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>

                  {/* Prominent Manual Shutter Button */}
                  <button
                    onClick={handleManualTakePhoto}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-5 py-3 rounded-full shadow-xl border-2 border-white ring-4 ring-blue-600/30 transition cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 shadow-lg backdrop-blur-xs transition"
                    title="Manual File Selection"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Explanatory Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zero auto-capture • User must manually trigger photo</span>
              </span>

              <button
                type="button"
                onClick={() => setStep("details")}
                className="text-slate-600 hover:text-blue-600 font-semibold"
              >
                Skip Photo & Proceed to Form →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Photo Preview Screen */}
        {step === "preview" && capturedPhotoUrl && (
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-4/3 sm:aspect-16/10 shadow-md">
              <img
                src={capturedPhotoUrl}
                alt="Captured Onsite Photo Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Watermark Label on Preview */}
              <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white p-2 rounded-xl border border-white/10 text-xs shadow-lg space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                  <span>📷 Onsite Photo — Manually Captured</span>
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>{captureTimestamp}</span>
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1">
                  <Building className="h-3 w-3 text-slate-400" />
                  <span className="font-semibold">{project.name}</span>
                </div>
              </div>
            </div>

            {/* Prompt */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Manual Confirmation Required:</span> Review the photo
                above. If clear, click <span className="font-bold">"Use Photo"</span> to attach it
                to your Daily Progress Report. Otherwise click{" "}
                <span className="font-bold">"Retake Photo"</span>.
              </div>
            </div>

            {/* Retake vs Use Photo Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-3 shadow-xs transition"
              >
                <RotateCcw className="h-4 w-4 text-slate-600" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleUsePhoto}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 shadow-md transition"
              >
                <Check className="h-4 w-4" />
                <span>Use Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DPR Form Details */}
        {step === "details" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep("review");
            }}
            className="p-5 flex-1 flex flex-col space-y-4 overflow-y-auto max-h-[70vh] text-xs"
          >
            {/* Attached Photo Card with Delete / Replace Options */}
            {capturedPhotoUrl ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 shrink-0 shadow-xs">
                    <img
                      src={capturedPhotoUrl}
                      alt="Attached Onsite"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-[11px]">
                      <span>📷 Onsite Photo — Manually Captured</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{captureTimestamp || "Just now"}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Site: {project.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleReplaceImage}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg shadow-2xs transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Replace</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-white border border-red-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg shadow-2xs transition"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3.5 flex items-center justify-between">
                <div className="text-slate-500">
                  <span className="font-semibold text-slate-700">No Onsite Photo Attached</span>
                  <div className="text-[10px] text-slate-400">
                    You can capture a photo or proceed with text-only report.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("camera")}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs px-3 py-1.5 shadow-xs hover:bg-blue-700 transition"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Open Camera</span>
                </button>
              </div>
            )}

            {/* Work / Activity Description */}
            <div>
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Work / Activity Description *</span>
                <span className="text-[10px] text-slate-400 font-normal">Required for DPR</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe specific construction operations completed today (e.g. 2nd floor beam formwork shuttering, poured 15 cu.m M25 grade concrete, tied stirrups)..."
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Location & Work Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Location / Site Area</label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Grid C4-C8, 2nd Floor Slab"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800">Work Status</label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none font-medium"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed Milestone">Completed Milestone</option>
                  <option value="Quality Review">Quality Review & Inspection</option>
                  <option value="Halted / Blocked">Halted / Field Hindrance</option>
                </select>
              </div>
            </div>

            {/* Progress Percentage & Weather */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span>Physical Progress %</span>
                  <span className="text-blue-600 font-mono text-sm">{progressPercentage}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Weather Condition</label>
                <input
                  type="text"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  placeholder="e.g. Sunny, 32°C / Overcast"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Completed Activities & Issues */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Completed Checklist Items</label>
                <textarea
                  rows={2}
                  placeholder="One task per line (e.g. Cube compression test, Level marking)"
                  value={completedActivities}
                  onChange={(e) => setCompletedActivities(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Field Impediments & Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Awaiting steel bar delivery, power outage 2 hours"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Navigation to Review */}
            <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep("preview")}
                disabled={!capturedPhotoUrl}
                className="min-h-[44px] flex items-center justify-center text-xs text-slate-600 hover:text-slate-900 font-semibold disabled:opacity-40 px-3 py-2 rounded-xl"
              >
                ← Back to Photo Preview
              </button>

              <button
                type="submit"
                className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 shadow-md transition"
              >
                <span>Review DPR Summary →</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Review DPR & Explicit Submit */}
        {step === "review" && (
          <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-4 overflow-y-auto max-h-[70vh] text-xs touch-scroll">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Daily Progress Report (DPR) Summary</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date: {new Date().toLocaleDateString()} • Logged by: {currentUserName}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  {workStatus}
                </span>
              </div>

              {/* Attached Photo in Review */}
              {capturedPhotoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-300 aspect-16/9 max-h-48 bg-slate-900">
                  <img
                    src={capturedPhotoUrl}
                    alt="DPR Captured Onsite"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md border border-white/10 font-bold">
                    📷 Onsite Photo — Manually Captured
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md border border-white/10">
                    {captureTimestamp} • {project.name}
                  </div>
                </div>
              ) : (
                <div className="text-center p-3 text-slate-400 bg-white rounded-lg border border-slate-200 text-xs">
                  No onsite photo attached
                </div>
              )}

              {/* Progress & Location KPIs */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Total Progress</div>
                  <div className="text-sm font-bold text-blue-600">{progressPercentage}%</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Site Area</div>
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {locationArea || "General Site"}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Weather</div>
                  <div className="text-xs font-bold text-slate-800 truncate">{weather}</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-[11px]">Work Executed:</div>
                <p className="text-slate-600 leading-relaxed">{workDescription || "None specified"}</p>
              </div>

              {/* Remarks */}
              {remarks && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 text-[11px]">Field Remarks:</div>
                  <p className="text-slate-600">{remarks}</p>
                </div>
              )}
            </div>

            {/* Confirmation & Explicit Submit */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2.5 transition flex items-center justify-center"
              >
                ← Edit Form Details
              </button>

              <button
                type="button"
                onClick={() => handleSubmitDPR()}
                className="w-full sm:flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 shadow-lg transition"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Submit DPR (Explicit Save)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
