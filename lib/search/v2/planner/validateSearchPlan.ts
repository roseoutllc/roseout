import { extractRawRestaurantDishTerms } from "../../enterprise/rawDishTerms";
import type { SearchIntent } from "../../enterprise/types";
import type { SearchPlan } from "./searchPlanTypes";
import { detectPlannerDomainLoss } from "./explicitDomainSignals";
import {
  detectVenueRelationship,
  extractNegativeConstraints,
  extractSubjectivePreferences,
} from "./languageUnderstanding";
import { inferNoisyLanguageSignals } from "./noisyLanguageRepair";

const NON_DISH_ACTIVITY_RESIDUALS = new Set([
  "child", "children", "coworker", "coworkers", "date", "family", "friend", "friends", "fun", "group",
  "kid", "kids", "people", "person", "someone", "something", "work",
]);

function dishProbeIntent(plan: SearchPlan): SearchIntent {
  return {
    needsRestaurant: true,
    occasion: plan.occasion,
    vibe: [],
    restaurantIntent: {
      cuisineTerms: plan.restaurant.cuisines,
      foodTerms: plan.restaurant.foods,
      mealTerms: plan.restaurant.mealPeriods,
      categoryTerms: [],
      featureTerms: plan.restaurant.features,
      vibeTerms: [],
    },
    activityIntent: {
      activityTerms: plan.activity.categories,
      categoryTerms: plan.activity.categories,
      featureTerms: plan.activity.features,
      vibeTerms: [],
      alternativeGroups: [],
    },
    geo: {
      raw: null,
      neighborhood: plan.geo.neighborhood,
      borough: plan.geo.borough,
      city: plan.geo.city,
      county: plan.geo.county,
      region: null,
      state: plan.geo.state,
      requestedMarket: plan.geo.market,
      resolvedMarket: plan.geo.market,
    },
  } as unknown as SearchIntent;
}

function socialActivityResidualOnly(terms: string[]) {
  const words = terms.flatMap((term) => term.toLowerCase().split(/\s+/)).filter(Boolean);
  return words.length > 0 && words.every((word) => NON_DISH_ACTIVITY_RESIDUALS.has(word));
}

function repairArbitraryDishIntent(plan: SearchPlan) {
  const wasRestaurantRequired = plan.restaurant.required;
  const activityOnly = plan.activity.required && !wasRestaurantRequired;
  const hasMixedConnector = /\b(?:and\s+then|then|after|before|with|and)\b/i.test(plan.rawQuery);
  if (activityOnly && !hasMixedConnector) return;

  const inferredDishTerms = extractRawRestaurantDishTerms(plan.rawQuery, dishProbeIntent(plan));
  if (!inferredDishTerms.length) return;
  if (activityOnly && socialActivityResidualOnly(inferredDishTerms)) return;

  const draft = plan as unknown as {
    mode: SearchPlan["mode"];
    restaurant: SearchPlan["restaurant"];
    pairing: SearchPlan["pairing"];
    parser: SearchPlan["parser"];
  };
  draft.restaurant = {
    ...plan.restaurant,
    required: true,
    foods: Array.from(new Set([...plan.restaurant.foods, ...inferredDishTerms])),
  };
  if (!wasRestaurantRequired && plan.activity.required) {
    draft.mode = plan.pairing.sameVenueRequired ? "same_venue" : "paired_outing";
    draft.pairing = { ...plan.pairing, required: true };
  } else if (!wasRestaurantRequired) {
    draft.mode = "restaurant_only";
  }
  draft.parser = {
    ...plan.parser,
    reasons: [...plan.parser.reasons, `arbitrary dish intent restored from raw query: ${inferredDishTerms.join(",")}`],
  };
}

function normalizeConstraintQuery(query: string) {
  return query.replace(/\b(?:pls|plz|please)\b/gi, " ").replace(/\s+/g, " ").trim();
}

