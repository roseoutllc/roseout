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

      const { data: restaurants } = await supabase.from("restaurants").select("*");
      const { data: activities } = await supabase.from("activities").select("*");

      const r: LocationRow[] =
        restaurants?.map((x: any) => ({
          id: String(x.id),
          type: "restaurants" as LocationType,
          name: x.restaurant_name || x.name || "Unnamed Restaurant",
          address: x.address || "",
          city: x.city || "",
          state: x.state || "",
          image_url: x.image_url || x.photo_url || x.cover_image_url || null,
          roseout_score: clampScore(Number(x.roseout_score || x.score || 0)),
          view_count: Number(x.view_count || 0),
          click_count: Number(x.click_count || 0),
          claim_status:
            x.claim_status || (x.owner_id || x.claimed ? "claimed" : "unclaimed"),
          owner_name: x.owner_name || "",
          owner_email: x.owner_email || "",
        })) || [];

      const a: LocationRow[] =
        activities?.map((x: any) => ({
          id: String(x.id),
          type: "activities" as LocationType,
          name: x.activity_name || x.name || "Unnamed Activity",
          address: x.address || "",
          city: x.city || "",
          state: x.state || "",
          image_url: x.image_url || x.photo_url || x.cover_image_url || null,
          roseout_score: clampScore(Number(x.roseout_score || x.score || 0)),
          view_count: Number(x.view_count || 0),
          click_count: Number(x.click_count || 0),
          claim_status:
            x.claim_status || (x.owner_id || x.claimed ? "claimed" : "unclaimed"),
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
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        x.name.toLowerCase().includes(q) ||
        x.city.toLowerCase().includes(q) ||
        x.state.toLowerCase().includes(q) ||
        x.address.toLowerCase().includes(q) ||
        x.owner_name.toLowerCase().includes(q) ||
        x.owner_email.toLowerCase().includes(q);

      const matchType = typeFilter === "all" || x.type === typeFilter;

      const matchClaim =
        claimFilter === "all" || x.claim_status.toLowerCase() === claimFilter;

      return matchSearch && matchType && matchClaim;
    });
  }, [rows, search, typeFilter, claimFilter]);

  const total = rows.length;
  const restaurantsCount = rows.filter((x) => x.type === "restaurants").length;
  const activitiesCount = rows.filter((x) => x.type === "activities").length;
  const claimed = rows.filter((x) => x.claim_status === "claimed").length;
  const unclaimed = total - claimed;

  return (
    <main className="h-screen overflow-hidden bg-[#030303] text-white">
      <AdminTopBar />

      <div className="mx-auto flex h-[calc(100vh-73px)] max-w-7xl flex-col px-6 py-5">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f5b700]">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-black">Locations Overview</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage restaurants, activities, claims, scores, and listing quality.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-5 gap-3">
          {[
            ["Total", total],
            ["Restaurants", restaurantsCount],
            ["Activities", activitiesCount],
            ["Claimed", claimed],
            ["Unclaimed", unclaimed],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/15 bg-[#181818]/90 p-4"
            >
              <p className="text-xs text-zinc-400">{label}</p>
              <p className="text-2xl font-black text-[#f5b700]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations, city, owner..."
            className="rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#f5b700]"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | LocationType)}
            className="rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#f5b700]"
          >
            <option value="all">All Types</option>
            <option value="restaurants">Restaurants</option>
            <option value="activities">Activities</option>
          </select>

          <select
            value={claimFilter}
            onChange={(e) => setClaimFilter(e.target.value)}
            className="rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#f5b700]"
          >
            <option value="all">All Claims</option>
            <option value="claimed">Claimed</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="flex-1 overflow-hidden rounded-2xl border border-white/15 bg-[#181818]/90 shadow-2xl">
          <div className="grid grid-cols-[80px_1fr_110px_110px_80px_80px_120px_150px] border-b border-white/10 bg-[#101010] p-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
            <div>Image</div>
            <div>Name</div>
            <div>Score</div>
            <div>Type</div>
            <div>Views</div>
            <div>Clicks</div>
            <div>Claim</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="h-full overflow-y-auto pb-14">
            {loading ? (
              <div className="p-6 text-sm text-zinc-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-sm text-zinc-400">No locations found.</div>
            ) : (
              filtered.map((x) => (
                <div
                  key={`${x.type}-${x.id}`}
                  className="grid grid-cols-[80px_1fr_110px_110px_80px_80px_120px_150px] items-center border-b border-white/10 p-3 transition hover:bg-white/[0.03]"
                >
                  <div>
                    {x.image_url ? (
                      <img
                        src={x.image_url}
                        alt={x.name}
                        className="h-12 w-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-xl border border-white/10 bg-[#050505] text-[10px] font-bold text-zinc-600">
                        No Img
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{x.name}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {[x.address, x.city, x.state].filter(Boolean).join(", ") ||
                        "No address"}
                    </p>
                  </div>

                  <div>
                    <ScoreBadge score={x.roseout_score} />
                  </div>

                  <div>
                    <span className="rounded-full border border-[#f5b700]/30 bg-[#f5b700]/10 px-3 py-1 text-xs font-bold text-[#f5b700]">
                      {x.type === "restaurants" ? "Restaurant" : "Activity"}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-zinc-300">{x.view_count}</div>
                  <div className="text-sm font-bold text-zinc-300">{x.click_count}</div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        x.claim_status === "claimed"
                          ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : x.claim_status === "pending"
                            ? "border border-[#f5b700]/30 bg-[#f5b700]/10 text-[#f5b700]"
                            : "border border-white/15 bg-white/5 text-zinc-400"
                      }`}
                    >
                      {x.claim_status || "unclaimed"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/locations/${x.type}/${x.id}?from=/admin/dashboard`}
                      className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                    >
                      View
                    </Link>

                    <Link
                      href={`/locations/edit/${x.type}/${x.id}?from=/admin/dashboard`}
                      className="inline-flex rounded-full bg-[#f5b700] px-3 py-1.5 text-xs font-black text-black hover:bg-[#ffd24a]"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}