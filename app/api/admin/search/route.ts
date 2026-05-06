import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applySupabaseMultiWordSearch, sanitizeSearchTerm } from "@/lib/search";

export const dynamic = "force-dynamic";

type SearchUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  subscription_status: string | null;
};

type SearchLocation = {
  id: string;
  restaurant_name?: string | null;
  activity_name?: string | null;
  city: string | null;
  state: string | null;
  owner_email: string | null;
  address: string | null;
};

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    },
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q") || "";
    const q = sanitizeSearchTerm(rawQuery);

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = adminSupabase();

    const usersQuery = supabase
      .from("users")
      .select("id,email,full_name,phone,role,subscription_status");

    const { data: users } = await applySupabaseMultiWordSearch(
      usersQuery,
      ["email", "full_name", "phone"],
      q,
    ).limit(8);

    const restaurantsQuery = supabase
      .from("restaurants")
      .select("id,restaurant_name,city,state,owner_email,address");

    const { data: restaurants } = await applySupabaseMultiWordSearch(
      restaurantsQuery,
      ["restaurant_name", "city", "state", "owner_email", "address"],
      q,
    ).limit(8);

    const activitiesQuery = supabase
      .from("activities")
      .select("id,activity_name,city,state,owner_email,address");

    const { data: activities } = await applySupabaseMultiWordSearch(
      activitiesQuery,
      ["activity_name", "city", "state", "owner_email", "address"],
      q,
    ).limit(8);

    const results = [
      ...((users || []) as SearchUser[]).map((u) => ({
        type: "user",
        id: u.id,
        title: u.full_name || "Unnamed User",
        subtitle: u.email || "No email",
        meta: u.role || "user",
        phone: u.phone || null,
        subscription_status: u.subscription_status || null,
      })),

      ...((restaurants || []) as SearchLocation[]).map((r) => ({
        type: "location",
        locationType: "restaurants",
        id: r.id,
        title: r.restaurant_name || "Untitled restaurant",
        subtitle:
          [r.city, r.state].filter(Boolean).join(", ") ||
          r.address ||
          "Restaurant",
        meta: r.owner_email || "No owner email",
      })),

      ...((activities || []) as SearchLocation[]).map((a) => ({
        type: "location",
        locationType: "activities",
        id: a.id,
        title: a.activity_name || "Untitled activity",
        subtitle:
          [a.city, a.state].filter(Boolean).join(", ") ||
          a.address ||
          "Activity",
        meta: a.owner_email || "No owner email",
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Admin global search error:", error);

    return NextResponse.json(
      {
        error: "Failed to search users and locations",
        results: [],
      },
      { status: 500 },
    );
  }
}
