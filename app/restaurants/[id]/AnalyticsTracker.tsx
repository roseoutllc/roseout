"use client";

import { useEffect } from "react";

export function RestaurantViewTracker({ id }: { id: string }) {
  useEffect(() => {
    fetch("/api/analytics/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "restaurant", event: "view" }),
    });
  }, [id]);

  return null;
}

export function AnalyticsLink({
  id,
  type,
  href,
  children,
  className,
}: {
  id: string;
  type: "restaurant" | "activity";
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const trackClick = () => {
    fetch("/api/analytics/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type, event: "click" }),
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      className={className}
    >
      {children}
    </a>
  );
}

export function ActivityImpressionTracker({
  activities,
}: {
  activities: any[];
}) {
  useEffect(() => {
    activities.forEach((activity) => {
      if (!activity?.id) return;

      fetch("/api/analytics/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activity.id,
          type: "activity",
          event: "view",
        }),
      });
    });
  }, [activities]);

  return null;
}