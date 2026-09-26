// Safe storage utility with in-memory fallback for iOS Safari Private Browsing & Quota Limits

const memoryStore = new Map<string, string>();

function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const testKey = "__infrasync_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (storageAvailable) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Ignore security error
    }
    return memoryStore.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (storageAvailable) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // In iOS Safari private browsing or quota exceeded, save to memory store
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (storageAvailable) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
    memoryStore.delete(key);
  },

  clear(): void {
    try {
      if (storageAvailable) {
        window.localStorage.clear();
      }
    } catch {
      // Ignore
    }
    memoryStore.clear();
  },

  getAllKeys(): string[] {
    const keys = new Set<string>();
    try {
      if (storageAvailable) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) keys.add(k);
        }
      }
    } catch {
      // Ignore
    }
    for (const k of memoryStore.keys()) {
      keys.add(k);
    }
    return Array.from(keys);
  },
};
