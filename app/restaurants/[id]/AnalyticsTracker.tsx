"use client";

import { useEffect } from "react";

export function AnalyticsTracker({ id }: { id: string }) {
  useEffect(() => {
    fetch("/api/analytics/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        type: "restaurant",
        event: "view",
      }),
    });
  }, [id]);

  return null;
}

export function AnalyticsLink({
  id,
  href,
  children,
  className,
}: {
  id: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const trackClick = () => {
    fetch("/api/analytics/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        type: "restaurant",
        event: "click",
      }),
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