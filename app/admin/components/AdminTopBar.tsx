"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminTopBar() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    loadUser();
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
      {/* Left Side */}
      <div className="text-xl font-bold">
        RoseOut Admin
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-neutral-400">{email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          Logout
        </button>
      </div>
    </header>
  );
}