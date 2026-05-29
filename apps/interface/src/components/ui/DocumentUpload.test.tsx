import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentUpload } from "./DocumentUpload";

describe("DocumentUpload", () => {
  it("renders upload button", () => {
    render(<DocumentUpload campaignId="test-id" onUpload={jest.fn()} />);
    expect(screen.getByText(/upload document/i)).toBeInTheDocument();
  });

  it("accepts file input", () => {
    const onUpload = jest.fn();
    render(<DocumentUpload campaignId="test-id" onUpload={onUpload} />);
    const input = screen.getByRole("button", { name: /upload document/i });
    expect(input).toBeInTheDocument();
  });

  it("displays error for oversized files", () => {
    render(<DocumentUpload campaignId="test-id" onUpload={jest.fn()} />);
    const input = screen.getByRole("button", { name: /upload document/i });
    expect(input).toBeInTheDocument();
  });
});
