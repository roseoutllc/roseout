import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.invite_code) {
  await supabase
    .from("restaurant_invites")
    .update({
      submitted_at: new Date().toISOString(),
      status: "submitted",
    })
    .eq("invite_code", body.invite_code);
}

    // 🔐 Validate required fields
    if (!body.restaurant_name) {
      return Response.json(
        { error: "Restaurant name is required." },
        { status: 400 }
      );
    }

    // 🔐 Verify Turnstile CAPTCHA
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY || "",
          response: body.captchaToken || "",
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return Response.json(
        { error: "CAPTCHA verification failed." },
        { status: 400 }
      );
    }

    // 🧱 Insert into Supabase
    const { error } = await supabase.from("restaurants").insert({
      restaurant_name: body.restaurant_name,
      address: body.address,
      city: body.city,
      state: body.state,
      zip_code: body.zip_code,
      neighborhood: body.neighborhood,
      cuisine_type: body.cuisine_type,
      price_range: body.price_range,
      reservation_link: body.reservation_link,
      website: body.website,
      phone: body.phone,
      email: body.email,
      instagram_url: body.instagram_url,
      tiktok_url: body.tiktok_url,
      x_url: body.x_url,
      hours_of_operation: body.hours_of_operation,
      kitchen_closing_time: body.kitchen_closing_time,
      description: body.description,

      status: "pending", // 🔥 important for approval flow
    });

    if (error) {
      console.error("Supabase Insert Error:", error);

      return Response.json(
        { error: error.message || "Database error" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Restaurant submitted successfully for review.",
    });
  } catch (error: any) {
    console.error("API ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}