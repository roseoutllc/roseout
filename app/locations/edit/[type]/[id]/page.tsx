"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";
import ScoreBadge from "@/components/ScoreBadge";

type LocationType = "restaurants" | "activities";

function calculateUpdatedScore(location: any) {
  let score = 40;

  const has = (value: any) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && String(value).trim() !== "";
  };

  if (has(location.description)) score += 8;
  if (has(location.image_url)) score += 8;
  if (has(location.website)) score += 4;
  if (has(location.reservation_url) || has(location.reservation_link)) score += 5;
  if (has(location.price_range)) score += 4;
  if (has(location.atmosphere)) score += 6;
  if (has(location.primary_tag)) score += 5;
  if (has(location.date_style_tags)) score += 5;
  if (has(location.best_for)) score += 5;
  if (has(location.special_features)) score += 5;
  if (has(location.search_keywords)) score += 5;
  if (has(location.latitude) && has(location.longitude)) score += 5;
  if (location.claim_status === "claimed" || location.claimed) score += 8;
  if (location.rating) score += Math.min(Number(location.rating) * 2, 10);

  return clampScore(score);
}

export default function EditLocationPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const type = params.type as LocationType;
  const id = params.id as string;
  const from = searchParams.get("from") || "/locations/dashboard";

  const table = type === "activities" ? "activities" : "restaurants";
  const nameField = type === "activities" ? "activity_name" : "restaurant_name";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    neighborhood: "",
    image_url: "",
    website: "",
    reservation_url: "",
    phone: "",
    price_range: "",
    cuisine: "",
    activity_type: "",
    atmosphere: "",
    noise_level: "",
    dress_code: "",
    parking_info: "",
    hours: "",
    best_for: "",
    special_features: "",
    signature_items: "",
    primary_tag: "",
    date_style_tags: "",
    search_keywords: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    claim_status: "",
    roseout_score: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    const loadLocation = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setMessage("Location not found.");
        setLoading(false);
        return;
      }

      setForm({
        name: data[nameField] || "",
        description: data.description || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip_code: data.zip_code || "",
        neighborhood: data.neighborhood || "",
        image_url: data.image_url || "",
        website: data.website || "",
        reservation_url: data.reservation_url || data.reservation_link || "",
        phone: data.phone || "",
        price_range: data.price_range || "",
        cuisine: data.cuisine || "",
        activity_type: data.activity_type || "",
        atmosphere: data.atmosphere || "",
        noise_level: data.noise_level || "",
        dress_code: data.dress_code || "",
        parking_info: data.parking_info || "",
        hours: data.hours || "",
        best_for: Array.isArray(data.best_for)
          ? data.best_for.join(", ")
          : data.best_for || "",
        special_features: Array.isArray(data.special_features)
          ? data.special_features.join(", ")
          : data.special_features || "",
        signature_items: Array.isArray(data.signature_items)
          ? data.signature_items.join(", ")
          : data.signature_items || "",
        primary_tag: data.primary_tag || "",
        date_style_tags: Array.isArray(data.date_style_tags)
          ? data.date_style_tags.join(", ")
          : data.date_style_tags || "",
        search_keywords: Array.isArray(data.search_keywords)
          ? data.search_keywords.join(", ")
          : data.search_keywords || "",
        owner_name: data.owner_name || "",
        owner_email: data.owner_email || "",
        owner_phone: data.owner_phone || "",
        claim_status: data.claim_status || "",
        roseout_score: clampScore(data.roseout_score ?? data.quality_score ?? 0),
        latitude: data.latitude ?? "",
        longitude: data.longitude ?? "",
      });

      setLoading(false);
    };

    if (id && type) loadLocation();
  }, [id, type, supabase, table, nameField]);

  const update = (key: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toArray = (value: string) => {
    return value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  };

  const optimizeWithAI = async () => {
    setOptimizing(true);
    setMessage("");

    try {
      const res = await fetch("/api/locations/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          name: form.name,
          description: form.description,
          city: form.city,
          neighborhood: form.neighborhood,
          cuisine: form.cuisine,
          activity_type: form.activity_type,
          atmosphere: form.atmosphere,
          best_for: form.best_for,
          special_features: form.special_features,
          signature_items: form.signature_items,
          primary_tag: form.primary_tag,
          date_style_tags: form.date_style_tags,
          search_keywords: form.search_keywords,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "AI optimization failed.");
        return;
      }

      setForm((prev: any) => ({
        ...prev,
        description: data.description || prev.description,
        primary_tag: data.primary_tag || prev.primary_tag,
        date_style_tags: Array.isArray(data.date_style_tags)
          ? data.date_style_tags.join(", ")
          : prev.date_style_tags,
        best_for: Array.isArray(data.best_for)
          ? data.best_for.join(", ")
          : prev.best_for,
        special_features: Array.isArray(data.special_features)
          ? data.special_features.join(", ")
          : prev.special_features,
        search_keywords: Array.isArray(data.search_keywords)
          ? data.search_keywords.join(", ")
          : prev.search_keywords,
      }));

      setMessage("✅ AI optimization applied. Review and save changes.");
    } catch {
      setMessage("AI optimization failed.");
    } finally {
      setOptimizing(false);
    }
  };

  const saveLocation = async () => {
    setSaving(true);
    setMessage("");

    const payload: any = {
      [nameField]: form.name,
      description: form.description,
      address: form.address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      neighborhood: form.neighborhood,
      image_url: form.image_url,
      website: form.website,
      reservation_url: form.reservation_url,
      phone: form.phone,
      price_range: form.price_range,
      atmosphere: form.atmosphere,
      noise_level: form.noise_level,
      dress_code: form.dress_code,
      parking_info: form.parking_info,
      hours: form.hours,
      best_for: toArray(form.best_for),
      special_features: toArray(form.special_features),
      signature_items: toArray(form.signature_items),
      primary_tag: form.primary_tag,
      date_style_tags: toArray(form.date_style_tags),
      search_keywords: toArray(form.search_keywords),
      owner_name: form.owner_name,
      owner_email: form.owner_email,
      owner_phone: form.owner_phone,
      claim_status: form.claim_status,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
    };

    if (type === "restaurants") {
      payload.cuisine = form.cuisine;
    }

    if (type === "activities") {
      payload.activity_type = form.activity_type;
    }

    const calculatedScore = calculateUpdatedScore(payload);
    payload.roseout_score = calculatedScore;

    const { error } = await supabase.from(table).update(payload).eq("id", id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setForm((prev: any) => ({
      ...prev,
      roseout_score: calculatedScore,
    }));

    setMessage(`✅ Saved successfully. RoseOut Score: ${calculatedScore}/100`);
    setSaving(false);
  };

  const safeScore = clampScore(form.roseout_score);

  const isSuccess =
    message.includes("✅") ||
    message.toLowerCase().includes("success") ||
    message.toLowerCase().includes("applied");

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-500">
          Loading Location...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push(from)}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white hover:text-black"
          >
            ← Back
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={optimizeWithAI}
              disabled={optimizing || saving}
              className="rounded-full border border-yellow-500 px-6 py-3 text-sm font-black text-yellow-500 transition hover:bg-yellow-500 hover:text-black disabled:opacity-50"
            >
              {optimizing ? "Optimizing..." : "✨ Improve With AI"}
            </button>

            <button
              onClick={saveLocation}
              disabled={saving || optimizing}
              className="rounded-full bg-yellow-500 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-[1.5rem] p-4 text-sm font-bold shadow-xl ${
              isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mb-6 grid gap-6 rounded-[2rem] border border-white/10 bg-[#111] p-6 shadow-2xl lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-500">
              RoseOut
            </p>

            <h1 className="mt-2 text-4xl font-black">Edit Location</h1>

            <p className="mt-2 text-sm text-neutral-400">
              Add stronger details so RoseOut can match this location to better
              customer searches.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-5 text-black">
            <ScoreBadge score={safeScore} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <section className="space-y-6">
            <Panel title="Basic Listing Details">
              <Field label="Location Name" value={form.name} onChange={(v) => update("name", v)} />

              <TextArea
                label="Short Description"
                helper="This helps RoseOut understand what makes the location special."
                value={form.description}
                onChange={(v) => update("description", v)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                {type === "restaurants" && (
                  <Field
                    label="Cuisine"
                    value={form.cuisine}
                    onChange={(v) => update("cuisine", v)}
                    placeholder="Italian, Caribbean, Steakhouse"
                  />
                )}

                {type === "activities" && (
                  <Field
                    label="Activity Type"
                    value={form.activity_type}
                    onChange={(v) => update("activity_type", v)}
                    placeholder="Bowling, Museum, Spa, Lounge"
                  />
                )}

                <Field
                  label="Price Range"
                  value={form.price_range}
                  onChange={(v) => update("price_range", v)}
                  placeholder="$, $$, $$$"
                />
              </div>

              <Field
                label="Primary Tag"
                value={form.primary_tag}
                onChange={(v) => update("primary_tag", v)}
                placeholder="Romantic, Trendy, Cozy, Upscale"
              />
            </Panel>

            <Panel title="Address & Nearby Search">
              <Field label="Address" value={form.address} onChange={(v) => update("address", v)} />

              <div className="grid gap-4 md:grid-cols-4">
                <Field label="City" value={form.city} onChange={(v) => update("city", v)} />
                <Field label="State" value={form.state} onChange={(v) => update("state", v)} />
                <Field label="Zip Code" value={form.zip_code} onChange={(v) => update("zip_code", v)} />
                <Field
                  label="Neighborhood"
                  value={form.neighborhood}
                  onChange={(v) => update("neighborhood", v)}
                  placeholder="Astoria, Flushing"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Latitude"
                  value={String(form.latitude || "")}
                  onChange={(v) => update("latitude", v)}
                  placeholder="40.7282"
                />

                <Field
                  label="Longitude"
                  value={String(form.longitude || "")}
                  onChange={(v) => update("longitude", v)}
                  placeholder="-73.7949"
                />
              </div>
            </Panel>

            <Panel title="Experience Matching Details">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Atmosphere"
                  value={form.atmosphere}
                  onChange={(v) => update("atmosphere", v)}
                  placeholder="Romantic, lively, cozy, upscale"
                />

                <Field
                  label="Noise Level"
                  value={form.noise_level}
                  onChange={(v) => update("noise_level", v)}
                  placeholder="Quiet, moderate, lively"
                />

                <Field
                  label="Dress Code"
                  value={form.dress_code}
                  onChange={(v) => update("dress_code", v)}
                  placeholder="Casual, smart casual, dressy"
                />

                <Field
                  label="Parking Info"
                  value={form.parking_info}
                  onChange={(v) => update("parking_info", v)}
                  placeholder="Street parking, valet, garage nearby"
                />
              </div>

              <Field
                label="Best For"
                helper="Separate with commas."
                value={form.best_for}
                onChange={(v) => update("best_for", v)}
                placeholder="Date night, birthday, brunch, first date"
              />

              <Field
                label="Special Features"
                helper="Separate with commas."
                value={form.special_features}
                onChange={(v) => update("special_features", v)}
                placeholder="Outdoor seating, live music, waterfront, rooftop"
              />

              <Field
                label="Signature Items / Highlights"
                helper="Separate with commas."
                value={form.signature_items}
                onChange={(v) => update("signature_items", v)}
                placeholder="Wine list, lobster pasta, mocktails, private rooms"
              />
            </Panel>

            <Panel title="Search Tags & Ranking">
              <Field
                label="Date Style Tags"
                helper="Separate with commas. These display on result cards."
                value={form.date_style_tags}
                onChange={(v) => update("date_style_tags", v)}
                placeholder="Romantic, Dinner, Quiet, Upscale"
              />

              <Field
                label="Search Keywords"
                helper="Separate with commas. These help AI/search match better."
                value={form.search_keywords}
                onChange={(v) => update("search_keywords", v)}
                placeholder="wine, brunch, date night, anniversary, Queens"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="RoseOut Score"
                  value={String(safeScore)}
                  onChange={(v) => update("roseout_score", v)}
                  helper="This updates automatically when you save."
                />

                <Field
                  label="Claim Status"
                  value={form.claim_status}
                  onChange={(v) => update("claim_status", v)}
                  placeholder="claimed, pending, unclaimed"
                />
              </div>
            </Panel>

            <Panel title="Links & Owner Contact">
              <Field label="Image URL" value={form.image_url} onChange={(v) => update("image_url", v)} />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Website" value={form.website} onChange={(v) => update("website", v)} />
                <Field
                  label="Reservation / Booking URL"
                  value={form.reservation_url}
                  onChange={(v) => update("reservation_url", v)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Public Phone" value={form.phone} onChange={(v) => update("phone", v)} />
                <Field
                  label="Hours"
                  value={form.hours}
                  onChange={(v) => update("hours", v)}
                  placeholder="Mon–Fri 11am–10pm"
                />
              </div>

              <div className="rounded-[1.5rem] bg-neutral-100 p-5">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                  Owner Contact
                </p>

                <div className="grid gap-4">
                  <Field label="Owner Name" value={form.owner_name} onChange={(v) => update("owner_name", v)} />
                  <Field label="Owner Email" value={form.owner_email} onChange={(v) => update("owner_email", v)} />
                  <Field label="Owner Phone" value={form.owner_phone} onChange={(v) => update("owner_phone", v)} />
                </div>
              </div>
            </Panel>

            <button
              onClick={saveLocation}
              disabled={saving || optimizing}
              className="w-full rounded-full bg-yellow-500 px-5 py-4 font-black text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-[2rem] bg-white text-black shadow-2xl">
              {form.image_url ? (
                <Image
                  src={form.image_url}
                  alt={form.name || "Location preview"}
                  width={700}
                  height={420}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-neutral-200 text-neutral-500">
                  No image preview
                </div>
              )}

              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                  Listing Preview
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {form.name || "Location Name"}
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  {[form.address, form.city, form.state, form.zip_code]
                    .filter(Boolean)
                    .join(", ") || "Address will appear here"}
                </p>

                <div className="mt-5 rounded-[1.5rem] bg-black p-5 text-white">
                  <ScoreBadge score={safeScore} />
                </div>

                {form.description && (
                  <p className="mt-4 text-sm leading-6 text-neutral-700">
                    {form.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {form.primary_tag && (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">
                      {form.primary_tag}
                    </span>
                  )}

                  {form.price_range && (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">
                      {form.price_range}
                    </span>
                  )}
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-neutral-100 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                    Why It Stands Out
                  </p>

                  <p className="mt-2 text-sm">
                    <b>Atmosphere:</b> {form.atmosphere || "Not added"}
                  </p>
                  <p className="mt-1 text-sm">
                    <b>Best For:</b> {form.best_for || "Not added"}
                  </p>
                  <p className="mt-1 text-sm">
                    <b>Features:</b> {form.special_features || "Not added"}
                  </p>
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-neutral-100 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                    Owner
                  </p>

                  <p className="mt-2 text-sm">
                    <b>Name:</b> {form.owner_name || "Not added"}
                  </p>
                  <p className="mt-1 text-sm">
                    <b>Email:</b> {form.owner_email || "Not added"}
                  </p>
                  <p className="mt-1 text-sm">
                    <b>Phone:</b> {form.owner_phone || "Not added"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
      <p className="mb-5 text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
        {title}
      </p>

      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  helper,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </label>

      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black"
      />

      {helper && <p className="mt-1 text-xs text-neutral-500">{helper}</p>}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </label>

      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black"
      />

      {helper && <p className="mt-1 text-xs text-neutral-500">{helper}</p>}
    </div>
  );
}