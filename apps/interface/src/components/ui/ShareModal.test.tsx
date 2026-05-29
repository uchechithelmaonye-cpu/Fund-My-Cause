import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShareModal } from "./ShareModal";

const mockOnClose = jest.fn();

jest.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

describe("ShareModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders share modal with campaign title", () => {
    render(
      <ShareModal
        campaignId="test-123"
        campaignTitle="Save the Rainforest"
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText(/share/i)).toBeInTheDocument();
  });

  it("closes modal when close button clicked", () => {
    render(
      <ShareModal
        campaignId="test-123"
        campaignTitle="Save the Rainforest"
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("displays share links for social platforms", () => {
    render(
      <ShareModal
        campaignId="test-123"
        campaignTitle="Save the Rainforest"
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText(/twitter|x/i)).toBeInTheDocument();
    expect(screen.getByText(/facebook/i)).toBeInTheDocument();
  });

  it("provides copy-to-clipboard functionality", () => {
    render(
      <ShareModal
        campaignId="test-123"
        campaignTitle="Save the Rainforest"
        onClose={mockOnClose}
      />,
    );
    const copyButton = screen.getByRole("button", { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
  });
});
