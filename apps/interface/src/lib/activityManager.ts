export type ActivityEventType =
  | "contribution"
  | "comment"
  | "milestone_reached"
  | "goal_reached"
  | "campaign_updated";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  actor: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFilter {
  types?: ActivityEventType[];
  actor?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function filterActivities(
  activities: ActivityEvent[],
  filter: ActivityFilter,
): ActivityEvent[] {
  return activities.filter((activity) => {
    if (filter.types && !filter.types.includes(activity.type)) return false;
    if (filter.actor && activity.actor !== filter.actor) return false;
    if (filter.dateFrom && new Date(activity.timestamp) < new Date(filter.dateFrom))
      return false;
    if (filter.dateTo && new Date(activity.timestamp) > new Date(filter.dateTo)) return false;
    return true;
  });
}

export function sortActivitiesByDate(activities: ActivityEvent[]): ActivityEvent[] {
  return [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getActivityIcon(type: ActivityEventType): string {
  const icons: Record<ActivityEventType, string> = {
    contribution: "💰",
    comment: "💬",
    milestone_reached: "🎯",
    goal_reached: "🎉",
    campaign_updated: "📝",
  };
  return icons[type];
}

export function formatActivityTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