function supplementalExplicitNegatives(query: string) {
  const text = query.toLowerCase();
  const restaurant: string[] = [];
  const activity: string[] = [];
  if (/\b(?:no|without|anything but|except)\s+(?:a\s+|an\s+|the\s+)?pizza\b/.test(text)) restaurant.push("pizza");
  if (/\b(?:no|without|anything but|except)\s+(?:a\s+|an\s+|the\s+)?(?:rooftop|rooftop lounge|rooftop bar)\b/.test(text)) activity.push("rooftop");
  return { restaurant, activity };
}

function repairExplicitConstraintsAndPreferences(plan: SearchPlan) {
  const constraintQuery = normalizeConstraintQuery(plan.rawQuery);
  const negatives = extractNegativeConstraints(constraintQuery);
  const supplemental = supplementalExplicitNegatives(constraintQuery);
  const subjective = extractSubjectivePreferences(constraintQuery);
  const premiumFromNaturalLanguage = /\b(?:fancy|splurge[- ]worthy)\b/i.test(constraintQuery);
  const budget = premiumFromNaturalLanguage ? "premium" : subjective.budget;
  const draft = plan as unknown as {
    restaurant: SearchPlan["restaurant"];
    activity: SearchPlan["activity"];
    preferences?: SearchPlan["preferences"];
    parser: SearchPlan["parser"];
  };

  const restaurantExclusions = Array.from(new Set([...plan.restaurant.exclusions, ...negatives.restaurant, ...supplemental.restaurant]));
  const activityExclusions = Array.from(new Set([...plan.activity.exclusions, ...negatives.activity, ...supplemental.activity]));
  draft.restaurant = { ...plan.restaurant, exclusions: restaurantExclusions };
  draft.activity = { ...plan.activity, exclusions: activityExclusions };
  draft.preferences = {
    vibes: subjective.vibes,
    avoidVibes: negatives.vibes,
    subjectiveTerms: subjective.subjectiveTerms,
    budget,
    noise: subjective.noise,
  };

  if (
    restaurantExclusions.length !== plan.restaurant.exclusions.length || activityExclusions.length !== plan.activity.exclusions.length ||
    subjective.vibes.length || negatives.vibes.length || budget || subjective.noise
  ) {
    draft.parser = {
      ...plan.parser,
      reasons: [...plan.parser.reasons, "explicit exclusions and subjective preferences preserved in final search plan"],
    };
  }
}

