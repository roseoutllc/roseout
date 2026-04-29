"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminTopBar() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    };
    load();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const signIn = () => {
    window.location.href = "/login";
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-white">
        
        {/* LEFT NAV */}
        <div className="flex items-center gap-6">
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

        {/* RIGHT ACTION */}
        <div>
          {user ? (
            <button
              onClick={signOut}
              className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={signIn}
              className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}