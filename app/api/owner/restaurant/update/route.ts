import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      user_id,
      restaurant_id,
      restaurant_name,
      address,
      city,
      state,
      zip_code,
      phone,
      website,
      instagram_url,
facebook_url,
tiktok_url,
      reservation_link,
      description,
      cuisine_type,
      price_range,
      atmosphere,
      noise_level,
      image_url,
    } = body;

    if (!user_id || !restaurant_id) {
      return Response.json(
        { error: "Missing user or restaurant." },
        { status: 400 }
      );
    }

    const { data: ownerRecord, error: ownerError } = await supabaseAdmin
      .from("restaurant_owners")
      .select("id")
      .eq("user_id", user_id)
      .eq("restaurant_id", restaurant_id)
      .maybeSingle();

    if (ownerError || !ownerRecord) {
      return Response.json(
        { error: "You are not authorized to update this restaurant." },
        { status: 403 }
      );
    }

    const { data: updatedRestaurant, error: updateError } = await supabaseAdmin
      .from("restaurants")
      .update({
        restaurant_name,
        address,
        city,
        state,
        zip_code,
        phone,
        website,
        instagram_url,
facebook_url,
tiktok_url,
        reservation_link,
        description,
        cuisine_type,
        price_range,
        atmosphere,
        noise_level,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurant_id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      restaurant: updatedRestaurant,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}