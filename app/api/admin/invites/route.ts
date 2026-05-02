import { createClaimQr } from "@/lib/claimQr";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.restaurant_name) {
      return Response.json(
        { error: "Restaurant name is required." },
        { status: 400 }
      );
    }

    const claimQr = await createClaimQr("restaurant");

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .insert({
        restaurant_name: body.restaurant_name,
        contact_name: body.contact_name,
        address: body.address || body.mailing_address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,

        status: "approved",

        ...claimQr,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      restaurant: data,
      qrCodeDataUrl: data.qr_code_data_url,
      qrLink: data.claim_url,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}