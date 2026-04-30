"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

export default function AdminActivityDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const id = params.id as string;

  const [activity, setActivity] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [ownerEmail, setOwnerEmail] = useState(""); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const loadActivity = async () => {
    const res = await fetch(`/api/admin/activities/${id}`);
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to load.");
      setLoading(false);
      return;
    }

    setActivity(data.activity);
    setForm(data.activity || {});

    // ✅ LOAD OWNER EMAIL
    setOwnerEmail(
      data.activity?.activity_owners?.[0]?.email || ""
    );

    setLoading(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/activities/${id}`, {
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

    setActivity(data.activity);
    setForm(data.activity);

    setOwnerEmail(
      data.activity?.activity_owners?.[0]?.email || ""
    );

    setMessage("Saved successfully.");
    setSaving(false);
  };

  const quickUpdate = async (updates: any) => {
    setMessage("");

    const res = await fetch(`/api/admin/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        owner_email: ownerEmail, // ✅ IMPORTANT
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      return;
    }

    setActivity(data.activity);
    setForm(data.activity);

    setOwnerEmail(
      data.activity?.activity_owners?.[0]?.email || ""
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

      loadActivity();
    };

    init();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">Loading...</div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">Not authorized</div>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className="min-h-screen bg-black text-white">
        <AdminTopBar />
        <div className="p-6">{message || "Activity not found."}</div>
      </main>
    );
  }

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${form.activity_name || ""} ${form.address || ""} ${form.city || ""}`
  )}`;

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <a href="/admin" className="text-sm underline">
          ← Back to Admin Dashboard
        </a>

        <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold">
              {form.activity_name || "Unnamed Activity"}
            </h1>

            <p className="mt-2 text-neutral-400">
              Full CMS editor for activity location listing.
            </p>
          </div>

          <button
            onClick={saveChanges}
            disabled={saving}
            className="rounded-full bg-yellow-500 px-6 py-3 font-extrabold text-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl bg-white p-4 font-semibold text-black">
            {message}
          </div>
        )}

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
                  This email controls who can manage this activity listing.
                </p>
              </div>
            </section>

            {/* 🔒 ALL YOUR ORIGINAL SECTIONS REMAIN UNCHANGED BELOW */}
