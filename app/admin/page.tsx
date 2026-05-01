import { requireAdminRole } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
export default async function AdminPage() {
  await requireAdminRole([
    "superuser",
    "admin",
    "editor",
    "reviewer",
    "viewer",
  ]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut Admin
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-3 text-neutral-400">
          Manage your platform, content, and users.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <a
            href="/admin/restaurants"
            className="rounded-2xl bg-white p-6 text-black shadow-xl"
          >
            <h2 className="text-xl font-bold">Restaurants</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Manage restaurant listings
            </p>
          </a>

          <a
            href="/admin/activities"
            className="rounded-2xl bg-white p-6 text-black shadow-xl"
          >
            <h2 className="text-xl font-bold">Activities</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Manage activities
            </p>
          </a>

          <a
            href="/admin/import-history"
            className="rounded-2xl bg-white p-6 text-black shadow-xl"
          >
            <h2 className="text-xl font-bold">Import History</h2>
            <p className="mt-2 text-sm text-neutral-600">
              View cron import logs
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}