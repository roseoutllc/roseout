"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ActivityEditClient({
  activity,
  initialNotes,
}: {
  activity: any;
  initialNotes: any[];
}) {
  const supabase = createClient();

  const [form, setForm] = useState({
    activity_name: activity.activity_name || "",
    activity_type: activity.activity_type || "",
    address: activity.address || "",
    city: activity.city || "",
    state: activity.state || "",
    zip_code: activity.zip_code || "",
    status: activity.status || "approved",
    price_range: activity.price_range || "",
    atmosphere: activity.atmosphere || "",
    primary_tag: activity.primary_tag || "",
    reservation_link: activity.reservation_link || "",
    website: activity.website || "",
    image_url: activity.image_url || "",
    rating: activity.rating || 0,
    review_count: activity.review_count || 0,
    roseout_score: activity.roseout_score || 0,
    owner_name: activity.owner_name || "",
    owner_email: activity.owner_email || "",
    owner_phone: activity.owner_phone || "",
    claimed: activity.claimed || false,
  });

  const [notes, setNotes] = useState(initialNotes || []);
  const [newNote, setNewNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveActivity = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        rating: Number(form.rating || 0),
        review_count: Number(form.review_count || 0),
        roseout_score: Number(form.roseout_score || 0),
        claimed_at: form.claimed
          ? activity.claimed_at || new Date().toISOString()
          : null,
      };

      const { error: updateError } = await supabase
        .from("activities")
        .update(payload)
        .eq("id", activity.id);

      if (updateError) throw updateError;

      setMessage("Activity updated successfully.");
    } catch (err: any) {
      setError(err.message || "Could not update activity.");
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) {
      setError("Please enter a note.");
      return;
    }

    setAddingNote(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/activities/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity_id: activity.id,
          note: newNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not add note.");
        return;
      }

      const note = {
        id: crypto.randomUUID(),
        note: newNote,
        created_by: "You",
        created_at: new Date().toISOString(),
      };

      setNotes((prev) => [note, ...prev]);
      setNewNote("");
      setMessage("Note added successfully.");
    } catch (err: any) {
      setError(err.message || "Could not add note.");
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div>
      <a
        href="/admin/activities"
        className="mb-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
      >
        ← Back to Activities
      </a>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
            RoseOut Admin
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight">
            Edit Activity
          </h1>

          <p className="mt-3 text-neutral-400">
            Update activity details, owner info, claim status, notes, and analytics.
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-4 py-2 text-sm font-extrabold uppercase ${
            form.claimed
              ? "bg-green-100 text-green-700"
              : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {form.claimed ? "Claimed" : "Unclaimed"}
        </span>
      </div>

      {message && (
        <div className="mt-6 rounded-2xl bg-green-100 p-4 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
          <h2 className="text-2xl font-extrabold">Activity Details</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-bold">Activity Name</label>
              <input
                value={form.activity_name}
                onChange={(e) => updateField("activity_name", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold">Claim Status</label>
              <select
                value={form.claimed ? "claimed" : "unclaimed"}
                onChange={(e) =>
                  updateField("claimed", e.target.value === "claimed")
                }
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              >
                <option value="unclaimed">Unclaimed</option>
                <option value="claimed">Claimed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold">Activity Type</label>
              <input
                value={form.activity_type}
                onChange={(e) => updateField("activity_type", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Price Range</label>
              <input
                value={form.price_range}
                onChange={(e) => updateField("price_range", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Address</label>
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">City</label>
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">State</label>
              <input
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Zip Code</label>
              <input
                value={form.zip_code}
                onChange={(e) => updateField("zip_code", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Atmosphere</label>
              <input
                value={form.atmosphere}
                onChange={(e) => updateField("atmosphere", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Primary Tag</label>
              <input
                value={form.primary_tag}
                onChange={(e) => updateField("primary_tag", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Rating</label>
              <input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => updateField("rating", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Review Count</label>
              <input
                type="number"
                value={form.review_count}
                onChange={(e) => updateField("review_count", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">RoseOut Score</label>
              <input
                type="number"
                value={form.roseout_score}
                onChange={(e) => updateField("roseout_score", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-bold">Image URL</label>
              <input
                value={form.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Website</label>
              <input
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Reservation Link</label>
              <input
                value={form.reservation_link}
                onChange={(e) => updateField("reservation_link", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <h2 className="text-2xl font-extrabold">Owner / Manager Info</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-bold">
                  Owner / Manager Name
                </label>
                <input
                  value={form.owner_name}
                  onChange={(e) => updateField("owner_name", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Email Address</label>
                <input
                  type="email"
                  value={form.owner_email}
                  onChange={(e) => updateField("owner_email", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Phone Number</label>
                <input
                  value={form.owner_phone}
                  onChange={(e) => updateField("owner_phone", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={saveActivity}
            disabled={saving}
            className="mt-6 w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Activity"}
          </button>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
            <h2 className="text-2xl font-extrabold">Preview</h2>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-neutral-200">
              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt={form.activity_name}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center bg-neutral-200 text-neutral-500">
                  No image
                </div>
              )}

              <div className="p-5">
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                  {form.status}
                </span>

                <h3 className="mt-4 text-2xl font-extrabold">
                  {form.activity_name || "Activity Name"}
                </h3>

                <p className="mt-2 text-sm text-neutral-600">
                  {form.city || "City"}, {form.state || "State"}
                </p>

                <p className="mt-3 text-sm text-neutral-500">
                  {form.activity_type || "Type"} · Score:{" "}
                  {form.roseout_score || 0}
                </p>
              </div>
            </div>

            <a
              href={`/activities/${activity.id}`}
              target="_blank"
              className="mt-5 block rounded-full bg-black px-5 py-3 text-center font-bold text-white"
            >
              View Public Page
            </a>
          </div>

          <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
            <h2 className="text-2xl font-extrabold">Owner / Manager</h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Name
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  {form.owner_name || "Not added"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Email
                </p>
                {form.owner_email ? (
                  <a
                    href={`mailto:${form.owner_email}`}
                    className="mt-1 block break-all text-sm font-bold text-blue-600 underline"
                  >
                    {form.owner_email}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-neutral-500">Not added</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Phone
                </p>
                {form.owner_phone ? (
                  <a
                    href={`tel:${form.owner_phone}`}
                    className="mt-1 block text-sm font-bold"
                  >
                    {form.owner_phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-neutral-500">Not added</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Claim Status
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    form.claimed
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {form.claimed ? "Claimed" : "Unclaimed"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
            <h2 className="text-2xl font-extrabold">Contact Notes</h2>

            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add contact history, call notes, owner updates..."
              className="mt-4 h-28 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
            />

            <button
              type="button"
              onClick={addNote}
              disabled={addingNote}
              className="mt-3 w-full rounded-full bg-yellow-500 px-5 py-3 font-extrabold text-black disabled:opacity-50"
            >
              {addingNote ? "Adding Note..." : "Add Note"}
            </button>

            <div className="mt-5 space-y-3">
              {notes.length ? (
                notes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-neutral-100 p-4">
                    <p className="text-sm text-neutral-700">{note.note}</p>
                    <p className="mt-2 text-xs font-bold text-neutral-400">
                      {note.created_by || "Unknown"} ·{" "}
                      {note.created_at
                        ? new Date(note.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">No notes yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
            <h2 className="text-2xl font-extrabold">Analytics</h2>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Views
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {activity.view_count || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Clicks
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {activity.click_count || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Rating
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  ⭐ {activity.rating || 0}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}