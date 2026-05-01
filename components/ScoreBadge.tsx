"use client";

import { useEffect, useState } from "react";
import { clampScore } from "@/lib/clampScore";

export default function ScoreBadge({ score }: { score: number }) {
  const safeScore = clampScore(score);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = safeScore / steps;

    const interval = setInterval(() => {
      start += increment;
      if (start >= safeScore) {
        setDisplayScore(safeScore);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [safeScore]);

  const getTier = () => {
    if (safeScore >= 90) return { label: "Elite", color: "bg-black text-white" };
    if (safeScore >= 80) return { label: "Top Pick", color: "bg-yellow-500 text-black" };
    if (safeScore >= 65) return { label: "Great Match", color: "bg-neutral-200 text-black" };
    return { label: "Match", color: "bg-neutral-300 text-black" };
  };

  const tier = getTier();

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex items-center gap-3">

      {/* RING */}
      <div className="relative h-16 w-16">
        <svg className="rotate-[-90deg]" width="64" height="64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#e5e5e5"
            strokeWidth="6"
            fill="transparent"
          />

          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#000"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-xs font-black">
          {displayScore}
        </div>
      </div>

      {/* LABEL */}
      <div>
        <p className="text-lg font-black">{safeScore}/100</p>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${tier.color}`}>
          {tier.label}
        </span>
      </div>
    </div>
  );
}