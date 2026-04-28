import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Validate
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

    // 🔐 Create user account automatically
    const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";

    const { data: createdUser, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true,
      });

    if (userError && !userError.message.includes("already registered")) {
      return Response.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    const ownerUserId = createdUser?.user?.id || null;

    // 🔗 Create QR code
    const restaurantSlug = body.restaurant_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const qrLink = `${siteUrl}/restaurants/apply?restaurant=${restaurantSlug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrLink);

    // 🧱 Insert into Supabase (FIXED)
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

      qr_link: qrLink,
      qr_code_data_url: qrCodeDataUrl,

      owner_user_id: ownerUserId,
      owner_email: body.email,

      status: "pending",
    });

    if (error) {
      return Response.json(
        { error: error.message || "Database error" },
        { status: 500 }
      );
    }

    // 📊 Track invite submission
    if (body.invite_code) {
      await supabase
        .from("restaurant_invites")
        .update({
          submitted_at: new Date().toISOString(),
          status: "submitted",
        })
        .eq("invite_code", body.invite_code);
    }

    return Response.json({
      success: true,
      message:
        "Restaurant submitted successfully. A RoseOut account has been created.",
      qrLink,
      qrCodeDataUrl,
    });
  } catch (error: any) {
    console.error("API ERROR:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}