import {
  analyzeBundleSize,
  identifyLargeDependencies,
  calculateOptimizationPotential,
  reportBundleMetrics,
  getScriptExecutionTime,
  detectUnusedDependencies,
} from "./bundleAnalysis";

describe("bundleAnalysis", () => {
  describe("analyzeBundleSize", () => {
    it("should return bundle metrics object with required properties", () => {
      const result = analyzeBundleSize();
      expect(result).toHaveProperty("totalSize");
      expect(result).toHaveProperty("gzipSize");
      expect(result).toHaveProperty("dependencies");
      expect(result).toHaveProperty("largestModules");
    });

    it("should have numeric properties", () => {
      const result = analyzeBundleSize();
      expect(typeof result.totalSize).toBe("number");
      expect(typeof result.gzipSize).toBe("number");
    });

    it("should have array properties", () => {
      const result = analyzeBundleSize();
      expect(Array.isArray(result.dependencies)).toBe(true);
      expect(Array.isArray(result.largestModules)).toBe(true);
    });
  });

  describe("identifyLargeDependencies", () => {
    it("should return array of dependencies", () => {
      const result = identifyLargeDependencies(100000);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("calculateOptimizationPotential", () => {
    it("should return optimization potential object", () => {
      const metrics = {
        totalSize: 500000,
        gzipSize: 150000,
        dependencies: [],
        largestModules: [
          { name: "large.js", size: 100000, percentage: 20 },
        ],
      };

      const result = calculateOptimizationPotential(metrics);
      expect(result).toHaveProperty("potentialReduction");
      expect(result).toHaveProperty("percentage");
      expect(result).toHaveProperty("recommendations");
    });

    it("should provide recommendations array", () => {
      const metrics = {
        totalSize: 500000,
        gzipSize: 150000,
        dependencies: [],
        largestModules: [
          { name: "large.js", size: 100000, percentage: 20 },
        ],
      };

      const result = calculateOptimizationPotential(metrics);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe("reportBundleMetrics", () => {
    it("should handle metric reporting", async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const metrics = {
        totalSize: 500000,
        gzipSize: 150000,
        dependencies: [],
        largestModules: [],
      };

      await reportBundleMetrics("/api/metrics", metrics);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("getScriptExecutionTime", () => {
    it("should return execution times map", () => {
      const result = getScriptExecutionTime();
      expect(result instanceof Map).toBe(true);
    });
  });

  describe("detectUnusedDependencies", () => {
    it("should return array of unused dependencies", () => {
      const usedModules = new Set(["used.js"]);
      const result = detectUnusedDependencies(usedModules);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
