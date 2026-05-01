import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { requireAdminRole } from "@/lib/admin-auth";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  await requireAdminRole(["superuser"]);

  return <AdminUsersClient />;
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  role?: string;
}>;

type PageProps = {
  searchParams: SearchParams;
};

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = params.q || "";
  const status = params.status || "all";
  const role = params.role || "all";

  const supabase = adminSupabase();

  let query = supabase
    .from("users")
    .select(
      "id,email,full_name,phone,role,subscription_status,stripe_customer_id,stripe_subscription_id,created_at"
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  if (status !== "all") {
    query = query.eq("subscription_status", status);
  }

  if (role !== "all") {
    query = query.eq("role", role);
  }

  const { data: users } = await query;

  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  const { count: activeUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("subscription_status", "active");

  const { count: freeUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .or("subscription_status.eq.free,subscription_status.is.null");

  const { count: superusers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "superuser");

  return (
    <main className="min-h-screen bg-[#080406] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-rose-300">
              RoseOut Admin
            </p>
            <h1 className="mt-2 text-4xl font-bold">User Management</h1>
            <p className="mt-2 text-white/50">
              View users, subscriptions, saved activity, and login as users.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold hover:bg-white hover:text-black"
          >
            Back to Admin
          </Link>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-white/50">Total Users</p>
            <h2 className="mt-2 text-3xl font-bold">{totalUsers || 0}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-white/50">Active Subscribers</p>
            <h2 className="mt-2 text-3xl font-bold">{activeUsers || 0}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-white/50">Free Users</p>
            <h2 className="mt-2 text-3xl font-bold">{freeUsers || 0}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-white/50">Superusers</p>
            <h2 className="mt-2 text-3xl font-bold">{superusers || 0}</h2>
          </div>
        </section>

        <form className="mb-6 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone..."
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 md:col-span-2"
          />

          <select
            name="status"
            defaultValue={status}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="free">Free</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>

          <select
            name="role"
            defaultValue={role}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="superuser">Superuser</option>
            <option value="owner">Owner</option>
          </select>

          <button className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold text-white hover:bg-rose-400 md:col-span-4">
            Search Users
          </button>
        </form>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="grid grid-cols-12 border-b border-white/10 px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Stripe</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {!users || users.length === 0 ? (
            <div className="p-10 text-center text-white/50">
              No users found.
            </div>
          ) : (
            users.map((user: any) => (
              <div
                key={user.id}
                className="grid grid-cols-12 items-center border-b border-white/10 px-5 py-5 last:border-b-0 hover:bg-white/[0.03]"
              >
                <div className="col-span-4">
                  <p className="font-bold">
                    {user.full_name || "Unnamed User"}
                  </p>
                  <p className="mt-1 text-sm text-white/50">{user.email}</p>
                  {user.phone && (
                    <p className="mt-1 text-xs text-white/35">{user.phone}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold capitalize">
                    {user.role || "user"}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold capitalize text-rose-200">
                    {user.subscription_status || "free"}
                  </span>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-white/50">
                    {user.stripe_subscription_id ? "Connected" : "None"}
                  </p>
                </div>

                <div className="col-span-2 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-rose-100"
                  >
                    View User
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}