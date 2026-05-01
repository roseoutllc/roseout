"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

type LocationType = "restaurants" | "activities";

type LocationRow = {
  id: string;
  type: LocationType;
  name: string;
  address: string;
  city: string;
  state: string;
  image_url: string | null;
  roseout_score: number;
  view_count: number;
  click_count: number;
  claim_status: string;
  owner_name: string;
  owner_email: string;
};

function clampScore(score: number) {
  if (!score || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

function ScoreBadge({ score }: { score: number }) {
  const clean = clampScore(score);

  return (
    <span className="inline-flex rounded-full border border-[#f5b700]/30 bg-[#f5b700]/10 px-3 py-1 text-xs font-black text-[#f5b700]">
      ★ {clean.toFixed(1)}
    </span>
  );
}

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | LocationType>("all");
  const [claimFilter, setClaimFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("*");

      const { data: activities } = await supabase
        .from("activities")
        .select("*");

      const r =
        restaurants?.map((x: any) => ({
          id: x.id,
          type: "restaurants",
          name: x.restaurant_name || x.name || "Unnamed",
          address: x.address || "",
          city: x.city || "",
          state: x.state || "",
          image_url: x.image_url || null,
          roseout_score: clampScore(Number(x.roseout_score || 0)),
          view_count: Number(x.view_count || 0),
          click_count: Number(x.click_count || 0),
          claim_status:
            x.claim_status ||
            (x.owner_id || x.claimed ? "claimed" : "unclaimed"),
          owner_name: x.owner_name || "",
          owner_email: x.owner_email || "",
        })) || [];

      const a =
        activities?.map((x: any) => ({
          id: x.id,
          type: "activities",
          name: x.activity_name || x.name || "Unnamed",
          address: x.address || "",
          city: x.city || "",
          state: x.state || "",
          image_url: x.image_url || null,
          roseout_score: clampScore(Number(x.roseout_score || 0)),
          view_count: Number(x.view_count || 0),
          click_count: Number(x.click_count || 0),
          claim_status:
            x.claim_status ||
            (x.owner_id || x.claimed ? "claimed" : "unclaimed"),
          owner_name: x.owner_name || "",
          owner_email: x.owner_email || "",
        })) || [];

      setRows([...r, ...a]);
      setLoading(false);
    };

    load();
  }, [supabase]);

  const filtered = useMemo(() => {
    return rows.filter((x) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        x.name.toLowerCase().includes(q) ||
        x.city.toLowerCase().includes(q) ||
        x.address.toLowerCase().includes(q) ||
        x.owner_name.toLowerCase().includes(q);

      const matchType = typeFilter === "all" || x.type === typeFilter;

      const matchClaim =
        claimFilter === "all" ||
        x.claim_status.toLowerCase() === claimFilter;

      return matchSearch && matchType && matchClaim;
    });
  }, [rows, search, typeFilter, claimFilter]);

  const total = rows.length;
  const claimed = rows.filter((x) => x.claim_status === "claimed").length;
  const unclaimed = total - claimed;

  return (
    <main className="h-screen overflow-hidden bg-[#030303] text-white">
      <AdminTopBar />

      <div className="mx-auto flex h-[calc(100vh-73px)] max-w-7xl flex-col px-6 py-5">
        {/* HEADER */}
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f5b700]">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-black">
            Locations Overview
          </h1>
        </div>

        {/* STATS */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/15 bg-[#181818]/90 p-4">
            <p className="text-xs text-zinc-400">Total</p>
            <p className="text-2xl font-black text-[#f5b700]">{total}</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-[#181818]/90 p-4">
            <p className="text-xs text-zinc-400">Claimed</p>
            <p className="text-2xl font-black text-[#f5b700]">{claimed}</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-[#181818]/90 p-4">
            <p className="text-xs text-zinc-400">Unclaimed</p>
            <p className="text-2xl font-black text-[#f5b700]">{unclaimed}</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-white focus:border-[#f5b700]"
          />

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | LocationType)
            }
            className="rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-white"
          >
            <option value="all">All</option>
            <option value="restaurants">Restaurants</option>
            <option value="activities">Activities</option>
          </select>

          <select
            value={claimFilter}
            onChange={(e) => setClaimFilter(e.target.value)}
            className="rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-white"
          >
            <option value="all">All</option>
            <option value="claimed">Claimed</option>
            <option value="unclaimed">Unclaimed</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-white/15 bg-[#181818]/90">
          <div className="grid grid-cols-[80px_1fr_100px_100px_80px] border-b border-white/10 p-3 text-xs text-zinc-400">
            <div>Image</div>
            <div>Name</div>
            <div>Score</div>
            <div>Type</div>
            <div>Edit</div>
          </div>

          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="p-6 text-zinc-400">Loading...</div>
            ) : (
              filtered.map((x) => (
                <div
                  key={x.id}
                  className="grid grid-cols-[80px_1fr_100px_100px_80px] items-center border-b border-white/10 p-3 hover:bg-white/[0.03]"
                >
                  <div>
                    {x.image_url ? (
                      <img
                        src={x.image_url}
                        className="h-12 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-16 bg-black" />
                    )}
                  </div>

                  <div>
                    <p className="font-bold">{x.name}</p>
                    <p className="text-xs text-zinc-500">{x.city}</p>
                  </div>

                  <ScoreBadge score={x.roseout_score} />

                  <div className="text-sm text-zinc-400">{x.type}</div>

                  <Link
                    href={`/locations/${x.type}/${x.id}?from=/locations/dashboard`}
                    className="rounded bg-[#f5b700] px-3 py-1 text-xs font-bold text-black"
                  >
                    Edit
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}