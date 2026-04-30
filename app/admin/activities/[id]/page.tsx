"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AdminActivityDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const id = params.id as string;

  const [activity, setActivity] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const load = async () => {
    const res = await fetch(`/api/admin/activities/${id}`);
    const data = await res.json();

    setActivity(data.activity);
    setForm(data.activity || {});
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);

    await fetch(`/api/admin/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="px-6 py-10 text-white">
      <a href="/admin" className="text-sm underline">
        ← Back to Admin
      </a>

      <h1 className="mt-4 text-4xl font-bold">
        {form.activity_name || "Unnamed Activity"}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">Basic Info</h2>

            <div className="mt-4 grid gap-3">
              <input
                className="rounded-xl border px-4 py-3"
                value={form.activity_name || ""}
                onChange={(e) => update("activity_name", e.target.value)}
                placeholder="Activity Name"
              />

              <input
                className="rounded-xl border px-4 py-3"
                value={form.address || ""}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Address"
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">Scores</h2>

            <div className="mt-5 grid gap-5">
              <ScoreSlider
                label="Rating"
                value={form.rating || 0}
                max={5}
                step={0.1}
                onChange={(v) => update("rating", v)}
              />

              <ScoreSlider
                label="Review Count"
                value={form.review_count || 0}
                max={500}
                step={1}
                onChange={(v) => update("review_count", v)}
              />

              <ScoreSlider
                label="Quality Score"
                value={form.quality_score || 0}
                max={100}
                step={1}
                onChange={(v) => update("quality_score", v)}
              />

              <ScoreSlider
                label="Popularity Score"
                value={form.popularity_score || 0}
                max={100}
                step={1}
                onChange={(v) => update("popularity_score", v)}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-white p-6 text-black">
            <h2 className="text-xl font-bold">Actions</h2>

            <button
              onClick={save}
              className="mt-4 w-full rounded-full bg-yellow-500 px-6 py-3 font-bold text-black"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </section>
        </aside>
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
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-700">
          {label}
        </label>

        <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          {numericValue}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
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
        className="mt-3 w-full accent-yellow-500"
      />
    </div>
  );
}