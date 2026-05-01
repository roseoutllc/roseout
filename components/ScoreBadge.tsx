"use client";

import { useEffect, useState } from "react";
import { clampScore } from "@/lib/clampScore";

export default function ScoreBadge({ score }: { score: number }) {
  const safeScore = clampScore(score);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let current = 0;

    const interval = setInterval(() => {
      current += 4;

      if (current >= safeScore) {
        setDisplayScore(safeScore);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 14);

    return () => clearInterval(interval);
  }, [safeScore]);

  const tier =
    safeScore >= 90
      ? "Elite"
      : safeScore >= 80
      ? "Top Pick"
      : safeScore >= 65
      ? "Great"
      : "Match";

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-12 w-12">
        <svg className="-rotate-90" width="48" height="48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="#eab308"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black">{displayScore}</span>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
          Score
        </p>

        <p className="text-sm font-black">{safeScore}/100</p>

        <span className="inline-block rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-black text-black">
          {tier}
        </span>
      </div>
    </div>
  );
}