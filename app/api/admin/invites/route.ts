import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function createInviteCode(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}

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

    const inviteCode = createInviteCode(body.restaurant_name);
    const qrLink = `${siteUrl}/restaurants/apply?invite=${inviteCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrLink);

    const { data, error } = await supabaseAdmin
      .from("restaurant_invites")
      .insert({
        restaurant_name: body.restaurant_name,
        contact_name: body.contact_name,
        mailing_address: body.mailing_address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        invite_code: inviteCode,
        qr_link: qrLink,
        status: "created",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      invite: data,
      qrCodeDataUrl,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}