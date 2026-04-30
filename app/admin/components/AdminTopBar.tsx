"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminTopBar() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Admin";

  const email = user?.email || "";

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-black px-6 py-4 text-white">
      {/* Left */}
      <div className="text-xl font-bold">RoseOut Admin</div>

      {/* Right */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 hover:bg-white/20"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 font-bold text-black">
            {name.charAt(0)}
          </div>

          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-neutral-400">{email}</p>
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white p-2 text-black shadow-xl">
            <div className="px-3 py-2">
              <p className="text-sm font-bold">{name}</p>
              <p className="text-xs text-neutral-500">{email}</p>
            </div>

            <div className="my-2 border-t" />

            <button
              onClick={() => {
                setOpen(false);
                window.location.href = "/admin";
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
            >
              Dashboard
            </button>

            <button
              onClick={() => {
                setOpen(false);
                window.location.href = "/admin/restaurants";
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
            >
              Restaurants
            </button>

            <button
              onClick={() => {
                setOpen(false);
                window.location.href = "/admin/activities";
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
            >
              Activities
            </button>

            {/* ✅ NEW PAGE LINK */}
            <button
              onClick={() => {
                setOpen(false);
                window.location.href = "/admin/import-history";
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
            >
              Import History
            </button>

            <div className="my-2 border-t" />

            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}