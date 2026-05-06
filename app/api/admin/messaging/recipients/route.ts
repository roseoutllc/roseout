import { createClient } from "@supabase/supabase-js";
import { requireAdminApiRole } from "@/lib/admin-api-auth";

export const dynamic = "force-dynamic";

type LocationType = "restaurants" | "activities";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  subscription_status: string | null;
  sms_opt_in: boolean | null;
};

type LocationRow = {
  id: string;
  restaurant_name?: string | null;
  activity_name?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  phone: string | null;
  claimed: boolean | null;
};

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function cleanSearch(value: string) {
  return value.trim().replace(/[%_,]/g, "");
}

function locationSubtitle(item: LocationRow) {
  return (
    [item.city, item.state].filter(Boolean).join(", ") ||
    item.address ||
    "Location"
  );
}

function mapLocation(item: LocationRow, locationType: LocationType) {
  const name =
    locationType === "restaurants"
      ? item.restaurant_name || "Untitled restaurant"
      : item.activity_name || "Untitled activity";

  return {
    id: item.id,
    type: "location",
    locationType,
    title: name,
    subtitle: locationSubtitle(item),
    email: item.owner_email || null,
    phone: item.owner_phone || item.phone || null,
    meta: item.claimed ? "Claimed location" : "Unclaimed location",
  };
}

export async function GET(req: Request) {
  const { error } = await requireAdminApiRole([
    "superuser",
    "admin",
    "editor",
  ]);

  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = cleanSearch(searchParams.get("q") || "");

  if (q.length < 2) {
    return Response.json({ recipients: [] });
  }

  const supabase = adminSupabase();

  const [usersResult, restaurantsResult, activitiesResult] = await Promise.all([
    supabase
      .from("users")
      .select("id,email,full_name,phone,role,subscription_status,sms_opt_in")
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(10),
    supabase
      .from("restaurants")
      .select(
        "id,restaurant_name,address,city,state,owner_email,owner_phone,phone,claimed"
      )
      .or(
        `restaurant_name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,owner_email.ilike.%${q}%,owner_phone.ilike.%${q}%,phone.ilike.%${q}%`
      )
      .limit(10),
    supabase
      .from("activities")
      .select(
        "id,activity_name,address,city,state,owner_email,owner_phone,phone,claimed"
      )
      .or(
        `activity_name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,owner_email.ilike.%${q}%,owner_phone.ilike.%${q}%,phone.ilike.%${q}%`
      )
      .limit(10),
  ]);

  const firstError =
    usersResult.error || restaurantsResult.error || activitiesResult.error;

  if (firstError) {
    return Response.json(
      { error: firstError.message, recipients: [] },
      { status: 500 }
    );
  }

  const recipients = [
    ...((usersResult.data || []) as UserRow[]).map((user) => ({
      id: user.id,
      type: "user",
      title: user.full_name || user.email || "Unnamed user",
      subtitle: user.email || "No email on file",
      email: user.email || null,
      phone: user.phone || null,
      smsOptIn: Boolean(user.sms_opt_in),
      meta: user.role || user.subscription_status || "user",
    })),
    ...((restaurantsResult.data || []) as LocationRow[]).map((item) =>
      mapLocation(item, "restaurants")
    ),
    ...((activitiesResult.data || []) as LocationRow[]).map((item) =>
      mapLocation(item, "activities")
    ),
  ];

  return Response.json({ recipients });
}
