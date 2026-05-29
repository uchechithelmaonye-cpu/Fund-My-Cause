import { render, screen } from "@testing-library/react";
import { DocumentViewer } from "./DocumentViewer";

describe("DocumentViewer", () => {
  const mockDoc = {
    id: "doc1",
    name: "test.pdf",
    url: "https://example.com/test.pdf",
    type: "application/pdf",
    size: 1024,
    uploadedAt: new Date().toISOString(),
  };

  it("renders document name", () => {
    render(<DocumentViewer document={mockDoc} />);
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("renders download button", () => {
    render(<DocumentViewer document={mockDoc} />);
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });

  it("displays file size", () => {
    render(<DocumentViewer document={mockDoc} />);
    expect(screen.getByText(/1 KB/i)).toBeInTheDocument();
  });
});
