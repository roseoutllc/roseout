import { createClient } from "@/lib/supabase-browser";

export async function isAdmin() {
  const supabase = createClient();

  const { data } = await supabase.auth.getUser();

  return data.user?.user_metadata?.role === "superuser";
}