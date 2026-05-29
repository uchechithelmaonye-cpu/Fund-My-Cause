/**
 * HTTP caching and cache invalidation utilities
 */

export interface CacheConfig {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  public?: boolean;
  private?: boolean;
}

/**
 * Generate Cache-Control header value
 */
export function generateCacheControl(config: CacheConfig): string {
  const directives: string[] = [];

  if (config.public) directives.push("public");
  if (config.private) directives.push("private");
  if (config.maxAge !== undefined)
    directives.push(`max-age=${config.maxAge}`);
  if (config.sMaxAge !== undefined)
    directives.push(`s-maxage=${config.sMaxAge}`);
  if (config.staleWhileRevalidate !== undefined)
    directives.push(
      `stale-while-revalidate=${config.staleWhileRevalidate}`
    );
  if (config.staleIfError !== undefined)
    directives.push(`stale-if-error=${config.staleIfError}`);

  return directives.join(", ");
}

/**
 * Cache storage for client-side caching
 */
export class CacheStorage {
  private prefix: string;

  constructor(prefix = "fmc_cache_") {
    this.prefix = prefix;
  }

  set(key: string, value: unknown, ttl?: number): void {
    if (typeof window === "undefined") return;

    const item = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    try {
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(item)
      );
    } catch (e) {
      console.warn("Cache storage failed:", e);
    }
  }

  get(key: string): unknown | null {
    if (typeof window === "undefined") return null;

    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const { value, timestamp, ttl } = parsed;

      if (ttl && Date.now() - timestamp > ttl) {
        this.remove(key);
        return null;
      }

      return value;
    } catch (e) {
      console.warn("Cache retrieval failed:", e);
      return null;
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clear(): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Cache clear failed:", e);
    }
  }

  invalidate(pattern: RegExp): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (
          key.startsWith(this.prefix) &&
          pattern.test(key.replace(this.prefix, ""))
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Cache invalidation failed:", e);
    }
  }
}

/**
 * Service Worker registration and management
 */
export async function registerServiceWorker(
  scriptUrl: string
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      scriptUrl,
      { scope: "/" }
    );
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations =
      await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  } catch (error) {
    console.error("Service Worker unregistration failed:", error);
  }
}

/**
 * Check if offline
 */
export function isOffline(): boolean {
  if (typeof window === "undefined") return false;
  return !navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onOnlineStatusChange(
  callback: (isOnline: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
