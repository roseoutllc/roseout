import QRCode from "qrcode";
import crypto from "crypto";
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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

    const claimToken = crypto.randomUUID();
    const claimUrl = `${siteUrl}/claim/${claimToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(claimUrl);

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
        claim_token: claimToken,
        claim_url: claimUrl,
        claim_status: "unclaimed",
        qr_code_data_url: qrCodeDataUrl,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      restaurant: data,
      qrCodeDataUrl,
      qrLink: claimUrl,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}