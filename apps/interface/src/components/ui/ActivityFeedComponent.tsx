"use client";

import { useState } from "react";
import {
  ActivityEvent,
  ActivityEventType,
  sortActivitiesByDate,
  filterActivities,
  getActivityIcon,
  formatActivityTime,
} from "@/lib/activityManager";

interface ActivityFeedComponentProps {
  activities: ActivityEvent[];
  filterTypes?: ActivityEventType[];
}

export function ActivityFeedComponent({
  activities,
  filterTypes,
}: ActivityFeedComponentProps) {
  const [selectedFilter, setSelectedFilter] = useState<ActivityEventType | null>(null);

  const filtered = filterActivities(activities, {
    types: selectedFilter ? [selectedFilter] : filterTypes,
  });

  const sorted = sortActivitiesByDate(filtered);

  if (sorted.length === 0) {
    return <div className="text-center text-gray-500 py-8">No activity yet</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["contribution", "comment", "milestone_reached", "goal_reached"].map((type) => (
          <button
            key={type}
            onClick={() =>
              setSelectedFilter(selectedFilter === type ? null : (type as ActivityEventType))
            }
            className={`px-3 py-1 text-sm rounded ${
              selectedFilter === type
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((activity) => (
          <div key={activity.id} className="flex gap-3 p-3 border rounded bg-white">
            <span className="text-xl">{getActivityIcon(activity.type)}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{activity.actor}</p>
              <p className="text-sm text-gray-600">{activity.message}</p>
              <p className="text-xs text-gray-500 mt-1">{formatActivityTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
