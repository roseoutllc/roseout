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
    return NextResponse.json({ results: [] });
  }

  const supabase = adminSupabase();

  const { data: users } = await supabase
    .from("users")
    .select("id,email,full_name,phone,role,subscription_status")
    .or(
      `email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`
    )
    .limit(8);

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id,restaurant_name,city,state,owner_email")
    .or(
      `restaurant_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,owner_email.ilike.%${q}%`
    )
    .limit(8);

  const { data: activities } = await supabase
    .from("activities")
    .select("id,activity_name,city,state,owner_email")
    .or(
      `activity_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,owner_email.ilike.%${q}%`
    )
    .limit(8);

  const results = [
    ...(users || []).map((u: any) => ({
      type: "user",
      id: u.id,
      title: u.full_name || "Unnamed User",
      subtitle: u.email || "No email",
      meta: u.role || "user",
      phone: u.phone,
      subscription_status: u.subscription_status,
    })),

    ...(restaurants || []).map((r: any) => ({
      type: "location",
      locationType: "restaurants",
      id: r.id,
      title: r.restaurant_name || "Untitled restaurant",
      subtitle: [r.city, r.state].filter(Boolean).join(", ") || "Restaurant",
      meta: r.owner_email || "No owner email",
    })),

    ...(activities || []).map((a: any) => ({
      type: "location",
      locationType: "activities",
      id: a.id,
      title: a.activity_name || "Untitled activity",
      subtitle: [a.city, a.state].filter(Boolean).join(", ") || "Activity",
      meta: a.owner_email || "No owner email",
    })),
  ];

  return NextResponse.json({ results });
}