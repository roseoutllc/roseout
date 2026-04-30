import { supabase } from "@/lib/supabase";
import RestaurantClient from "./RestaurantClient";

export default async function RestaurantPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!restaurant) {
    return <div className="text-white p-10">Restaurant not found</div>;
  }

  return <RestaurantClient restaurant={restaurant} />;
}