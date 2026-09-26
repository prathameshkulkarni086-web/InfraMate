import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SwitchCamera,
  ShieldCheck,
  Smartphone,
  ImageIcon,
} from "lucide-react";

interface LiveVehicleCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (dataUrl: string) => void;
  onChooseFromDeviceFallback?: () => void;
}

export const LiveVehicleCameraModal: React.FC<LiveVehicleCameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  onChooseFromDeviceFallback,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  
  const [status, setStatus] = useState<"initializing" | "ready" | "denied" | "unsupported" | "nocamera" | "inuse" | "insecure" | "error">("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Helper to safely stop all media tracks
  const stopTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
    }
  }, [stream]);

  // Enumerate video devices
  const detectCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);
      }
    } catch (e) {
      console.warn("Unable to enumerate devices:", e);
    }
  };

  // Start live camera stream
  const startCamera = async (mode: "environment" | "user", deviceId?: string) => {
    setStatus("initializing");
    setErrorMessage("");

    // Check secure context
    if (window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setStatus("insecure");
      setErrorMessage("Camera access requires a secure HTTPS connection.");
      return;
    }

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("unsupported");
      setErrorMessage("Camera capture is not supported by this browser or connection.");
      return;
    }

    // Stop current stream if active
    if (stream) {
      stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
    }

    try {
      let mediaStream: MediaStream | null = null;

      // 1. Try with preferred resolution & facing constraints
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId
            ? {
                deviceId: { exact: deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: { ideal: mode },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr: any) {
        // If advanced constraints failed (e.g. OverconstrainedError), fallback to basic constraints
        const errName = constraintErr?.name || "";
        if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
          throw constraintErr; // Re-throw permission denials to handle in outer block
        }
        
        // Try simple video constraint fallback
        const fallbackConstraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId ? { deviceId: { exact: deviceId } } : mode ? { facingMode: mode } : true,
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      if (!mediaStream) {
        throw new Error("Unable to initialize camera stream");
      }

      setStream(mediaStream);
      setStatus("ready");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => {
          console.warn("Video play notice:", err?.message || err);
        });
      }

      await detectCameras();
    } catch (err: any) {
      const name = err?.name || "";
      const msg = err?.message || "";
      
      // Handle known camera permission / availability states gracefully
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.toLowerCase().includes("permission denied")) {
        setStatus("denied");
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser or choose a photo from your device.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("nocamera");
        setErrorMessage("No camera was detected on this device.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setStatus("inuse");
        setErrorMessage("The camera is currently being used by another application or tab.");
      } else {
        setStatus("error");
        setErrorMessage(msg || "Unable to access device camera. Please check camera permissions.");
      }
    }
  };

  useEffect(() => {
    if (isOpen && !capturedPreview) {
      startCamera(facingMode, selectedDeviceId);
    }

    return () => {
      stopTracks();
    };
  }, [isOpen, facingMode, selectedDeviceId]);

  const handleClose = () => {
    stopTracks();
    setCapturedPreview(null);
    onClose();
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    canvas.width = vWidth;
    canvas.height = vHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw frame in native resolution
    ctx.drawImage(video, 0, 0, vWidth, vHeight);

    // High quality JPEG encoding to maintain plate sharpness
    const dataUrl = canvas.toDataURL("image/jpeg", 0.90);
    setCapturedPreview(dataUrl);

    // Stop live stream after frame is captured
    stopTracks();
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera(facingMode, selectedDeviceId);
  };

  const handleConfirmCapturedPhoto = () => {
    if (capturedPreview) {
      onPhotoCaptured(capturedPreview);
      handleClose();
    }
  };

  const handleToggleFacing = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    setSelectedDeviceId(""); // clear exact device id to allow facing mode switch
  };

  const handleSelectDevice = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
  };

  const handleFallbackToFilePicker = () => {
    handleClose();
    if (onChooseFromDeviceFallback) {
      onChooseFromDeviceFallback();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-white">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Capture Vehicle Photo
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Live Device Camera
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Position rear camera to capture vehicle & license plate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera / Preview Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px] sm:min-h-[440px]">
          
          {/* Initializing Spinner */}
          {status === "initializing" && !capturedPreview && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950/80 z-20">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-200 font-semibold">
                Accessing device camera ({facingMode === "environment" ? "Rear / Environment" : "Front Camera"})...
              </p>
              <p className="text-[11px] text-slate-400">Please grant camera permission in your browser prompt.</p>
            </div>
          )}

          {/* Error States */}
          {status !== "initializing" && status !== "ready" && !capturedPreview && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900 z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {status === "denied"
                    ? "Camera Access Denied"
                    : status === "nocamera"
                    ? "No Camera Detected"
                    : status === "inuse"
                    ? "Camera Busy"
                    : status === "insecure"
                    ? "Secure Connection Required"
                    : "Camera Unavailable"}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {errorMessage || "Unable to start camera stream."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode, selectedDeviceId)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>

                <button
                  type="button"
                  onClick={handleFallbackToFilePicker}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Choose From Device</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Video Stream */}
          {!capturedPreview && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[65vh]"
              />

              {/* Framing Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 sm:p-6 z-10">
                <div className="bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>FRAME VEHICLE HERE</span>
                </div>

                {/* Target Bounding Box */}
                <div className="w-[85%] max-w-md h-48 sm:h-56 border-2 border-dashed border-white/60 rounded-2xl flex flex-col items-center justify-center bg-white/5 backdrop-blur-[1px] relative shadow-inner">
                  <div className="absolute -top-3 left-4 bg-blue-600 text-white text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                    VEHICLE ALIGNMENT
                  </div>
                  <div className="text-center text-white/70 text-xs font-semibold px-4">
                    Position vehicle & registration plate inside this boundary
                  </div>
                  {/* Corner notches */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-xl" />
                </div>

                <div className="text-[10px] text-slate-300 bg-black/60 px-3 py-0.5 rounded-full">
                  Prefer Rear Camera • Keep license plate visible
                </div>
              </div>
            </>
          )}

          {/* Captured Review Preview */}
          {capturedPreview && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPreview}
                alt="Captured Vehicle"
                className="w-full h-full object-contain max-h-[65vh]"
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                <CheckCircle2 className="w-4 h-4" /> Photo Captured
              </span>
              <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gate Inward Timestamp: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
          {!capturedPreview ? (
            <>
              <div className="flex items-center gap-2">
                {/* Switch Camera Facing Mode */}
                <button
                  type="button"
                  id="btn-switch-camera"
                  onClick={handleToggleFacing}
                  className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  title="Switch between rear and front cameras"
                >
                  <SwitchCamera className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Switch Camera</span>
                  <span className="text-[10px] text-slate-400">({facingMode === "environment" ? "Rear" : "Front"})</span>
                </button>

                {/* Multiple Devices Select if more than 1 camera */}
                {videoDevices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={handleSelectDevice}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[140px] truncate"
                  >
                    <option value="">Default Camera</option>
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Capture Photo Button (Primary) */}
              <button
                type="button"
                id="btn-capture-frame"
                onClick={handleCaptureFrame}
                disabled={status !== "ready"}
                className="px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 text-xs sm:text-sm transition transform active:scale-95 cursor-pointer"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                <span>📷 CAPTURE PHOTO</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {/* Review Mode: Retake vs Use This Photo */}
              <button
                type="button"
                id="btn-retake-captured-photo"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Retake Photo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="btn-use-this-photo"
                  onClick={handleConfirmCapturedPhoto}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition transform active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Use This Photo</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
