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
export async function GET() {
  return Response.json({
    message: "Use POST to trigger import",
  });
}
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const limit = Math.min(body.limit || 5, 10);
    const start = body.start || 0;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const selectedQueries = GOOGLE_IMPORT_QUERIES.slice(start, start + limit);

    const results = [];

    for (const item of selectedQueries) {
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
    }

    return Response.json({
      success: true,
      start,
      limit,
      nextStart: start + limit,
      importedGroups: results.length,
      results,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Batch import failed" },
      { status: 500 }
    );
  }
}