import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/restaurants/apply`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${siteUrl}/restaurants/apply`);
  }

  const user = data.user;

  if (user.user_metadata?.role === "superuser") {
    return NextResponse.redirect(`${siteUrl}/admin`);
  }

  const email = user.email?.toLowerCase();

  if (!email) {
    return NextResponse.redirect(`${siteUrl}/restaurants/apply`);
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.redirect(`${siteUrl}/restaurants/apply`);
  }

  await supabaseAdmin
    .from("restaurants")
    .update({
      owner_user_id: user.id,
      owner_email: email,
    })
    .eq("id", restaurant.id);

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      role: "restaurants",
    },
  });

  return NextResponse.redirect(`${siteUrl}/restaurants/dashboard`);
}