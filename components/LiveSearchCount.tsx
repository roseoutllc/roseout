"use client";

import { useEffect, useMemo, useState } from "react";

const POLL_INTERVAL_MS = 15000;

function formatSearchCount(count: number) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, count));
}

export default function LiveSearchCount({
  initialCount,
}: {
  initialCount: number;
}) {
  const [searchCount, setSearchCount] = useState(initialCount);

  useEffect(() => {
    let isMounted = true;

    async function refreshSearchCount() {
      const response = await fetch("/api/search-count", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const payload = (await response.json()) as { count?: number };

      if (isMounted && typeof payload.count === "number") {
        setSearchCount(payload.count);
      }
    }

    refreshSearchCount().catch(() => undefined);

    const intervalId = window.setInterval(() => {
      refreshSearchCount().catch(() => undefined);
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const formattedCount = useMemo(
    () => formatSearchCount(searchCount),
    [searchCount],
  );

  return (
    <p className="text-sm font-semibold text-white/50" aria-live="polite">
      <span className="font-black text-white">{formattedCount}</span> outings
      planned from live searches
    </p>
  );
}
