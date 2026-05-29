import { renderHook, waitFor } from "@testing-library/react";
import { useIntersectionObserver, useLazyLoad } from "./lazyLoading";

describe("lazyLoading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should detect intersection", async () => {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    });
    window.IntersectionObserver = mockIntersectionObserver as any;

    const { result } = renderHook(() => useIntersectionObserver());
    const [ref, isVisible] = result.current;

    expect(ref).toBeDefined();
    expect(isVisible).toBe(false);
  });

  it("should lazy load data", async () => {
    const mockLoader = jest.fn().mockResolvedValue({ data: "loaded" });
    const mockIntersectionObserver = jest.fn((callback) => {
      setTimeout(() => callback([{ isIntersecting: true, target: {} }]), 0);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });
    window.IntersectionObserver = mockIntersectionObserver as any;

    const { result } = renderHook(() => useLazyLoad(mockLoader));

    await waitFor(() => {
      expect(result.current[1]).toEqual({ data: "loaded" });
    });
  });

  it("should handle lazy load errors", async () => {
    const error = new Error("Load failed");
    const mockLoader = jest.fn().mockRejectedValue(error);
    const mockIntersectionObserver = jest.fn((callback) => {
      setTimeout(() => callback([{ isIntersecting: true, target: {} }]), 0);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });
    window.IntersectionObserver = mockIntersectionObserver as any;

    const { result } = renderHook(() => useLazyLoad(mockLoader));

    await waitFor(() => {
      expect(result.current[3]).toEqual(error);
    });
  });
});
