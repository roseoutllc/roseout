import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ restaurants: data || [] });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return Response.json({ error: "Missing restaurant ID" }, { status: 400 });
  }

  const updates: any = {};

  if (body.status !== undefined) updates.status = body.status;
  if (body.is_featured !== undefined) updates.is_featured = body.is_featured;

  const { error } = await supabase
    .from("restaurants")
    .update(updates)
    .eq("id", body.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}