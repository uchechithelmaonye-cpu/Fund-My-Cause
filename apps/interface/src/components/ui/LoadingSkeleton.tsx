"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ── Base primitive ────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded skeleton-shimmer", className)}
      aria-hidden="true"
    />
  );
}

// ── Fade-in wrapper (wraps content that replaces a skeleton) ──────────────────

export function FadeIn({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("animate-fade-in-up", className)}>{children}</div>
  );
}

// ── Internal shimmer block ────────────────────────────────────────────────────

function Block({ className }: { className: string }) {
  return <div className={cn("skeleton-shimmer", className)} />;
}

// ── Campaign card skeleton ────────────────────────────────────────────────────

export function LoadingSkeleton() {
  return (
    <div
      className="ds-card"
      aria-busy="true"
      aria-label="Loading campaign"
    >
      <Block className="w-full h-48" />
      <div className="p-5 space-y-3">
        <Block className="h-5 rounded w-3/4" />
        <div className="space-y-2">
          <Block className="h-4 rounded w-full" />
          <Block className="h-4 rounded w-5/6" />
        </div>
        <Block className="h-2 rounded-full" />
        <div className="flex justify-between">
          <Block className="h-4 rounded w-1/3" />
          <Block className="h-4 rounded w-1/4" />
        </div>
        <Block className="h-4 rounded w-1/2" />
        <Block className="h-9 rounded-[var(--radius-xl)]" />
      </div>
    </div>
  );
}

export function LoadingSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────────────────────────

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr aria-busy="true" aria-label="Loading row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Block className="h-4 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ── Stat card skeleton ────────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div
      className="ds-card p-5 space-y-2"
      aria-busy="true"
      aria-label="Loading stat"
    >
      <Block className="h-3 rounded w-1/2" />
      <Block className="h-8 rounded w-2/3" />
      <Block className="h-3 rounded w-1/3" />
    </div>
  );
}

// ── Form field skeleton ───────────────────────────────────────────────────────

export function FormFieldSkeleton() {
  return (
    <div
      className="space-y-1"
      aria-busy="true"
      aria-label="Loading field"
    >
      <Block className="h-3 rounded w-1/4" />
      <Block className="h-10 rounded-[var(--radius-xl)] w-full" />
    </div>
  );
}
