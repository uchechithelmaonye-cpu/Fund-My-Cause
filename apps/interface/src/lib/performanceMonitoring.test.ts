import {
  measureCoreWebVitals,
  getCoreWebVitals,
  measurePageLoadTime,
  getResourceTimings,
  reportPerformanceMetrics,
  markPerformance,
  measurePerformance,
} from "./performanceMonitoring";

describe("performanceMonitoring", () => {
  describe("measureCoreWebVitals", () => {
    it("should accept callback function", () => {
      const callback = jest.fn();
      expect(() => measureCoreWebVitals(callback)).not.toThrow();
    });
  });

  describe("getCoreWebVitals", () => {
    it("should return core web vitals object", () => {
      const result = getCoreWebVitals();
      expect(result).toHaveProperty("lcp");
      expect(result).toHaveProperty("fid");
      expect(result).toHaveProperty("cls");
    });
  });

  describe("measurePageLoadTime", () => {
    it("should return numeric value", () => {
      const result = measurePageLoadTime();
      expect(typeof result).toBe("number");
    });
  });

  describe("getResourceTimings", () => {
    it("should return array", () => {
      const result = getResourceTimings();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("reportPerformanceMetrics", () => {
    it("should handle metric reporting", async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const metrics = { fcp: 100, lcp: 200, cls: 0.1 };
      await reportPerformanceMetrics("/api/perf", metrics);

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("markPerformance", () => {
    it("should handle mark creation safely", () => {
      expect(() => markPerformance("test-mark")).not.toThrow();
    });
  });

  describe("measurePerformance", () => {
    it("should handle measurement safely", () => {
      const result = measurePerformance("test", "start", "end");
      expect(typeof result).toBe("number");
    });
  });
});
