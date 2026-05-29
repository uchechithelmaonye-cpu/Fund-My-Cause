export type TimelineEventType =
  | "created"
  | "contribution"
  | "milestone"
  | "update"
  | "goal_reached"
  | "deadline_extended"
  | "campaign_ended";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  description?: string;
  actor?: string;
  amount?: number;
}

export function sortEventsByDate(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function filterEventsByType(
  events: TimelineEvent[],
  types: TimelineEventType[],
): TimelineEvent[] {
  return events.filter((e) => types.includes(e.type));
}

export function getEventColor(type: TimelineEventType): string {
  const colors: Record<TimelineEventType, string> = {
    created: "bg-blue-500",
    contribution: "bg-green-500",
    milestone: "bg-purple-500",
    update: "bg-yellow-500",
    goal_reached: "bg-emerald-500",
    deadline_extended: "bg-orange-500",
    campaign_ended: "bg-red-500",
  };
  return colors[type];
}

export function getEventLabel(type: TimelineEventType): string {
  const labels: Record<TimelineEventType, string> = {
    created: "Campaign Created",
    contribution: "New Contribution",
    milestone: "Milestone Reached",
    update: "Campaign Updated",
    goal_reached: "Goal Reached",
    deadline_extended: "Deadline Extended",
    campaign_ended: "Campaign Ended",
  };
  return labels[type];
}
