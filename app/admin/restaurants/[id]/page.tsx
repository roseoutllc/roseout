"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

export default function AdminRestaurantDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [ownerEmail, setOwnerEmail] = useState(""); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const loadRestaurant = async () => {
    const res = await fetch(`/api/admin/restaurants/${id}`);
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to load.");
      setLoading(false);
      return;
    }

    setRestaurant(data.restaurant);
    setForm(data.restaurant || {});

    // ✅ LOAD OWNER EMAIL
    setOwnerEmail(
      data.restaurant?.restaurant_owners?.[0]?.email || ""
    );

    setLoading(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        owner_email: ownerEmail, // ✅ SEND
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      setSaving(false);
      return;
    }

    setRestaurant(data.restaurant);
    setForm(data.restaurant);

    // ✅ refresh email after save
    setOwnerEmail(
      data.restaurant?.restaurant_owners?.[0]?.email || ""
    );

    setMessage("Saved successfully.");
    setSaving(false);
  };

  const quickUpdate = async (updates: any) => {
    setMessage("");

    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        owner_email: ownerEmail, // ✅ include here too
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      return;
    }

    setRestaurant(data.restaurant);
    setForm(data.restaurant);

    setOwnerEmail(
      data.restaurant?.restaurant_owners?.[0]?.email || ""
    );

    setMessage("Updated successfully.");
  };

  useEffect(() => {
    const init = async () => {
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

      loadRestaurant();
    };

    init();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (unauthorized) return <div>Not authorized</div>;
  if (!restaurant) return <div>{message || "Restaurant not found."}</div>;

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <a href="/admin" className="text-sm underline">
          ← Back to Admin Dashboard
        </a>

        {/* EXISTING UI KEPT */}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            
            {/* ✅ NEW OWNER SECTION */}
            <section className="rounded-3xl bg-white p-6 text-black">
              <h2 className="text-2xl font-bold">Owner Access</h2>

              <div className="mt-5 grid gap-4">
                <input
                  className="rounded-xl border px-4 py-3"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Owner Email"
                />

                <p className="text-sm text-neutral-500">
                  This email controls who can manage this listing in the owner dashboard.
                </p>
              </div>
            </section>

            {/* EVERYTHING ELSE FROM YOUR PAGE REMAINS EXACTLY THE SAME */}

          </div>
        </div>
      </div>
    </main>
  );
}