"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";

type LocationType = "restaurant" | "activity";

type LocationItem = {
  id: string;
  location_type: LocationType;
  display_name: string;
  restaurant_name?: string;
  activity_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  roseout_score?: number;
  quality_score?: number;
  status?: string;
  claimed?: boolean;
  claim_status?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  website?: string;
  reservation_url?: string;
  reservation_link?: string;
  primary_tag?: string;
  date_style_tags?: string[];
};

export default function DashboardPage() {
  const supabase = createClient();

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selected, setSelected] = useState<LocationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("*");

      const { data: activities } = await supabase
        .from("activities")
        .select("*");

      const combined: LocationItem[] = [
        ...(restaurants || []).map((r: any) => ({
          ...r,
          location_type: "restaurant",
          display_name: r.restaurant_name,
        })),
        ...(activities || []).map((a: any) => ({
          ...a,
          location_type: "activity",
          display_name: a.activity_name,
        })),
      ];

      setLocations(combined);
      setLoading(false);
    };

    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: locations.length,
      claimed: locations.filter(
        (l) => l.claim_status === "claimed" || l.claimed
      ).length,
      unclaimed: locations.filter(
        (l) => l.claim_status !== "claimed"
      ).length,
    };
  }, [locations]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Claimed" value={stats.claimed} />
          <StatCard label="Unclaimed" value={stats.unclaimed} />
        </div>

        {/* GRID */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

          {/* LEFT LIST */}
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {locations.map((loc) => {
              const score = clampScore(
                loc.roseout_score ?? loc.quality_score ?? 0
              );

              return (
                <div
                  key={loc.id}
                  onClick={() => setSelected(loc)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-20 bg-neutral-800 rounded-lg overflow-hidden">
                      {loc.image_url && (
                        <Image
                          src={loc.image_url}
                          alt=""
                          width={100}
                          height={100}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {loc.display_name}
                      </p>

                      <p className="text-xs text-neutral-400">
                        {loc.city}
                      </p>

                      <p className="text-xs font-bold text-yellow-400 mt-1">
                        {score}/100
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT PANEL */}
          <div>
            {selected ? (
              <div className="rounded-2xl bg-white text-black p-6 shadow-2xl">

                {/* IMAGE */}
                {selected.image_url && (
                  <Image
                    src={selected.image_url}
                    alt=""
                    width={800}
                    height={400}
                    className="rounded-xl mb-4"
                  />
                )}

                {/* NAME */}
                <h2 className="text-3xl font-black">
                  {selected.display_name}
                </h2>

                {/* SCORE */}
                <p className="mt-2 font-bold">
                  {clampScore(
                    selected.roseout_score ??
                      selected.quality_score ??
                      0
                  )}
                  /100 Match
                </p>

                {/* TAG */}
                {selected.primary_tag && (
                  <p className="mt-2 text-sm">
                    ✨ {selected.primary_tag}
                  </p>
                )}

                {/* OWNER */}
                <div className="mt-6 p-4 bg-neutral-100 rounded-xl">
                  <p className="text-xs font-black uppercase text-neutral-500">
                    Owner
                  </p>

                  <p className="mt-2 text-sm">
                    {selected.owner_name || "Not set"}
                  </p>

                  <p className="text-sm">
                    {selected.owner_email || "Not set"}
                  </p>

                  <p className="text-sm">
                    {selected.owner_phone || "Not set"}
                  </p>
                </div>

                {/* QR */}
                <QRPanel id={selected.id} />

                {/* EDIT */}
                <Link
                  href={`/locations/edit/${selected.location_type}s/${selected.id}`}
                  className="mt-6 inline-block rounded-full bg-black px-5 py-3 text-white font-bold"
                >
                  Edit Location
                </Link>
              </div>
            ) : (
              <div className="text-center text-neutral-400 mt-20">
                Select a location
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* COMPONENTS */

function StatCard({ label, value }: any) {
  return (
    <div className="bg-white/10 p-4 rounded-xl text-center">
      <p className="text-xs uppercase text-neutral-400">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function QRPanel({ id }: { id: string }) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/claim?id=${id}`;

    QRCode.toDataURL(url).then(setQr);
  }, [id]);

  return (
    <div className="mt-6">
      <p className="text-xs font-black uppercase text-neutral-500">
        Claim QR
      </p>

      {qr && (
        <img
          src={qr}
          alt="QR"
          className="mt-2 w-40 h-40"
        />
      )}
    </div>
  );
}