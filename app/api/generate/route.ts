import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { clampScore } from "@/lib/clampScore";
import {
  detectSmartMatchIntent,
  balanceSmartMatches,
  getSmartMatchVersion,
} from "@/lib/roseoutSmartMatchEngine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const AI_MODEL = "gpt-4o-mini";
const CACHE_HOURS = 6;

const OFF_TOPIC_REPLY =
  "I can only help with RoseOut outing plans, restaurants, activities, nightlife, brunch, and date ideas.";

type LocationMatchItem = {
  address?: string | null;
  borough?: string | null;
  city?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  neighborhood?: string | null;
  postal_code?: string | null;
  state?: string | null;
  zip_code?: string | null;
  distance_miles?: number | null;
};

const LOCATION_NAME_MATCH_WEIGHT = 500;
const DEFAULT_LOCATION_RADIUS_MILES = 15;

const FOOD_KEYWORDS = [
  "food",
  "eat",
  "restaurant",
  "restaurants",
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "birthday dinner",
  "birthday brunch",
  "birthday restaurant",
  "steak",
  "steakhouse",
  "pizza",
  "burger",
  "seafood",
  "sushi",
  "ramen",
  "pasta",
  "italian",
  "mexican",
  "chinese",
  "thai",
  "indian",
  "mediterranean",
  "greek",
  "spanish",
  "bbq",
  "barbecue",
  "caribbean",
  "jamaican",
  "soul food",
  "african",
  "wine",
  "cocktail",
  "cocktails",
  "drinks",
  "bar",
  "rooftop",
  "lounge",
  "dessert",
  "coffee",
  "cafe",
  "hookah",
  "shisha",
  "cigar",
];

const ACTIVITY_KEYWORDS = [
  "activity",
  "activities",
  "date ideas",
  "birthday activities",
  "bowling",
  "arcade",
  "museum",
  "karaoke",
  "karoke",
  "karoake",
  "escape",
  "escape room",
  "mini golf",
  "miniature golf",
  "minigolf",
  "golf",
  "topgolf",
  "driving range",
  "axe",
  "axe throwing",
  "paintball",
  "paint and sip",
  "comedy",
  "movie",
  "movies",
  "spa",
  "games",
  "game night",
  "pool",
  "billiards",
  "jazz",
  "live music",
  "nightclub",
  "night club",
  "dance club",
];

const TAG_KEYWORDS: Record<string, string[]> = {
  birthday_dinner: ["birthday dinner", "birthday restaurant"],
  birthday_brunch: ["birthday brunch"],
  birthday: ["birthday", "celebrate", "celebration"],
  romantic: ["romantic", "date night", "intimate", "cozy", "anniversary"],
  fun: ["fun", "exciting", "games", "interactive", "competitive"],
  luxury: ["luxury", "upscale", "classy", "fine dining", "elegant"],
  chill: ["chill", "relaxed", "quiet", "laid back", "low key", "low-key"],
  nightlife: ["nightlife", "lounge", "drinks", "cocktails", "music", "bar"],
  rooftop: ["rooftop", "roof top"],
  scenic: ["view", "skyline", "waterfront", "scenic"],
};

const FOOD_INTENTS: Record<string, string[]> = {
  steak: ["steak", "steakhouse"],
  seafood: ["seafood", "fish", "lobster", "crab", "shrimp"],
  italian: ["italian", "pasta"],
  mexican: ["mexican", "taco", "tacos"],
  asian: ["asian", "sushi", "ramen", "thai", "chinese", "japanese", "korean"],
  caribbean: ["caribbean", "jamaican"],
  soul_food: ["soul food"],
  african: ["african"],
  mediterranean: ["mediterranean", "greek"],
  brunch: ["brunch"],
  breakfast: ["breakfast"],
  cafe: ["cafe", "coffee"],
  dessert: ["dessert", "ice cream", "bakery", "cake"],
  drinks: ["drinks", "cocktail", "cocktails", "wine", "bar"],
  rooftop: ["rooftop", "roof top", "view", "skyline"],
  lounge: ["lounge"],
  hookah: ["hookah", "shisha", "hookah lounge", "hookah restaurant"],
  cigar: ["cigar", "cigar lounge", "cigar bar", "cigar friendly"],
  burger: ["burger"],
  pizza: ["pizza"],
};

const ACTIVITY_INTENTS: Record<string, string[]> = {
  bowling: ["bowling", "bowl", "bowling alley"],
  arcade: ["arcade", "games", "game room", "amusement"],
  museum: ["museum", "gallery", "art", "exhibit", "exhibits"],
  karaoke: [
    "karaoke",
    "karoke",
    "karoake",
    "singing",
    "karaoke bar",
    "private karaoke",
    "karaoke room",
  ],
  escape_room: ["escape room", "escape"],
  mini_golf: ["mini golf", "miniature golf", "minigolf"],
  golf: ["golf", "topgolf", "driving range", "indoor golf"],
  axe_throwing: ["axe throwing", "axe"],
  paintball: ["paintball"],
  paint_and_sip: ["paint and sip", "paint sip", "painting"],
  comedy: ["comedy", "stand up", "stand-up", "comedy club"],
  movie: ["movie", "movies", "cinema", "theater"],
  nightclub: ["nightclub", "night club", "dance club", "club"],
  hookah: ["hookah", "shisha", "hookah lounge", "hookah restaurant"],
  cigar: ["cigar", "cigar lounge", "cigar bar", "cigar friendly"],
  lounge: ["lounge"],
  rooftop: ["rooftop", "roof top", "skyline", "view"],
  live_music: ["live music", "jazz", "music venue"],
  spa: ["spa", "massage", "wellness"],
  pool: ["pool", "billiards", "billiard"],
};

const PRIORITY_WEIGHTS = {
  foodExact: 320,
  activityExact: 320,
  tagExact: 140,
  vibeExact: 120,
  keyword: 18,
  phrase: 40,
  mismatchPenalty: -70,
  birthday: 170,
  rooftop: 160,
  nightlife: 150,
  budget: 130,
  distance: 140,
};

function normalizeQuery(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s$.-]/g, " ")
    .replace(/\s+/g, " ");
}

async function logSearchQuery(input: string) {
  const query = normalizeQuery(input);

  if (!query || query.length < 3) return;

  try {
    await supabase.from("search_logs").insert({
      query,
    });
  } catch (error) {
    console.error("SEARCH LOG ERROR:", error);
  }
}

function toArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function itemText(item: any) {
  return [
    item.location_type,
    item.restaurant_name,
    item.activity_name,
    item.name,
    item.description,
    item.address,
    item.city,
    item.state,
    item.zip_code,
    item.neighborhood,
    item.borough,
    item.cuisine,
    item.cuisine_type,
    item.activity_type,
    item.category,
    item.categories,
    item.subcategory,
    item.google_types,
    item.types,
    item.business_status,
    item.atmosphere,
    item.lighting,
    item.noise_level,
    item.price_range,
    item.primary_tag,
    item.review_snippet,
    ...toArray(item.review_keywords),
    ...toArray(item.date_style_tags),
    ...toArray(item.search_keywords),
    ...toArray(item.best_for),
    ...toArray(item.special_features),
    ...toArray(item.signature_items),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function locationDisplayName(item: any) {
  return String(item.restaurant_name || item.activity_name || item.name || "")
    .trim()
    .toLowerCase();
}

function locationNameMatchScore(item: any, input: string) {
  const name = locationDisplayName(item);
  const query = normalizeQuery(input);

  if (!name || !query) return 0;

  if (query === name) return LOCATION_NAME_MATCH_WEIGHT + 300;
  if (query.includes(name)) return LOCATION_NAME_MATCH_WEIGHT + 220;
  if (name.includes(query)) return LOCATION_NAME_MATCH_WEIGHT + 180;

  const nameWords = name.split(" ").filter((word) => word.length > 2);
  const queryWords = query.split(" ").filter((word) => word.length > 2);
  const matches = nameWords.filter((word) => queryWords.includes(word));

  if (matches.length >= 2) return LOCATION_NAME_MATCH_WEIGHT + 100;
  if (matches.length === 1 && nameWords.length <= 2) {
    return LOCATION_NAME_MATCH_WEIGHT + 40;
  }

  return 0;
}

function buildMatchedLocationResults(locations: any[], input: string) {
  return locations
    .map((item: any) => ({
      ...item,
      location_name_match_score: locationNameMatchScore(item, input),
    }))
    .filter((item: any) => item.location_name_match_score > 0)
    .sort(
      (a: any, b: any) =>
        b.location_name_match_score - a.location_name_match_score
    )
    .slice(0, 10);
}

function normalizeLocation(item: any) {
  const name = item.name || item.restaurant_name || item.activity_name || "";
  const type =
    item.location_type ||
    (item.activity_name || item.activity_type ? "activity" : "restaurant");

  return {
    ...item,
    name,
    location_type: String(type).toLowerCase(),
    restaurant_name:
      String(type).toLowerCase() === "restaurant"
        ? item.restaurant_name || name
        : item.restaurant_name,
    activity_name:
      String(type).toLowerCase() === "activity"
        ? item.activity_name || name
        : item.activity_name,
  };
}

const QUEENS_LOCATION_TERMS = [
  "astoria",
  "arverne",
  "auburndale",
  "bay terrace",
  "bayside",
  "beechhurst",
  "bellaire",
  "belle harbor",
  "bellerose",
  "breezy point",
  "briarwood",
  "broad channel",
  "cambria heights",
  "college point",
  "corona",
  "ditmars steinway",
  "ditmars-steinway",
  "douglaston",
  "east elmhurst",
  "edgemere",
  "elmhurst",
  "far rockaway",
  "floral park queens",
  "flushing",
  "forest hills",
  "fresh meadows",
  "glen oaks",
  "glendale",
  "hammels",
  "hillcrest",
  "hollis",
  "hollis hills",
  "holliswood",
  "howard beach",
  "hunters point",
  "jackson heights",
  "jamaica",
  "jamaica estates",
  "jamaica hills",
  "kew gardens",
  "kew gardens hills",
  "laurelton",
  "lindenwood",
  "little neck",
  "long island city",
  "malba",
  "maspeth",
  "middle village",
  "murray hill queens",
  "neponsit",
  "oakland gardens",
  "ozone park",
  "pomonok",
  "queens village",
  "rego park",
  "richmond hill",
  "ridgewood",
  "rockaway",
  "rockaway beach",
  "rockaway park",
  "rosedale",
  "roxbury",
  "saint albans",
  "south jamaica",
  "south ozone park",
  "springfield gardens",
  "st albans",
  "st. albans",
  "sunnyside",
  "utopia",
  "whitestone",
  "woodhaven",
  "woodside",
];

const NASSAU_LOCATION_TERMS = [
  "albertson",
  "baldwin",
  "bayville",
  "bellmore",
  "bethpage",
  "carle place",
  "cedarhurst",
  "east meadow",
  "east rockaway",
  "elmont",
  "farmingdale",
  "five towns",
  "floral park",
  "franklin square",
  "freeport",
  "garden city",
  "glen cove",
  "glen head",
  "great neck",
  "hempstead",
  "hewlett",
  "hicksville",
  "inwood",
  "island park",
  "jericho",
  "lawrence",
  "levittown",
  "locust valley",
  "long beach",
  "lynbrook",
  "malverne",
  "manhasset",
  "massapequa",
  "massapequa park",
  "merrick",
  "mineola",
  "new hyde park",
  "north hempstead",
  "oceanside",
  "old westbury",
  "oyster bay",
  "plainview",
  "port washington",
  "rockville centre",
  "roosevelt",
  "roslyn",
  "roslyn heights",
  "sea cliff",
  "seaford",
  "syosset",
  "uniondale",
  "valley stream",
  "wantagh",
  "west hempstead",
  "westbury",
  "williston park",
  "woodmere",
];

const SUFFOLK_LOCATION_TERMS = [
  "amagansett",
  "amityville",
  "babylon",
  "bay shore",
  "bellport",
  "bohemia",
  "brentwood",
  "bridgehampton",
  "brookhaven",
  "calverton",
  "center moriches",
  "central islip",
  "centereach",
  "commack",
  "copiague",
  "coram",
  "cutchogue",
  "deer park",
  "dix hills",
  "east hampton",
  "east islip",
  "east quogue",
  "east setauket",
  "farmingville",
  "greenport",
  "hampton bays",
  "hamptons",
  "hauppauge",
  "holbrook",
  "holtsville",
  "huntington",
  "islip",
  "jamesport",
  "kings park",
  "lake ronkonkoma",
  "lindenhurst",
  "manorville",
  "mastic",
  "mastic beach",
  "mattituck",
  "medford",
  "melville",
  "middle island",
  "miller place",
  "montauk",
  "moriches",
  "mount sinai",
  "nesconset",
  "north babylon",
  "northport",
  "patchogue",
  "port jefferson",
  "quogue",
  "riverhead",
  "rocky point",
  "ronkonkoma",
  "sag harbor",
  "sagaponack",
  "saint james",
  "sayville",
  "selden",
  "setauket",
  "shelter island",
  "shirley",
  "shoreham",
  "smithtown",
  "southampton",
  "southold",
  "st james",
  "st. james",
  "stony brook",
  "water mill",
  "wading river",
  "west babylon",
  "west islip",
  "westhampton",
  "westhampton beach",
  "yaphank",
];

const LONG_ISLAND_LOCATION_TERMS = [
  ...NASSAU_LOCATION_TERMS,
  ...SUFFOLK_LOCATION_TERMS,
];

const NORTHERN_NEW_JERSEY_LOCATION_TERMS = [
  "new jersey",
  "north jersey",
  "northern new jersey",
  "jersey city",
  "hoboken",
  "newark",
  "edgewater",
  "fort lee",
  "union city",
  "weehawken",
  "secaucus",
  "hackensack",
  "paramus",
  "englewood",
  "bayonne",
  "kearny",
  "harrison",
  "clifton",
  "paterson",
  "passaic",
  "montclair",
  "bloomfield",
  "east orange",
  "orange",
  "west orange",
  "livingston",
  "morristown",
  "summit",
  "union",
  "elizabeth",
  "lodi",
  "teaneck",
  "ridgewood nj",
  "ridgewood new jersey",
];

function detectLocation(input: string, locations: any[]) {
  const text = normalizeQuery(input);
  const found = new Set<string>();

  const zipMatches = text.match(/\b\d{5}(?:-\d{4})?\b/g) || [];

  zipMatches.forEach((zip) => found.add(zip.slice(0, 5)));

  locations.forEach((item) => {
    const fields = [
      item.city,
      item.neighborhood,
      item.borough,
      item.state,
      item.zip_code,
    ]
      .filter(Boolean)
      .map((value) => normalizeQuery(String(value)));

    fields.forEach((field) => {
      if (field.length >= 3 && text.includes(field)) {
        found.add(field);
      }
    });
  });

  const hardcodedLocations = [
    "nyc",
    "new york",
    "new york city",
    "manhattan",
    "brooklyn",
    "queens",
    "bronx",
    "staten island",
    "soho",
    "tribeca",
    "chelsea",
    "midtown",
    "midtown east",
    "midtown west",
    "downtown",
    "uptown",
    "upper east side",
    "upper west side",
    "harlem",
    "east harlem",
    "west harlem",
    "washington heights",
    "inwood",
    "hells kitchen",
    "hudson yards",
    "times square",
    "theater district",
    "flatiron",
    "gramercy",
    "murray hill",
    "kips bay",
    "noho",
    "nolita",
    "lower east side",
    "les",
    "east village",
    "west village",
    "greenwich village",
    "financial district",
    "fidi",
    "battery park",
    "battery park city",
    "chinatown",
    "little italy",
    "union square",
    "williamsburg",
    "bushwick",
    "greenpoint",
    "dumbo",
    "downtown brooklyn",
    "brooklyn heights",
    "fort greene",
    "clinton hill",
    "bed stuy",
    "bedford stuyvesant",
    "crown heights",
    "prospect heights",
    "park slope",
    "prospect lefferts gardens",
    "flatbush",
    "east flatbush",
    "sunset park",
    "bay ridge",
    "red hook",
    "gowanus",
    "carroll gardens",
    "cobble hill",
    "boerum hill",
    "bensonhurst",
    "dyker heights",
    "sheepshead bay",
    "brighton beach",
    "coney island",
    "canarsie",
    "brownsville",
    "east new york",
    "astoria",
    "long island city",
    "lic",
    "sunnyside",
    "woodside",
    "jackson heights",
    "elmhurst",
    "corona",
    "flushing",
    "bayside",
    "whitestone",
    "forest hills",
    "rego park",
    "kew gardens",
    "fresh meadows",
    "jamaica",
    "jamaica estates",
    "hollis",
    "queens village",
    "laurelton",
    "cambria heights",
    "st albans",
    "st. albans",
    "saint albans",
    "arverne",
    "auburndale",
    "bay terrace",
    "beechhurst",
    "bellaire",
    "bellerose",
    "breezy point",
    "briarwood",
    "broad channel",
    "college point",
    "ditmars steinway",
    "ditmars-steinway",
    "douglaston",
    "east elmhurst",
    "edgemere",
    "floral park queens",
    "glen oaks",
    "glendale",
    "hammels",
    "hillcrest",
    "hollis hills",
    "holliswood",
    "howard beach",
    "hunters point",
    "jamaica hills",
    "kew gardens hills",
    "lindenwood",
    "little neck",
    "malba",
    "murray hill queens",
    "neponsit",
    "oakland gardens",
    "pomonok",
    "rockaway park",
    "rosedale",
    "roxbury",
    "south jamaica",
    "utopia",
    "springfield gardens",
    "ozone park",
    "south ozone park",
    "richmond hill",
    "woodhaven",
    "ridgewood",
    "middle village",
    "maspeth",
    "rockaway",
    "far rockaway",
    "belle harbor",
    "rockaway beach",
    "south bronx",
    "mott haven",
    "melrose",
    "fordham",
    "belmont",
    "little italy bronx",
    "kingsbridge",
    "riverdale",
    "pelham bay",
    "throgs neck",
    "morris park",
    "wakefield",
    "woodlawn",
    "bronx zoo",
    "yankee stadium",
    "st george",
    "st. george",
    "stapleton",
    "tompkinsville",
    "new dorp",
    "great kills",
    "tottenville",
    "port richmond",
    "long island",
    "nassau",
    "nassau county",
    "suffolk",
    "suffolk county",
    "hempstead",
    "garden city",
    "mineola",
    "freeport",
    "long beach",
    "rockville centre",
    "valley stream",
    "elmont",
    "uniondale",
    "westbury",
    "hicksville",
    "massapequa",
    "levittown",
    "babylon",
    "deer park",
    "ronkonkoma",
    "patchogue",
    "huntington",
    "island park",
    "north hempstead",
    "oyster bay",
    "glen cove",
    "malverne",
    "west hempstead",
    "franklin square",
    "floral park",
    "new hyde park",
    "great neck",
    "manhasset",
    "port washington",
    "roslyn",
    "roslyn heights",
    "old westbury",
    "carle place",
    "plainview",
    "bethpage",
    "wantagh",
    "seaford",
    "massapequa park",
    "farmingdale",
    "east meadow",
    "roosevelt",
    "baldwin",
    "merrick",
    "bellmore",
    "east rockaway",
    "oceanside",
    "lynbrook",
    "lawrence",
    "cedarhurst",
    "woodmere",
    "hewlett",
    "five towns",
    "syosset",
    "jericho",
    "bayville",
    "locust valley",
    "glen head",
    "sea cliff",
    "albertson",
    "williston park",
    "northport",
    "commack",
    "dix hills",
    "melville",
    "west babylon",
    "north babylon",
    "lindenhurst",
    "copiague",
    "amityville",
    "bay shore",
    "brentwood",
    "central islip",
    "islip",
    "east islip",
    "west islip",
    "sayville",
    "bohemia",
    "lake ronkonkoma",
    "holbrook",
    "holtsville",
    "hauppauge",
    "smithtown",
    "st james",
    "st. james",
    "saint james",
    "nesconset",
    "kings park",
    "port jefferson",
    "stony brook",
    "setauket",
    "east setauket",
    "centereach",
    "selden",
    "farmingville",
    "medford",
    "bellport",
    "shirley",
    "mastic",
    "mastic beach",
    "moriches",
    "center moriches",
    "manorville",
    "riverhead",
    "calverton",
    "wading river",
    "rocky point",
    "shoreham",
    "miller place",
    "mount sinai",
    "coram",
    "middle island",
    "yaphank",
    "brookhaven",
    "hamptons",
    "southampton",
    "east hampton",
    "bridgehampton",
    "sag harbor",
    "hampton bays",
    "westhampton",
    "westhampton beach",
    "quogue",
    "east quogue",
    "water mill",
    "sagaponack",
    "montauk",
    "amagansett",
    "shelter island",
    "greenport",
    "southold",
    "mattituck",
    "cutchogue",
    "jamesport",
    "westchester",
    "westchester county",
    "yonkers",
    "mount vernon",
    "new rochelle",
    "white plains",
    "scarsdale",
    "tarrytown",
    "elmsford",
    "ossining",
    "peekskill",
    "dobbs ferry",
    "hartsdale",
    "port chester",
    "rye",
    "new jersey",
    "north jersey",
    "jersey city",
    "hoboken",
    "newark",
    "edgewater",
    "fort lee",
    "union city",
    "weehawken",
    "secaucus",
    "hackensack",
    "paramus",
    "englewood",
    "bayonne",
    "kearny",
    "harrison",
    "clifton",
    "paterson",
    "passaic",
    "montclair",
    "bloomfield",
    "east orange",
    "orange",
    "west orange",
    "livingston",
    "morristown",
    "summit",
    "union",
    "elizabeth",
    "lodi",
    "teaneck",
    "ridgewood nj",
    "ridgewood new jersey",
    "jfk",
    "laguardia",
    "lga",
    "newark airport",
  ];

  hardcodedLocations.forEach((location) => {
    if (text.includes(location)) {
      found.add(location);
    }
  });

  return Array.from(found);
}

function zipCodeForItem(item: LocationMatchItem) {
  const zip = String(
    item.zip_code || item.postal_code || item.address || ""
  ).match(/\b\d{5}\b/);

  return zip?.[0] || "";
}

function isSupportedServiceZip(zip: string) {
  const prefix = Number(zip.slice(0, 3));

  return (
    [
      100,
      101,
      102,
      103,
      104,
      111,
      112,
      113,
      114,
      115,
      116,
      117,
      118,
      119,
    ].includes(prefix) ||
    zip === "11004" ||
    zip === "11005" ||
    (prefix >= 70 && prefix <= 79)
  );
}

function locationTermsFromZip(zip: string) {
  if (!zip || !isSupportedServiceZip(zip)) return [];

  const prefix = Number(zip.slice(0, 3));

  if (zip === "11412") {
    return ["saint albans", "st albans", "st. albans", "queens"];
  }

  if (zip === "11780") {
    return ["saint james", "st james", "st. james", "long island"];
  }

  if (prefix === 103) return ["staten island", "nyc", "new york city"];
  if (prefix === 104) return ["bronx", "nyc", "new york city"];
  if (prefix === 112) return ["brooklyn", "nyc", "new york city"];
  if ([100, 101, 102].includes(prefix)) {
    return ["manhattan", "nyc", "new york city"];
  }

  if (
    [111, 113, 114, 116].includes(prefix) ||
    zip === "11004" ||
    zip === "11005"
  ) {
    return ["queens", "nyc", "new york city", ...QUEENS_LOCATION_TERMS];
  }

  if ([110, 115, 118].includes(prefix)) {
    return ["nassau", "nassau county", "long island", ...NASSAU_LOCATION_TERMS];
  }

  if ([117, 119].includes(prefix)) {
    return [
      "long island",
      "suffolk",
      "suffolk county",
      ...LONG_ISLAND_LOCATION_TERMS,
    ];
  }

  if (prefix >= 70 && prefix <= 79) {
    return NORTHERN_NEW_JERSEY_LOCATION_TERMS;
  }

  return [];
}

function boroughFromZip(zip: string) {
  if (!zip) return "";

  const prefix = Number(zip.slice(0, 3));

  if (prefix === 103) return "staten island";
  if (prefix === 104) return "bronx";
  if (prefix === 112) return "brooklyn";
  if ([100, 101, 102].includes(prefix)) return "manhattan";
  if (
    [111, 113, 114, 116].includes(prefix) ||
    zip === "11004" ||
    zip === "11005"
  ) {
    return "queens";
  }

  return "";
}

function expandedLocationTerms(location: string) {
  const normalized = normalizeQuery(location);
  const aliases: Record<string, string[]> = {
    fidi: ["financial district"],
    les: ["lower east side"],
    lic: ["long island city"],
    "saint albans": ["st albans", "st. albans", "11412"],
    "st albans": ["saint albans", "st. albans", "11412"],
    "st. albans": ["saint albans", "st albans", "11412"],
    "saint james": ["st james", "st. james", "11780"],
    "st james": ["saint james", "st. james", "11780"],
    "st. james": ["saint james", "st james", "11780"],
    queens: QUEENS_LOCATION_TERMS,
    "long island": LONG_ISLAND_LOCATION_TERMS,
    nassau: NASSAU_LOCATION_TERMS,
    "nassau county": NASSAU_LOCATION_TERMS,
    suffolk: SUFFOLK_LOCATION_TERMS,
    "suffolk county": SUFFOLK_LOCATION_TERMS,
    "new jersey": NORTHERN_NEW_JERSEY_LOCATION_TERMS,
    "north jersey": NORTHERN_NEW_JERSEY_LOCATION_TERMS,
    "northern new jersey": NORTHERN_NEW_JERSEY_LOCATION_TERMS,
    nyc: [
      "new york",
      "new york city",
      "manhattan",
      "brooklyn",
      "queens",
      "bronx",
      "staten island",
    ],
    "new york city": [
      "new york",
      "manhattan",
      "brooklyn",
      "queens",
      "bronx",
      "staten island",
    ],
  };

  if (/^\d{5}$/.test(normalized)) {
    return Array.from(new Set([normalized, ...locationTermsFromZip(normalized)]));
  }

  return Array.from(new Set([normalized, ...(aliases[normalized] || [])]));
}

function matchesLocation(item: LocationMatchItem, detectedLocations: string[]) {
  if (!detectedLocations || detectedLocations.length === 0) return true;

  const itemZip = zipCodeForItem(item);
  const itemBorough = boroughFromZip(itemZip);
  const searchable = normalizeQuery(
    [
      item.city,
      item.neighborhood,
      item.borough,
      item.state,
      itemZip,
      item.address,
      itemBorough,
      ...locationTermsFromZip(itemZip),
    ]
      .filter(Boolean)
      .join(" ")
  );

  return detectedLocations.some((location) => {
    const normalizedLocation = normalizeQuery(location);

    if (/^\d{5}$/.test(normalizedLocation) && itemZip === normalizedLocation) {
      return true;
    }

    return expandedLocationTerms(normalizedLocation).some((term) =>
      searchable.includes(term)
    );
  });
}

function isRoseOutRelated(input: string) {
  const text = normalizeQuery(input);

  const allowedWords = [
    ...FOOD_KEYWORDS,
    ...ACTIVITY_KEYWORDS,
    ...Object.values(TAG_KEYWORDS).flat(),
    ...Object.values(FOOD_INTENTS).flat(),
    ...Object.values(ACTIVITY_INTENTS).flat(),
    ...QUEENS_LOCATION_TERMS,
    ...LONG_ISLAND_LOCATION_TERMS,
    "date",
    "outing",
    "plan",
    "plans",
    "place",
    "places",
    "spot",
    "spots",
    "search",
    "find",
    "show",
    "recommend",
    "recommendation",
    "recommendations",
    "suggest",
    "suggestion",
    "suggestions",
    "anything",
    "something",
    "somewhere",
    "near",
    "nearby",
    "budget",
    "cheap",
    "affordable",
    "expensive",
    "nyc",
    "new york",
    "queens",
    "brooklyn",
    "manhattan",
    "bronx",
    "staten island",
    "nassau",
    "suffolk",
    "long island",
  ];

  const searchedZips = text.match(/\b\d{5}\b/g) || [];

  return (
    allowedWords.some((word) => text.includes(word)) ||
    searchedZips.some(isSupportedServiceZip)
  );
}

function isUnsafeOrOffTopic(input: string) {
  const text = normalizeQuery(input);

  const blockedWords = [
    "fever",
    "sick",
    "ill",
    "medicine",
    "medical",
    "doctor",
    "hospital",
    "pain",
    "injury",
    "blood",
    "emergency",
    "suicide",
    "kill myself",
    "hurt myself",
    "weapon",
    "gun",
    "drug",
    "legal advice",
  ];

  return blockedWords.some((word) => text.includes(word));
}

function detectFromMap(input: string, map: Record<string, string[]>) {
  const text = normalizeQuery(input);

  return Array.from(
    new Set(
      Object.entries(map)
        .filter(([, keywords]) =>
          keywords.some((keyword) => text.includes(keyword))
        )
        .map(([key]) => key)
    )
  );
}

function buildWantsMap(keys: string[], selected: string[]) {
  const map: Record<string, boolean> = {};

  keys.forEach((key) => {
    map[`wants_${key}`] = selected.includes(key);
  });

  return map;
}

function itemHasTag(item: any, tag: string) {
  const searchable = itemText(item);

  const directTags = [
    item.activity_type,
    item.activity_name,
    item.category,
    item.categories,
    item.subcategory,
    item.primary_tag,
    ...toArray(item.google_types),
    ...toArray(item.types),
    ...toArray(item.date_style_tags),
    ...toArray(item.search_keywords),
    ...toArray(item.best_for),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (directTags.includes(tag)) return true;

  const keywords = TAG_KEYWORDS[tag] || [tag.replace(/_/g, " ")];
  return keywords.some((keyword) => searchable.includes(keyword));
}

function isHookahPlace(item: any) {
  const searchable = itemText(item);

  return (
    searchable.includes("hookah") ||
    searchable.includes("shisha") ||
    searchable.includes("hookah lounge") ||
    searchable.includes("hookah restaurant")
  );
}

function isCigarPlace(item: any) {
  const searchable = itemText(item);

  return (
    searchable.includes("cigar") ||
    searchable.includes("cigar lounge") ||
    searchable.includes("cigar bar") ||
    searchable.includes("cigar friendly")
  );
}

function matchesFoodIntent(item: any, foodIntent: string) {
  if (foodIntent === "hookah") return isHookahPlace(item);
  if (foodIntent === "cigar") return isCigarPlace(item);

  const searchable = itemText(item);
  const keywords = FOOD_INTENTS[foodIntent] || [foodIntent.replace(/_/g, " ")];

  return keywords.some((keyword) => searchable.includes(keyword));
}

function matchesActivityIntent(item: any, activityIntent: string) {
  const activityName = String(
    item.activity_name || item.name || ""
  ).toLowerCase();

  const normalizedIntent = activityIntent.replace(/_/g, " ");
  const keywords = ACTIVITY_INTENTS[activityIntent] || [normalizedIntent];

  if (activityName.includes(normalizedIntent)) return true;
  if (keywords.some((keyword) => activityName.includes(keyword))) return true;

  if (activityIntent === "hookah") return isHookahPlace(item);
  if (activityIntent === "cigar") return isCigarPlace(item);

  const searchable = itemText(item);

  if (itemHasTag(item, activityIntent)) return true;

  return keywords.some((keyword) => searchable.includes(keyword));
}

function detectBudget(input: string) {
  const text = normalizeQuery(input);
  const dollarMatch = text.match(/\$?\b(\d{2,4})\b/);
  const amount = dollarMatch ? Number(dollarMatch[1]) : null;

  if (
    text.includes("cheap") ||
    text.includes("affordable") ||
    text.includes("budget") ||
    text.includes("low cost") ||
    text.includes("inexpensive")
  ) {
    return { level: "low", maxAmount: amount || 60 };
  }

  if (
    text.includes("moderate") ||
    text.includes("not too expensive") ||
    text.includes("mid range") ||
    text.includes("mid-range")
  ) {
    return { level: "medium", maxAmount: amount || 120 };
  }

  if (
    text.includes("luxury") ||
    text.includes("expensive") ||
    text.includes("upscale") ||
    text.includes("fine dining") ||
    text.includes("high end") ||
    text.includes("high-end")
  ) {
    return { level: "high", maxAmount: amount || null };
  }

  if (amount) {
    if (amount <= 60) return { level: "low", maxAmount: amount };
    if (amount <= 150) return { level: "medium", maxAmount: amount };
    return { level: "high", maxAmount: amount };
  }

  return { level: null, maxAmount: null };
}

function priceLevel(item: any) {
  const price = String(item.price_range || item.price || "").toLowerCase();

  if (
    price.includes("$$$$") ||
    price.includes("expensive") ||
    price.includes("luxury")
  ) {
    return "high";
  }

  if (price.includes("$$$") || price.includes("moderate")) {
    return "medium";
  }

  if (
    price.includes("$") ||
    price.includes("cheap") ||
    price.includes("affordable")
  ) {
    return "low";
  }

  return null;
}

function budgetBoost(item: any, budget: ReturnType<typeof detectBudget>) {
  if (!budget.level) return 0;

  const level = priceLevel(item);
  const searchable = itemText(item);

  if (!level) {
    if (budget.level === "low" && searchable.includes("affordable")) return 70;
    if (
      budget.level === "high" &&
      (searchable.includes("upscale") || searchable.includes("luxury"))
    ) {
      return 90;
    }
    return 0;
  }

  if (budget.level === level) return PRIORITY_WEIGHTS.budget;

  if (budget.level === "low" && level === "high") return -120;
  if (budget.level === "medium" && level === "high") return -50;
  if (budget.level === "high" && level === "low") return -25;

  return 0;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 3958.8;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isWithinRoseOutServiceArea(item: any) {
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);

  if (!lat || !lng) return true;

  // NYC + Long Island + Westchester + North Jersey
  return (
    lat >= 40.4 &&
    lat <= 41.2 &&
    lng >= -74.3 &&
    lng <= -73.5
  );
}

function distanceMilesFromUser(
  item: LocationMatchItem,
  userLat?: number,
  userLng?: number
) {
  if (!userLat || !userLng || !item.latitude || !item.longitude) return null;

  return haversineMiles(
    Number(userLat),
    Number(userLng),
    Number(item.latitude),
    Number(item.longitude)
  );
}

function filterByUserRadius(
  items: LocationMatchItem[],
  userLat?: number,
  userLng?: number,
  maxMiles?: number | null
) {
  if (!userLat || !userLng) return items;

  const radius = maxMiles || DEFAULT_LOCATION_RADIUS_MILES;
  const itemsWithCoordinates = items.filter(
    (item) => item.latitude && item.longitude
  );

  if (itemsWithCoordinates.length === 0) return items;

  return items.filter((item) => {
    const miles = distanceMilesFromUser(item, userLat, userLng);

    if (miles === null) return false;

    item.distance_miles = Number(miles.toFixed(1));

    return miles <= radius;
  });
}

function distanceBoost(
  item: any,
  userLat?: number,
  userLng?: number,
  maxMiles?: number | null
) {
  const miles = distanceMilesFromUser(item, userLat, userLng);

  if (miles === null) return 0;

  item.distance_miles = Number(miles.toFixed(1));

  if (maxMiles && miles > maxMiles) return -200;

  if (miles <= 2) return PRIORITY_WEIGHTS.distance;
  if (miles <= 5) return 100;
  if (miles <= 10) return 55;
  if (miles <= 20) return 15;

  return -40;
}

function detectDistance(input: string) {
  const text = normalizeQuery(input);
  const match = text.match(/(\d{1,2})\s*(mile|miles|mi)/);

  if (match) return Number(match[1]);

  if (
    text.includes("near me") ||
    text.includes("nearby") ||
    text.includes("close by")
  ) {
    return 10;
  }

  return null;
}

function keywordBoost(item: any, input: string) {
  const searchable = itemText(item);

  const words = normalizeQuery(input)
    .split(" ")
    .filter((word) => word.length > 2);

  let boost = 0;

  words.forEach((word) => {
    if (searchable.includes(word)) boost += PRIORITY_WEIGHTS.keyword;
  });

  const phrase = normalizeQuery(input);

  if (phrase.length > 2 && searchable.includes(phrase)) {
    boost += PRIORITY_WEIGHTS.phrase;
  }

  return boost;
}

function weightedFoodBoost(item: any, foodIntents: string[]) {
  if (foodIntents.length === 0) return 0;

  let score = 0;

  foodIntents.forEach((food) => {
    score += matchesFoodIntent(item, food)
      ? PRIORITY_WEIGHTS.foodExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  });

  return score;
}

function weightedActivityBoost(item: any, activityIntents: string[]) {
  if (activityIntents.length === 0) return 0;

  let score = 0;

  activityIntents.forEach((activity) => {
    score += matchesActivityIntent(item, activity)
      ? PRIORITY_WEIGHTS.activityExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  });

  return score;
}

function weightedTagBoost(item: any, requestedTags: string[]) {
  return requestedTags.reduce(
    (total, tag) =>
      total + (itemHasTag(item, tag) ? PRIORITY_WEIGHTS.tagExact : 0),
    0
  );
}

function weightedVibeBoost(item: any, vibes: string[]) {
  return vibes.reduce(
    (total, vibe) =>
      total + (itemHasTag(item, vibe) ? PRIORITY_WEIGHTS.vibeExact : 0),
    0
  );
}

function popularityBoost(item: any) {
  const rating = Number(item.rating || 0);
  const reviews = Number(item.review_count || 0);

  let score = 0;

  score += rating * 25;
  score += Math.log10(reviews + 1) * 60;

  if (rating >= 4.5 && reviews >= 200) score += 120;
  if (rating >= 4.2 && reviews >= 100) score += 60;

  return score;
}

function detectIntent(input: string, body: any = {}, locations: any[] = []) {
  const text = normalizeQuery(input);

  const requestedTags = detectFromMap(input, TAG_KEYWORDS);
  const foodIntents = detectFromMap(input, FOOD_INTENTS);
  const activityIntents = detectFromMap(input, ACTIVITY_INTENTS);
  const detectedLocations = detectLocation(input, locations);

  const wantsFoodMap = buildWantsMap(Object.keys(FOOD_INTENTS), foodIntents);
  const wantsActivityMap = buildWantsMap(
    Object.keys(ACTIVITY_INTENTS),
    activityIntents
  );

  const wantsFood =
    FOOD_KEYWORDS.some((word) => text.includes(word)) || foodIntents.length > 0;

  const wantsActivity =
    ACTIVITY_KEYWORDS.some((word) => text.includes(word)) ||
    activityIntents.length > 0;

  const allOptions = [
    ...Object.values(FOOD_INTENTS).flat(),
    ...Object.values(ACTIVITY_INTENTS).flat(),
    ...Object.values(TAG_KEYWORDS).flat(),
  ];

  const mentionsAnyRoseOutOption = allOptions.some((option) =>
    text.includes(option)
  );

  const wantsFullOuting =
    text.includes("date night") ||
    text.includes("outing") ||
    text.includes("night out") ||
    text.includes("full plan") ||
    text.includes("plan a date") ||
    text.includes("birthday plan") ||
    text.includes("birthday outing") ||
    text.includes("date idea") ||
    text.includes("date ideas") ||
    text.includes("places to go") ||
    text.includes("things to do") ||
    text.includes("with") ||
    text.includes("and") ||
    (wantsFood && wantsActivity) ||
    (foodIntents.length > 0 && activityIntents.length > 0) ||
    (mentionsAnyRoseOutOption && text.includes("date"));

  const wantsRestaurant =
    wantsFood || wantsFullOuting || (!wantsFood && !wantsActivity);

  const vibes = Array.from(
    new Set([
      ...requestedTags.filter((tag) =>
        [
          "romantic",
          "fun",
          "luxury",
          "chill",
          "nightlife",
          "scenic",
          "birthday",
        ].includes(tag)
      ),
      ...(text.includes("romantic") ? ["romantic"] : []),
      ...(text.includes("fun") ? ["fun"] : []),
      ...(text.includes("luxury") || text.includes("upscale")
        ? ["luxury"]
        : []),
      ...(text.includes("chill") ? ["chill"] : []),
    ])
  );

  const budget = detectBudget(input);
  const maxMiles = body.maxMiles || body.max_miles || detectDistance(input);
  const userLat = body.lat || body.latitude || null;
  const userLng = body.lng || body.longitude || null;

  const multiIntentMode =
    wantsFullOuting ||
    (foodIntents.length > 0 && activityIntents.length > 0) ||
    (wantsFood && wantsActivity);

  return {
    text,
    wantsFood,
    wantsActivity,
    wantsFullOuting,
    wantsRestaurant,
    requestedTags,
    foodIntents,
    activityIntents,
    wantsFoodMap,
    wantsActivityMap,
    wantsBudget: Boolean(budget.level),
    budget,
    userLat,
    userLng,
    maxMiles,
    vibes,
    multiIntentMode,
    locations: detectedLocations,

    wantsBirthday: text.includes("birthday"),
    wantsBirthdayDinner: text.includes("birthday dinner"),
    wantsBirthdayBrunch: text.includes("birthday brunch"),
    wantsRooftop:
      foodIntents.includes("rooftop") ||
      activityIntents.includes("rooftop") ||
      requestedTags.includes("rooftop"),
    wantsHookah:
      foodIntents.includes("hookah") || activityIntents.includes("hookah"),
    wantsCigar:
      foodIntents.includes("cigar") || activityIntents.includes("cigar"),
    wantsLounge:
      foodIntents.includes("lounge") || activityIntents.includes("lounge"),
    wantsNightclub: activityIntents.includes("nightclub"),
  };
}

function scoreRestaurant(
  item: any,
  input: string,
  intent: ReturnType<typeof detectIntent>
) {
  let score = 0;

  score += locationNameMatchScore(item, input);
  score += keywordBoost(item, input);
  score += weightedVibeBoost(item, intent.vibes);
  score += weightedTagBoost(item, intent.requestedTags);
  score += weightedFoodBoost(item, intent.foodIntents);
  score += budgetBoost(item, intent.budget);
  score += distanceBoost(item, intent.userLat, intent.userLng, intent.maxMiles);
  score += popularityBoost(item);

  if (intent.locations.length > 0) {
    const text = itemText(item);

    if (intent.locations.some((loc) => text.includes(loc))) {
      score += 40;
    } else {
      score -= 25;
    }
  }

  if (intent.wantsBirthdayDinner) score += PRIORITY_WEIGHTS.birthday;
  if (intent.wantsBirthdayBrunch && matchesFoodIntent(item, "brunch")) {
    score += PRIORITY_WEIGHTS.birthday;
  }

  if (intent.wantsRooftop && matchesFoodIntent(item, "rooftop")) {
    score += PRIORITY_WEIGHTS.rooftop;
  }

  if (intent.wantsHookah) {
    score += isHookahPlace(item)
      ? PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.foodExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  }

  if (intent.wantsCigar) {
    score += isCigarPlace(item)
      ? PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.foodExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  }

  score += clampScore(item.roseout_score || 0) * 0.25;
  score += clampScore(item.quality_score || 0) * 0.15;
  score += clampScore(item.popularity_score || 0) * 0.1;
  score += clampScore(item.review_score || 0) * 0.2;

  return clampScore(score);
}

function scoreActivity(
  item: any,
  input: string,
  intent: ReturnType<typeof detectIntent>
) {
  let score = 0;

  score += locationNameMatchScore(item, input);

  if (intent.locations.length > 0) {
    const text = itemText(item);

    if (intent.locations.some((loc) => text.includes(loc))) {
      score += 40;
    } else {
      score -= 25;
    }
  }

  intent.activityIntents.forEach((activity) => {
    const name = String(item.activity_name || item.name || "").toLowerCase();
    const normalizedActivity = activity.replace(/_/g, " ");
    const keywords = ACTIVITY_INTENTS[activity] || [normalizedActivity];

    if (
      name.includes(normalizedActivity) ||
      keywords.some((keyword) => name.includes(keyword))
    ) {
      score += 500;
    }
  });

  score += keywordBoost(item, input);
  score += weightedVibeBoost(item, intent.vibes);
  score += weightedTagBoost(item, intent.requestedTags);
  score += weightedActivityBoost(item, intent.activityIntents);
  score += budgetBoost(item, intent.budget);
  score += distanceBoost(item, intent.userLat, intent.userLng, intent.maxMiles);
  score += popularityBoost(item);

  if (intent.wantsBirthday) {
    if (
      itemHasTag(item, "birthday") ||
      itemHasTag(item, "fun") ||
      itemHasTag(item, "nightlife") ||
      matchesActivityIntent(item, "nightclub") ||
      matchesActivityIntent(item, "comedy") ||
      matchesActivityIntent(item, "karaoke")
    ) {
      score += PRIORITY_WEIGHTS.birthday;
    }
  }

  if (intent.wantsRooftop && matchesActivityIntent(item, "rooftop")) {
    score += PRIORITY_WEIGHTS.rooftop;
  }

  if (intent.wantsHookah) {
    score += isHookahPlace(item)
      ? PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.activityExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  }

  if (intent.wantsCigar) {
    score += isCigarPlace(item)
      ? PRIORITY_WEIGHTS.nightlife + PRIORITY_WEIGHTS.activityExact
      : PRIORITY_WEIGHTS.mismatchPenalty;
  }

  if (intent.wantsNightclub && matchesActivityIntent(item, "nightclub")) {
    score += PRIORITY_WEIGHTS.nightlife;
  }

  score += clampScore(item.roseout_score || 0) * 0.25;
  score += clampScore(item.quality_score || 0) * 0.15;
  score += clampScore(item.popularity_score || 0) * 0.1;
  score += clampScore(item.review_score || 0) * 0.2;

  return clampScore(score);
}

function filterRestaurantsByFoodIntent(
  restaurants: any[],
  intent: ReturnType<typeof detectIntent>
) {
  if (intent.foodIntents.length === 0) return restaurants;

  const exactMatches = restaurants.filter((restaurant: any) =>
    intent.foodIntents.every((food) => matchesFoodIntent(restaurant, food))
  );

  if (exactMatches.length > 0) return exactMatches;

  const partialMatches = restaurants.filter((restaurant: any) =>
    intent.foodIntents.some((food) => matchesFoodIntent(restaurant, food))
  );

  return partialMatches.length > 0 ? partialMatches : restaurants;
}

function filterActivitiesByActivityIntent(
  activities: any[],
  intent: ReturnType<typeof detectIntent>
) {
  if (intent.activityIntents.length === 0) return activities;

  const exactMatches = activities.filter((activity: any) =>
    intent.activityIntents.every((activityIntent) =>
      matchesActivityIntent(activity, activityIntent)
    )
  );

  if (exactMatches.length > 0) return exactMatches;

  const partialMatches = activities.filter((activity: any) =>
    intent.activityIntents.some((activityIntent) =>
      matchesActivityIntent(activity, activityIntent)
    )
  );

  if (partialMatches.length > 0) return partialMatches;

  return [];
}

function pairSmartMatches(restaurants: any[], activities: any[]) {
  if (!restaurants.length || !activities.length) {
    return {
      restaurants,
      activities,
      pairs: [],
    };
  }

  const pairs = restaurants
    .flatMap((restaurant) =>
      activities.map((activity) => {
        let distance = null;

        if (
          restaurant.latitude &&
          restaurant.longitude &&
          activity.latitude &&
          activity.longitude
        ) {
          distance = haversineMiles(
            Number(restaurant.latitude),
            Number(restaurant.longitude),
            Number(activity.latitude),
            Number(activity.longitude)
          );
        }

        const sameCity =
          restaurant.city &&
          activity.city &&
          String(restaurant.city).toLowerCase() ===
            String(activity.city).toLowerCase();

        const sameNeighborhood =
          restaurant.neighborhood &&
          activity.neighborhood &&
          String(restaurant.neighborhood).toLowerCase() ===
            String(activity.neighborhood).toLowerCase();

        let pairScore =
          Number(restaurant.roseout_score || 0) +
          Number(activity.roseout_score || 0);

        if (sameNeighborhood) pairScore += 80;
        if (sameCity) pairScore += 50;

        if (distance !== null) {
          if (distance <= 1) pairScore += 120;
          else if (distance <= 3) pairScore += 90;
          else if (distance <= 5) pairScore += 50;
          else if (distance <= 10) pairScore += 15;
          else pairScore -= 80;
        }

        return {
          restaurant,
          activity,
          distance_miles:
            distance !== null ? Number(distance.toFixed(1)) : null,
          same_city: Boolean(sameCity),
          same_neighborhood: Boolean(sameNeighborhood),
          pair_score: pairScore,
        };
      })
    )
    .sort((a, b) => b.pair_score - a.pair_score);

  const usedRestaurantIds = new Set<string>();
  const usedActivityIds = new Set<string>();

  const bestPairs = pairs
    .filter((pair) => {
      const restaurantId = String(
        pair.restaurant.id || pair.restaurant.restaurant_name || ""
      );

      const activityId = String(
        pair.activity.id || pair.activity.activity_name || ""
      );

      if (
        usedRestaurantIds.has(restaurantId) ||
        usedActivityIds.has(activityId)
      ) {
        return false;
      }

      usedRestaurantIds.add(restaurantId);
      usedActivityIds.add(activityId);

      return true;
    })
    .slice(0, 3);

  return {
    restaurants: bestPairs.map((pair) => ({
      ...pair.restaurant,
      paired_activity_name:
        pair.activity.activity_name || pair.activity.name || null,
      pair_distance_miles: pair.distance_miles,
      pair_score: pair.pair_score,
    })),
    activities: bestPairs.map((pair) => ({
      ...pair.activity,
      paired_restaurant_name:
        pair.restaurant.restaurant_name || pair.restaurant.name || null,
      pair_distance_miles: pair.distance_miles,
      pair_score: pair.pair_score,
    })),
    pairs: bestPairs,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const input = body.input || messages[messages.length - 1]?.content || "";

    if (!input) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    const smartIntent = detectSmartMatchIntent(input);
    console.log("SMART MATCH INTENT:", smartIntent);

    if (isUnsafeOrOffTopic(input) || !isRoseOutRelated(input)) {
      return Response.json({
        success: false,
        version: getSmartMatchVersion(),
        reply: OFF_TOPIC_REPLY,
        smart_match: smartIntent,
        intent: {
          requestedTags: [],
          foodIntents: [],
          activityIntents: [],
          vibes: [],
          multiIntentMode: false,
          locations: [],
        },
        restaurants: [],
        activities: [],
        matched_locations: [],
      });
    }

    await logSearchQuery(input);

    const { data: locationsData, error: locationsError } = await supabase
      .from("locations")
      .select("*");

    const { data: restaurantsData, error: restaurantsError } = await supabase
      .from("restaurants")
      .select("*");

    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("*");

    if (locationsError) {
      return Response.json({ error: locationsError.message }, { status: 500 });
    }

    if (restaurantsError) {
      return Response.json(
        { error: restaurantsError.message },
        { status: 500 }
      );
    }

    if (activitiesError) {
      return Response.json({ error: activitiesError.message }, { status: 500 });
    }

    const mergedLocations = [
      ...(locationsData || []),
      ...(restaurantsData || []).map((restaurant: any) => ({
        ...restaurant,
        location_type: "restaurant",
        name: restaurant.restaurant_name || restaurant.name,
        restaurant_name: restaurant.restaurant_name || restaurant.name,
      })),
      ...(activitiesData || []).map((activity: any) => ({
        ...activity,
        location_type: "activity",
        name: activity.activity_name || activity.name,
        activity_name: activity.activity_name || activity.name,
      })),
    ];

    const locations = mergedLocations.map(normalizeLocation);
    const intent = detectIntent(input, body, locations);

   const cacheKey = normalizeQuery(
  `roseout-${getSmartMatchVersion()}-contact-v1-${input}-${intent.userLat || ""}-${
    intent.userLng || ""
  }-${intent.maxMiles || ""}-${intent.locations.join("-")}`
);

    const { data: cached } = await supabase
      .from("ai_response_cache")
      .select("response, created_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.response) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();

      if (cacheAge < 1000 * 60 * 60 * CACHE_HOURS) {
        return Response.json(cached.response);
      }
    }

const usableLocations = locations.filter((item: any) => {
  const status = String(item.status || "approved").toLowerCase();

  const isApproved =
    status === "approved" || status === "active" || status === "";

  return isApproved && isWithinRoseOutServiceArea(item);
});

    const sourceLocations =
      usableLocations.length > 0 ? usableLocations : locations;

    const matchedLocationResults = buildMatchedLocationResults(
      sourceLocations,
      input
    );

    let restaurants = sourceLocations.filter((item: any) => {
      const type = String(item.location_type || "").toLowerCase();

      return (
        type === "restaurant" ||
        Boolean(item.restaurant_name) ||
        Boolean(item.cuisine) ||
        Boolean(item.cuisine_type)
      );
    });

    let activities = sourceLocations.filter((item: any) => {
      const type = String(item.location_type || "").toLowerCase();

      return (
        type === "activity" ||
        Boolean(item.activity_name) ||
        Boolean(item.activity_type) ||
        intent.activityIntents.some((activityIntent) =>
          matchesActivityIntent(item, activityIntent)
        )
      );
    });

    const fallbackRestaurants = restaurants;
    const fallbackActivities = activities;

    restaurants = filterRestaurantsByFoodIntent(restaurants, intent);
    activities = filterActivitiesByActivityIntent(activities, intent);

    if (restaurants.length === 0 && fallbackRestaurants.length > 0) {
      restaurants = fallbackRestaurants;
    }

    if (activities.length === 0 && fallbackActivities.length > 0) {
      activities = fallbackActivities;
    }

    if (intent.locations.length > 0) {
      restaurants = restaurants.filter((item) =>
        matchesLocation(item, intent.locations)
      );

      activities = activities.filter((item) =>
        matchesLocation(item, intent.locations)
      );
    } else if (intent.userLat && intent.userLng) {
      restaurants = filterByUserRadius(
        restaurants,
        intent.userLat,
        intent.userLng,
        intent.maxMiles
      );

      activities = filterByUserRadius(
        activities,
        intent.userLat,
        intent.userLng,
        intent.maxMiles
      );
    }

    if (intent.activityIntents.length > 0) {
      let forcedActivityMatches = sourceLocations.filter((item: any) =>
        intent.activityIntents.some((activityIntent) =>
          matchesActivityIntent(item, activityIntent)
        )
      );

      if (intent.locations.length > 0) {
        forcedActivityMatches = forcedActivityMatches.filter((item) =>
          matchesLocation(item, intent.locations)
        );
      } else if (intent.userLat && intent.userLng) {
        forcedActivityMatches = filterByUserRadius(
          forcedActivityMatches,
          intent.userLat,
          intent.userLng,
          intent.maxMiles
        );
      }

      if (forcedActivityMatches.length > 0) {
        activities = forcedActivityMatches;
      }
    }

    const rankedRestaurants = restaurants
      .map((restaurant: any) => {
        const score = scoreRestaurant(restaurant, input, intent);

        return {
          ...restaurant,
          roseout_score: score,
          smart_match_score: score,
          location_name_match_score: locationNameMatchScore(restaurant, input),
        };
      })
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const rankedActivities = activities
      .map((activity: any) => {
        const score = scoreActivity(activity, input, intent);

        return {
          ...activity,
          roseout_score: score,
          smart_match_score: score,
          location_name_match_score: locationNameMatchScore(activity, input),
        };
      })
      .sort((a: any, b: any) => b.roseout_score - a.roseout_score);

    const smartBalanced = balanceSmartMatches(
      rankedRestaurants,
      rankedActivities,
      smartIntent
    );

    if (
      intent.activityIntents.length > 0 &&
      rankedActivities.length > 0 &&
      smartBalanced.activities.length === 0
    ) {
      smartBalanced.activities = rankedActivities.slice(0, 2);
    }

    if (
      intent.foodIntents.length > 0 &&
      rankedRestaurants.length > 0 &&
      smartBalanced.restaurants.length === 0
    ) {
      smartBalanced.restaurants = rankedRestaurants.slice(0, 2);
    }

    const pairedResults =
      smartBalanced.restaurants.length > 0 &&
      smartBalanced.activities.length > 0
        ? pairSmartMatches(smartBalanced.restaurants, smartBalanced.activities)
        : {
            restaurants: smartBalanced.restaurants,
            activities: smartBalanced.activities,
            pairs: [],
          };

    const topRestaurants = pairedResults.restaurants;
    const topActivities = pairedResults.activities;

    const slimMatchedLocations = matchedLocationResults.map((item: any) => ({
      id: String(item.id),
      name: item.restaurant_name || item.activity_name || item.name,
      location_type: item.location_type,
      city: item.city,
      address: item.address,
      cuisine: item.cuisine || item.cuisine_type || null,
      activity_type:
        item.activity_type || item.category || item.subcategory || null,
      score: item.location_name_match_score,
    }));

    const slimRestaurants = topRestaurants.map((r: any) => ({
      name: r.restaurant_name || r.name,
      city: r.city,
      cuisine: r.cuisine || r.cuisine_type,
      score: clampScore(r.roseout_score),
      location_name_match_score: r.location_name_match_score || 0,
      tag: r.primary_tag,
      rating: r.rating,
      review_count: r.review_count,
      distance_miles: r.distance_miles || null,
      review_keywords: toArray(r.review_keywords).slice(0, 5),
    }));

    const slimActivities = topActivities.map((a: any) => ({
      name: a.activity_name || a.name,
      city: a.city,
      type: a.activity_type || a.category || a.subcategory,
      score: clampScore(a.roseout_score),
      location_name_match_score: a.location_name_match_score || 0,
      tag: a.primary_tag,
      rating: a.rating,
      review_count: a.review_count,
      distance_miles: a.distance_miles || null,
      review_keywords: toArray(a.review_keywords).slice(0, 5),
    }));

    const shortConversation = messages
      .slice(-4)
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
You are RoseOut, a concise AI outing planner.

Conversation:
${shortConversation}

Latest user request:
"${input}"

RoseOut Smart Match Engine:
${JSON.stringify({
  version: getSmartMatchVersion(),
  mode: smartBalanced.mode,
  wantsFood: smartIntent.wantsFood,
  wantsActivity: smartIntent.wantsActivity,
  wantsFullOuting: smartIntent.wantsFullOuting,
  foodIntents: smartIntent.foodIntents,
  activityIntents: smartIntent.activityIntents,
  vibes: smartIntent.vibes,
  locations: smartIntent.locations,
  strictFoodMode: smartIntent.strictFoodMode,
  strictActivityMode: smartIntent.strictActivityMode,
})}

Detected intent:
${JSON.stringify({
  wantsRestaurant: intent.wantsRestaurant,
  wantsActivity: intent.wantsActivity,
  wantsFullOuting: intent.wantsFullOuting,
  multiIntentMode: intent.multiIntentMode,
  foodIntents: intent.foodIntents,
  activityIntents: intent.activityIntents,
  requestedTags: intent.requestedTags,
  vibes: intent.vibes,
  budget: intent.budget,
  maxMiles: intent.maxMiles,
  locations: intent.locations,
})}

Matched location/business names from RoseOut database:
${JSON.stringify(slimMatchedLocations)}

Restaurants:
${JSON.stringify(slimRestaurants)}

Activities:
${JSON.stringify(slimActivities)}

STRICT RULES:
- This request already passed RoseOut server relevance checks.
- Only answer RoseOut-related outing, date, restaurant, activity, nightlife, brunch, birthday, budget, distance, or location-planning requests.
- Restaurant, dinner, steak, cuisine, and recognized location searches are RoseOut-related.
- If the user asks anything outside RoseOut, respond exactly: "${OFF_TOPIC_REPLY}"
- Keep the answer short and direct.
- Use ONLY the listed restaurants and activities.
- If the user typed a specific business/location name and it appears in "Matched location/business names", prioritize it.
- If there is a matched business/location name, mention that match first.
- If the user asks for food plus any activity, include both a restaurant and a matching activity when available.
- Never ignore the requested activity intent.
- If a location is detected, prioritize restaurants and activities from that location.
- If matching activities only exist in another borough, still include the matching activity.
- Never say “I don’t have any.”
- Never ask the user to provide a list.
- Never say “let me know.”
- Balance restaurant and activity perfectly when both are requested.
- If budget is detected, recommend options that fit the budget first.
- If distance is detected, prioritize closer options first.
- Match the vibe, food intent, activity intent, and location together.
- Do NOT recommend museums unless the user asked for museums, art, galleries, exhibits, or culture.
- Do NOT suggest unrelated cuisines or unrelated activities.
- Do NOT invent business details.
- Do NOT add times unless asked.
- Do NOT add dessert, walks, or extra stops unless asked.
`;

    const hasResults =
      topRestaurants.length > 0 ||
      topActivities.length > 0 ||
      matchedLocationResults.length > 0;

    const response = hasResults
      ? await openai.responses.create({
          model: AI_MODEL,
          input: prompt,
          max_output_tokens: 350,
        })
      : null;

    const generatedReply = response?.output_text?.trim();
    const fallbackReply = "Here are strong RoseOut matches based on your vibe.";
    const reply =
      generatedReply && generatedReply !== OFF_TOPIC_REPLY
        ? generatedReply
        : fallbackReply;

    const responsePayload = {
      success: true,
      version: getSmartMatchVersion(),
      smart_match: {
        mode: smartBalanced.mode,
        pairing_enabled: pairedResults.pairs.length > 0,
        pair_count: pairedResults.pairs.length,
        query: smartIntent.query,
        wantsFood: smartIntent.wantsFood,
        wantsActivity: smartIntent.wantsActivity,
        wantsFullOuting: smartIntent.wantsFullOuting,
        foodIntents: smartIntent.foodIntents,
        activityIntents: smartIntent.activityIntents,
        vibes: smartIntent.vibes,
        locations: smartIntent.locations,
        strictFoodMode: smartIntent.strictFoodMode,
        strictActivityMode: smartIntent.strictActivityMode,
      },
      reply,
      intent: {
        requestedTags: intent.requestedTags,
        foodIntents: intent.foodIntents,
        activityIntents: intent.activityIntents,
        vibes: intent.vibes,
        budget: intent.budget,
        maxMiles: intent.maxMiles,
        multiIntentMode: intent.multiIntentMode,
        locations: intent.locations,
      },
      matched_locations: matchedLocationResults.map((item: any) => ({
        id: String(item.id),
        name: item.restaurant_name || item.activity_name || item.name,
        location_type: item.location_type,
        address: item.address,
        city: item.city,
        state: item.state,
        zip_code: item.zip_code,
        cuisine: item.cuisine || item.cuisine_type || null,
        activity_type:
          item.activity_type || item.category || item.subcategory || null,
        website: item.website,
        phone: item.phone || null,
google_maps_url: item.google_maps_url || null,
        image_url: item.image_url || null,
        reservation_url: item.reservation_url || item.booking_url || null,
        location_name_match_score: item.location_name_match_score,
      })),
      pairs: pairedResults.pairs.map((pair: any) => ({
        restaurant_name: pair.restaurant.restaurant_name || pair.restaurant.name,
        activity_name: pair.activity.activity_name || pair.activity.name,
        distance_miles: pair.distance_miles,
        same_city: pair.same_city,
        same_neighborhood: pair.same_neighborhood,
        pair_score: clampScore(pair.pair_score),
      })),
      restaurants: topRestaurants.map((r: any) => ({
        id: String(r.id),
        restaurant_name: r.restaurant_name || r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        zip_code: r.zip_code,
        cuisine: r.cuisine || r.cuisine_type || null,
        atmosphere: r.atmosphere || null,
        price_range: r.price_range || null,
        roseout_score: clampScore(r.roseout_score),
        smart_match_score: clampScore(r.smart_match_score || r.roseout_score),
        location_name_match_score: r.location_name_match_score || 0,
        paired_activity_name: r.paired_activity_name || null,
        pair_distance_miles: r.pair_distance_miles || null,
        pair_score: r.pair_score ? clampScore(r.pair_score) : null,
        reservation_link: r.reservation_link,
        reservation_url: r.reservation_url || r.booking_url,
        website: r.website,
        image_url: r.image_url || null,
        rating: r.rating || null,
        review_count: r.review_count || null,
        review_score: r.review_score || null,
        review_keywords: toArray(r.review_keywords),
        review_snippet: r.review_snippet || null,
        primary_tag: r.primary_tag || null,
        date_style_tags: toArray(r.date_style_tags),
        distance_miles: r.distance_miles || null,
      })),
      activities: topActivities.map((a: any) => ({
        id: String(a.id),
        activity_name: a.activity_name || a.name,
        activity_type: a.activity_type || a.category || a.subcategory,
        address: a.address,
        city: a.city,
        state: a.state,
        zip_code: a.zip_code,
        price_range: a.price_range,
        atmosphere: a.atmosphere,
        group_friendly: a.group_friendly,
        roseout_score: clampScore(a.roseout_score),
        smart_match_score: clampScore(a.smart_match_score || a.roseout_score),
        location_name_match_score: a.location_name_match_score || 0,
        paired_restaurant_name: a.paired_restaurant_name || null,
        pair_distance_miles: a.pair_distance_miles || null,
        pair_score: a.pair_score ? clampScore(a.pair_score) : null,
        reservation_link: a.reservation_link,
        reservation_url: a.reservation_url || a.booking_url,
        website: a.website,
        image_url: a.image_url || null,
        rating: a.rating || null,
        review_count: a.review_count || null,
        review_score: a.review_score || null,
        review_keywords: toArray(a.review_keywords),
        review_snippet: a.review_snippet || null,
        primary_tag: a.primary_tag || null,
        date_style_tags: toArray(a.date_style_tags),
        distance_miles: a.distance_miles || null,
      })),
    };

    await supabase.from("ai_response_cache").upsert({
      cache_key: cacheKey,
      user_query: input,
      response: responsePayload,
    });

    return Response.json(responsePayload);
  } catch (error: any) {
    console.error("GENERATE ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}