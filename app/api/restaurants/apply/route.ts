import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.restaurant_name) {
      return Response.json(
        { error: "Restaurant name is required." },
        { status: 400 }
      );
    }

    if (!body.email) {
      return Response.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

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

    const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true,
      });

    let ownerUserId = createdUser?.user?.id || null;

    if (createUserError) {
      const { data: usersData, error: listUsersError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (listUsersError) {
        return Response.json(
          { error: listUsersError.message },
          { status: 500 }
        );
      }

      const existingUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === body.email.toLowerCase()
      );

      ownerUserId = existingUser?.id || null;
    }

    const { data: magicLinkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: body.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/restaurants/dashboard`,
        },
      });

    if (linkError) {
      return Response.json({ error: linkError.message }, { status: 500 });
    }

    const magicLink = magicLinkData.properties.action_link;

    const restaurantSlug = body.restaurant_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const qrLink = `${siteUrl}/restaurants/apply?restaurant=${restaurantSlug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrLink);

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

    await sendEmail({
      to: body.email,
      subject: "Access your RoseOut restaurant dashboard",
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;line-height:1.6;color:#111;">
          <h2 style="margin:0 0 12px;">Welcome to RoseOut</h2>

          <p>Your restaurant has been submitted successfully and is now pending review.</p>

          <p>Click below to access your restaurant dashboard:</p>

          <p>
            <a href="${magicLink}" 
              style="display:inline-block;padding:12px 20px;background:#000;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
              Open Dashboard
            </a>
          </p>

          <p style="margin-top:20px;font-size:12px;color:#666;">
            This secure magic link will log you in instantly.
          </p>
        </div>
      `,
    });

    await sendEmail({
      to: process.env.ADMIN_EMAIL || "your-email@example.com",
      subject: "New RoseOut Restaurant Submission",
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;line-height:1.6;color:#111;">
          <h2>New Restaurant Submitted</h2>
          <p><strong>Name:</strong> ${body.restaurant_name}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Phone:</strong> ${body.phone || "Not provided"}</p>
          <p><strong>Location:</strong> ${body.city || ""}, ${body.state || ""} ${body.zip_code || ""}</p>
          <p><strong>Status:</strong> Pending Review</p>
        </div>
      `,
    });

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
        "Restaurant submitted. Check your email for dashboard access.",
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