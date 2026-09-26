import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { networkService, ConnectionStatus } from "../../services/networkService";
import { attendanceService } from "../../services/attendanceService";

export const NetworkStatusBar: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(networkService.getStatus());
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [showRestoredBanner, setShowRestoredBanner] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = networkService.subscribe((newStatus) => {
      setStatus(newStatus);
      if (newStatus === "online") {
        setShowRestoredBanner(true);
        const timer = setTimeout(() => setShowRestoredBanner(false), 3500);
        return () => clearTimeout(timer);
      }
    });

    const checkQueue = () => {
      const q = attendanceService.getOfflineQueue();
      setOfflineQueueCount(q.length);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (status === "online" && !showRestoredBanner && offlineQueueCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full transition-all duration-300 z-40 text-xs px-3 py-1.5 flex items-center justify-between shadow-xs font-medium"
      style={{
        backgroundColor:
          status === "offline"
            ? "#dc2626"
            : status === "connecting"
            ? "#d97706"
            : status === "syncing"
            ? "#2563eb"
            : "#059669",
        color: "#ffffff",
      }}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-1.5 truncate">
          {status === "offline" && (
            <>
              <WifiOff className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
              <span className="font-semibold">Site Offline Mode:</span>
              <span className="truncate">Working offline. Data will safely save locally.</span>
            </>
          )}
          {status === "connecting" && (
            <>
              <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 animate-spin" />
              <span className="font-semibold">Connecting to network...</span>
            </>
          )}
          {status === "syncing" && (
            <>
              <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 animate-spin" />
              <span className="font-semibold">Syncing field records...</span>
            </>
          )}
          {status === "online" && showRestoredBanner && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-semibold">Back Online:</span>
              <span className="truncate">Real-time sync restored.</span>
            </>
          )}
        </div>

        {offlineQueueCount > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold shrink-0">
            {offlineQueueCount} queued
          </span>
        )}
      </div>
    </div>
  );
};
