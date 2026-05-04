import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_ROSEOUT_PRO_PRICE_ID;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_ROSEOUT_PRO_PRICE_ID" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const plan = String(formData.get("plan") || "pro");

    if (plan !== "pro") {
      return NextResponse.redirect(`${siteUrl}/locations/apply?plan=free`, {
        status: 303,
      });
    }

    const body = new URLSearchParams({
      mode: "subscription",
      success_url: `${siteUrl}/locations/dashboard?upgraded=1`,
      cancel_url: `${siteUrl}/pricing?canceled=1`,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[plan]": "roseout_pro",
    });

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    const session = await stripeResponse.json();

    if (!stripeResponse.ok || !session.url) {
      return NextResponse.json(
        {
          error: session.error?.message || "Unable to create Stripe checkout.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Checkout failed." },
      { status: 500 }
    );
  }
}