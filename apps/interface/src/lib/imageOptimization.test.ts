import {
  generateResponsiveImageSet,
  generateWebPSrcSet,
  supportsWebP,
  getOptimizedImageUrl,
  preloadImage,
  createLazyLoadObserver,
} from "./imageOptimization";

describe("imageOptimization", () => {
  describe("generateResponsiveImageSet", () => {
    it("should generate srcset with default widths", () => {
      const result = generateResponsiveImageSet("/image.jpg");
      expect(result.srcSet).toContain("320w");
      expect(result.srcSet).toContain("640w");
      expect(result.srcSet).toContain("1024w");
      expect(result.srcSet).toContain("1280w");
    });

    it("should generate correct sizes attribute", () => {
      const result = generateResponsiveImageSet("/image.jpg");
      expect(result.sizes).toContain("100vw");
      expect(result.sizes).toContain("50vw");
      expect(result.sizes).toContain("33vw");
    });

    it("should use custom widths", () => {
      const result = generateResponsiveImageSet("/image.jpg", [
        100, 200,
      ]);
      expect(result.srcSet).toContain("100w");
      expect(result.srcSet).toContain("200w");
      expect(result.srcSet).not.toContain("320w");
    });
  });

  describe("generateWebPSrcSet", () => {
    it("should generate webp srcset", () => {
      const result = generateWebPSrcSet("/image.jpg");
      expect(result).toContain("fmt=webp");
      expect(result).toContain("320w");
    });

    it("should use custom widths", () => {
      const result = generateWebPSrcSet("/image.jpg", [100, 200]);
      expect(result).toContain("100w");
      expect(result).toContain("200w");
    });
  });

  describe("supportsWebP", () => {
    it("should return boolean", () => {
      const mockCanvas = {
        toDataURL: jest.fn(() => "data:image/webp;base64,"),
        width: 1,
        height: 1,
      };
      jest
        .spyOn(document, "createElement")
        .mockReturnValueOnce(mockCanvas as any);

      const result = supportsWebP();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getOptimizedImageUrl", () => {
    it("should add width parameter", () => {
      const result = getOptimizedImageUrl("/image.jpg", {
        width: 640,
      });
      expect(result).toContain("w=640");
    });

    it("should add quality parameter", () => {
      const result = getOptimizedImageUrl("/image.jpg", {
        quality: 75,
      });
      expect(result).toContain("q=75");
    });

    it("should add webp format", () => {
      const result = getOptimizedImageUrl("/image.jpg", {
        format: "webp",
      });
      expect(result).toContain("fmt=webp");
    });

    it("should handle existing query params", () => {
      const result = getOptimizedImageUrl("/image.jpg?existing=param", {
        width: 640,
      });
      expect(result).toContain("existing=param");
      expect(result).toContain("w=640");
    });
  });

  describe("preloadImage", () => {
    it("should create preload link", () => {
      const appendChildSpy = jest.spyOn(
        document.head,
        "appendChild"
      );
      preloadImage("/image.jpg");
      expect(appendChildSpy).toHaveBeenCalled();
      appendChildSpy.mockRestore();
    });
  });

  describe("createLazyLoadObserver", () => {
    beforeEach(() => {
      global.IntersectionObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      })) as any;
    });

    it("should create intersection observer", () => {
      const callback = jest.fn();
      const observer = createLazyLoadObserver(callback);
      expect(global.IntersectionObserver).toHaveBeenCalled();
    });

    it("should use custom options", () => {
      const callback = jest.fn();
      const customOptions = { rootMargin: "100px" };
      createLazyLoadObserver(callback, customOptions);
      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        callback,
        expect.objectContaining({ rootMargin: "100px" })
      );
    });
  });
});
