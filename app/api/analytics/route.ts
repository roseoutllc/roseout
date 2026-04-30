import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getTable(itemType: string) {
  if (itemType === "restaurant") return "restaurants";
  if (itemType === "activity") return "activities";
  return null;
}

function getCounter(eventType: string) {
  if (eventType === "view") return "view_count";
  if (eventType === "click") return "click_count";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const itemId = body.item_id;
    const itemType = body.item_type;
    const eventType = body.event_type;
    const pagePath = body.page_path || null;

    const referrer = req.headers.get("referer");
    const userAgent = req.headers.get("user-agent");

    // ✅ Validation
    if (!itemId || !itemType || !eventType) {
      return NextResponse.json(
        { error: "Missing item_id, item_type, or event_type." },
        { status: 400 }
      );
    }

    const table = getTable(itemType);
    const counter = getCounter(eventType);

    if (!table || !counter) {
      return NextResponse.json(
        { error: "Invalid analytics type." },
        { status: 400 }
      );
    }

    // ✅ Log event (for history / analytics dashboard)
    await supabaseAdmin.from("analytics_events").insert({
      item_id: itemId,
      item_type: itemType,
      event_type: eventType,
      page_path: pagePath,
      referrer,
      user_agent: userAgent,
    });

    // ✅ Get current count
    const { data: item, error: fetchError } = await supabaseAdmin
      .from(table)
      .select(counter)
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    // 🔥 FIXED TYPE ERROR HERE
    const typedItem = item as Record<string, any>;
    const currentCount = Number(typedItem[counter] || 0);

    // ✅ Update counter
    const { error: updateError } = await supabaseAdmin
      .from(table)
      .update({
        [counter]: currentCount + 1,
      })
      .eq("id", itemId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item_id: itemId,
      item_type: itemType,
      event_type: eventType,
      count: currentCount + 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Analytics failed." },
      { status: 500 }
    );
  }
}