import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET all restaurants
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ restaurants: data || [] });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// UPDATE restaurant (approve / reject / feature)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return Response.json(
        { error: "Missing restaurant ID" },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    if (body.is_featured !== undefined) {
      updates.is_featured = body.is_featured;
    }

    const { error } = await supabaseAdmin
      .from("restaurants")
      .update(updates)
      .eq("id", body.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}