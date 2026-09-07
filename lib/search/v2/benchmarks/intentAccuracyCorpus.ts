export type IntentBenchmarkCategory =
  | "gold"
  | "typo"
  | "slang"
  | "vague"
  | "exclusion"
  | "neighborhood"
  | "cuisine"
  | "vibe"
  | "budget"
  | "date_time"
  | "walking"
  | "same_venue"
  | "combination";

export type IntentExpectation = Readonly<{
  mode?: "restaurant_only" | "activity_only" | "same_venue" | "paired_outing" | "anchored_nearby";
  restaurantRequired?: boolean;
  activityRequired?: boolean;
  borough?: string | null;
  neighborhood?: string | null;
  cuisinesAnyOf?: readonly string[];
  activityCategoriesAnyOf?: readonly string[];
  restaurantExclusionsAnyOf?: readonly string[];
  activityExclusionsAnyOf?: readonly string[];
  vibesAnyOf?: readonly string[];
  budget?: "budget" | "moderate" | "premium" | null;
  travelMode?: "walking" | "driving" | "unspecified";
  requireWalkable?: boolean;
  sameVenueRequired?: boolean;
  plannedForPresent?: boolean;
}>;

export type IntentBenchmarkCase = Readonly<{
  id: string;
  category: IntentBenchmarkCategory;
  query: string;
  expected: IntentExpectation;
  source: "hand_labeled" | "stress_generated";
}>;

