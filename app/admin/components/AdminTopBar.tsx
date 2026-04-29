"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminTopBar() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    };

    loadUser();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="sticky top-0 z-50 border-b border-neutral-800 bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-white">
        <div className="flex items-center gap-5">
          <a href="/admin" className="font-semibold hover:underline">
            Dashboard
          </a>
          <a href="/admin/restaurants" className="hover:underline">
            Restaurants
          </a>
          <a href="/admin/invites" className="hover:underline">
            Invites
          </a>
          <a href="/admin/labels" className="hover:underline">
            Labels
          </a>
        </div>

        {user ? (
          <button
            onClick={signOut}
            className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
          >
            Sign Out
          </button>
        ) : (
          <a
            href="/login"
            className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
          >
            Sign In
          </a>
        )}
      </div>
    </div>
  );
}