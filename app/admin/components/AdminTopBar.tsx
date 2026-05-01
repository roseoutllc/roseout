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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080407]/90 text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => goTo("/admin/dashboard")}
          className="group flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-lg font-black shadow-lg shadow-rose-500/25">
            R
          </div>

          <div className="text-left">
            <p className="text-lg font-black tracking-tight">
              RoseOut Admin
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200/70">
              Control Room
            </p>
          </div>
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
          {canViewDashboard && (
            <button
              type="button"
              onClick={() => goTo("/admin/dashboard")}
              className="rounded-full px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white hover:text-black"
            >
              Dashboard
            </button>
          )}

          {canViewRestaurants && (
            <button
              type="button"
              onClick={() => goTo("/admin/restaurants")}
              className="rounded-full px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white hover:text-black"
            >
              Restaurants
            </button>
          )}

          {canViewActivities && (
            <button
              type="button"
              onClick={() => goTo("/admin/activities")}
              className="rounded-full px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white hover:text-black"
            >
              Activities
            </button>
          )}

          {canViewUsers && (
            <button
              type="button"
              onClick={() => goTo("/admin/users")}
              className="rounded-full px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white hover:text-black"
            >
              Users
            </button>
          )}

          {canViewClaims && (
            <button
              type="button"
              onClick={() => goTo("/admin/claims")}
              className="rounded-full px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white hover:text-black"
            >
              Claims
            </button>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 shadow-inner shadow-white/5 transition hover:bg-white/[0.1]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-600 text-sm font-black text-white shadow-lg shadow-rose-500/20">
              {initial}
            </div>

            <div className="hidden text-left md:block">
              <p className="text-sm font-bold leading-tight">{name}</p>
              <p className="max-w-[180px] truncate text-xs text-white/45">
                {email}
              </p>
            </div>

            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/50">
              {open ? "▲" : "▼"}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 z-[9999] mt-4 w-96 overflow-hidden rounded-[2rem] border border-white/10 bg-[#12090d] text-white shadow-2xl shadow-black/70">
              <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-rose-500/25 via-fuchsia-500/15 to-black px-5 py-5">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/20 blur-3xl" />

                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-black text-black">
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-black">{name}</p>
                    <p className="mt-1 truncate text-xs text-white/55">
                      {email}
                    </p>

                    {role && (
                      <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-100 ring-1 ring-white/10">
                        {role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="max-h-[78vh] overflow-y-auto p-3">
                {canViewDashboard && (
                  <MenuButton onClick={() => goTo("/admin/dashboard")}>
                    Dashboard
                  </MenuButton>
                )}

                {canViewRestaurants && (
                  <MenuButton onClick={() => goTo("/admin/restaurants")}>
                    Restaurants
                  </MenuButton>
                )}

                {canViewActivities && (
                  <MenuButton onClick={() => goTo("/admin/activities")}>
                    Activities
                  </MenuButton>
                )}

                {canViewUsers && (
                  <>
                    <MenuButton onClick={() => goTo("/admin/users")}>
                      Users Dashboard
                    </MenuButton>

                    <button
                      type="button"
                      onClick={() => setShowUserSearch((prev) => !prev)}
                      className="w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-left text-sm font-black text-rose-100 transition hover:bg-rose-500/20"
                    >
                      👁 View as User
                    </button>

                    {showUserSearch && (
                      <div className="mt-3 rounded-[1.5rem] border border-white/10 bg-black/35 p-3">
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search name, email, or phone..."
                          autoFocus
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-rose-400"
                        />

                        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                          {query.trim().length < 2 && (
                            <p className="px-1 text-xs text-white/40">
                              Type at least 2 characters.
                            </p>
                          )}

                          {searching && (
                            <p className="px-1 text-xs text-white/40">
                              Searching users...
                            </p>
                          )}

                          {!searching &&
                            query.trim().length >= 2 &&
                            users.length === 0 && (
                              <p className="px-1 text-xs text-white/40">
                                No users found.
                              </p>
                            )}

                          {users.map((searchUser) => (
                            <button
                              key={searchUser.id}
                              type="button"
                              onClick={() => loginAsUser(searchUser.id)}
                              disabled={impersonatingId === searchUser.id}
                              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-60"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-white">
                                    {searchUser.full_name || "Unnamed User"}
                                  </p>

                                  <p className="mt-0.5 truncate text-xs text-white/45">
                                    {searchUser.email || "No email"}
                                  </p>

                                  {searchUser.phone && (
                                    <p className="mt-0.5 text-xs text-white/35">
                                      {searchUser.phone}
                                    </p>
                                  )}
                                </div>

                                <span className="rounded-full bg-rose-500 px-3 py-1 text-[10px] font-black uppercase text-white">
                                  {impersonatingId === searchUser.id
                                    ? "Opening"
                                    : "View"}
                                </span>
                              </div>

                              <div className="mt-3 flex gap-2">
                                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold capitalize text-white/60">
                                  {searchUser.role || "user"}
                                </span>

                                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold capitalize text-white/60">
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
                  <MenuButton onClick={() => goTo("/admin/claims")}>
                    Claims
                  </MenuButton>
                )}

                {canViewAnalytics && (
  <MenuButton onClick={() => goTo("/admin/live-sessions")}>
    Live Sessions
  </MenuButton>
)}

                {canViewAnalytics && (
                  <MenuButton onClick={() => goTo("/admin/analytics")}>
                    Analytics Dashboard
                  </MenuButton>
                )}

                {canViewImportHistory && (
                  <MenuButton onClick={() => goTo("/admin/import-history")}>
                    Import History
                  </MenuButton>
                )}

                <div className="my-3 border-t border-white/10" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-black text-red-300 transition hover:bg-red-500/10"
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

function MenuButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}