import React, { useState, useRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Maximize2,
  X,
  Smartphone,
} from "lucide-react";
import { LiveVehicleCameraModal } from "./LiveVehicleCameraModal";

interface VehiclePhotoCaptureProps {
  photoUrl: string;
  onPhotoChange: (url: string) => void;
  error?: string;
  required?: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const VehiclePhotoCapture: React.FC<VehiclePhotoCaptureProps> = ({
  photoUrl,
  onPhotoChange,
  error,
  required = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState<boolean>(false);

  // Compress large smartphone photos selected from device files client-side to preserve license plate clarity
  const processAndCompressFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX_DIM = 1920; // Crisp 1080p-1440p resolution

            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(readerEvent.target?.result as string);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Compress as high quality JPEG (0.88 keeps plate sharp)
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
            resolve(compressedDataUrl);
          } catch {
            resolve(readerEvent.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error("Unable to parse image data"));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  // Trigger 1: Open Live Device Camera Modal (getUserMedia WebRTC stream)
  const openLiveCamera = () => {
    setValidationError("");
    setIsLiveCameraOpen(true);
  };

  // Trigger 2: Open Normal Device File / Gallery Picker
  const triggerFilePicker = () => {
    setValidationError("");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle Photo Captured from Live Camera Modal
  const handleLivePhotoCaptured = (dataUrl: string) => {
    onPhotoChange(dataUrl);
    setValidationError("");
    setIsLiveCameraOpen(false);
  };

  // Handle File Selected from Device File Picker
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setValidationError("Please select a valid vehicle image (JPG, JPEG, PNG, WEBP).");
      if (e.target) e.target.value = "";
      return;
    }

    // Validate 10MB limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError("Photo is too large. Please capture or select a smaller image (under 10MB).");
      if (e.target) e.target.value = "";
      return;
    }

    setIsProcessing(true);
    try {
      const optimizedUrl = await processAndCompressFile(file);
      onPhotoChange(optimizedUrl);
      setValidationError("");
    } catch (err) {
      console.error("Image processing error:", err);
      setValidationError("Failed to process photo from this device. Please try again.");
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleClearPhoto = () => {
    onPhotoChange("");
    setValidationError("");
  };

  return (
    <div className="space-y-3" id="vehicle-photo-capture-section">
      {/* Hidden Device Gallery / File Picker Input ONLY for 'Choose From Device' */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        id="device-photo-input"
        onChange={handleFileSelection}
      />

      {/* Live Device Camera Modal (Uses navigator.mediaDevices.getUserMedia) */}
      <LiveVehicleCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onPhotoCaptured={handleLivePhotoCaptured}
        onChooseFromDeviceFallback={() => {
          setIsLiveCameraOpen(false);
          setTimeout(() => triggerFilePicker(), 100);
        }}
      />

      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          VEHICLE PHOTOGRAPH (Manual Capture / Upload by Operator)
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {photoUrl && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Photo Attached
          </span>
        )}
      </div>

      {/* Processing Loader */}
      {isProcessing && (
        <div className="p-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
            Processing vehicle photo from device...
          </p>
          <p className="text-[10px] text-blue-700 dark:text-blue-400">
            Optimizing resolution for site ledger & number plate clarity
          </p>
        </div>
      )}

      {/* STATE 1: No Photo Attached Yet -> Dedicated Action Box */}
      {!photoUrl && !isProcessing && (
        <div className="bg-slate-100/90 dark:bg-slate-900/90 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 text-center shadow-xs">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>📷 VEHICLE PHOTO</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4 font-medium">
            Use your device camera to photograph the vehicle, or choose an existing image from this device.
          </p>

          {/* Action Buttons: Primary Camera (WebRTC) + Secondary Device File Picker */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {/* Primary Action: 📷 Take Vehicle Photo (OPENS DEVICE CAMERA) */}
            <button
              type="button"
              id="btn-take-vehicle-photo"
              onClick={openLiveCamera}
              className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>Take Vehicle Photo</span>
            </button>

            {/* Secondary Action: 🖼 Choose From Device (OPENS FILE PICKER) */}
            <button
              type="button"
              id="btn-choose-from-device"
              onClick={triggerFilePicker}
              className="w-full sm:flex-1 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 active:scale-98 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Choose From Device</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            <span>Photo must be captured/uploaded by the gate operator from this smartphone/device</span>
          </div>
        </div>
      )}

      {/* STATE 2: Photo Attached -> Large Preview, Retake & Replace Controls */}
      {photoUrl && !isProcessing && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              Vehicle Photograph Preview
            </span>
            <button
              type="button"
              onClick={() => setIsModalPreviewOpen(true)}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Enlarge</span>
            </button>
          </div>

          {/* Photo Preview Container */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-video max-h-64 flex items-center justify-center">
            <img
              src={photoUrl}
              alt="Vehicle Entry Photograph"
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => setIsModalPreviewOpen(true)}
            />

            {/* Visual Watermark Badge */}
            <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded-md border border-white/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Operator Visual Record • {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          {/* Retake & Replace Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {/* Retake Photo (OPENS LIVE CAMERA AGAIN) */}
              <button
                type="button"
                id="btn-retake-photo"
                onClick={openLiveCamera}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>

              {/* Choose Another (OPENS DEVICE FILE PICKER) */}
              <button
                type="button"
                id="btn-choose-another"
                onClick={triggerFilePicker}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Choose Another</span>
              </button>
            </div>

            {/* Remove / Clear Photo */}
            <button
              type="button"
              id="btn-remove-photo"
              onClick={handleClearPhoto}
              className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Validation / Error Messages */}
      {(validationError || error) && (
        <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Manual Verification Mode Footer Banner */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Manual verification mode: Operators manually verify number plate and upload visual record.</span>
      </div>

      {/* Full Size Enlarge Preview Modal */}
      {isModalPreviewOpen && photoUrl && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 overflow-hidden shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold">Vehicle Photograph Full Inspection</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black rounded-xl p-2">
              <img
                src={photoUrl}
                alt="Enlarged Vehicle"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                Verify license plate and vehicle physical condition
              </p>
              <button
                type="button"
                onClick={() => setIsModalPreviewOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