const gold: IntentBenchmarkCase[] = [
  { id: "gold-001", category: "gold", source: "hand_labeled", query: "Plan a restaurant and activity outing. dinner and comedy show near me. Return the best options, ranked by fit.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, activityCategoriesAnyOf: ["comedy"] } },
  { id: "gold-002", category: "gold", source: "hand_labeled", query: "Plan a date night with a nice restaurant and something fun to do after near me.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true } },
  { id: "gold-003", category: "gold", source: "hand_labeled", query: "Find me a Caribbean restaurant for dinner and pair it with an activity nearby.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, cuisinesAnyOf: ["caribbean"] } },
  { id: "gold-004", category: "gold", source: "hand_labeled", query: "I want dinner and bowling tonight. Show me the best complete outing options near me.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, activityCategoriesAnyOf: ["bowling"], plannedForPresent: true } },
  { id: "gold-005", category: "gold", source: "hand_labeled", query: "Plan dinner and a comedy show in Queens. Prioritize sit-down restaurants suitable for a night out.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Queens", activityCategoriesAnyOf: ["comedy"] } },
  { id: "gold-006", category: "gold", source: "hand_labeled", query: "Find me a restaurant and activity for girls night with drinks and a lively vibe.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, sameVenueRequired: false } },
  { id: "gold-007", category: "gold", source: "hand_labeled", query: "Plan a romantic dinner and an activity afterward in Brooklyn.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Brooklyn" } },
  { id: "gold-008", category: "gold", source: "hand_labeled", query: "Find a steakhouse and something fun to do nearby. I want a full night-out experience.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, cuisinesAnyOf: ["steakhouse", "steak"] } },
  { id: "gold-009", category: "gold", source: "hand_labeled", query: "Find me a quick bite at a deli near me.", expected: { mode: "restaurant_only", restaurantRequired: true, activityRequired: false } },
  { id: "gold-010", category: "gold", source: "hand_labeled", query: "I want takeout or fast casual food and something nearby to do afterward.", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true } },
  { id: "gold-011", category: "gold", source: "hand_labeled", query: "somewhere cute for sushi then karaoke not too far apart in flushing", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood: "Flushing", cuisinesAnyOf: ["sushi", "japanese"], activityCategoriesAnyOf: ["karaoke"] } },
  { id: "gold-012", category: "gold", source: "hand_labeled", query: "cheap eats and bowling in queens but no pizza", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Queens", budget: "budget", activityCategoriesAnyOf: ["bowling"], restaurantExclusionsAnyOf: ["pizza"] } },
  { id: "gold-013", category: "gold", source: "hand_labeled", query: "fancy italian date night in bk with something chill after", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Brooklyn", cuisinesAnyOf: ["italian"], budget: "premium" } },
  { id: "gold-014", category: "gold", source: "hand_labeled", query: "dinner + escape room astoria walking distance", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood: "Astoria", activityCategoriesAnyOf: ["escape_room"], travelMode: "walking", requireWalkable: true } },
  { id: "gold-015", category: "gold", source: "hand_labeled", query: "one place in forest hills where we can eat and do karaoke", expected: { mode: "same_venue", restaurantRequired: true, activityRequired: true, neighborhood: "Forest Hills", sameVenueRequired: true, activityCategoriesAnyOf: ["karaoke"] } },
  { id: "gold-016", category: "gold", source: "hand_labeled", query: "no museums pls. dinner and something fun in brooklyn", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Brooklyn", activityExclusionsAnyOf: ["museum"] } },
  { id: "gold-017", category: "gold", source: "hand_labeled", query: "need a lowkey spot for dinner then jazz around harlem", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood: "Harlem", activityCategoriesAnyOf: ["jazz", "live_music"] } },
  { id: "gold-018", category: "gold", source: "hand_labeled", query: "girls nite drinks + dinner + dancing in manhattan", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Manhattan" } },
  { id: "gold-019", category: "gold", source: "hand_labeled", query: "romantic seafood dinner tonight at 8 in long island city then rooftop drinks", expected: { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood: "Long Island City", cuisinesAnyOf: ["seafood"], plannedForPresent: true, activityCategoriesAnyOf: ["rooftop", "lounge"] } },
  { id: "gold-020", category: "gold", source: "hand_labeled", query: "bar with wings in queens, all in one place", expected: { mode: "same_venue", restaurantRequired: true, borough: "Queens", sameVenueRequired: true } },
];

const boroughs = ["Queens", "Brooklyn", "Manhattan", "Bronx"] as const;
const neighborhoods = ["Astoria", "Flushing", "Forest Hills", "Long Island City", "Harlem", "Williamsburg", "Bushwick", "Jackson Heights", "Huntington", "Patchogue"] as const;
const cuisines = [
  ["Italian", "italian"], ["Mexican", "mexican"], ["Thai", "thai"], ["Indian", "indian"], ["Chinese", "chinese"],
  ["Japanese", "japanese"], ["Korean", "korean"], ["Caribbean", "caribbean"], ["Jamaican", "jamaican"], ["Haitian", "haitian"],
  ["Seafood", "seafood"], ["Sushi", "sushi"], ["Steakhouse", "steakhouse"], ["Peruvian", "peruvian"], ["Vegan", "vegan"],
] as const;
const activities = [
  ["bowling", "bowling"], ["karaoke", "karaoke"], ["a comedy show", "comedy"], ["an escape room", "escape_room"],
  ["mini golf", "mini_golf"], ["an arcade", "arcade"], ["live music", "live_music"], ["a rooftop lounge", "rooftop"],
] as const;

function generated(id: string, category: IntentBenchmarkCategory, query: string, expected: IntentExpectation): IntentBenchmarkCase {
  return { id, category, query, expected, source: "stress_generated" };
}

const stress: IntentBenchmarkCase[] = [];
let n = 0;
const add = (category: IntentBenchmarkCategory, query: string, expected: IntentExpectation) => {
  n += 1;
  stress.push(generated(`stress-${String(n).padStart(4, "0")}`, category, query, expected));
};

for (const [label, cuisine] of cuisines) {
  for (const borough of boroughs) {
    add("cuisine", `${label} dinner in ${borough}`, { mode: "restaurant_only", restaurantRequired: true, activityRequired: false, borough, cuisinesAnyOf: [cuisine] });
    add("combination", `${label} dinner then bowling in ${borough}`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough, cuisinesAnyOf: [cuisine], activityCategoriesAnyOf: ["bowling"] });
  }
}

for (const neighborhood of neighborhoods) {
  add("neighborhood", `dinner in ${neighborhood}`, { mode: "restaurant_only", restaurantRequired: true, activityRequired: false, neighborhood });
  add("neighborhood", `dinner then karaoke in ${neighborhood}`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood, activityCategoriesAnyOf: ["karaoke"] });
  add("walking", `dinner and bowling in ${neighborhood}, walking distance`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood, travelMode: "walking", requireWalkable: true, activityCategoriesAnyOf: ["bowling"] });
  add("same_venue", `one place in ${neighborhood} for dinner and karaoke`, { mode: "same_venue", restaurantRequired: true, activityRequired: true, neighborhood, sameVenueRequired: true, activityCategoriesAnyOf: ["karaoke"] });
}

for (const [activityLabel, activity] of activities) {
  for (const borough of boroughs) {
    add("combination", `dinner and ${activityLabel} in ${borough}`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough, activityCategoriesAnyOf: [activity] });
    add("exclusion", `dinner and something fun in ${borough} but no ${activityLabel}`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough, activityExclusionsAnyOf: [activity] });
  }
}\n
const typoCases: ReadonlyArray<readonly [string, IntentExpectation]> = [
  ["suhsi dinner in queens", { mode: "restaurant_only", restaurantRequired: true, borough: "Queens", cuisinesAnyOf: ["sushi", "japanese"] }],
  ["italain food then bolwing in brooklyn", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Brooklyn", cuisinesAnyOf: ["italian"], activityCategoriesAnyOf: ["bowling"] }],
  ["caribean dinner and karoke in queens", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Queens", cuisinesAnyOf: ["caribbean"], activityCategoriesAnyOf: ["karaoke"] }],
  ["romntic diner and comedy in manhattan", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Manhattan", activityCategoriesAnyOf: ["comedy"] }],
  ["diner then escap room astoria", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood: "Astoria", activityCategoriesAnyOf: ["escape_room"] }],
];
for (let repeat = 0; repeat < 8; repeat += 1) for (const [query, expected] of typoCases) add("typo", query, expected);

const slangCases: ReadonlyArray<readonly [string, IntentExpectation]> = [
  ["need a cute date spot in bk then something fun", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Brooklyn" }],
  ["girls nite in queens food drinks and dancing", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Queens" }],
  ["lowkey dinner then jazz in harlem", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, neighborhood: "Harlem", activityCategoriesAnyOf: ["jazz", "live_music"] }],
  ["cheap eats + bowling queens", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Queens", budget: "budget", activityCategoriesAnyOf: ["bowling"] }],
  ["fancy dinner vibes in manhattan then rooftop", { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough: "Manhattan", budget: "premium", activityCategoriesAnyOf: ["rooftop"] }],
];
for (let repeat = 0; repeat < 8; repeat += 1) for (const [query, expected] of slangCases) add("slang", query, expected);

const vagueCases = [
  "date night in Brooklyn",
  "something fun after dinner in Queens",
  "food and something chill in Manhattan",
  "take me somewhere nice then somewhere fun in Queens",
  "dinner and an activity near me",
] as const;
for (let repeat = 0; repeat < 8; repeat += 1) {
  for (const query of vagueCases) {
    const borough = query.includes("Brooklyn") ? "Brooklyn" : query.includes("Queens") ? "Queens" : query.includes("Manhattan") ? "Manhattan" : undefined;
    add("vague", query, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, ...(borough ? { borough } : {}) });
  }
}

for (const borough of boroughs) {
  for (const [activityLabel, activity] of activities.slice(0, 5)) {
    add("walking", `dinner then ${activityLabel} in ${borough}, keep it walking distance`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough, travelMode: "walking", requireWalkable: true, activityCategoriesAnyOf: [activity] });
    add("same_venue", `I want one place in ${borough} with dinner and ${activityLabel}`, { mode: "same_venue", restaurantRequired: true, activityRequired: true, borough, sameVenueRequired: true, activityCategoriesAnyOf: [activity] });
  }
}

const budgetPhrases = [
  ["cheap", "budget"], ["affordable", "budget"], ["not too expensive", "moderate"], ["mid range", "moderate"], ["upscale", "premium"], ["fancy", "premium"],
] as const;
for (const [phrase, budget] of budgetPhrases) for (const borough of boroughs) add("budget", `${phrase} dinner in ${borough}`, { mode: "restaurant_only", restaurantRequired: true, activityRequired: false, borough, budget });

const vibePhrases = ["romantic", "lively", "quiet", "cozy", "upscale", "casual", "trendy", "intimate"] as const;
for (const vibe of vibePhrases) for (const borough of boroughs) add("vibe", `${vibe} dinner and something fun in ${borough}`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough });

const datePhrases = ["tonight at 8", "tomorrow at 7 pm", "Friday at 8", "Saturday night", "tomorrow evening"] as const;
for (const when of datePhrases) for (const borough of boroughs) add("date_time", `dinner and bowling in ${borough} ${when}`, { mode: "paired_outing", restaurantRequired: true, activityRequired: true, borough, activityCategoriesAnyOf: ["bowling"], plannedForPresent: true });

// Dense cross-product: realistic mixed requests with simultaneous cuisine, activity and geography constraints.
for (const [cuisineLabel, cuisine] of cuisines) {
  for (const [activityLabel, activity] of activities) {
    for (const borough of boroughs) {
      add("combination", `${cuisineLabel} dinner then ${activityLabel} in ${borough}`, {
        mode: "paired_outing",
        restaurantRequired: true,
        activityRequired: true,
        borough,
        cuisinesAnyOf: [cuisine],
        activityCategoriesAnyOf: [activity],
      });
    }
  }
}

export const INTENT_ACCURACY_GOLD = Object.freeze(gold);
export const INTENT_ACCURACY_STRESS = Object.freeze(stress);
export const INTENT_ACCURACY_CORPUS = Object.freeze([...gold, ...stress]);
