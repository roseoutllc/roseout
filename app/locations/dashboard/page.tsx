"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase-browser";
import { clampScore } from "@/lib/clampScore";
import ScoreBadge from "@/components/ScoreBadge";

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
  image_url?: string;
  roseout_score?: number;
  quality_score?: number;
  claim_status?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  primary_tag?: string;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selected, setSelected] = useState<LocationItem | null>(null);

  useEffect(() => {
    const load = async () => {
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
    };

    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: locations.length,
      claimed: locations.filter((l) => l.claim_status === "claimed").length,
      unclaimed: locations.filter((l) => l.claim_status !== "claimed").length,
    };
  }, [locations]);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <h1 className="text-3xl font-black mb-6">
          Locations Dashboard
        </h1>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="Total" value={stats.total} />
          <Stat label="Claimed" value={stats.claimed} />
          <Stat label="Unclaimed" value={stats.unclaimed} />
        </div>

        {/* LAYOUT */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-6">

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
                  className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  <div className="flex gap-3 items-center">

                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800">
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT PANEL */}
          <div>
            {selected ? (
              <div className="rounded-3xl bg-white text-black p-6 shadow-2xl">

                {/* IMAGE */}
                {selected.image_url && (
                  <Image
                    src={selected.image_url}
                    alt=""
                    width={900}
                    height={400}
                    className="rounded-xl mb-5"
                  />
                )}

                {/* NAME */}
                <h2 className="text-3xl font-black">
                  {selected.display_name}
                </h2>

                {/* SCORE */}
                <div className="mt-5">
                  <ScoreBadge
                    score={clampScore(
                      selected.roseout_score ??
                        selected.quality_score ??
                        0
                    )}
                  />
                </div>

                {/* TAG */}
                {selected.primary_tag && (
                  <p className="mt-3 font-bold">
                    ✨ {selected.primary_tag}
                  </p>
                )}

                {/* OWNER PANEL */}
                <div className="mt-6 p-4 bg-neutral-100 rounded-xl">
                  <p className="text-xs font-black uppercase text-neutral-500">
                    Owner Info
                  </p>

                  <p className="mt-2 text-sm">
                    {selected.owner_name || "Not set"}
                  </p>

                  <p className="text-sm">
                    {selected.owner_email
                      ? maskEmail(selected.owner_email)
                      : "Not set"}
                  </p>

                  <p className="text-sm">
                    {selected.owner_phone || "Not set"}
                  </p>
                </div>

                {/* QR PANEL */}
                <QRPanel id={selected.id} />

                {/* ACTION */}
                <Link
                  href={`/locations/edit/${selected.location_type}s/${selected.id}`}
                  className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white font-bold"
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

function Stat({ label, value }: any) {
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

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  return name[0] + "***@" + domain;
}