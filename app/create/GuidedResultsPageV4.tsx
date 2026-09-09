"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/trackClientEvent";
import { getLocationImage } from "@/lib/locationImage";
import { getLocationName } from "@/lib/locationName";
import { getLocationDetailHref } from "@/lib/locationLinks";
import { buildGoogleDirectionsUrl } from "@/lib/googleDirections";
import GuidedJourneySteps from "@/components/planner/GuidedJourneySteps";

type PlanType = "outing" | "restaurant" | "activity";
type PlacementFields = { sponsored?: boolean | null; isSponsored?: boolean | null; is_sponsored?: boolean | null; placement_type?: string | null; sponsor_id?: string | number | null };
type LocationCard = Record<string, unknown> & PlacementFields & {
  id?: string | number | null;
  name?: string | null;
  restaurant_name?: string | null;
  activity_name?: string | null;
  city?: string | null;
  state?: string | null;
  primary_category?: string | null;
  cuisine?: string | null;
  cuisine_type?: string | null;
  activity_type?: string | null;
  detail_location_type?: string | null;
  location_type?: string | null;
  source_table?: string | null;
  sourceTable?: string | null;
  whyMatched?: string | null;
  why_it_matched?: string | null;
  matchReasons?: string[] | null;
  rating?: number | string | null;
  google_rating?: number | string | null;
  average_rating?: number | string | null;
  review_count?: number | string | null;
  user_ratings_total?: number | string | null;
  google_review_count?: number | string | null;
  price?: string | number | null;
  price_level?: string | number | null;
  price_range?: string | null;
  reservation_url?: string | null;
  booking_url?: string | null;
};
type PairCard = PlacementFields & { restaurant?: LocationCard | null; activity?: LocationCard | null; distanceMiles?: number | null; walkingMinutes?: number | null; whyMatched?: string | null; why_it_matched?: string | null; matchReasons?: string[] | null };
type SearchPayload = {
  restaurants?: LocationCard[];
  activities?: LocationCard[];
  sameVenueResults?: LocationCard[];
  same_venue_results?: LocationCard[];
  pairs?: PairCard[];
  plannedTime?: { plannedFor?: string | null; timezone?: string | null; dateContext?: string | null; confidence?: "none" | "date_only" | "exact" | null; shouldSchedulePreOutingReminders?: boolean | null; nextMorningFollowupDate?: string | null } | null;
  planned_time?: SearchPayload["plannedTime"];
  outingDateTimeText?: string | null;
  outingDateLabel?: string | null;
  outingTimeLabel?: string | null;
  parsedDateText?: string | null;
  parsedTimeText?: string | null;
  searchV2?: SearchPayload | null;
};
type OutingTimeValue = { plannedFor: string | null; timezone: string; outingDateContext: string | null; outingTimeConfidence: "none" | "date_only" | "exact"; remindersEnabled: boolean; nextMorningFollowupEnabled: boolean; nextMorningFollowupDate: string | null; outingDateTimeText: string | null; outingDateLabel: string | null; outingTimeLabel: string | null };
type CompletePair = { restaurant: LocationCard; activity: LocationCard; pair: PairCard | null; resultType: "pair" | "same_venue"; placement: PlacementFields };

const PLAN_KEY = "theouthaven_plan";
const LOCATION_KEY = "theouthaven_user_location";
const FLOW_VERSION = "guided_create_v1";
const JOURNEY_VERSION = "four_step";
const WALKING_INTENT = /\b(?:walk|walking|walkable|walkability)\b|\bon\s+foot\b/i;
const INTERNAL_REASON = /qualified\s+as|general[_\s-]?activity|nearby options? outside|outside the requested|fallback|candidate pool|search radius|classification|domain qualification|geo relaxation/i;

const LOADING_LINES: Record<PlanType, string[]> = {
  outing: ["Finding your perfect outing...", "Matching restaurants and activities...", "Checking distance, ratings, and fit...", "Building your strongest complete picks..."],
  restaurant: ["Finding your perfect restaurant...", "Matching the food, vibe, and area...", "Checking ratings and fit..."],
  activity: ["Finding your perfect activity...", "Matching the vibe, area, and experience...", "Checking ratings and fit..."],
};

