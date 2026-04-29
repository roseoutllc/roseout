"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      // STEP 1: exchange code for session
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // STEP 2: get user
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/restaurants/apply";
        return;
      }

      // STEP 3: admin check
      if (userData.user.user_metadata?.role === "superuser") {
        window.location.href = "/admin";
        return;
      }

      // STEP 4: check if restaurant exists
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_user_id", userData.user.id)
        .maybeSingle();

      if (restaurant) {
        window.location.href = "/restaurants/dashboard";
        return;
      }

      // STEP 5: fallback
      window.location.href = "/restaurants/apply";
    };

    run();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      Logging you in...
    </main>
  );
}