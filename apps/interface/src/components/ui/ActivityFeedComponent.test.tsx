import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityFeedComponent } from "./ActivityFeedComponent";
import { ActivityEvent } from "@/lib/activityManager";

describe("ActivityFeedComponent", () => {
  const mockActivities: ActivityEvent[] = [
    {
      id: "1",
      type: "contribution",
      timestamp: new Date().toISOString(),
      actor: "user1",
      message: "Contributed 100 XLM",
    },
    {
      id: "2",
      type: "comment",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor: "user2",
      message: "Great project!",
    },
  ];

  it("renders activity events", () => {
    render(<ActivityFeedComponent activities={mockActivities} />);
    expect(screen.getByText("Contributed 100 XLM")).toBeInTheDocument();
  });

  it("displays actor names", () => {
    render(<ActivityFeedComponent activities={mockActivities} />);
    expect(screen.getByText("user1")).toBeInTheDocument();
  });

  it("filters by type", () => {
    render(
      <ActivityFeedComponent
        activities={mockActivities}
        filterTypes={["contribution"]}
      />,
    );
    expect(screen.getByText("Contributed 100 XLM")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<ActivityFeedComponent activities={[]} />);
    expect(screen.getByText(/no activity/i)).toBeInTheDocument();
  });
});
