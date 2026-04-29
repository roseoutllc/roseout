"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

export default function AdminDashboard() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
  window.location.href = "/login";
  return;
}

if (data.user.user_metadata?.role !== "superuser") {
  setUnauthorized(true);
  setLoading(false);
  return;
}

      // 🔥 CHECK ADMIN ROLE
      if (data.user.user_metadata?.role !== "superuser") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading...
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Not authorized
      </main>
    );
  }

return (
  <main className="min-h-screen bg-black text-white">
    <AdminTopBar />

    <div className="px-6 py-12">
        </div>

        <h1 className="text-4xl font-bold">RoseOut Admin Portal</h1>

        <p className="mt-3 text-neutral-400">
          Manage restaurant approvals, QR invites, and platform activity.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <a
            href="/admin/restaurants"
            className="rounded-3xl bg-white p-6 text-black"
          >
            <h2 className="text-2xl font-bold">Restaurants</h2>
            <p className="mt-2 text-neutral-600">
              Review, approve, reject, and manage listings.
            </p>
          </a>

          <a
            href="/admin/invites"
            className="rounded-3xl bg-white p-6 text-black"
          >
            <h2 className="text-2xl font-bold">QR Invites</h2>
            <p className="mt-2 text-neutral-600">
              Create QR invite links and labels.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}