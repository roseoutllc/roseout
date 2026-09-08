import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnterpriseLocation } from "../../enterprise/types";
import type { RetrievalRequest } from "./retrievalTypes";
import { SEARCH_LOCATION_SELECT } from "./locationSearchSelect";

export type IndexedLowLevelScope = {
  neighborhood: string | null;
  city: string | null;
  borough: string | null;
  county: string | null;
  market: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMiles: number | null;
};

const SERVICE_INTENT_TERMS = new Set([
  "takeout", "take out", "fast casual", "fast food", "quick bite", "quick service",
  "counter service", "deli", "delicatessen", "bodega", "food truck", "food cart", "sandwich shop",
]);
const GENERIC_LOW_LEVEL_TERMS = new Set([
  "food", "restaurant", "dinner", "lunch", "breakfast", "brunch", "near me", "nearby",
  "takeout", "take out", "fast casual", "fast food", "quick bite", "quick service", "counter service",
]);
const LOW_LEVEL_GOOGLE_TYPES = ["meal_takeaway", "fast_food_restaurant", "sandwich_shop", "deli"] as const;

function cleanTerm(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

export function indexedLowLevelSearchTerms(request: RetrievalRequest) {
  return [...new Set([...request.retrievalTerms, ...request.foods, ...request.cuisines]
    .map(cleanTerm)
    .filter((term) => term.length >= 3 && !GENERIC_LOW_LEVEL_TERMS.has(term)))]
    .slice(0, 4);
}

export function indexedLowLevelServiceTypes(request: RetrievalRequest) {
  const authored = [...request.retrievalTerms, ...request.foods, ...request.categories].map(cleanTerm);
  return authored.some((term) => SERVICE_INTENT_TERMS.has(term)) ? [...LOW_LEVEL_GOOGLE_TYPES] : [];
}

export function boundingBoxForLowLevelScope(scope: IndexedLowLevelScope) {
  const latitude = Number(scope.latitude);
  const longitude = Number(scope.longitude);
  const radiusMiles = Number(scope.radiusMiles);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMiles) || radiusMiles <= 0) return null;
  const latDelta = radiusMiles / 69;
  const longitudeMilesPerDegree = Math.max(10, 69 * Math.cos(latitude * Math.PI / 180));
  const lngDelta = radiusMiles / longitudeMilesPerDegree;
  return { minLat: latitude - latDelta, maxLat: latitude + latDelta, minLng: longitude - lngDelta, maxLng: longitude + lngDelta };
}

function baseQuery(supabase: SupabaseClient, scope: IndexedLowLevelScope) {
  let query: any = supabase
    .from("locations")
    .select(SEARCH_LOCATION_SELECT)
    .is("deleted_at", null)
    .or("is_hidden.is.null,is_hidden.eq.false")
    .or("active.is.null,active.eq.true")
    .or("is_searchable.is.null,is_searchable.eq.true")
    .or("status.is.null,status.not.in.(hidden,deleted,archived)")
    .or("data_status.is.null,data_status.not.in.(hidden,deleted,archived)");

  const box = boundingBoxForLowLevelScope(scope);
  if (box) {
    query = query.gte("latitude", box.minLat).lte("latitude", box.maxLat).gte("longitude", box.minLng).lte("longitude", box.maxLng);
  } else {
    if (scope.state) query = query.ilike("state", scope.state);
    if (scope.neighborhood) query = query.ilike("neighborhood", scope.neighborhood);
    else if (scope.city) query = query.ilike("city", scope.city);
    else if (scope.borough) query = query.ilike("borough", scope.borough);
    else if (scope.county) query = query.ilike("county", scope.county);
    else if (scope.market) query = query.ilike("market", scope.market);
  }
  return query;
}

function ranked(query: any, limit: number) {
  return query
    .order("theouthaven_score", { ascending: false, nullsFirst: false })
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false, nullsFirst: false })
    .limit(Math.min(Math.max(limit, 1), 40));
}

export async function retrieveIndexedLowLevelLocations(
  supabase: SupabaseClient,
  request: RetrievalRequest,
  scope: IndexedLowLevelScope,
  limit = 30,
): Promise<EnterpriseLocation[] | null> {
  if (request.allowLowLevel !== true || request.desiredRole !== "restaurant") return null;
  const terms = indexedLowLevelSearchTerms(request);
  const serviceTypes = indexedLowLevelServiceTypes(request);
  if (!terms.length && !serviceTypes.length) return null;

  const queries: any[] = [];
  if (terms.length) {
    const filters = terms.flatMap((term) => [
      `name.ilike.%${term}%`,
      `restaurant_name.ilike.%${term}%`,
      `primary_category.ilike.%${term}%`,
      `search_document.ilike.%${term}%`,
    ]).join(",");
    queries.push(ranked(baseQuery(supabase, scope).or(filters), limit));
  }
  if (serviceTypes.length) queries.push(ranked(baseQuery(supabase, scope).overlaps("google_types", serviceTypes), limit));

  const results = await Promise.all(queries);
  const rows = new Map<string, EnterpriseLocation>();
  for (const result of results) {
    if (result.error) throw new Error(`SEARCH_V2_INDEXED_LOW_LEVEL_FAILED:${result.error.message}`);
    for (const row of Array.isArray(result.data) ? result.data : []) {
      const id = String((row as any)?.id ?? "");
      if (id && !rows.has(id)) rows.set(id, row as EnterpriseLocation);
    }
  }
  return [...rows.values()].slice(0, limit);
}
