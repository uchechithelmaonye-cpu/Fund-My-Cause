import React from "react";
import { render, screen } from "@testing-library/react";
import { CampaignCard } from "./CampaignCard";
import type { Campaign } from "@/types/campaign";

const mockCampaign: Campaign = {
  id: "test-123",
  contractId: "CTEST123",
  title: "Save the Rainforest",
  description: "Help us protect endangered species",
  creator: "GCREATOR123",
  goal: 100_000_000n,
  totalRaised: 50_000_000n,
  deadline: new Date(Date.now() + 86400000),
  minContribution: 1_000_000n,
  status: "active",
  imageUrl: "https://example.com/image.jpg",
  token: "native",
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("CampaignCard", () => {
  it("renders campaign title", () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText("Save the Rainforest")).toBeInTheDocument();
  });

  it("renders campaign description", () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText("Help us protect endangered species")).toBeInTheDocument();
  });

  it("displays progress percentage", () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders campaign image", () => {
    render(<CampaignCard campaign={mockCampaign} />);
    const img = screen.getByAltText("Save the Rainforest");
    expect(img).toHaveAttribute("src", expect.stringContaining("image.jpg"));
  });

  it("links to campaign details", () => {
    render(<CampaignCard campaign={mockCampaign} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("test-123"));
  });

  it("shows active status badge", () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it("handles completed campaigns", () => {
    const completedCampaign = {
      ...mockCampaign,
      status: "completed" as const,
      totalRaised: 100_000_000n,
    };
    render(<CampaignCard campaign={completedCampaign} />);
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });
});
