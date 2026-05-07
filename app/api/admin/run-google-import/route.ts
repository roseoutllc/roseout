import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ImportRequestBody = {
  type?: string;
  limit?: number;
  batch?: string;
  areas?: string;
};

type JsonObject = Record<string, unknown>;

function normalizeBatch(batch: unknown) {
  return String(batch || "all").trim().toLowerCase();
}

function normalizeCategory(batch: unknown) {
  const value = normalizeBatch(batch);

  if (!value || value === "activity" || value === "activities") return "all";
  if (value === "fun") return "birthday";

  return value;
}

function getScopedImportQuery(batch: unknown, areas: unknown) {
  const value = normalizeBatch(batch);
  const area = String(areas || "").trim();

  if (value !== "fun") return null;

  return area ? `fun date night in ${area}` : "fun date night";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function getNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

async function readJsonResponse(response: Response): Promise<JsonObject> {
  const text = await response.text();

  if (!text.trim()) {
    return {
      error: response.ok
        ? "Google import returned an empty response."
        : `Google import failed with status ${response.status}.`,
    };
  }

  try {
    return getRecord(JSON.parse(text));
  } catch {
    return {
      error: response.ok
        ? "Google import returned a non-JSON response."
        : `Google import failed with status ${response.status}.`,
      details: text.slice(0, 500),
    };
  }
}

function summarizeImport(data: JsonObject) {
  const stats = getRecord(data.stats);

  return {
    imported: getNumber(stats.imported ?? data.imported),
    skipped: getNumber(stats.skipped ?? data.skipped),
    failed: getNumber(stats.failed ?? data.failed),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ImportRequestBody;

    const siteUrl =
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://roseout.vercel.app";

    const url = new URL("/api/google/specialty-import", siteUrl);

    const scopedQuery = getScopedImportQuery(body.batch, body.areas);

    if (scopedQuery) {
      url.searchParams.set("query", scopedQuery);
    } else {
      url.searchParams.set("category", normalizeCategory(body.batch));

      if (body.areas) {
        url.searchParams.set("area", body.areas);
      }
    }

    url.searchParams.set("limit", String(body.limit || 20));

    const headers: Record<string, string> = {};

    if (process.env.CRON_SECRET) {
      headers.Authorization = `Bearer ${process.env.CRON_SECRET}`;
    }

    if (process.env.IMPORT_SECRET) {
      headers["x-internal-import-secret"] = process.env.IMPORT_SECRET;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await readJsonResponse(response);
    const summary = summarizeImport(data);

    const status = response.ok && data.error ? 502 : response.status;

    return NextResponse.json(
      {
        ...data,
        ...summary,
        import_type: body.type || "both",
      },
      { status }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Google import failed") },
      { status: 500 }
    );
  }
}
