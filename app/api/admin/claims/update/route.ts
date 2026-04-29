import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, type, status } = await req.json();

    if (!id || !type || !status) {
      return Response.json(
        { error: "Missing id, type, or status." },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return Response.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    if (type === "restaurant") {
      const { data: claim, error: claimLookupError } = await supabase
        .from("restaurant_claims")
        .select("id, restaurant_id, owner_email")
        .eq("id", id)
        .maybeSingle();

      if (claimLookupError || !claim) {
        return Response.json(
          { error: "Restaurant claim not found." },
          { status: 404 }
        );
      }

      const { error: claimUpdateError } = await supabase
        .from("restaurant_claims")
        .update({ status })
        .eq("id", id);

      if (claimUpdateError) {
        return Response.json(
          { error: claimUpdateError.message },
          { status: 500 }
        );
      }

      const { error: restaurantUpdateError } = await supabase
        .from("restaurants")
        .update({
          claim_status: status,
          claimed_by_email: status === "approved" ? claim.owner_email : null,
          claimed_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", claim.restaurant_id);

      if (restaurantUpdateError) {
        return Response.json(
          { error: restaurantUpdateError.message },
          { status: 500 }
        );
      }

      return Response.json({ success: true });
    }

    if (type === "activity") {
      const { data: claim, error: claimLookupError } = await supabase
        .from("activity_claims")
        .select("id, activity_id, owner_email")
        .eq("id", id)
        .maybeSingle();

      if (claimLookupError || !claim) {
        return Response.json(
          { error: "Activity claim not found." },
          { status: 404 }
        );
      }

      const { error: claimUpdateError } = await supabase
        .from("activity_claims")
        .update({ status })
        .eq("id", id);

      if (claimUpdateError) {
        return Response.json(
          { error: claimUpdateError.message },
          { status: 500 }
        );
      }

      const { error: activityUpdateError } = await supabase
        .from("activities")
        .update({
          claim_status: status,
          claimed_by_email: status === "approved" ? claim.owner_email : null,
          claimed_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", claim.activity_id);

      if (activityUpdateError) {
        return Response.json(
          { error: activityUpdateError.message },
          { status: 500 }
        );
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid claim type." }, { status: 400 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}