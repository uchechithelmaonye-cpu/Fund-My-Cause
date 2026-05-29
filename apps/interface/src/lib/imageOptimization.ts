/**
 * Image optimization utilities for responsive images, lazy loading, and WebP support
 */

export interface ImageOptimizationConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

export interface ResponsiveImageSet {
  src: string;
  srcSet: string;
  sizes: string;
  webpSrcSet?: string;
}

/**
 * Generate responsive image srcset for different screen sizes
 */
export function generateResponsiveImageSet(
  baseSrc: string,
  widths: number[] = [320, 640, 1024, 1280]
): ResponsiveImageSet {
  const srcSet = widths
    .map((width) => `${baseSrc}?w=${width} ${width}w`)
    .join(", ");

  const sizes =
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return {
    src: baseSrc,
    srcSet,
    sizes,
  };
}

/**
 * Generate WebP srcset for modern browsers
 */
export function generateWebPSrcSet(
  baseSrc: string,
  widths: number[] = [320, 640, 1024, 1280]
): string {
  return widths
    .map((width) => `${baseSrc}?w=${width}&fmt=webp ${width}w`)
    .join(", ");
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === "undefined") return false;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  return (
    canvas.toDataURL("image/webp").indexOf("image/webp") === 0
  );
}

/**
 * Get optimized image URL with compression and format
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    quality?: number;
    format?: "webp" | "auto";
  } = {}
): string {
  const { width, quality = 80, format = "auto" } = options;

  const params = new URLSearchParams();
  if (width) params.append("w", width.toString());
  params.append("q", quality.toString());
  if (format === "webp") params.append("fmt", "webp");

  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}${params.toString()}`;
}

/**
 * Preload image for better performance
 */
export function preloadImage(src: string): void {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Create intersection observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: "50px",
    threshold: 0.01,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}
