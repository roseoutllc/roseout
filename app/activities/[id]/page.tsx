import { supabase } from "@/lib/supabase";
import ActivityClient from "./ActivityClient";

export default async function ActivityPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!activity) {
    return <div className="text-white p-10">Activity not found</div>;
  }

  return <ActivityClient activity={activity} />;
}