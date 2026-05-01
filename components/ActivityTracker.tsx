"use client";

import { useEffect } from "react";
import { trackActivity } from "@/lib/trackActivity";

export default function ActivityTracker({ userId }: { userId?: string | null }) {
  useEffect(() => {
    trackActivity({
      userId,
      eventType: "page_view",
      eventName: "Page Viewed",
      pagePath: window.location.pathname,
    });
  }, [userId]);

  return null;
}