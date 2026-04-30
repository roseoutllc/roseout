import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import RestaurantEditClient from "./RestaurantEditClient";

export default async function AdminRestaurantEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminRole(["superuser", "admin", "editor"]);

  const { id } = await params;

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !restaurant) {
    return (
      <div className="rounded-[2rem] bg-white p-8 text-black">
        Restaurant not found.
      </div>
    );
  }

  return <RestaurantEditClient restaurant={restaurant} />;
}