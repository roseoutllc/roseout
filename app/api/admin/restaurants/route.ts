import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select(`
        id,
        restaurant_name,
        address,
        city,
        state,
        zip_code,
        status,
        claim_status,
        claimed_by_email,
        is_featured,
        qr_code_data_url,
        claim_url,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      restaurants: restaurants || [],
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}