function track(eventName: string, metadata: Record<string, unknown>) {
  try { trackClientEvent({ event_name: eventName, source: "guided_create", metadata }); } catch { /* analytics never blocks */ }
}
function planTypeFrom(value: string | null): PlanType { return value === "restaurant" || value === "activity" ? value : "outing"; }
function laneFor(planType: PlanType) { return planType === "restaurant" ? "restaurant" : planType === "activity" ? "activity" : "mixed"; }
function nameFor(location: LocationCard | null | undefined) { return location ? getLocationName(location, "Location") : "Location"; }
function imageFor(location: LocationCard | null | undefined) { return location ? getLocationImage(location as never) : null; }
function metaFor(location: LocationCard) { return [location.cuisine || location.cuisine_type || location.activity_type || location.primary_category, location.city, location.state].filter(Boolean).join(" · "); }
function detailHref(location: LocationCard) { return getLocationDetailHref({ id: location.id, type: location.detail_location_type || location.location_type, sourceTable: location.source_table || location.sourceTable, location }); }
function profileHref(location: LocationCard, returnToResults: string) { const href = detailHref(location); return `${href}${href.includes("?") ? "&" : "?"}from=${encodeURIComponent(returnToResults)}`; }
function numeric(value: unknown) { const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN; return Number.isFinite(number) ? number : null; }
function ratingFor(location: LocationCard) { const value = numeric(location.rating ?? location.google_rating ?? location.average_rating); if (!value || value <= 0) return null; const reviews = numeric(location.review_count ?? location.user_ratings_total ?? location.google_review_count); return { value: value.toFixed(1), reviews: reviews && reviews > 0 ? Math.round(reviews) : null }; }
function priceFor(location: LocationCard) {
  if (typeof location.price_range === "string" && location.price_range.trim()) return location.price_range.trim();
  if (typeof location.price === "string" && location.price.trim()) return location.price.trim();
  const level = numeric(location.price_level ?? location.price);
  if (!level || level <= 0) return null;
  return "$".repeat(Math.max(1, Math.min(4, Math.round(level))));
}
function reservationReady(location: LocationCard) { return Boolean(location.reservation_url || location.booking_url); }
function cleanReason(value: unknown) {
  if (typeof value !== "string") return null;
  const pieces = value.split(/[;•]|\s+·\s+/).map((part) => part.trim()).filter(Boolean).filter((part) => !/requested locality|matched requested|matches? requested/i.test(part)).filter((part) => !INTERNAL_REASON.test(part));
  return pieces[0] || null;
}
function customerWhy(value: PairCard | LocationCard | null | undefined) {
  if (!value) return null;
  return cleanReason(value.whyMatched) || cleanReason(value.why_it_matched) || (Array.isArray(value.matchReasons) ? value.matchReasons.map(cleanReason).find(Boolean) || null : null);
}
function distanceFor(pair: PairCard | null, walkingRequested: boolean) {
  if (!pair) return null;
  const walking = numeric(pair.walkingMinutes);
  if (walkingRequested && walking && walking > 0) return `${Math.round(walking)} min walk`;
  const miles = numeric(pair.distanceMiles);
  return miles !== null && miles >= 0 ? `${miles.toFixed(1)} ${Math.abs(miles - 1) < 0.05 ? "mile" : "miles"} apart` : null;
}
function isSponsored(value: PlacementFields | null | undefined) { return Boolean(value?.sponsored || value?.isSponsored || value?.is_sponsored || String(value?.placement_type || "").toLowerCase() === "sponsored"); }
function sponsoredPair(item: CompletePair) { return isSponsored(item.placement) || isSponsored(item.restaurant) || isSponsored(item.activity); }
function sponsorId(item: CompletePair) { const value = item.placement.sponsor_id || item.restaurant.sponsor_id || item.activity.sponsor_id; return value ? String(value) : null; }
function completePairs(payload: SearchPayload | null | undefined): CompletePair[] {
  if (!payload) return [];
  const pairs = (payload.pairs || []).filter((pair) => pair.restaurant && pair.activity).map((pair) => ({ restaurant: pair.restaurant!, activity: pair.activity!, pair, resultType: "pair" as const, placement: pair }));
  const sameVenue = (payload.sameVenueResults || payload.same_venue_results || []).map((location) => ({ restaurant: location, activity: location, pair: null, resultType: "same_venue" as const, placement: location }));
  return [...pairs, ...sameVenue];
}
function readCoordinates() { try { const raw = localStorage.getItem(LOCATION_KEY); if (!raw) return null; const parsed = JSON.parse(raw) as { latitude?: unknown; longitude?: unknown }; const latitude = Number(parsed.latitude); const longitude = Number(parsed.longitude); return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null; } catch { return null; } }
function outingTimeFrom(payload: SearchPayload): OutingTimeValue {
  const time = payload.plannedTime || payload.planned_time || payload.searchV2?.plannedTime || null;
  const confidence = time?.confidence === "exact" || time?.confidence === "date_only" ? time.confidence : "none";
  return { plannedFor: time?.plannedFor || null, timezone: time?.timezone || "America/New_York", outingDateContext: time?.dateContext || null, outingTimeConfidence: confidence, remindersEnabled: Boolean(time?.shouldSchedulePreOutingReminders), nextMorningFollowupEnabled: Boolean(time?.nextMorningFollowupDate), nextMorningFollowupDate: time?.nextMorningFollowupDate || null, outingDateTimeText: payload.outingDateTimeText || null, outingDateLabel: payload.outingDateLabel || payload.parsedDateText || null, outingTimeLabel: payload.outingTimeLabel || payload.parsedTimeText || null };
}

