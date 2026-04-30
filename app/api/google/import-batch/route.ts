import { supabase } from "@/lib/supabase";

const GOOGLE_IMPORT_QUERIES = [
  { query: "restaurants in Queens NY", type: "restaurant" },
  { query: "date night restaurants in Queens NY", type: "restaurant" },
  { query: "things to do in Queens NY", type: "activity" },
  { query: "fun activities in Queens NY", type: "activity" },

  { query: "restaurants in Brooklyn NY", type: "restaurant" },
  { query: "date night restaurants in Brooklyn NY", type: "restaurant" },
  { query: "things to do in Brooklyn NY", type: "activity" },
  { query: "fun activities in Brooklyn NY", type: "activity" },

  { query: "restaurants in Manhattan NY", type: "restaurant" },
  { query: "date night restaurants in Manhattan NY", type: "restaurant" },
  { query: "things to do in Manhattan NY", type: "activity" },
  { query: "fun activities in Manhattan NY", type: "activity" },

  { query: "restaurants in Bronx NY", type: "restaurant" },
  { query: "things to do in Bronx NY", type: "activity" },

  { query: "restaurants in Staten Island NY", type: "restaurant" },
  { query: "things to do in Staten Island NY", type: "activity" },

  { query: "restaurants in Nassau County NY", type: "restaurant" },
  { query: "date night restaurants in Nassau County NY", type: "restaurant" },
  { query: "things to do in Nassau County NY", type: "activity" },
  { query: "fun activities in Nassau County NY", type: "activity" },

  { query: "restaurants in Suffolk County NY", type: "restaurant" },
  { query: "date night restaurants in Suffolk County NY", type: "restaurant" },
  { query: "things to do in Suffolk County NY", type: "activity" },
  { query: "fun activities in Suffolk County NY", type: "activity" },
];

const BATCH_SIZE = 5;

async function alreadyRanToday() {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("import_logs")
    .select("*")
    .eq("job_name", "google_import")
    .eq("run_date", today)
    .maybeSingle();

  return !!data;
}

async function logRun() {
  const today = new Date().toISOString().split("T")[0];

  await supabase.from("import_logs").insert({
    job_name: "google_import",
    run_date: today,
  });
}

async function runBatchImport(body: any = {}) {
  const force = body.force || false;

  if (!force) {
    const alreadyRan = await alreadyRanToday();
    if (alreadyRan) {
      return Response.json({
        success: false,
        message: "Import already ran today",
      });
    }
  }

  const today = new Date().getDate();

  // rotate queries daily
  const start = (today * BATCH_SIZE) % GOOGLE_IMPORT_QUERIES.length;
  const selectedQueries = GOOGLE_IMPORT_QUERIES.slice(
    start,
    start + BATCH_SIZE
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

  const results = [];

  for (const item of selectedQueries) {
    try {
      const res = await fetch(`${baseUrl}/api/google/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-import-secret": process.env.IMPORT_SECRET || "",
        },
        body: JSON.stringify(item),
      });

      const data = await res.json();

      results.push({
        query: item.query,
        type: item.type,
        status: res.status,
        result: data,
      });
    } catch (err: any) {
      results.push({
        query: item.query,
        type: item.type,
        status: 500,
        error: err.message,
      });
    }
  }

  await logRun();

  return Response.json({
    success: true,
    start,
    batchSize: BATCH_SIZE,
    importedGroups: results.length,
    results,
  });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runBatchImport();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return runBatchImport(body);
}