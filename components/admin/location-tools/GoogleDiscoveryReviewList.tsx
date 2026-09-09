"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Candidate = {
  id: string;
  name?: string | null;
  location_type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  website?: string | null;
  primary_category?: string | null;
  cuisine?: string | null;
  activity_type?: string | null;
  rating?: number | string | null;
  review_count?: number | null;
  quality_score?: number | string | null;
  quality_status?: string | null;
  import_status?: string | null;
  duplicate_status?: string | null;
  rejection_reason?: string | null;
  main_image?: string | null;
  source_url?: string | null;
  has_photos?: boolean | null;
  photo_status?: string | null;
  import_confidence?: string | null;
  source_quality_status?: string | null;
  public_visibility_tier?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  raw_payload?: Record<string, unknown> | null;
};

function num(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decisionLabel(candidate: Candidate) {
  if (candidate.import_status === "published") return "Published";
  if (candidate.import_status === "hidden") return "Hidden";
  if (candidate.import_status === "duplicate" || candidate.duplicate_status === "duplicate" || candidate.duplicate_status === "possible_duplicate") return "Duplicate review";
  if (candidate.import_status === "rejected") return "Rejected";
  if (candidate.quality_status === "publish_ready") return "Ready";
  if (candidate.quality_status === "needs_photo") return "Needs photo";
  return "Needs review";
}

function attentionSummary(candidate: Candidate) {
  const reasons: string[] = [];
  if (candidate.duplicate_status === "possible_duplicate") reasons.push("Possible duplicate");
  if (candidate.duplicate_status === "duplicate") reasons.push("Confirmed duplicate");
  if (!candidate.has_photos || candidate.quality_status === "needs_photo") reasons.push("Photo needed");
  if (!candidate.website) reasons.push("Website missing");
  if (!candidate.address || !candidate.city || !candidate.state) reasons.push("Location details incomplete");
  if (String(candidate.import_confidence || "").toLowerCase() === "low") reasons.push("Low confidence");
  if (String(candidate.public_visibility_tier || "").toLowerCase() !== "standard" && candidate.public_visibility_tier) reasons.push("Not public-ready");
  if (candidate.rejection_reason) reasons.push(candidate.rejection_reason.replace(/_/g, " "));
  return Array.from(new Set(reasons)).slice(0, 3);
}

function tone(candidate: Candidate) {
  if (candidate.import_status === "published" || candidate.quality_status === "publish_ready") return "border-emerald-400/20 bg-emerald-500/[0.07]";
  if (candidate.import_status === "hidden") return "border-white/10 bg-white/[0.04]";
  if (candidate.import_status === "rejected" || candidate.import_status === "duplicate" || candidate.duplicate_status === "duplicate") return "border-red-400/15 bg-red-500/[0.05]";
  return "border-amber-300/15 bg-amber-400/[0.06]";
}

function Detail({ title, value }: { title: string; value: unknown }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{title}</div>
      <div className="mt-1 break-words text-sm font-bold text-white/80">{display}</div>
    </div>
  );
}