function repairNoisyLanguageIntent(plan: SearchPlan) {
  const signals = inferNoisyLanguageSignals(plan.rawQuery);
  const restaurantRequired = plan.restaurant.required || signals.restaurantSignal;
  const activityRequired = plan.activity.required || signals.activitySignal;
  const explicitMixed = restaurantRequired && activityRequired;
  const sameVenueRequired = explicitMixed && signals.sameVenueRequired;
  const cuisines = Array.from(new Set([...plan.restaurant.cuisines, ...signals.cuisines]));
  const activityCategories = Array.from(new Set([...plan.activity.categories, ...signals.activityCategories]));
  const normalizedChanged = signals.normalizedQuery.toLowerCase() !== plan.rawQuery.toLowerCase();
  const domainChanged = restaurantRequired !== plan.restaurant.required || activityRequired !== plan.activity.required;
  const cuisineChanged = cuisines.length !== plan.restaurant.cuisines.length;
  const activityChanged = activityCategories.length !== plan.activity.categories.length;
  const geoChanged = Boolean(signals.geo && (
    signals.geo.borough !== plan.geo.borough ||
    (signals.geo.type === "neighborhood" && signals.geo.name !== plan.geo.neighborhood) ||
    (signals.geo.type === "city" && signals.geo.name !== plan.geo.city)
  ));

  if (!normalizedChanged && !domainChanged && !cuisineChanged && !activityChanged && !geoChanged && !sameVenueRequired) return;

  const draft = plan as unknown as {
    mode: SearchPlan["mode"];
    restaurant: SearchPlan["restaurant"];
    activity: SearchPlan["activity"];
    geo: SearchPlan["geo"];
    anchor: SearchPlan["anchor"];
    pairing: SearchPlan["pairing"];
    parser: SearchPlan["parser"];
  };
  draft.restaurant = { ...plan.restaurant, required: restaurantRequired, cuisines };
  draft.activity = { ...plan.activity, required: activityRequired, categories: activityCategories };

  if (signals.geo) {
    draft.geo = {
      ...plan.geo,
      source: "explicit",
      city: signals.geo.city ?? (signals.geo.type === "city" ? signals.geo.name : plan.geo.city),
      borough: signals.geo.borough ?? (signals.geo.type === "borough" ? signals.geo.name : plan.geo.borough),
      neighborhood: signals.geo.type === "neighborhood" ? signals.geo.name : plan.geo.neighborhood,
      county: signals.geo.county ?? plan.geo.county,
      state: signals.geo.state ?? plan.geo.state,
      latitude: signals.geo.latitude ?? plan.geo.latitude,
      longitude: signals.geo.longitude ?? plan.geo.longitude,
      radiusMiles: signals.geo.defaultRadiusMiles ?? plan.geo.radiusMiles,
      strictness: "strict",
    };
  }

  const genericLowLevel = /\b(?:quick bite|deli|takeout|fast casual)\b/i.test(signals.normalizedQuery) && !signals.activitySignal;
  if (genericLowLevel && plan.anchor.generic) {
    draft.anchor = {
      requested: false,
      rawName: null,
      locationId: null,
      name: null,
      latitude: null,
      longitude: null,
      entityType: "none",
      generic: false,
      exactNameRequired: false,
    };
  }

  draft.pairing = {
    ...plan.pairing,
    required: explicitMixed,
    sameVenueRequired,
    sameVenuePreferred: sameVenueRequired ? false : plan.pairing.sameVenuePreferred,
  };
  draft.mode = explicitMixed
    ? sameVenueRequired ? "same_venue" : "paired_outing"
    : activityRequired && !restaurantRequired
      ? "activity_only"
      : "restaurant_only";
  draft.parser = {
    ...plan.parser,
    reasons: [
      ...plan.parser.reasons,
      `noisy-language repair normalized intent: ${signals.normalizedQuery}`,
    ],
  };
}

function newYorkParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function newYorkOffsetMs(date: Date) {
  const parts = newYorkParts(date);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(date.getTime() / 1000) * 1000;
}

function newYorkLocalToIso(year: number, month: number, day: number, hour: number, minute: number) {
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = new Date(wallClockUtc - newYorkOffsetMs(new Date(wallClockUtc)));
  instant = new Date(wallClockUtc - newYorkOffsetMs(instant));
  return instant.toISOString();
}

const WEEKDAYS: Record<string, number> = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };

