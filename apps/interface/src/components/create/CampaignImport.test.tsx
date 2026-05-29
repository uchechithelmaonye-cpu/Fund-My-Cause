import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CampaignImport } from "./CampaignImport";

const mockOnImport = jest.fn();

describe("CampaignImport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders upload area", () => {
    render(<CampaignImport onImport={mockOnImport} />);
    expect(screen.getByText(/upload csv file/i)).toBeInTheDocument();
  });

  it("displays file name after selection", async () => {
    render(<CampaignImport onImport={mockOnImport} />);
    const input = screen.getByRole("button").querySelector("input[type='file']") as HTMLInputElement;
    
    const file = new File(
      ["title,description,goal,deadline,minContribution\nTest,A test campaign,1000,2025-12-31,10"],
      "test.csv",
      { type: "text/csv" },
    );

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/test.csv/i)).toBeInTheDocument();
    });
  });

  it("shows preview of imported data", async () => {
    render(<CampaignImport onImport={mockOnImport} />);
    const input = screen.getByRole("button").querySelector("input[type='file']") as HTMLInputElement;

    const file = new File(
      ["title,description,goal,deadline,minContribution\nTest Campaign,A test campaign,1000,2025-12-31,10"],
      "test.csv",
      { type: "text/csv" },
    );

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    });
  });

  it("shows validation errors for invalid data", async () => {
    render(<CampaignImport onImport={mockOnImport} />);
    const input = screen.getByRole("button").querySelector("input[type='file']") as HTMLInputElement;

    const file = new File(
      ["title,description,goal,deadline,minContribution\nAB,short,invalid,2020-01-01,10"],
      "test.csv",
      { type: "text/csv" },
    );

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it("disables import button when all rows have errors", async () => {
    render(<CampaignImport onImport={mockOnImport} />);
    const input = screen.getByRole("button").querySelector("input[type='file']") as HTMLInputElement;

    const file = new File(
      ["title,description,goal,deadline,minContribution\nAB,short,invalid,2020-01-01,10"],
      "test.csv",
      { type: "text/csv" },
    );

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const importBtn = screen.getByRole("button", { name: /import/i });
      expect(importBtn).toBeDisabled();
    });
  });

  it("calls onImport with valid data", async () => {
    render(<CampaignImport onImport={mockOnImport} />);
    const input = screen.getByRole("button").querySelector("input[type='file']") as HTMLInputElement;

    const file = new File(
      ["title,description,goal,deadline,minContribution\nValid Campaign,This is a valid campaign,1000,2025-12-31,10"],
      "test.csv",
      { type: "text/csv" },
    );

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const importBtn = screen.getByRole("button", { name: /import 1 campaign/i });
      fireEvent.click(importBtn);
    });

    expect(mockOnImport).toHaveBeenCalled();
  });
});
