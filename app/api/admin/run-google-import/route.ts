import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportRequestBody = {
  type?: string;
  limit?: number;
  batch?: string;
  areas?: string;
};

type JsonObject = Record<string, unknown>;

function normalizeCategory(batch: unknown) {
  const value = String(batch || "all").trim().toLowerCase();

  if (!value || value === "fun") return "birthday";
  if (value === "activity" || value === "activities") return "all";

  return value;
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
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.nextUrl.origin ||
      "https://roseout.vercel.app";

    const url = new URL("/api/google/specialty-import", siteUrl);

    url.searchParams.set("category", normalizeCategory(body.batch));
    url.searchParams.set("limit", String(body.limit || 20));

    if (body.areas) {
      url.searchParams.set("area", body.areas);
    }

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

    return NextResponse.json(
      {
        ...data,
        ...summary,
        import_type: body.type || "both",
      },
      { status: response.status }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Google import failed") },
      { status: 500 }
    );
  }
}
