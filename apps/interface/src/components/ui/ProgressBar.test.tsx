import React from "react";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders with correct percentage", () => {
    const { container } = render(<ProgressBar current={50} goal={100} />);
    const bar = container.querySelector("[role='progressbar']");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("displays percentage text", () => {
    render(<ProgressBar current={75} goal={100} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("handles zero progress", () => {
    const { container } = render(<ProgressBar current={0} goal={100} />);
    const bar = container.querySelector("[role='progressbar']");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  it("handles 100% progress", () => {
    const { container } = render(<ProgressBar current={100} goal={100} />);
    const bar = container.querySelector("[role='progressbar']");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("handles progress exceeding goal", () => {
    const { container } = render(<ProgressBar current={150} goal={100} />);
    const bar = container.querySelector("[role='progressbar']");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });
});
