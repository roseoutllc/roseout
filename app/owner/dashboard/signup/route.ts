import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return Response.json(
        { error: "Missing token, email, or password." },
        { status: 400 }
      );
    }

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id, claimed_by_email, claim_status")
      .eq("owner_signup_token", token)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return Response.json({ error: "Invalid signup link." }, { status: 404 });
    }

    if (restaurant.claim_status !== "approved") {
      return Response.json(
        { error: "This claim has not been approved yet." },
        { status: 403 }
      );
    }

    if (
      restaurant.claimed_by_email &&
      restaurant.claimed_by_email.toLowerCase() !== email.toLowerCase()
    ) {
      return Response.json(
        { error: "Please use the approved owner email." },
        { status: 403 }
      );
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "restaurant_owner",
        },
      });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 500 });
    }

    const userId = authUser.user.id;

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      role: "restaurant_owner",
    });

    const { error: ownerError } = await supabaseAdmin
      .from("restaurant_owners")
      .upsert(
        {
          restaurant_id: restaurant.id,
          user_id: userId,
          owner_email: email,
        },
        {
          onConflict: "restaurant_id,user_id",
        }
      );

    if (ownerError) {
      return Response.json({ error: ownerError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("restaurants")
      .update({
        owner_signup_token: null,
        owner_signup_url: null,
      })
      .eq("id", restaurant.id);

    return Response.json({
      success: true,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}