"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminDashboard() {
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
      }
    };

    checkUser();
  }, []);

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex gap-4">
          <a href="/admin" className="underline">Dashboard</a>
          <a href="/admin/restaurants" className="underline">Restaurants</a>
          <a href="/admin/invites" className="underline">Invites</a>
        </div>

        <h1 className="text-4xl font-bold">RoseOut Admin Portal</h1>

        <p className="mt-3 text-neutral-400">
          Manage restaurant approvals, QR invites, and RoseOut platform activity.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <a href="/admin/restaurants" className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-2xl font-bold">Restaurants</h2>
            <p className="mt-2 text-neutral-600">
              Review, approve, reject, and manage restaurant listings.
            </p>
          </a>

          <a href="/admin/invites" className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-2xl font-bold">QR Invites</h2>
            <p className="mt-2 text-neutral-600">
              Create QR invite links and mailer labels for restaurants.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}