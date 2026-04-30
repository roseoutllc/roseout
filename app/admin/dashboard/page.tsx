import { requireAdminRole } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut Admin
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-400">
          Manage your platform, listings, analytics, imports, claims, and admin access.
        </p>

        {/* Cards */}
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Restaurants */}
          <a
            href="/admin/restaurants"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Listings
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Restaurants
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              Edit restaurant details, images, ratings, tags, and links.
            </p>
          </a>

          {/* Activities */}
          <a
            href="/admin/activities"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Listings
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Activities
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              Manage activities, categories, images, and booking links.
            </p>
          </a>

          {/* Claims */}
          <a
            href="/admin/claims"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Approvals
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Claims
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              Review and approve restaurant owner claims.
            </p>
          </a>

          {/* 🔥 NEW: Analytics Dashboard */}
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
              View views, clicks, top listings, and user activity in real time.
            </p>
          </a>

          {/* Import History */}
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
              View cron runs and verify daily imports.
            </p>
          </a>

          {/* Admin Users */}
          <a
            href="/admin/users"
            className="rounded-[2rem] bg-white p-6 text-black shadow-xl transition hover:-translate-y-1"
          >
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
              Access
            </span>

            <h2 className="mt-5 text-2xl font-extrabold">
              Admin Users
            </h2>

            <p className="mt-3 text-sm text-neutral-600">
              Add users, assign roles, and manage admin access.
            </p>
          </a>
        </section>

        {/* Access Levels */}
        <section className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-extrabold">Access Levels</h2>

          <div className="mt-5 overflow-hidden rounded-2xl bg-white text-black">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Permissions</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-t">
                  <td className="px-5 py-4 font-bold">Superuser</td>
                  <td className="px-5 py-4">
                    Full system access, analytics, users, imports, and content.
                  </td>
                </tr>

                <tr className="border-t">
                  <td className="px-5 py-4 font-bold">Admin</td>
                  <td className="px-5 py-4">
                    Manage content, claims, analytics, and imports.
                  </td>
                </tr>

                <tr className="border-t">
                  <td className="px-5 py-4 font-bold">Editor</td>
                  <td className="px-5 py-4">
                    Edit restaurants and activities.
                  </td>
                </tr>

                <tr className="border-t">
                  <td className="px-5 py-4 font-bold">Viewer</td>
                  <td className="px-5 py-4">
                    View analytics and platform data only.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}