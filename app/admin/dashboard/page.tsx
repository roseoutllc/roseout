import { requireAdminRole } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut Admin
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-400">
          Manage your platform, listings, analytics, imports, claims, and admin access.
        </p>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <a
            href="/admin/restaurants"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Restaurant Dashboard
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Restaurants Admin
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              View, edit, approve, and manage restaurant listings.
            </p>
          </a>

          <a
            href="/admin/activities"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Activities Dashboard
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Activities Admin
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              View, edit, approve, and manage activity listings.
            </p>
          </a>

          <a
            href="/admin/analytics"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Analytics
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Analytics Dashboard
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              View views, clicks, top listings, and recent events.
            </p>
          </a>

          <a
            href="/admin/claims"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Claims
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Claims Review
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              Review restaurant owner claims and approvals.
            </p>
          </a>

          <a
            href="/admin/import-history"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Imports
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Import History
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              View Google import runs and cron job history.
            </p>
          </a>

          <a
            href="/admin/users"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Users
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Admin Users
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              Add users, assign roles, and manage admin access.
            </p>
          </a>
        </section>
      </div>
    </main>
  );
}