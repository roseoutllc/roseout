import "server-only";

import { createClient } from "@/lib/supabase-server";

/**
 * Return the authenticated Supabase user id for the current request.
 *
 * Impersonation must be resolved by an explicitly authenticated admin flow; a
 * client-writable cookie is never an authorization source.
 */
export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id || null;
}
