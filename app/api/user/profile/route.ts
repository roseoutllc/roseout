import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function cleanString(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const safe: Record<string, unknown> = {};

  if ("full_name" in b) safe.full_name = cleanString(b.full_name);
  if ("preferred_name" in b) safe.preferred_name = cleanString(b.preferred_name);
  if ("city" in b) safe.city = cleanString(b.city, 120);
  if ("mobile_number" in b || "phone" in b) {
    const phone = cleanString(b.mobile_number ?? b.phone, 40);
    safe.mobile_number = phone || null;
    safe.phone = phone || null;
  }
  if ("birthday_month" in b) {
    const month = Number(b.birthday_month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: "Birth month must be between 1 and 12." }, { status: 400 });
    }
    safe.birthday_month = month;
  }
  if ("age_range" in b) safe.age_range = cleanString(b.age_range, 40) || null;
  if ("sms_opt_in" in b) safe.sms_opt_in = Boolean(b.sms_opt_in);
  if ("preferences" in b) safe.preferences = b.preferences && typeof b.preferences === "object" ? b.preferences : {};

  safe.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ id: user.id, email: user.email, ...safe }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, profile: data });
}
