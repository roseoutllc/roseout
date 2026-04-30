import { requireAdminRole } from "@/lib/admin-auth";

export default async function AdminRestaurantsPage() {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut Admin
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Restaurants
        </h1>

        <p className="mt-3 text-neutral-400">
          Manage all restaurant listings.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 text-black shadow-2xl">
          <p className="text-sm text-neutral-600">
            Your restaurant management UI goes here.
          </p>
        </div>
      </div>
    </main>
  );
}