function VenueRow({ location, label }: { location: LocationCard; label: string }) {
  const image = imageFor(location);
  const rating = ratingFor(location);
  const price = priceFor(location);
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
        {image ? <img src={image} alt={nameFor(location)} className="absolute inset-0 h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl">📍</div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff7188]">{label}</p>
        <h3 className="mt-1 truncate text-base font-black">{nameFor(location)}</h3>
        {metaFor(location) ? <p className="mt-1 truncate text-xs font-semibold text-white/45">{metaFor(location)}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-white/55">
          {rating ? <span>★ {rating.value}{rating.reviews ? ` (${rating.reviews.toLocaleString()})` : ""}</span> : null}
          {price ? <span>· {price}</span> : null}
          {reservationReady(location) ? <span className="text-emerald-300">· Reservation link found</span> : null}
        </div>
      </div>
    </div>
  );
}

function PairCardView({ item, rank, walkingRequested, returnToResults, onUse }: { item: CompletePair; rank: number; walkingRequested: boolean; returnToResults: string; onUse: () => void }) {
  const best = rank === 1 && !sponsoredPair(item);
  const sponsored = sponsoredPair(item);
  const distance = distanceFor(item.pair, walkingRequested);
  const why = customerWhy(item.pair) || customerWhy(item.restaurant) || customerWhy(item.activity) || (item.resultType === "same_venue" ? "Food and activity together in one venue." : "A strong restaurant + activity match for what you asked for.");
  const route = item.resultType === "pair" ? buildGoogleDirectionsUrl({ origin: item.restaurant, destination: item.activity, travelMode: walkingRequested ? "walking" : "driving" }) : null;
  return (
    <article className={`rounded-[1.5rem] border bg-[#0b0b0b] p-4 shadow-xl shadow-black/30 ${best ? "border-[#e1062a]/70 ring-1 ring-[#e1062a]/20 lg:p-5" : "border-white/10"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${sponsored ? "bg-white text-black" : best ? "bg-[#e1062a] text-white" : "border border-white/10 bg-white/[0.04] text-white/55"}`}>{sponsored ? "Sponsored" : best ? "Best Match" : `Option ${rank}`}</span>
        {distance ? <span className="text-xs font-black text-white/55">{distance}</span> : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <VenueRow location={item.restaurant} label={item.resultType === "same_venue" ? "Restaurant + activity" : "Restaurant"} />
        {item.resultType !== "same_venue" ? <VenueRow location={item.activity} label="Activity" /> : null}
      </div>

      <div className="mt-4 rounded-2xl border border-[#e1062a]/20 bg-[#e1062a]/[0.055] px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff7188]">Why it fits</p>
        <p className="mt-1.5 text-sm font-semibold leading-5 text-white/70">{why}</p>
      </div>

      <button type="button" onClick={onUse} className={`mt-4 w-full rounded-full bg-[#e1062a] px-5 py-4 font-black uppercase tracking-[0.08em] transition hover:bg-[#ff1744] ${best ? "text-sm" : "text-xs"}`}>Choose this outing →</button>

      <details className="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm">
        <summary className="cursor-pointer list-none font-black text-white/55">More details <span className="float-right text-white/30">+</span></summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link href={profileHref(item.restaurant, returnToResults)} className="rounded-full border border-white/10 px-4 py-2.5 text-center text-xs font-black text-white/65">View restaurant</Link>
          {item.resultType !== "same_venue" ? <Link href={profileHref(item.activity, returnToResults)} className="rounded-full border border-white/10 px-4 py-2.5 text-center text-xs font-black text-white/65">View activity</Link> : null}
          {route ? <a href={route} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-2.5 text-center text-xs font-black text-white/65 sm:col-span-2">Open route</a> : null}
        </div>
      </details>
    </article>
  );
}

function SingleCard({ location, rank, planType, returnToResults, onUse }: { location: LocationCard; rank: number; planType: PlanType; returnToResults: string; onUse: () => void }) {
  const image = imageFor(location);
  const rating = ratingFor(location);
  const price = priceFor(location);
  const best = rank === 1;
  const why = customerWhy(location) || "A strong match for the outing you described.";
  return (
    <article className={`overflow-hidden rounded-[1.5rem] border bg-[#0b0b0b] shadow-xl shadow-black/30 ${best ? "border-[#e1062a]/70 ring-1 ring-[#e1062a]/20" : "border-white/10"}`}>
      <div className="relative h-48 bg-white/[0.04]">
        {image ? <img src={image} alt={nameFor(location)} className="absolute inset-0 h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl">📍</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${best ? "bg-[#e1062a] text-white" : "bg-black/75 text-white/70"}`}>{best ? "Best Match" : `Option ${rank}`}</span>
        <div className="absolute bottom-3 left-3 right-3"><h3 className="truncate text-lg font-black">{nameFor(location)}</h3><p className="mt-1 truncate text-xs font-semibold text-white/60">{metaFor(location)}</p></div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2 text-xs font-bold text-white/55">{rating ? <span>★ {rating.value}{rating.reviews ? ` (${rating.reviews.toLocaleString()})` : ""}</span> : null}{price ? <span>· {price}</span> : null}{reservationReady(location) ? <span className="text-emerald-300">· Reservation link found</span> : null}</div>
        <div className="mt-3 rounded-2xl bg-white/[0.03] px-3.5 py-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#ff7188]">Why it fits</p><p className="mt-1.5 text-sm font-semibold leading-5 text-white/65">{why}</p></div>
        <button type="button" onClick={onUse} className="mt-4 w-full rounded-full bg-[#e1062a] px-5 py-3.5 text-xs font-black uppercase tracking-[0.1em]">Choose this {planType} →</button>
        <details className="mt-3 text-center text-xs font-black text-white/45"><summary className="cursor-pointer list-none">More details</summary><Link href={profileHref(location, returnToResults)} className="mt-3 inline-flex rounded-full border border-white/10 px-4 py-2.5 text-white/65">View profile</Link></details>
      </div>
    </article>
  );
}

function LoadingResults({ planType, index }: { planType: PlanType; index: number }) {
  return <div className="rounded-[1.5rem] border border-white/10 bg-[#090909] p-5"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e1062a]">TheOutHaven is searching</p><h2 className="mt-2 text-2xl font-black">{LOADING_LINES[planType][index % LOADING_LINES[planType].length]}</h2><div className="mt-6 grid gap-4 lg:grid-cols-2">{[0,1,2,3].map((item) => <div key={item} className="h-72 animate-pulse rounded-[1.4rem] border border-white/10 bg-white/[0.05]" />)}</div></div>;
}

export default function GuidedResultsPageV4() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt")?.trim() || "";
  const planType = planTypeFrom(searchParams.get("planType"));
  const walkingRequested = WALKING_INTENT.test(prompt);
  const returnToResults = `/create${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const [payload, setPayload] = useState<SearchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setLoadingIndex((current) => (current + 1) % LOADING_LINES[planType].length), 1800);
    return () => window.clearInterval(timer);
  }, [loading, planType]);

  useEffect(() => {
    document.title = "Pick Your Plan | TheOutHaven";
    if (!prompt) { setLoading(false); setError("Your planner request is missing. Start a new plan and we’ll rebuild it."); return; }
    const controller = new AbortController();
    const coordinates = readCoordinates();
    setLoading(true); setError("");
    fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ input: prompt, selectedSearchLane: laneFor(planType), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York", useCurrentLocation: Boolean(coordinates), userLatitude: coordinates?.latitude, userLongitude: coordinates?.longitude, guidedFlow: FLOW_VERSION }) })
      .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || "We couldn’t build your picks right now."); return data as SearchPayload; })
      .then((data) => { if (controller.signal.aborted) return; setPayload(data); const result = data.searchV2 || data; track("planner_results_viewed", { step: 3, plan_type: planType, pair_count: completePairs(result).length, restaurant_count: result.restaurants?.length || 0, activity_count: result.activities?.length || 0, flow_version: FLOW_VERSION, journey_version: JOURNEY_VERSION }); track("planner_pick_screen_viewed", { step: 3, plan_type: planType, flow_version: FLOW_VERSION, journey_version: JOURNEY_VERSION }); })
      .catch((err: unknown) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "We couldn’t build your picks right now."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [planType, prompt, retryKey]);

  const result = payload?.searchV2 || payload;
  const pairs = useMemo(() => completePairs(result).slice(0, 6), [result]);
  const singles = useMemo(() => (planType === "restaurant" ? result?.restaurants || [] : result?.activities || []).slice(0, 6), [planType, result]);
  const hasResults = planType === "outing" ? pairs.length > 0 : singles.length > 0;

  function openPlan(restaurant: LocationCard | null, activity: LocationCard | null, pair: PairCard | null, rank: number, resultType: string, sponsored = false, sponsor: string | null = null) {
    const outingTime = outingTimeFrom(result || {});
    localStorage.setItem(PLAN_KEY, JSON.stringify({ restaurant, activity, locations: [restaurant, activity].filter(Boolean), distancePreference: walkingRequested ? "walking" : "miles", savedAt: Date.now(), outingTime, outingTiming: { outingDateLabel: outingTime.outingDateLabel, outingTimeLabel: outingTime.outingTimeLabel, outingDateTimeText: outingTime.outingDateTimeText, outingTimeConfidence: outingTime.outingTimeConfidence } }));
    track("planner_plan_selected", { step: 3, plan_type: planType, rank, result_type: resultType, placement_group: sponsored ? "sponsored" : rank === 1 ? "best_match" : "organic", sponsored, sponsor_id: sponsor, restaurant_id: restaurant?.id || null, activity_id: activity?.id || null, flow_version: FLOW_VERSION, journey_version: JOURNEY_VERSION });
    const params = new URLSearchParams({ q: prompt, guidedFlow: FLOW_VERSION, journey: JOURNEY_VERSION, timezone: outingTime.timezone, outingTimeConfidence: outingTime.outingTimeConfidence });
    if (outingTime.plannedFor) params.set("plannedFor", outingTime.plannedFor);
    if (outingTime.outingDateContext) params.set("outingDateContext", outingTime.outingDateContext);
    if (outingTime.outingDateTimeText) params.set("outingDateTimeText", outingTime.outingDateTimeText);
    if (outingTime.outingDateLabel) params.set("outingDateLabel", outingTime.outingDateLabel);
    if (outingTime.outingTimeLabel) params.set("outingTimeLabel", outingTime.outingTimeLabel);
    router.push(`/plan?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#050505] pb-16 text-white">
      <GuidedJourneySteps activeStep={3} className="max-w-5xl" />
      <section className="border-b border-white/10 px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1062a]">Step 3 of 4 · Pick</p><h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-5xl">{planType === "outing" ? "Choose your outing." : planType === "restaurant" ? "Choose your restaurant." : "Choose your activity."}</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/50 sm:text-base">Your strongest match is first. Compare only what matters, then choose and finish the plan.</p></div><Link href="/create" className="rounded-full border border-white/10 px-4 py-2.5 text-xs font-black text-white/60">Adjust plan</Link></div></div></section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        {loading ? <LoadingResults planType={planType} index={loadingIndex} /> : error ? <div className="rounded-[1.4rem] border border-red-400/20 bg-red-500/10 p-6"><h2 className="text-xl font-black">We couldn’t load your picks.</h2><p className="mt-2 text-sm font-semibold text-red-100/70">{error}</p><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-5 rounded-full bg-[#e1062a] px-5 py-3 text-xs font-black uppercase">Try again</button></div> : !hasResults ? <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-6 text-center"><h2 className="text-2xl font-black">No strong picks yet.</h2><p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-white/45">Adjust the area or preferences and we’ll try again.</p><Link href="/create" className="mt-5 inline-flex rounded-full bg-[#e1062a] px-5 py-3 text-xs font-black uppercase">Adjust my plan</Link></div> : planType === "outing" ? <div className="grid gap-5 lg:grid-cols-2">{pairs.map((item, index) => <div key={`${item.restaurant.id}-${item.activity.id}-${index}`} className={index === 0 ? "lg:col-span-2" : ""}><PairCardView item={item} rank={index + 1} walkingRequested={walkingRequested} returnToResults={returnToResults} onUse={() => openPlan(item.restaurant, item.activity, item.pair, index + 1, item.resultType, sponsoredPair(item), sponsorId(item))} /></div>)}</div> : <div className="grid gap-5 md:grid-cols-2">{singles.map((location, index) => <SingleCard key={`${location.id || index}`} location={location} rank={index + 1} planType={planType} returnToResults={returnToResults} onUse={() => openPlan(planType === "restaurant" ? location : null, planType === "activity" ? location : null, null, index + 1, planType)} />)}</div>}
      </section>
    </main>
  );
}
