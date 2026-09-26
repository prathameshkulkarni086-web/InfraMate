import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { attendanceService } from "../../services/attendanceService";
import { AttendanceRecord } from "../../types";

interface OfflineSyncBannerProps {
  onSyncComplete: (syncedCount: number) => void;
  storageServiceSync: (records: AttendanceRecord[]) => number;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  onSyncComplete,
  storageServiceSync,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const checkPendingQueue = () => {
    const queue = attendanceService.getOfflineQueue();
    setPendingCount(queue.length);
  };

  useEffect(() => {
    checkPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      checkPendingQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      checkPendingQueue();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(checkPendingQueue, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const queue = attendanceService.getOfflineQueue();
    if (queue.length === 0) {
      setIsSyncing(false);
      return;
    }

    // Process synchronization
    await new Promise((resolve) => setTimeout(resolve, 800));
    const synced = storageServiceSync(queue);
    attendanceService.clearOfflineQueue();
    setPendingCount(0);
    setIsSyncing(false);
    setSyncSuccessMsg(`Successfully synced ${synced} attendance record(s) with authoritative server.`);
    onSyncComplete(synced);

    setTimeout(() => {
      setSyncSuccessMsg(null);
    }, 4000);
  };

  if (isOnline && pendingCount === 0 && !syncSuccessMsg) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2 animate-in fade-in">
      {!isOnline && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-semibold">Site Offline Mode Active:</span> Device is currently disconnected from internet. New attendance will be stored locally in safe offline storage.
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-medium">
            Local Queue ({pendingCount})
          </span>
        </div>
      )}

      {pendingCount > 0 && isOnline && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 text-xs">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-semibold">Internet Restored:</span> You have <span className="font-bold underline">{pendingCount}</span> offline attendance record(s) pending synchronization.
            </div>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Pending Records Now"}
          </button>
        </div>
      )}

      {syncSuccessMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
