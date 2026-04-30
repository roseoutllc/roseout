import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import RestaurantsAdminClient from "./RestaurantsAdminClient";

export default async function AdminRestaurantsPage() {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <RestaurantsAdminClient
      initialRestaurants={restaurants || []}
      loadError={error?.message || ""}
    />
  );
}