// Global Network & Offline Sync Service
export type ConnectionStatus = "online" | "offline" | "connecting" | "syncing";

type NetworkListener = (status: ConnectionStatus) => void;

class NetworkService {
  private status: ConnectionStatus = typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online";
  private listeners: Set<NetworkListener> = new Set();
  private pendingQueueCount = 0;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleStatusChange("online"));
      window.addEventListener("offline", () => this.handleStatusChange("offline"));
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isOnline(): boolean {
    return this.status === "online" || this.status === "syncing";
  }

  public setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.notify();
    }
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleStatusChange(status: "online" | "offline") {
    if (status === "online") {
      this.status = "connecting";
      this.notify();
      setTimeout(() => {
        this.status = "online";
        this.notify();
      }, 1000);
    } else {
      this.status = "offline";
      this.notify();
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (err) {
        console.error("Network listener error:", err);
      }
    });
  }
}

export const networkService = new NetworkService();
