import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const supabase = adminSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("id,email,full_name,phone,role,subscription_status")
    .or(`email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(8);

  if (error) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}