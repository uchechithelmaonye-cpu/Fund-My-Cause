import { render, screen } from "@testing-library/react";
import { CampaignTimeline } from "./CampaignTimeline";
import { TimelineEvent } from "@/lib/timelineManager";

describe("CampaignTimeline", () => {
  const mockEvents: TimelineEvent[] = [
    {
      id: "1",
      type: "created",
      timestamp: new Date().toISOString(),
      title: "Campaign Created",
    },
    {
      id: "2",
      type: "contribution",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      title: "New Contribution",
      amount: 100,
    },
  ];

  it("renders timeline events", () => {
    render(<CampaignTimeline events={mockEvents} />);
    expect(screen.getByText("Campaign Created")).toBeInTheDocument();
  });

  it("displays event count", () => {
    render(<CampaignTimeline events={mockEvents} />);
    expect(screen.getByText(/2 events/i)).toBeInTheDocument();
  });

  it("renders empty state when no events", () => {
    render(<CampaignTimeline events={[]} />);
    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });
});
