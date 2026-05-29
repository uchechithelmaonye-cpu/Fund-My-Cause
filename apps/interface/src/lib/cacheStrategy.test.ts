import {
  generateCacheControl,
  CacheStorage,
  registerServiceWorker,
  unregisterServiceWorker,
  isOffline,
  onOnlineStatusChange,
} from "./cacheStrategy";

describe("cacheStrategy", () => {
  describe("generateCacheControl", () => {
    it("should generate cache control header", () => {
      const result = generateCacheControl({
        maxAge: 3600,
        public: true,
      });
      expect(result).toContain("public");
      expect(result).toContain("max-age=3600");
    });

    it("should include stale-while-revalidate", () => {
      const result = generateCacheControl({
        maxAge: 3600,
        staleWhileRevalidate: 86400,
      });
      expect(result).toContain("stale-while-revalidate=86400");
    });

    it("should include stale-if-error", () => {
      const result = generateCacheControl({
        maxAge: 3600,
        staleIfError: 604800,
      });
      expect(result).toContain("stale-if-error=604800");
    });

    it("should handle private cache", () => {
      const result = generateCacheControl({
        private: true,
        maxAge: 1800,
      });
      expect(result).toContain("private");
    });
  });

  describe("CacheStorage", () => {
    let cache: CacheStorage;

    beforeEach(() => {
      cache = new CacheStorage();
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("should set and get cache", () => {
      cache.set("key1", { data: "value" });
      const result = cache.get("key1");
      expect(result).toEqual({ data: "value" });
    });

    it("should respect TTL", (done) => {
      cache.set("key1", "value", 100);
      expect(cache.get("key1")).toBe("value");

      setTimeout(() => {
        expect(cache.get("key1")).toBeNull();
        done();
      }, 150);
    });

    it("should remove cache", () => {
      cache.set("key1", "value");
      cache.remove("key1");
      expect(cache.get("key1")).toBeNull();
    });

    it("should clear all cache", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
    });

    it("should invalidate by pattern", () => {
      cache.set("campaign_1", "data1");
      cache.set("campaign_2", "data2");
      cache.set("user_1", "data3");

      cache.invalidate(/^campaign_/);

      expect(cache.get("campaign_1")).toBeNull();
      expect(cache.get("campaign_2")).toBeNull();
      expect(cache.get("user_1")).toBe("data3");
    });

    it("should use custom prefix", () => {
      const customCache = new CacheStorage("custom_");
      customCache.set("key1", "value");
      expect(localStorage.getItem("custom_key1")).toBeTruthy();
    });
  });

  describe("registerServiceWorker", () => {
    it("should return null if service worker not supported", async () => {
      const originalSW = navigator.serviceWorker;
      Object.defineProperty(navigator, "serviceWorker", {
        value: undefined,
        configurable: true,
      });

      const result = await registerServiceWorker("/sw.js");
      expect(result).toBeNull();

      Object.defineProperty(navigator, "serviceWorker", {
        value: originalSW,
        configurable: true,
      });
    });
  });

  describe("unregisterServiceWorker", () => {
    it("should handle unregistration", async () => {
      await unregisterServiceWorker();
      expect(true).toBe(true);
    });
  });

  describe("isOffline", () => {
    it("should return online status", () => {
      const result = isOffline();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("onOnlineStatusChange", () => {
    it("should return unsubscribe function", () => {
      const callback = jest.fn();
      const unsubscribe = onOnlineStatusChange(callback);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });

    it("should listen for online event", () => {
      const callback = jest.fn();
      const unsubscribe = onOnlineStatusChange(callback);

      window.dispatchEvent(new Event("online"));
      expect(callback).toHaveBeenCalledWith(true);

      unsubscribe();
    });

    it("should listen for offline event", () => {
      const callback = jest.fn();
      const unsubscribe = onOnlineStatusChange(callback);

      window.dispatchEvent(new Event("offline"));
      expect(callback).toHaveBeenCalledWith(false);

      unsubscribe();
    });
  });
});
