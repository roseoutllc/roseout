import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

    const url = new URL("/api/google/import", siteUrl);

    url.searchParams.set("type", body.type || "both");
    url.searchParams.set("limit", String(body.limit || 10));
    url.searchParams.set("batch", body.batch || "fun");

    if (body.areas) {
      url.searchParams.set("areas", body.areas);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Google import failed" },
      { status: 500 }
    );
  }
}