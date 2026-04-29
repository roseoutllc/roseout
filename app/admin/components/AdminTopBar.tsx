"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminTopBar() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

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
        <a href="/admin" className="text-xl font-bold">
          RoseOut Admin
        </a>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
          >
            Menu
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white p-3 text-black shadow-xl">
              <a
                href="/admin"
                className="block rounded-xl px-4 py-3 hover:bg-neutral-100"
              >
                Dashboard
              </a>

              <a
                href="/admin/restaurants"
                className="block rounded-xl px-4 py-3 hover:bg-neutral-100"
              >
                Restaurants
              </a>

              <a
                href="/admin/invites"
                className="block rounded-xl px-4 py-3 hover:bg-neutral-100"
              >
                Invites
              </a>

              <a
                href="/admin/labels"
                className="block rounded-xl px-4 py-3 hover:bg-neutral-100"
              >
                Labels
              </a>

              <div className="my-2 border-t" />

              {user ? (
                <button
                  onClick={signOut}
                  className="w-full rounded-xl px-4 py-3 text-left hover:bg-neutral-100"
                >
                  Sign Out
                </button>
              ) : (
                <a
                  href="/login"
                  className="block rounded-xl px-4 py-3 hover:bg-neutral-100"
                >
                  Sign In
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}