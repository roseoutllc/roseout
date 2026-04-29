"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/restaurants/apply";
        return;
      }

      if (data.user.user_metadata?.role === "superuser") {
        window.location.href = "/admin";
        return;
      }

      const res = await fetch("/api/auth/link-restaurant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
        }),
      });

      if (!res.ok) {
        window.location.href = "/restaurants/apply";
        return;
      }

      window.location.href = "/restaurants/dashboard";
    };

    run();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      Logging you in...
    </main>
  );
}