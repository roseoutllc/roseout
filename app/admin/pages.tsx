"use client";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">RoseOut Admin Portal</h1>

        <p className="mt-3 text-neutral-400">
          Manage restaurants, invites, and platform activity.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <a
            href="/admin/restaurants"
            className="rounded-3xl bg-white p-6 text-black hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold">Restaurants</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Approve, reject, and manage listings
            </p>
          </a>

          <a
            href="/admin/invites"
            className="rounded-3xl bg-white p-6 text-black hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold">QR Invites</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Create and track restaurant outreach
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}