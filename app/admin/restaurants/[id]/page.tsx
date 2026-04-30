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
  const [ownerName, setOwnerName] = useState(""); // ✅ NEW
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

    // ✅ LOAD OWNER DATA
    setOwnerName(data.restaurant?.restaurant_owners?.[0]?.name || "");
    setOwnerEmail(data.restaurant?.restaurant_owners?.[0]?.email || "");

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
        owner_name: ownerName,
        owner_email: ownerEmail,
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

    setOwnerName(data.restaurant?.restaurant_owners?.[0]?.name || "");
    setOwnerEmail(data.restaurant?.restaurant_owners?.[0]?.email || "");

    setMessage("Saved successfully.");
    setSaving(false);
  };

  const quickUpdate = async (updates: any) => {
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        owner_name: ownerName,
        owner_email: ownerEmail,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setRestaurant(data.restaurant);
      setForm(data.restaurant);
      setMessage("Updated successfully.");
    }
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

        <h1 className="mt-6 text-4xl font-bold">
          {form.restaurant_name || "Unnamed Restaurant"}
        </h1>

        {message && (
          <div className="mt-4 rounded-2xl bg-white p-4 text-black">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">

            {/* ✅ OWNER SECTION */}
            <section className="rounded-3xl bg-white p-6 text-black">
              <h2 className="text-2xl font-bold">Owner / Manager</h2>

              <div className="mt-5 grid gap-4">
                <input
                  className="rounded-xl border px-4 py-3"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Owner / Manager Name"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Owner / Manager Email"
                />
              </div>
            </section>

            {/* KEEP YOUR OTHER SECTIONS HERE */}

          </div>

          <aside>
            <button
              onClick={saveChanges}
              className="w-full rounded-full bg-yellow-500 px-6 py-4 font-bold text-black"
            >
              Save Changes
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}