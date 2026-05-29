import React from "react";
import { render, screen, act } from "@testing-library/react";
import { CountdownTimer } from "./CountdownTimer";

describe("CountdownTimer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders countdown with valid deadline", () => {
    const futureDate = new Date(Date.now() + 86400000); // 1 day from now
    render(<CountdownTimer deadline={futureDate} />);
    expect(screen.getByText(/days?/i)).toBeInTheDocument();
  });

  it("shows expired state when deadline passed", () => {
    const pastDate = new Date(Date.now() - 1000);
    render(<CountdownTimer deadline={pastDate} />);
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  it("updates countdown every second", () => {
    const futureDate = new Date(Date.now() + 3600000); // 1 hour
    const { rerender } = render(<CountdownTimer deadline={futureDate} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    rerender(<CountdownTimer deadline={futureDate} />);
    expect(screen.getByText(/\d+\s*h/)).toBeInTheDocument();
  });

  it("handles deadline in less than 1 minute", () => {
    const soonDate = new Date(Date.now() + 30000); // 30 seconds
    render(<CountdownTimer deadline={soonDate} />);
    expect(screen.getByText(/\d+\s*s/)).toBeInTheDocument();
  });
});
