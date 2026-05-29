"use client";

import { TimelineEvent, sortEventsByDate, getEventColor, getEventLabel } from "@/lib/timelineManager";

interface CampaignTimelineProps {
  events: TimelineEvent[];
}

export function CampaignTimeline({ events }: CampaignTimelineProps) {
  const sorted = sortEventsByDate(events);

  if (sorted.length === 0) {
    return <div className="text-center text-gray-500 py-8">No events yet</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{sorted.length} events</p>
      <div className="relative">
        {sorted.map((event, idx) => (
          <div key={event.id} className="flex gap-4 pb-8">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${getEventColor(event.type)}`} />
              {idx < sorted.length - 1 && <div className="w-0.5 h-12 bg-gray-300 mt-2" />}
            </div>
            <div className="flex-1 pt-1">
              <p className="font-medium text-sm">{getEventLabel(event.type)}</p>
              {event.description && <p className="text-sm text-gray-600">{event.description}</p>}
              {event.amount && <p className="text-sm text-gray-600">{event.amount} XLM</p>}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(event.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
