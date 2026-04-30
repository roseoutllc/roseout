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
    const loadUserAndRole = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      setUser(currentUser);

      if (currentUser?.email) {
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("role")
          .eq("email", currentUser.email.toLowerCase())
          .maybeSingle();

        setRole(adminUser?.role || null);
      }
    };

    loadUserAndRole();
  }, []);

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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    window.location.href = path;
  };

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Admin";

  const email = user?.email || "";
  const initial = name?.charAt(0)?.toUpperCase() || "A";

  const canViewDashboard = ["superuser", "admin", "editor", "viewer"].includes(
    role || ""
  );

  const canViewRestaurants = ["superuser", "admin", "editor", "viewer"].includes(
    role || ""
  );

  const canViewActivities = ["superuser", "admin", "editor", "viewer"].includes(
    role || ""
  );

  const canViewClaims = ["superuser", "admin", "reviewer"].includes(role || "");

  const canViewAnalytics = ["superuser", "admin", "viewer"].includes(
    role || ""
  );

  const canViewImportHistory = ["superuser", "admin", "viewer"].includes(
    role || ""
  );

  const canViewUsers = role === "superuser";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
            className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 font-bold text-black">
              {initial}
            </div>

            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-tight">{name}</p>
              <p className="text-xs text-neutral-400">{email}</p>
            </div>

            <span className="text-xs text-neutral-400">
              {open ? "▲" : "▼"}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 z-[9999] mt-3 w-72 overflow-hidden rounded-2xl bg-white text-black shadow-2xl ring-1 ring-black/10">
              <div className="bg-neutral-50 px-4 py-4">
                <p className="text-sm font-bold">{name}</p>
                <p className="mt-1 break-all text-xs text-neutral-500">
                  {email}
                </p>

                {role && (
                  <span className="mt-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-700">
                    {role}
                  </span>
                )}
              </div>

              <div className="p-2">
                {canViewDashboard && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin/dashboard")}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                  >
                    Dashboard
                  </button>
                )}

                {canViewRestaurants && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin/restaurants")}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                  >
                    Restaurants
                  </button>
                )}

                {canViewActivities && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin/activities")}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                  >
                    Activities
                  </button>
                )}

                {canViewClaims && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin/claims")}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                  >
                    Claims
                  </button>
                )}

                {canViewAnalytics && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin/analytics")}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                  >
                    Analytics Dashboard
                  </button>
                )}

                {canViewImportHistory && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin/import-history")}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                  >
                    Import History
                  </button>
                )}

                {canViewUsers && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin/users")}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                  >
                    Admin Users
                  </button>
                )}

                <div className="my-2 border-t border-neutral-200" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}