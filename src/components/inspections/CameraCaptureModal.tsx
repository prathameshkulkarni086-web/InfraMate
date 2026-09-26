import React, { useState, useRef, useEffect } from "react";
import { Camera, X, RefreshCw, CheckCircle2, AlertTriangle, SwitchCamera } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (blob: Blob, previewUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "unavailable">("prompt");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Start camera stream
  const startCamera = async (mode: "environment" | "user") => {
    setIsInitializing(true);
    setErrorMessage("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus("unavailable");
        setErrorMessage("Your browser or device does not support live camera capture.");
        setIsInitializing(false);
        return;
      }

      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setPermissionStatus("granted");
      setIsInitializing(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access notice:", err?.message || err);
      setPermissionStatus("denied");
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera access is required. Please allow camera permission in your browser or device settings to capture inspection photos."
          : `Camera error: ${err.message || "Unable to start camera."}`
      );
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImageUrl) {
      startCamera(facingMode);
    }

    return () => {
      // Cleanup on unmount or close
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const stopAllTracks = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleClose = () => {
    stopAllTracks();
    setCapturedImageUrl(null);
    setCapturedBlob(null);
    onClose();
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedBlob(blob);
          setCapturedImageUrl(url);
          stopAllTracks();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRetake = () => {
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }
    setCapturedImageUrl(null);
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedBlob && capturedImageUrl) {
      onPhotoCaptured(capturedBlob, capturedImageUrl);
      handleClose();
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Inspection Camera</h3>
              <p className="text-[11px] text-slate-400">Position camera towards construction site</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[400px]">
          
          {/* Permission Denied or Unavailable State */}
          {(permissionStatus === "denied" || permissionStatus === "unavailable") && (
            <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-base font-bold text-white">Camera Access Required</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {/* Initializing State */}
          {isInitializing && permissionStatus === "prompt" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 bg-slate-900">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Requesting camera permissions & starting stream...</p>
            </div>
          )}

          {/* Live Video Preview */}
          {!capturedImageUrl && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-[60vh]"
            />
          )}

          {/* Captured Photo Preview */}
          {capturedImageUrl && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImageUrl}
                alt="Captured inspection evidence"
                className="w-full h-full object-contain max-h-[60vh]"
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow">
                <CheckCircle2 className="w-4 h-4" /> Captured Successfully
              </span>
            </div>
          )}

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-4">
          {!capturedImageUrl ? (
            <>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <SwitchCamera className="w-4 h-4" /> Switch Camera ({facingMode})
              </button>

              <button
                type="button"
                onClick={handleCapture}
                disabled={isInitializing || permissionStatus !== "granted"}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 text-sm transition transform active:scale-95"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                CAPTURE PHOTO
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" /> Retake Photo
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> Use This Photo
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
