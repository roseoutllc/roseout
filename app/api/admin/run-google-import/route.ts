import { NextRequest, NextResponse } from "next/server";
import { runGooglePlacesImport, type GooglePlacesImportOptions } from "@/lib/googlePlacesImport";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

function isCronAuthorized(request: NextRequest) {
  const bearerToken = getBearerToken(request);
  return Boolean(process.env.CRON_SECRET && bearerToken === process.env.CRON_SECRET);
}

function optionsFromSearchParams(request: NextRequest): GooglePlacesImportOptions {
  const { searchParams } = request.nextUrl;

  return {
    type: (searchParams.get("type") as GooglePlacesImportOptions["type"]) || "both",
    limit: Number(searchParams.get("limit") || 10),
    batch: searchParams.get("batch") || "all",
    areas: searchParams.get("areas") || searchParams.get("area") || "nyc",
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runGooglePlacesImport(optionsFromSearchParams(request));
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Google import failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = await runGooglePlacesImport({
      type: body.type || "both",
      limit: Number(body.limit || 10),
      batch: body.batch || "all",
      areas: body.areas || body.area || "nyc",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Google import failed" },
      { status: 500 }
    );
  }
}
