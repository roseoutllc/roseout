import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.restaurant_name || !body.email) {
      return Response.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://https://roseout.vercel.app/";

    const qrLink = `${siteUrl}/restaurants/${encodeURIComponent(
      body.restaurant_name
    )}`;

    const qrCodeDataUrl = await QRCode.toDataURL(qrLink);

    const { error } = await supabase.from("restaurants").insert({
      restaurant_name: body.restaurant_name,
      address: body.address,
      city: body.city,
      state: body.state,
      zip_code: body.zip_code,
      email: body.email,
      description: body.description,
      qr_link: qrLink,
      qr_code_data_url: qrCodeDataUrl,
      status: "pending",
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await supabase.auth.signInWithOtp({
  email: body.email,
  options: {
    emailRedirectTo: `${siteUrl}/restaurants/dashboard`,
  },
});

    await supabase.auth.signInWithOtp({
      email: body.email,
      options: {
        emailRedirectTo: `${siteUrl}/restaurants/dashboard`,
      },
    });

    return Response.json({
      success: true,
      message: "Restaurant submitted. Check your email for login link.",
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}