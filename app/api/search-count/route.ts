import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLiveOutingsPlanned } from "@/lib/outingsCount";

export const dynamic = "force-dynamic";

export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("search_logs")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: getLiveOutingsPlanned(count) });
}
