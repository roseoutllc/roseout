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

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/restaurants/apply";
        return;
      }

      if (userData.user.user_metadata?.role === "superuser") {
        window.location.href = "/admin";
        return;
      }

      const userId = userData.user.id;
      const userEmail = userData.user.email;

      if (!userEmail) {
        window.location.href = "/restaurants/apply";
        return;
      }

      const { data: existingRestaurant } = await supabase
        .from("restaurants")
        .select("id, owner_user_id")
        .eq("owner_user_id", userId)
        .maybeSingle();

      if (existingRestaurant) {
        window.location.href = "/restaurants/dashboard";
        return;
      }

      const { data: restaurantByEmail } = await supabase
        .from("restaurants")
        .select("id, email, owner_user_id")
        .ilike("email", userEmail)
        .maybeSingle();

      if (restaurantByEmail) {
        await supabase
          .from("restaurants")
          .update({
            owner_user_id: userId,
            owner_email: userEmail,
          })
          .eq("id", restaurantByEmail.id);

        await supabase.auth.updateUser({
          data: {
            role: "restaurants",
          },
        });

        window.location.href = "/restaurants/dashboard";
        return;
      }

      await supabase.auth.updateUser({
        data: {
          role: "restaurants",
        },
      });

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