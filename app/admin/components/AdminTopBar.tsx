"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type SearchUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  subscription_status: string | null;
};

export default function AdminTopBar() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

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
  }, [supabase]);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!showUserSearch || cleanQuery.length < 2) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(cleanQuery)}`
        );

        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showUserSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setShowUserSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    setShowUserSearch(false);
    window.location.href = path;
  };

  const loginAsUser = async (userId: string) => {
    setImpersonatingId(userId);

    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      alert("Unable to view as this user.");
      setImpersonatingId(null);
      return;
    }

    window.location.href = "/user/dashboard";
  };

  const handleLogout = async () => {
    setOpen(false);
    setShowUserSearch(false);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const name =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "Admin";

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

  const canViewUsers = ["superuser", "admin"].includes(role || "");

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

        <div className="hidden items-center gap-2 lg:flex">
          {canViewDashboard && (
            <button
              type="button"
              onClick={() => goTo("/admin/dashboard")}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              Dashboard
            </button>
          )}

          {canViewRestaurants && (
            <button
              type="button"
              onClick={() => goTo("/admin/restaurants")}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              Restaurants
            </button>
          )}

          {canViewActivities && (
            <button
              type="button"
              onClick={() => goTo("/admin/activities")}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              Activities
            </button>
          )}

          {canViewUsers && (
            <button
              type="button"
              onClick={() => goTo("/admin/users")}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              Users
            </button>
          )}

          {canViewClaims && (
            <button
              type="button"
              onClick={() => goTo("/admin/claims")}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              Claims
            </button>
          )}
        </div>

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
            <div className="absolute right-0 z-[9999] mt-3 w-80 overflow-hidden rounded-2xl bg-white text-black shadow-2xl ring-1 ring-black/10">
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

                {canViewUsers && (
                  <>
                    <button
                      type="button"
                      onClick={() => goTo("/admin/users")}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100"
                    >
                      Users Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUserSearch((prev) => !prev)}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"
                    >
                      👁 View as User
                    </button>

                    {showUserSearch && (
                      <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search name, email, or phone..."
                          autoFocus
                          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
                        />

                        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                          {query.trim().length < 2 && (
                            <p className="px-1 text-xs text-neutral-500">
                              Type at least 2 characters.
                            </p>
                          )}

                          {searching && (
                            <p className="px-1 text-xs text-neutral-500">
                              Searching users...
                            </p>
                          )}

                          {!searching &&
                            query.trim().length >= 2 &&
                            users.length === 0 && (
                              <p className="px-1 text-xs text-neutral-500">
                                No users found.
                              </p>
                            )}

                          {users.map((searchUser) => (
                            <button
                              key={searchUser.id}
                              type="button"
                              onClick={() => loginAsUser(searchUser.id)}
                              disabled={impersonatingId === searchUser.id}
                              className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-neutral-950">
                                    {searchUser.full_name || "Unnamed User"}
                                  </p>

                                  <p className="mt-0.5 break-all text-xs text-neutral-500">
                                    {searchUser.email || "No email"}
                                  </p>

                                  {searchUser.phone && (
                                    <p className="mt-0.5 text-xs text-neutral-400">
                                      {searchUser.phone}
                                    </p>
                                  )}
                                </div>

                                <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase text-rose-700">
                                  {impersonatingId === searchUser.id
                                    ? "Opening"
                                    : "View"}
                                </span>
                              </div>

                              <div className="mt-2 flex gap-2">
                                <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold capitalize text-neutral-600">
                                  {searchUser.role || "user"}
                                </span>

                                <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold capitalize text-neutral-600">
                                  {searchUser.subscription_status || "free"}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
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