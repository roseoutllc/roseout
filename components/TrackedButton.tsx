"use client";

import { trackActivity } from "@/lib/trackActivity";

type TrackedButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  eventType: string;
  eventName: string;
  metadata?: Record<string, any>;
};

export default function TrackedButton({
  href,
  children,
  className = "",
  eventType,
  eventName,
  metadata = {},
}: TrackedButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        trackActivity({
          eventType,
          eventName,
          pagePath: window.location.pathname,
          metadata,
        });

        window.location.href = href;
      }}
      className={className}
    >
      {children}
    </button>
  );
}