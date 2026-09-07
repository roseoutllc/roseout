import type { EnterpriseSearchResult } from "@/lib/search/enterprise/types";
import {
  isLowLevelLocation,
  isQuickBiteSearchCandidate,
  userExplicitlyAskedForLowLevel,
} from "@/lib/search/lowLevel";

function locationId(item: any): string | null {
  const value = item?.id ?? item?.location_id ?? item?.source_id ?? null;
  return value == null ? null : String(value);
}

function isRestaurantLike(item: any): boolean {
  const locationType = String(item?.location_type ?? item?.type ?? "").toLowerCase();
  return locationType === "restaurant" || Boolean(item?.restaurant_name);
}

function restaurantEligible(item: any, query: string): boolean {
  if (!item) return true;
  if (userExplicitlyAskedForLowLevel(query)) return true;
  return !isLowLevelLocation(item) && !isQuickBiteSearchCandidate(item);
}

function pairRestaurant(pair: any) {
  return pair?.restaurant ?? pair?.restaurant_location ?? pair?.first_restaurant ?? null;
}

function pairRestaurantId(pair: any): string | null {
  const nested = locationId(pairRestaurant(pair));
  if (nested) return nested;
  const value =
    pair?.restaurant_location_id ??
    pair?.restaurant_id ??
    pair?.restaurant?.location_id ??
    pair?.restaurant?.id ??
    null;
  return value == null ? null : String(value);
}

function filterRestaurantArray(items: any[], query: string) {
  return items.filter((item) => !isRestaurantLike(item) || restaurantEligible(item, query));
}

function filterPairs(items: any[], query: string, excludedRestaurantIds: Set<string>) {
  return items.filter((pair) => {
    const nested = pairRestaurant(pair);
    if (nested && !restaurantEligible(nested, query)) return false;
    const id = pairRestaurantId(pair);
    return !id || !excludedRestaurantIds.has(id);
  });
}

function filterCards(items: any[], query: string, excludedRestaurantIds: Set<string>) {
  return items.filter((item) => {
    if (pairRestaurant(item)) {
      const nested = pairRestaurant(item);
      if (nested && !restaurantEligible(nested, query)) return false;
      const id = pairRestaurantId(item);
      return !id || !excludedRestaurantIds.has(id);
    }
    if (!isRestaurantLike(item)) return true;
    const id = locationId(item);
    if (id && excludedRestaurantIds.has(id)) return false;
    return restaurantEligible(item, query);
  });
}

export function applyFinalRestaurantEligibility(
  result: EnterpriseSearchResult,
  query: string,
): EnterpriseSearchResult {
  if (!result || userExplicitlyAskedForLowLevel(query)) return result;

  const raw = result as any;
  const originalRestaurants = Array.isArray(raw.restaurants) ? raw.restaurants : [];
  const restaurants = filterRestaurantArray(originalRestaurants, query);
  const allowedRestaurantIds = new Set(restaurants.map(locationId).filter(Boolean) as string[]);
  const excludedRestaurantIds = new Set(
    originalRestaurants
      .map(locationId)
      .filter((id: string | null): id is string => Boolean(id) && !allowedRestaurantIds.has(id as string)),
  );

  const pairs = filterPairs(Array.isArray(raw.pairs) ? raw.pairs : [], query, excludedRestaurantIds);
  const matchedLocations = filterRestaurantArray(
    Array.isArray(raw.matched_locations)
      ? raw.matched_locations
      : Array.isArray(raw.matchedLocations)
        ? raw.matchedLocations
        : [],
    query,
  );
  const cards = filterCards(Array.isArray(raw.cards) ? raw.cards : [], query, excludedRestaurantIds);
  const builderRestaurants = filterRestaurantArray(
    Array.isArray(raw.builder_restaurants)
      ? raw.builder_restaurants
      : Array.isArray(raw.builder?.restaurants)
        ? raw.builder.restaurants
        : [],
    query,
  );

  const nextBuilder = raw.builder
    ? { ...raw.builder, restaurants: builderRestaurants }
    : raw.builder;

  return {
    ...raw,
    restaurants,
    pairs,
    matched_locations: matchedLocations,
    matchedLocations,
    cards,
    builder: nextBuilder,
    builder_restaurants: builderRestaurants,
    restaurant_count: restaurants.length,
    restaurantCount: restaurants.length,
    pair_count: pairs.length,
    pairCount: pairs.length,
    result_count: cards.length || pairs.length || restaurants.length + (raw.activities?.length ?? 0),
    card_counts: raw.card_counts
      ? {
          ...raw.card_counts,
          restaurants: restaurants.length,
          pairs: pairs.length,
          cards: cards.length,
          builder_restaurants: builderRestaurants.length,
          matched_locations: matchedLocations.length,
        }
      : raw.card_counts,
    cardCounts: raw.cardCounts
      ? {
          ...raw.cardCounts,
          restaurants: restaurants.length,
          pairs: pairs.length,
          cards: cards.length,
          builderRestaurants: builderRestaurants.length,
          matched_locations: matchedLocations.length,
        }
      : raw.cardCounts,
    debug: {
      ...(raw.debug ?? {}),
      finalRestaurantEligibilityRejectedCount: originalRestaurants.length - restaurants.length,
    },
  } as EnterpriseSearchResult;
}
