"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AdminRestaurantDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
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
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      setSaving(false);
      return;
    }

    setRestaurant(data.restaurant);
    setForm(data.restaurant);
    setMessage("Saved successfully.");
    setSaving(false);
  };

  const quickUpdate = async (updates: any) => {
    setMessage("");

    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      return;
    }

    setRestaurant(data.restaurant);
    setForm(data.restaurant);
    setMessage("Updated successfully.");
  };

  const printLabel = () => {
    if (!restaurant) return;

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${restaurant.restaurant_name || "Restaurant Label"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label {
              width: 440px;
              display: flex;
              gap: 16px;
              align-items: center;
              border: 1px solid #ddd;
              border-radius: 14px;
              padding: 16px;
            }
            img { width: 120px; height: 120px; }
            h2 { margin: 0 0 6px; font-size: 20px; }
            p { margin: 3px 0; font-size: 13px; }
            .small { margin-top: 8px; font-weight: bold; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${restaurant.qr_code_data_url || ""}" />
            <div>
              <h2>${restaurant.restaurant_name || ""}</h2>
              <p>${restaurant.address || ""}</p>
              <p>${restaurant.city || ""}, ${restaurant.state || ""} ${
      restaurant.zip_code || ""
    }</p>
              <p class="small">Scan to claim & manage your RoseOut listing</p>
            </div>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);

    win.document.close();
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (unauthorized) return <div className="p-6 text-red-400">Not authorized</div>;
  if (!restaurant) return <div className="p-6">{message || "Restaurant not found."}</div>;

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${form.restaurant_name || ""} ${form.address || ""} ${form.city || ""}`
  )}`;

  return (
    <div>
      <a href="/admin" className="text-sm underline">
        ← Back to Admin
      </a>

      <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-bold">
            {form.restaurant_name || "Unnamed Restaurant"}
          </h1>

          <p className="mt-2 text-neutral-400">
            Full CMS editor for restaurant listing.
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
          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-2xl font-bold">Basic Information</h2>

            <div className="mt-5 grid gap-4">
              <input
                className="rounded-xl border px-4 py-3"
                value={form.restaurant_name || ""}
                onChange={(e) => update("restaurant_name", e.target.value)}
                placeholder="Restaurant Name"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.address || ""}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Address"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.city || ""}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="City"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.state || ""}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="State"
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  value={form.zip_code || ""}
                  onChange={(e) => update("zip_code", e.target.value)}
                  placeholder="Zip Code"
                />
              </div>

              <input
                className="rounded-xl border px-4 py-3"
                value={form.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Phone"
              />

              <textarea
                className="min-h-32 rounded-xl border px-4 py-3"
                value={form.description || ""}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Description"
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-2xl font-bold">Listing Details</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border px-4 py-3"
                value={form.cuisine_type || ""}
                onChange={(e) => update("cuisine_type", e.target.value)}
                placeholder="Cuisine Type"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.price_range || ""}
                onChange={(e) => update("price_range", e.target.value)}
                placeholder="Price Range"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.atmosphere || ""}
                onChange={(e) => update("atmosphere", e.target.value)}
                placeholder="Atmosphere"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.noise_level || ""}
                onChange={(e) => update("noise_level", e.target.value)}
                placeholder="Noise Level"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.lighting || ""}
                onChange={(e) => update("lighting", e.target.value)}
                placeholder="Lighting"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.primary_tag || ""}
                onChange={(e) => update("primary_tag", e.target.value)}
                placeholder="Primary Tag"
              />
            </div>

            <input
              className="mt-4 w-full rounded-xl border px-4 py-3"
              value={
                Array.isArray(form.date_style_tags)
                  ? form.date_style_tags.join(", ")
                  : form.date_style_tags || ""
              }
              onChange={(e) =>
                update(
                  "date_style_tags",
                  e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Date Style Tags, separated by commas"
            />
          </section>

          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-2xl font-bold">Links & Media</h2>

            <div className="mt-5 grid gap-4">
              <input
                className="rounded-xl border px-4 py-3"
                value={form.website || ""}
                onChange={(e) => update("website", e.target.value)}
                placeholder="Website"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.reservation_link || ""}
                onChange={(e) => update("reservation_link", e.target.value)}
                placeholder="Reservation Link"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.image_url || ""}
                onChange={(e) => update("image_url", e.target.value)}
                placeholder="Image URL"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.instagram_url || ""}
                onChange={(e) => update("instagram_url", e.target.value)}
                placeholder="Instagram URL"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.facebook_url || ""}
                onChange={(e) => update("facebook_url", e.target.value)}
                placeholder="Facebook URL"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.tiktok_url || ""}
                onChange={(e) => update("tiktok_url", e.target.value)}
                placeholder="TikTok URL"
              />
            </div>

            {form.image_url && (
              <img
                src={form.image_url}
                alt={form.restaurant_name || "Restaurant"}
                className="mt-5 max-h-72 w-full rounded-2xl object-cover"
              />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">Status</h2>

            <div className="mt-4 grid gap-3">
              <select
                className="rounded-xl border px-4 py-3"
                value={form.status || "approved"}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                className="rounded-xl border px-4 py-3"
                value={form.claim_status || "unclaimed"}
                onChange={(e) => update("claim_status", e.target.value)}
              >
                <option value="unclaimed">Unclaimed</option>
                <option value="pending">Pending Claim</option>
                <option value="approved">Claimed / Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <label className="flex items-center gap-3 rounded-xl border px-4 py-3">
                <input
                  type="checkbox"
                  checked={!!form.is_featured}
                  onChange={(e) => update("is_featured", e.target.checked)}
                />
                Featured
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => quickUpdate({ status: "approved" })}
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white"
              >
                Approve
              </button>

              <button
                onClick={() => quickUpdate({ status: "rejected" })}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                Reject
              </button>

              <button
                onClick={() =>
                  quickUpdate({ is_featured: !restaurant.is_featured })
                }
                className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black"
              >
                Toggle Featured
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">Claim & Owner</h2>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Owner / Manager:</strong> {ownerName || "—"}
              </p>

              <p>
                <strong>Owner Email:</strong>{" "}
                {ownerEmail || form.claimed_by_email || "—"}
              </p>

              <p>
                <strong>Claimed At:</strong> {form.claimed_at || "—"}
              </p>

              <p className="break-all">
                <strong>Claim URL:</strong> {form.claim_url || "—"}
              </p>

              <p className="break-all">
                <strong>Signup URL:</strong> {form.owner_signup_url || "—"}
              </p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 text-center text-black">
            <h2 className="text-xl font-bold">QR Label</h2>

            {form.qr_code_data_url ? (
              <>
                <img
                  src={form.qr_code_data_url}
                  alt="QR Code"
                  className="mx-auto mt-4 h-44 w-44"
                />

                <button
                  onClick={printLabel}
                  className="mt-4 w-full rounded-xl bg-black px-4 py-3 font-bold text-white"
                >
                  Print Label
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                No QR code available.
              </p>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">Analytics & Scores</h2>

            <p className="mt-1 text-xs text-neutral-500">
              Used internally for ranking, recommendations, and listing quality.
            </p>

            <div className="mt-4 grid gap-4">
              <ScoreSlider
                label="Rating"
                value={form.rating || 0}
                max={5}
                step={0.1}
                onChange={(v) => update("rating", v)}
              />

              <ScoreSlider
                label="Reviews"
                value={form.review_count || 0}
                max={1000}
                step={1}
                onChange={(v) => update("review_count", v)}
              />

              <ScoreSlider
                label="Quality"
                value={form.quality_score || 0}
                max={100}
                step={1}
                onChange={(v) => update("quality_score", v)}
              />

              <ScoreSlider
                label="Popularity"
                value={form.popularity_score || 0}
                max={100}
                step={1}
                onChange={(v) => update("popularity_score", v)}
              />

              <div className="rounded-2xl bg-neutral-100 p-3">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  RoseOut Score
                </p>
                <p className="mt-1 text-3xl font-black text-yellow-600">
                  {Number(form.roseout_score || 0)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-100 p-3">
                  <p className="text-xs font-bold uppercase text-neutral-500">
                    Views
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {form.view_count || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-100 p-3">
                  <p className="text-xs font-bold uppercase text-neutral-500">
                    Clicks
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {form.click_count || 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">External Actions</h2>

            <div className="mt-4 grid gap-3">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-black px-4 py-3 text-center font-bold text-white"
              >
                Open in Maps
              </a>

              {form.website && (
                <a
                  href={form.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-black px-4 py-3 text-center font-bold text-black"
                >
                  Website
                </a>
              )}

              {form.claim_url && (
                <a
                  href={form.claim_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-black px-4 py-3 text-center font-bold text-black"
                >
                  Open Claim Link
                </a>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-0 mt-8 border-t border-white/10 bg-black/95 py-4 backdrop-blur">
        <div className="flex gap-3">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>

          <a
            href="/admin"
            className="rounded-full border border-white/20 px-6 py-4 text-center font-bold text-white"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}

function ScoreSlider({
  label,
  value,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number | string;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const numericValue = Number(value) || 0;
  const percent = Math.min((numericValue / max) * 100, 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wide text-neutral-600">
          {label}
        </label>

        <input
          type="number"
          value={numericValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 rounded-lg border px-2 py-1 text-right text-sm font-bold"
        />
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-yellow-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={numericValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-yellow-500"
      />
    </div>
  );
}