function parseClock(hourValue: string | undefined, minuteValue: string | undefined, meridiem: string | undefined, fallbackHour: number) {
  if (!hourValue) return { hour: fallbackHour, minute: 0 };
  let hour = Number(hourValue);
  const minute = Number(minuteValue ?? 0);
  if (!Number.isFinite(hour) || hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  const suffix = String(meridiem ?? "").toLowerCase();
  if (suffix === "pm" && hour !== 12) hour += 12;
  else if (suffix === "am" && hour === 12) hour = 0;
  else if (!suffix && hour <= 11) hour += 12;
  return { hour, minute };
}

function parseBroaderPlannedFor(query: string, now = new Date()) {
  const text = query.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
  const hasDateLanguage = /\b(?:today|tonight|tomorrow|this evening|tomorrow evening|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/.test(text);
  if (!hasDateLanguage) return null;
  const current = newYorkParts(now);
  let dayOffset = /\btomorrow\b/.test(text) ? 1 : 0;
  const fallbackHour = 19;
  const weekdayMatch = text.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (weekdayMatch) {
    const currentWeekday = new Date(Date.UTC(current.year, current.month - 1, current.day)).getUTCDay();
    dayOffset = (WEEKDAYS[weekdayMatch[1]] - currentWeekday + 7) % 7;
  }
  const clockMatch = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  const clock = parseClock(clockMatch?.[1], clockMatch?.[2], clockMatch?.[3], fallbackHour);
  if (!clock) return null;
  const targetDate = new Date(Date.UTC(current.year, current.month - 1, current.day + dayOffset));
  return newYorkLocalToIso(targetDate.getUTCFullYear(), targetDate.getUTCMonth()+1, targetDate.getUTCDate(), clock.hour, clock.minute);
}

function repairBroaderDateTime(plan: SearchPlan) {
  if (plan.plannedFor) return;
  const plannedFor = parseBroaderPlannedFor(plan.rawQuery);
  if (!plannedFor) return;
  const draft = plan as unknown as { plannedFor: string | null; parser: SearchPlan["parser"] };
  draft.plannedFor = plannedFor;
  draft.parser = { ...plan.parser, reasons: [...plan.parser.reasons, "natural-language date/time preserved in final search plan"] };
}

function repairExplicitVenueRelationship(plan: SearchPlan) {
  const relationship = detectVenueRelationship(plan.rawQuery);
  if (relationship.type !== "same_venue_required") return;
  if (!plan.restaurant.required || !plan.activity.required) return;
  if (plan.pairing.sameVenueRequired && plan.mode === "same_venue") return;
  const draft = plan as unknown as { mode: SearchPlan["mode"]; pairing: SearchPlan["pairing"]; parser: SearchPlan["parser"] };
  draft.mode = "same_venue";
  draft.pairing = { ...plan.pairing, required: true, sameVenuePreferred: false, sameVenueRequired: true };
  draft.parser = { ...plan.parser, reasons: [...plan.parser.reasons, "explicit same-venue relationship restored at final plan validation"] };
}

export function validateSearchPlan(plan: SearchPlan): void {
  if (!plan.rawQuery.trim()) throw new Error("SEARCH_PLAN_EMPTY_QUERY");

  repairArbitraryDishIntent(plan);
  repairExplicitConstraintsAndPreferences(plan);
  repairNoisyLanguageIntent(plan);
  repairBroaderDateTime(plan);
  repairExplicitVenueRelationship(plan);

  const domainContract = detectPlannerDomainLoss(plan.rawQuery, plan);
  if (domainContract.lostRestaurant) throw new Error(`SEARCH_PLAN_DROPPED_RESTAURANT_INTENT:${domainContract.explicit.restaurantEvidence.join(",")}`);
  if (domainContract.lostActivity) throw new Error(`SEARCH_PLAN_DROPPED_ACTIVITY_INTENT:${domainContract.explicit.activityEvidence.join(",")}`);

  if (plan.pairing.required && (!plan.restaurant.required || !plan.activity.required)) throw new Error("SEARCH_PLAN_INVALID_PAIRING");
  if (plan.pairing.sameVenueRequired && !plan.pairing.required && plan.restaurant.required && plan.activity.required) throw new Error("SEARCH_PLAN_INVALID_SAME_VENUE");
  if (plan.geo.radiusMiles <= 0) throw new Error("SEARCH_PLAN_INVALID_RADIUS");
  if (plan.travel.mode === "walking" && plan.travel.constraint === "none") throw new Error("SEARCH_PLAN_WALKING_REQUIRES_CONSTRAINT");
  if (plan.travel.constraint === "hard" && (plan.pairing.maxDistanceMiles == null || plan.pairing.maxDistanceMiles <= 0)) throw new Error("SEARCH_PLAN_HARD_DISTANCE_REQUIRES_LIMIT");
  if (plan.travel.mode === "walking" && plan.travel.maxWalkingMinutes != null && plan.travel.maxWalkingMinutes <= 0) throw new Error("SEARCH_PLAN_INVALID_WALKING_LIMIT");
  if (plan.travel.mode === "driving" && plan.travel.maxDrivingMinutes != null && plan.travel.maxDrivingMinutes <= 0) throw new Error("SEARCH_PLAN_INVALID_DRIVING_LIMIT");
  if (plan.pairing.requireWalkable && plan.travel.mode !== "walking") throw new Error("SEARCH_PLAN_WALKABLE_REQUIRES_WALKING_MODE");
}
