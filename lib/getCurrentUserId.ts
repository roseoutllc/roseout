import "server-only";

import { createClient } from "@/lib/supabase-server";

/**
 * Return the authenticated Supabase user id for the current request.
 *
 * Never trust an impersonation cookie directly. Any future impersonation feature
 * must verify the acting administrator server-side before resolving an alternate
 * identity.
 */
export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
