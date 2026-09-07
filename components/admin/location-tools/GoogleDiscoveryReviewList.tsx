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

function label(candidate: Candidate) {
  if (candidate.import_status === "published") return "Published";
  if (candidate.import_status === "hidden") return "Kept hidden";
  if (candidate.import_status === "duplicate") return "Duplicate";
  if (candidate.import_status === "rejected") return "Rejected";
  if (candidate.quality_status === "publish_ready") return "Approved · ready to publish";
  if (candidate.quality_status === "needs_photo") return "Review · photo needed";
  return "Manual review";
}

function tone(candidate: Candidate) {
  if (candidate.import_status === "published") return "border-emerald-400/20 bg-emerald-500/[0.07]";
  if (candidate.import_status === "hidden") return "border-white/10 bg-white/[0.04]";
  if (candidate.import_status === "rejected" || candidate.import_status === "duplicate") return "border-red-400/15 bg-red-500/[0.05]";
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
        const canReview = !["published", "duplicate", "rejected"].includes(candidate.import_status || "");

        return (
          <article key={candidate.id} className={`overflow-hidden rounded-2xl border ${tone(candidate)}`}>
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : candidate.id)}
              className="w-full p-4 text-left transition hover:bg-white/[0.03]"
              aria-expanded={expanded}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-white">{candidate.name || "Unnamed Google candidate"}</h3>
                    <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white/65">{label(candidate)}</span>
                    <span className="text-xs font-black text-white/35">{expanded ? "Hide details" : "Review details"}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-white/50">
                    {[candidate.city, candidate.state, candidate.primary_category].filter(Boolean).join(" · ") || "Location/category unavailable"}
                  </p>
                  {candidate.rejection_reason ? <p className="mt-2 text-xs font-bold text-amber-100/75">Reason: {candidate.rejection_reason.replace(/_/g, " ")}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black text-white/65">
                  <span className="rounded-full bg-black/25 px-3 py-1.5">★ {num(candidate.rating).toFixed(1)}</span>
                  <span className="rounded-full bg-black/25 px-3 py-1.5">{num(candidate.review_count).toLocaleString()} reviews</span>
                  <span className="rounded-full bg-black/25 px-3 py-1.5">Score {num(candidate.quality_score)}</span>
                </div>
              </div>
            </button>

            {expanded ? (
              <div className="border-t border-white/10 bg-black/15 p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Detail title="Address" value={[candidate.address, candidate.city, candidate.state, candidate.zip_code].filter(Boolean).join(", ")} />
                  <Detail title="Type" value={candidate.location_type} />
                  <Detail title="Category" value={candidate.primary_category || candidate.cuisine || candidate.activity_type} />
                  <Detail title="Duplicate status" value={candidate.duplicate_status} />
                  <Detail title="Phone" value={candidate.phone} />
                  <Detail title="Website" value={candidate.website} />
                  <Detail title="Photo status" value={candidate.photo_status || (candidate.has_photos ? "has photo" : "missing photo")} />
                  <Detail title="Import confidence" value={candidate.import_confidence} />
                  <Detail title="Source quality" value={candidate.source_quality_status} />
                  <Detail title="Visibility" value={candidate.public_visibility_tier} />
                  <Detail title="Google business status" value={google?.business_status || google?.businessStatus} />
                  <Detail title="Google primary type" value={google?.primaryType} />
                  <Detail title="Coordinates" value={candidate.latitude != null && candidate.longitude != null ? `${candidate.latitude}, ${candidate.longitude}` : null} />
                  <Detail title="Quality status" value={candidate.quality_status} />
                  <Detail title="Import status" value={candidate.import_status} />
                  <Detail title="Review decision" value={message[candidate.id] || "No manual decision yet"} />
                </div>

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
