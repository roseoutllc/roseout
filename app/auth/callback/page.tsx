"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const supabase = createClient();

  useEffect(() => {
    const finishLogin = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/restaurants/apply";
        return;
      }

      if (userData.user.user_metadata?.role === "superuser") {
        window.location.href = "/admin";
        return;
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_user_id", userData.user.id)
        .maybeSingle();

      if (restaurant) {
        window.location.href = "/restaurants/dashboard";
        return;
      }

      window.location.href = "/restaurants/apply";
    };

    finishLogin();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      Logging you in...
    </main>
  );
}