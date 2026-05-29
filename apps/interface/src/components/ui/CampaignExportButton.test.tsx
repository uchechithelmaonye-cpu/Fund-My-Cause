import { render, screen, fireEvent } from "@testing-library/react";
import { CampaignExportButton } from "./CampaignExportButton";
import { Campaign } from "@/types/campaign";

describe("CampaignExportButton", () => {
  const mockCampaign: Campaign = {
    id: "test-id",
    contractId: "contract-id",
    title: "Test Campaign",
    description: "Test Description",
    creator: "creator-address",
    raised: 500,
    goal: 1000,
    deadline: new Date().toISOString(),
    status: "Active",
    token: "XLM",
  };

  it("renders export button", () => {
    render(<CampaignExportButton campaign={mockCampaign} />);
    expect(screen.getByText(/export/i)).toBeInTheDocument();
  });

  it("shows export options on click", () => {
    render(<CampaignExportButton campaign={mockCampaign} />);
    const button = screen.getByText(/export/i);
    fireEvent.click(button);
    expect(screen.getByText(/csv/i)).toBeInTheDocument();
  });

  it("displays all export formats", () => {
    render(<CampaignExportButton campaign={mockCampaign} />);
    const button = screen.getByText(/export/i);
    fireEvent.click(button);
    expect(screen.getByText(/json/i)).toBeInTheDocument();
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();
  });
});
