"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";

export default function EditLocationPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const type = params.type as string;
  const id = params.id as string;
  const from = searchParams.get("from");

  const table = type === "activities" ? "activities" : "restaurants";
  const nameField =
    type === "activities" ? "activity_name" : "restaurant_name";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (!data) return;

      setForm({
        ...data,
        name: data[nameField] || "",
      });

      setLoading(false);
    };

    load();
  }, [id, table, nameField, supabase]);

  const update = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const calculateScore = (data: any) => {
    let score = 40;

    if (data.description) score += 10;
    if (data.image_url) score += 10;
    if (data.website) score += 5;
    if (data.reservation_url) score += 5;
    if (data.primary_tag) score += 10;
    if (data.search_keywords) score += 10;
    if (data.date_style_tags) score += 10;

    return clampScore(score);
  };

  const save = async () => {
    setSaving(true);
    setMessage("");

    const payload: any = {
      ...form,
      [nameField]: form.name,
    };

    const score = calculateScore(payload);
    payload.roseout_score = score;

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", id);

    if (error) {
      setMessage("❌ Error saving changes");
      setSaving(false);
      return;
    }

    setMessage(`✅ Saved successfully. Score: ${score}/100`);
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  const score = clampScore(
    form.roseout_score ?? form.quality_score ?? 0
  );

  return (
    <main className="min-h-screen bg-black text-white px-5 py-6">
      <div className="mx-auto max-w-4xl">

        {/* BACK */}
        <button
          onClick={() => router.push(from || "/locations/dashboard")}
          className="mb-4 rounded-full border border-white/20 px-4 py-2 text-sm"
        >
          ← Back
        </button>

        {/* MESSAGE */}
        {message && (
          <div className="mb-4 rounded-xl bg-green-100 text-green-700 p-3 font-bold">
            {message}
          </div>
        )}

        {/* HEADER */}
        <h1 className="text-3xl font-black mb-2">Edit Location</h1>

        <p className="text-yellow-400 font-bold mb-6">
          {score}/100 Score
        </p>

        {/* FORM */}
        <div className="grid gap-4">

          <Input
            label="Name"
            value={form.name}
            onChange={(v) => update("name", v)}
          />

          <Input
            label="Description"
            value={form.description || ""}
            onChange={(v) => update("description", v)}
          />

          <Input
            label="Image URL"
            value={form.image_url || ""}
            onChange={(v) => update("image_url", v)}
          />

          <Input
            label="Website"
            value={form.website || ""}
            onChange={(v) => update("website", v)}
          />

          <Input
            label="Reservation URL"
            value={form.reservation_url || ""}
            onChange={(v) => update("reservation_url", v)}
          />

          <Input
            label="Primary Tag"
            value={form.primary_tag || ""}
            onChange={(v) => update("primary_tag", v)}
          />

          <Input
            label="Search Keywords"
            value={form.search_keywords || ""}
            onChange={(v) => update("search_keywords", v)}
          />

          <Input
            label="Date Style Tags"
            value={form.date_style_tags || ""}
            onChange={(v) => update("date_style_tags", v)}
          />

        </div>

        {/* SAVE */}
        <button
          onClick={save}
          disabled={saving}
          className="mt-6 w-full bg-yellow-500 text-black py-3 rounded-full font-bold"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase text-neutral-400 mb-1">{label}</p>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-xl bg-white/10 border border-white/10"
      />
    </div>
  );
}