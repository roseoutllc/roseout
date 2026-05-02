import { NextResponse } from "next/server";

const LOCATIONS = [
  "Queens NY",
  "Brooklyn NY",
  "Manhattan NY",
  "Bronx NY",
  "Staten Island NY",
  "Nassau County NY",
  "Suffolk County NY",
  "Westchester NY",
  "Jersey City NJ",
  "Hoboken NJ",
];

const CATEGORIES: { query: string; type: "restaurant" | "activity" }[] = [
  { query: "restaurants", type: "restaurant" },
  { query: "date night restaurants", type: "restaurant" },
  { query: "romantic restaurants", type: "restaurant" },
  { query: "brunch restaurants", type: "restaurant" },
  { query: "breakfast spots", type: "restaurant" },
  { query: "coffee shops", type: "restaurant" },
  { query: "upscale restaurants", type: "restaurant" },
  { query: "rooftop restaurants", type: "restaurant" },
  { query: "lounges", type: "restaurant" },

  { query: "fun activities", type: "activity" },
  { query: "things to do", type: "activity" },
  { query: "date activities", type: "activity" },
  { query: "museums", type: "activity" },
  { query: "live music venues", type: "activity" },
  { query: "comedy clubs", type: "activity" },
];

const BATCH_SIZE = 3;

function getDailyBatch() {
  const today = new Date();

  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      1000 /
      60 /
      60 /
      24
  );

  const location = LOCATIONS[dayOfYear % LOCATIONS.length];
  const start = (dayOfYear * BATCH_SIZE) % CATEGORIES.length;

  const selectedCategories = [
    ...CATEGORIES.slice(start, start + BATCH_SIZE),
    ...CATEGORIES.slice(
      0,
      Math.max(0, start + BATCH_SIZE - CATEGORIES.length)
    ),
  ].slice(0, BATCH_SIZE);

  return selectedCategories.map((item) => ({
    query: `${item.query} in ${location}`,
    type: item.type,
    location,
    category: item.query,
  }));
}

async function runDailyImport(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

  const importSecret = process.env.IMPORT_SECRET || "";

  const queries = getDailyBatch();
  const results = [];

  for (const item of queries) {
    try {
      const res = await fetch(`${baseUrl}/api/google/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-import-secret": importSecret,
        },
        body: JSON.stringify({
          query: item.query,
          type: item.type,
        }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      results.push({
        query: item.query,
        type: item.type,
        location: item.location,
        category: item.category,
        status: res.status,
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        result: data,
      });
    } catch (error: any) {
      results.push({
        query: item.query,
        type: item.type,
        location: item.location,
        category: item.category,
        status: 500,
        imported: 0,
        skipped: 0,
        error: error.message || "Import failed",
      });
    }
  }

  const totalImported = results.reduce(
    (sum, item) => sum + Number(item.imported || 0),
    0
  );

  const totalSkipped = results.reduce(
    (sum, item) => sum + Number(item.skipped || 0),
    0
  );

  return NextResponse.json({
    success: true,
    message:
      "Daily Google expansion import completed for restaurants and activities.",
    totalImported,
    totalSkipped,
    queriesRun: results.length,
    results,
  });
}

export async function GET(request: Request) {
  return runDailyImport(request);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runDailyImport(
    new Request(request.url, {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })
  );
}