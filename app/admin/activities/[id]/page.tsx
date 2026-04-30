import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import ActivityEditClient from "./ActivityEditClient";

export default async function AdminActivityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminRole(["superuser", "admin", "editor"]);

  const { id } = await params;

  const { data: activity, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  const { data: notes } = await supabase
    .from("activity_contact_notes")
    .select("id, note, created_by, created_at")
    .eq("activity_id", id)
    .order("created_at", { ascending: false });

  if (error || !activity) {
    return (
      <div className="rounded-[2rem] bg-white p-8 text-black">
        Activity not found.
      </div>
    );
  }

  return <ActivityEditClient activity={activity} initialNotes={notes || []} />;
}