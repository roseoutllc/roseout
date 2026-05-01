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

export default async function AdminUsersPage() {
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#0b0b0f] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">Admin Users</h1>

          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            <p className="font-semibold">Database Error</p>
            <p className="mt-2 text-sm">{error.message}</p>
          </div>
        </div>
      </main>
    );
  }

  const totalUsers = users?.length ?? 0;
  const admins =
    users?.filter((user: AppUser) => user.role === "admin" || user.is_superadmin)
      .length ?? 0;
  const owners = users?.filter((user: AppUser) => user.role === "owner").length ?? 0;
  const regularUsers =
    users?.filter((user: AppUser) => user.role === "user").length ?? 0;

  return (
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-rose-300">
              RoseOut Admin
            </p>
            <h1 className="mt-2 text-4xl font-bold">Users</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Manage platform users, admin access, owner accounts, and customer
              profiles.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Back to Dashboard
          </a>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">Total Users</p>
            <p className="mt-2 text-3xl font-bold">{totalUsers}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">Admins</p>
            <p className="mt-2 text-3xl font-bold">{admins}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">Owners</p>
            <p className="mt-2 text-3xl font-bold">{owners}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">Customers</p>
            <p className="mt-2 text-3xl font-bold">{regularUsers}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-bold">User Accounts</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Showing all users from your public users table.
            </p>
          </div>

          {!users || users.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Super Admin</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">User ID</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {users.map((user: AppUser) => (
                    <tr key={user.id} className="hover:bg-white/[0.03]">
                      <td className="px-6 py-4 font-medium text-white">
                        {user.email || "No email"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200">
                          {user.role || "user"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {user.is_superadmin ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                            Yes
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                            No
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-zinc-400">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                        {user.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}