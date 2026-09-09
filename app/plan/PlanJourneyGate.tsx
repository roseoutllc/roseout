"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import GuidedCompleteOuting from "./GuidedCompleteOuting";
import PlanContinuityOverlay from "./PlanContinuityOverlay";

export default function PlanJourneyGate({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const isGuided = searchParams.get("guidedFlow") === "guided_create_v1";

  if (isGuided) {
    return (
      <div className="guided-plan-shell min-h-screen bg-[#050505] text-white">
        <GuidedCompleteOuting />
      </div>
    );
  }

  return (
    <>
      {children}
      <PlanContinuityOverlay />
    </>
  );
}
