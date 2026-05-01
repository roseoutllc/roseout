"use client";

import { trackActivity } from "@/lib/trackActivity";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  eventType: string;
  eventName: string;
  metadata?: Record<string, any>;
  newTab?: boolean;
};

export default function TrackedLink({
  href,
  children,
  className = "",
  eventType,
  eventName,
  metadata = {},
  newTab = false,
}: Props) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      onClick={() => {
        trackActivity({
          eventType,
          eventName,
          pagePath: window.location.pathname,
          metadata,
        });
      }}
      className={className}
    >
      {children}
    </a>
  );
}