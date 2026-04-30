"use client";

import { useEffect } from "react";

export function ActivityViewTracker({ id }: { id: string }) {
  useEffect(() => {
    fetch("/api/analytics/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "activity", event: "view" }),
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