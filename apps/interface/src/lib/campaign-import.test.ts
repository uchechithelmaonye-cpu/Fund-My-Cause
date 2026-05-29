import {
  parseCSV,
  validateImportData,
  convertToXLM,
  type CampaignImportData,
} from "./campaign-import";

describe("campaign-import", () => {
  describe("parseCSV", () => {
    it("parses valid CSV data", () => {
      const csv = `title,description,goal
Test Campaign,A test campaign,1000
Another Campaign,Another test,2000`;
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Test Campaign");
      expect(result[1].goal).toBe("2000");
    });

    it("handles empty CSV", () => {
      const result = parseCSV("");
      expect(result).toHaveLength(0);
    });

    it("trims whitespace", () => {
      const csv = `title , description
  Test  ,  Description  `;
      const result = parseCSV(csv);
      expect(result[0].title).toBe("Test");
      expect(result[0].description).toBe("Description");
    });
  });

  describe("validateImportData", () => {
    const validData: CampaignImportData = {
      title: "Valid Campaign",
      description: "This is a valid campaign description",
      goal: "1000",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      minContribution: "10",
    };

    it("validates correct data", () => {
      const errors = validateImportData(validData);
      expect(errors).toHaveLength(0);
    });

    it("rejects short title", () => {
      const errors = validateImportData({ ...validData, title: "ab" });
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "title" }),
      );
    });

    it("rejects short description", () => {
      const errors = validateImportData({ ...validData, description: "short" });
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
    });

    it("rejects invalid goal", () => {
      const errors = validateImportData({ ...validData, goal: "invalid" });
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "goal" }),
      );
    });

    it("rejects past deadline", () => {
      const errors = validateImportData({
        ...validData,
        deadline: new Date(Date.now() - 1000).toISOString(),
      });
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "deadline" }),
      );
    });

    it("rejects invalid URLs", () => {
      const errors = validateImportData({
        ...validData,
        imageUrl: "not-a-url",
      });
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "imageUrl" }),
      );
    });
  });

  describe("convertToXLM", () => {
    it("converts XLM to stroops", () => {
      expect(convertToXLM("1")).toBe(10_000_000n);
      expect(convertToXLM("0.5")).toBe(5_000_000n);
      expect(convertToXLM("100")).toBe(1_000_000_000n);
    });

    it("handles decimal values", () => {
      expect(convertToXLM("1.5")).toBe(15_000_000n);
    });
  });
});
