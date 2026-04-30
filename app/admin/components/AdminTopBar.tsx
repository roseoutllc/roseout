"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminTopBar() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);

      if (data.user?.email) {
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("role")
          .eq("email", data.user.email.toLowerCase())
          .maybeSingle();

        setRole(adminUser?.role || null);
      }
    };

    loadUser();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    window.location.href = path;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Admin";

  const email = user?.email || "";

  const canViewDashboard = ["superuser", "admin", "editor"].includes(role || "");
  const canViewRestaurants = ["superuser", "admin", "editor", "viewer"].includes(
    role || ""
  );
  const canViewActivities = ["superuser", "admin", "editor", "viewer"].includes(
    role || ""
  );
  const canViewClaims = ["superuser", "admin", "reviewer"].includes(role || "");
  const canViewImports = ["superuser", "admin", "viewer"].includes(role || "");
  const canViewUsers = role === "superuser";

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-black px-6 py-4 text-white">
      <button
        type="button"
        onClick={() => goTo("/admin/dashboard")}
        className="text-xl font-bold"
      >
        RoseOut Admin
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
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
          <div className="absolute right-0 z-50 mt-3 w-64 rounded-2xl bg-white p-2 text-black shadow-xl">
            <div className="px-3 py-2">
              <p className="text-sm font-bold">{name}</p>
              <p className="text-xs text-neutral-500">{email}</p>

              {role && (
                <p className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                  {role}
                </p>
              )}
            </div>

            <div className="my-2 border-t" />

            {canViewDashboard && (
              <button
                type="button"
                onClick={() => goTo("/admin/dashboard")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                Dashboard
              </button>
            )}

            {canViewRestaurants && (
              <button
                type="button"
                onClick={() => goTo("/admin/restaurants")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                Restaurants
              </button>
            )}

            {canViewActivities && (
              <button
                type="button"
                onClick={() => goTo("/admin/activities")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                Activities
              </button>
            )}

            {canViewClaims && (
              <button
                type="button"
                onClick={() => goTo("/admin/claims")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                Claims
              </button>
            )}

            {canViewImports && (
              <button
                type="button"
                onClick={() => goTo("/admin/import-history")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                Import History
              </button>
            )}

            {canViewUsers && (
              <button
                type="button"
                onClick={() => goTo("/admin/users")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                Admin Users
              </button>
            )}

            <div className="my-2 border-t" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
        {canViewImports && (
  <button
    type="button"
    onClick={() => goTo("/admin/analytics")}
    className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100"
  >
    Analytics Dashboard
  </button>
)}
      </div>
    </header>
  );
}