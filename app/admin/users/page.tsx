import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type AppUser = {
  id: string;
  email: string | null;
  role: string | null;
  is_superadmin?: boolean | null;
  created_at: string | null;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function roleBadge(role?: string | null, isSuperadmin?: boolean | null) {
  if (isSuperadmin) return "border-rose-200 bg-rose-50 text-rose-700";
  if (role === "admin") return "border-rose-200 bg-rose-50 text-rose-700";
  if (role === "owner") return "border-black/10 bg-[#f5eee8] text-black/70";
  if (role === "user") return "border-black/10 bg-white text-black/55";

  return "border-black/10 bg-neutral-100 text-black/50";
}

export default async function AdminUsersPage() {
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#090706] px-4 pb-10 pt-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <section className="rounded-[1.75rem] border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
              RoseOut Admin
            </p>
            <h1 className="mt-2 text-3xl font-black">Database Error</h1>
            <p className="mt-3 text-sm font-bold">{error.message}</p>
          </section>
        </div>
      </main>
    );
  }

  const safeUsers = (users || []) as AppUser[];

  const totalUsers = safeUsers.length;
  const admins = safeUsers.filter(
    (user) => user.role === "admin" || user.is_superadmin
  ).length;
  const owners = safeUsers.filter((user) => user.role === "owner").length;
  const regularUsers = safeUsers.filter((user) => user.role === "user").length;

  return (
    <main className="min-h-screen bg-[#090706] px-4 pb-10 pt-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.22),transparent_35%),linear-gradient(135deg,#160b0b,#090706_55%,#140f0a)] p-5 shadow-2xl sm:p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-rose-300">
                RoseOut Admin
              </p>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Users
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Manage platform users, admin access, owner accounts, and
                customer profiles.
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="rounded-full border border-white/10 bg-white/[0.07] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Total Users
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatNumber(totalUsers)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Admins
            </p>
            <p className="mt-2 text-3xl font-black text-rose-200">
              {formatNumber(admins)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Owners
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatNumber(owners)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Customers
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatNumber(regularUsers)}
            </p>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#f8f3ef] text-[#1b1210] shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fffaf6] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black">User Accounts</h2>
              <p className="mt-1 text-xs font-medium text-black/50">
                Showing all users from your public users table.
              </p>
            </div>

            <div className="rounded-full bg-[#1b1210] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white">
              {formatNumber(totalUsers)} Users
            </div>
          </div>

          {!safeUsers.length ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">
                🌹
              </div>
              <p className="mt-4 text-lg font-black">No users found</p>
              <p className="mt-1 text-sm text-black/50">
                New users will appear here after signup.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {safeUsers.map((user) => {
                const displayRole = user.is_superadmin
                  ? "superadmin"
                  : user.role || "user";

                const initial =
                  user.email?.charAt(0)?.toUpperCase() ||
                  displayRole.charAt(0).toUpperCase();

                return (
                  <div
                    key={user.id}
                    className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-xl"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_320px_260px] lg:items-center">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f5eee8] text-lg font-black text-rose-700">
                          {initial}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-base font-black">
                            {user.email || "No email"}
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-black/40">
                            ID: {user.id}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase ${roleBadge(
                                user.role,
                                user.is_superadmin
                              )}`}
                            >
                              {displayRole}
                            </span>

                            {user.is_superadmin ? (
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-black uppercase text-rose-700">
                                Super Admin
                              </span>
                            ) : (
                              <span className="rounded-full border border-black/10 bg-[#f5eee8] px-3 py-1 text-[11px] font-black uppercase text-black/45">
                                Standard
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-[#f5eee8] p-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-black/35">
                            Role
                          </p>
                          <p className="mt-1 truncate text-sm font-black capitalize">
                            {displayRole}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f5eee8] p-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-black/35">
                            Created
                          </p>
                          <p className="mt-1 truncate text-sm font-black">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#1b1210] p-3 text-white">
                        <p className="text-[10px] font-black uppercase tracking-wide text-white/40">
                          User ID
                        </p>
                        <p className="mt-1 truncate font-mono text-xs text-white/80">
                          {user.id}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}