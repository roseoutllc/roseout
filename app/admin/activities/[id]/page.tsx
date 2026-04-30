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
  const [ownerName, setOwnerName] = useState(""); // ✅ NEW
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

    // ✅ LOAD OWNER DATA
    setOwnerName(data.activity?.activity_owners?.[0]?.name || "");
    setOwnerEmail(data.activity?.activity_owners?.[0]?.email || "");

    setLoading(false);
  };

  const saveChanges = async () => {
    setSaving(true);

    const res = await fetch(`/api/admin/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        owner_name: ownerName,
        owner_email: ownerEmail,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setActivity(data.activity);
      setForm(data.activity);
      setMessage("Saved successfully.");
    }

    setSaving(false);
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

  if (loading) return <div>Loading...</div>;
  if (unauthorized) return <div>Not authorized</div>;
  if (!activity) return <div>{message || "Activity not found."}</div>;

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <a href="/admin" className="text-sm underline">
          ← Back to Admin Dashboard
        </a>

        <h1 className="mt-6 text-4xl font-bold">
          {form.activity_name || "Unnamed Activity"}
        </h1>

        {message && (
          <div className="mt-4 rounded-2xl bg-white p-4 text-black">
            {message}
          </div>
        )}

        <div className="mt-8 space-y-6">

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

          {/* KEEP YOUR OTHER SECTIONS */}

          <button
            onClick={saveChanges}
            className="w-full rounded-full bg-yellow-500 px-6 py-4 font-bold text-black"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}