export function GoogleDiscoveryReviewList({ candidates }: { candidates: Candidate[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const act = (candidate: Candidate, action: "approve" | "keep_hidden") => {
    startTransition(async () => {
      setMessage((current) => ({ ...current, [candidate.id]: action === "approve" ? "Approving…" : "Saving hidden decision…" }));
      try {
        const response = await fetch("/api/admin/location-growth/google-discovery-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: candidate.id, action }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body?.success !== true) throw new Error(body?.error || "Review action failed.");
        setMessage((current) => ({ ...current, [candidate.id]: action === "approve" ? "Approved for publish." : "Kept hidden." }));
        router.refresh();
      } catch (error) {
        setMessage((current) => ({ ...current, [candidate.id]: error instanceof Error ? error.message : "Review action failed." }));
      }
    });
  };

  return (
    <div className="space-y-2">
      {candidates.map((candidate) => {
        const expanded = openId === candidate.id;
        const google = candidate.raw_payload && typeof candidate.raw_payload === "object"
          ? ((candidate.raw_payload as Record<string, unknown>).google as Record<string, unknown> | undefined)
          : undefined;
        const duplicateNeedsReview = candidate.duplicate_status === "possible_duplicate";
        const canReview = !["published", "duplicate", "rejected"].includes(candidate.import_status || "") && !duplicateNeedsReview;
        const blockers = attentionSummary(candidate);

        return (
          <article key={candidate.id} className={`overflow-hidden rounded-2xl border ${tone(candidate)}`}>
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : candidate.id)}
              className="w-full p-4 text-left transition hover:bg-white/[0.03]"
              aria-expanded={expanded}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-white">{candidate.name || "Unnamed Google candidate"}</h3>
                    <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white/70">{decisionLabel(candidate)}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-white/50">
                    {[candidate.city, candidate.state, candidate.primary_category].filter(Boolean).join(" · ") || "Location/category unavailable"}
                  </p>
                  {blockers.length ? (
                    <p className="mt-2 text-xs font-bold text-amber-100/75">Needs attention: {blockers.join(" · ")}</p>
                  ) : (
                    <p className="mt-2 text-xs font-bold text-emerald-200/70">No obvious quality blockers in this review record.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-black text-white/65">
                  <span className="rounded-full bg-black/25 px-3 py-1.5">★ {num(candidate.rating).toFixed(1)}</span>
                  <span className="rounded-full bg-black/25 px-3 py-1.5">{num(candidate.review_count).toLocaleString()} reviews</span>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-white/45">{expanded ? "Hide" : "Review"}</span>
                </div>
              </div>
            </button>

            {expanded ? (
              <div className="border-t border-white/10 bg-black/15 p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Detail title="Address" value={[candidate.address, candidate.city, candidate.state, candidate.zip_code].filter(Boolean).join(", ")} />
                  <Detail title="Category" value={candidate.primary_category || candidate.cuisine || candidate.activity_type} />
                  <Detail title="Duplicate check" value={candidate.duplicate_status || "unknown"} />
                  <Detail title="Website" value={candidate.website} />
                  <Detail title="Photo" value={candidate.photo_status || (candidate.has_photos ? "has photo" : "missing photo")} />
                  <Detail title="Google business status" value={google?.business_status || google?.businessStatus} />
                </div>

                <details className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-white/55">Advanced data</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Detail title="Type" value={candidate.location_type} />
                    <Detail title="Phone" value={candidate.phone} />
                    <Detail title="Import confidence" value={candidate.import_confidence} />
                    <Detail title="Source quality" value={candidate.source_quality_status} />
                    <Detail title="Visibility" value={candidate.public_visibility_tier} />
                    <Detail title="Google primary type" value={google?.primaryType} />
                    <Detail title="Coordinates" value={candidate.latitude != null && candidate.longitude != null ? `${candidate.latitude}, ${candidate.longitude}` : null} />
                    <Detail title="Quality status" value={candidate.quality_status} />
                    <Detail title="Import status" value={candidate.import_status} />
                    <Detail title="Quality score" value={candidate.quality_score} />
                  </div>
                </details>

                <div className="mt-4 flex flex-wrap gap-3">
                  {candidate.source_url ? (
                    <a href={candidate.source_url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-black text-white hover:bg-white/[0.1]">
                      Open Google source
                    </a>
                  ) : null}
                  {canReview ? (
                    <>
                      <button type="button" disabled={isPending} onClick={() => act(candidate, "approve")} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-black disabled:opacity-50">
                        Approve for Publish
                      </button>
                      <button type="button" disabled={isPending} onClick={() => act(candidate, "keep_hidden")} className="rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
                        Keep Hidden
                      </button>
                    </>
                  ) : duplicateNeedsReview ? (
                    <p className="rounded-xl border border-amber-300/15 bg-amber-400/[0.06] px-4 py-2.5 text-sm font-bold text-amber-100/80">Resolve the possible duplicate before publishing.</p>
                  ) : null}
                </div>

                {message[candidate.id] ? <p className="mt-3 text-sm font-bold text-white/65">{message[candidate.id]}</p> : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
