"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import AdminTopBar from "@/components/AdminTopBar";

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
  const cleanScore = clampScore(score);

  return (
    <span className="inline-flex rounded-full border border-[#f5b700]/30 bg-[#f5b700]/10 px-3 py-1 text-xs font-black text-[#f5b700]">
      ★ {cleanScore.toFixed(1)}
    </span>
  );
}

export default function LocationsDashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | LocationType>("all");
  const [claimFilter, setClaimFilter] = useState("all");

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true);

      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("*")
        .order("roseout_score", { ascending: false });

      const { data: activities } = await supabase
        .from("activities")
        .select("*")
        .order("roseout_score", { ascending: false });

      const restaurantRows: LocationRow[] =
        restaurants?.map((item: any) => ({
          id: item.id,
          type: "restaurants",
          name: item.restaurant_name || item.name || "Unnamed Restaurant",
          address: item.address || "",
          city: item.city || "",
          state: item.state || "",
          image_url: item.image_url || item.photo_url || item.cover_image_url || null,
          roseout_score: clampScore(Number(item.roseout_score || item.score || 0)),
          view_count: Number(item.view_count || 0),
          click_count: Number(item.click_count || 0),
          claim_status:
            item.claim_status ||
            (item.owner_id || item.claimed ? "claimed" : "unclaimed"),
          owner_name: item.owner_name || "",
          owner_email: item.owner_email || "",
        })) || [];

      const activityRows: LocationRow[] =
        activities?.map((item: any) => ({
          id: item.id,
          type: "activities",
          name: item.activity_name || item.name || "Unnamed Activity",
          address: item.address || "",
          city: item.city || "",
          state: item.state || "",
          image_url: item.image_url || item.photo_url || item.cover_image_url || null,
          roseout_score: clampScore(Number(item.roseout_score || item.score || 0)),
          view_count: Number(item.view_count || 0),
          click_count: Number(item.click_count || 0),
          claim_status:
            item.claim_status ||
            (item.owner_id || item.claimed ? "claimed" : "unclaimed"),
          owner_name: item.owner_name || "",
          owner_email: item.owner_email || "",
        })) || [];

      setRows([...restaurantRows, ...activityRows]);
      setLoading(false);
    };

    loadLocations();
  }, [supabase]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const q = search.toLowerCase().trim();

      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.owner_name.toLowerCase().includes(q) ||
        item.owner_email.toLowerCase().includes(q);

      const matchesType = typeFilter === "all" || item.type === typeFilter;

      const matchesClaim =
        claimFilter === "all" ||
        item.claim_status?.toLowerCase() === claimFilter;

      return matchesSearch && matchesType && matchesClaim;
    });
  }, [rows, search, typeFilter, claimFilter]);

  const total = rows.length;
  const restaurantCount = rows.filter((x) => x.type === "restaurants").length;
  const activityCount = rows.filter((x) => x.type === "activities").length;
  const claimed = rows.filter((x) => x.claim_status === "claimed").length;
  const unclaimed = total - claimed;

  const stats = [
    { label: "Total", value: total },
    { label: "Restaurants", value: restaurantCount },
    { label: "Activities", value: activityCount },
    { label: "Claimed", value: claimed },
    { label: "Unclaimed", value: unclaimed },
  ];

  return (
    <main className="h-screen overflow-hidden bg-[#030303] text-white">
      <AdminTopBar />

      <div className="mx-auto flex h-[calc(100vh-73px)] max-w-7xl flex-col px-6 py-5">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f5b700]">
              RoseOut Admin
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Locations Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage restaurants, activities, claims, scores, and listing quality.
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            className="rounded-full border border-white/15 bg-[#181818] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#252525]"
          >
            Back to Admin
          </Link>
        </header>

        <section className="mb-4 grid grid-cols-5 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/15 bg-[#181818]/90 p-4"
            >
              <p className="text-xs font-bold text-zinc-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-black text-[#f5b700]">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-4 rounded-2xl border border-white/15 bg-[#181818]/90 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_190px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations, owner, city..."
              className="rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#f5b700]"
            />

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | LocationType)
              }
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
        </section>

        <section className="flex-1 overflow-hidden rounded-2xl border border-white/15 bg-[#181818]/90 shadow-2xl">
          <div className="grid border-b border-white/15 bg-[#101010] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-400 lg:grid-cols-[90px_1fr_120px_110px_80px_80px_125px_90px]">
            <div>Image</div>
            <div>Location</div>
            <div>Type</div>
            <div>Score</div>
            <div>Views</div>
            <div>Clicks</div>
            <div>Claim</div>
            <div className="text-right">Edit</div>
          </div>

          <div className="h-full overflow-y-auto pb-14">
            {loading ? (
              <div className="p-10 text-center text-sm text-zinc-400">
                Loading locations...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-zinc-400">
                No locations found.
              </div>
            ) : (
              filteredRows.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="grid items-center border-b border-white/10 px-4 py-3 transition hover:bg-white/[0.03] lg:grid-cols-[90px_1fr_120px_110px_80px_80px_125px_90px]"
                >
                  <div>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-14 w-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-20 items-center justify-center rounded-xl border border-white/10 bg-[#050505] text-[10px] font-bold text-zinc-500">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {item.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {[item.address, item.city, item.state]
                        .filter(Boolean)
                        .join(", ") || "No address"}
                    </p>
                    {(item.owner_name || item.owner_email) && (
                      <p className="mt-1 truncate text-[11px] text-zinc-600">
                        Owner: {item.owner_name || item.owner_email}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="rounded-full border border-[#f5b700]/30 bg-[#f5b700]/10 px-3 py-1 text-xs font-bold text-[#f5b700]">
                      {item.type === "restaurants" ? "Restaurant" : "Activity"}
                    </span>
                  </div>

                  <div>
                    <ScoreBadge score={item.roseout_score} />
                  </div>

                  <div className="text-sm font-bold text-zinc-300">
                    {item.view_count}
                  </div>

                  <div className="text-sm font-bold text-zinc-300">
                    {item.click_count}
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.claim_status === "claimed"
                          ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : item.claim_status === "pending"
                            ? "border border-[#f5b700]/30 bg-[#f5b700]/10 text-[#f5b700]"
                            : "border border-white/15 bg-white/5 text-zinc-400"
                      }`}
                    >
                      {item.claim_status || "unclaimed"}
                    </span>
                  </div>

                  <div className="text-right">
                    <Link
                      href={`/locations/${item.type}/${item.id}?from=/locations/dashboard`}
                      className="inline-flex rounded-full bg-[#f5b700] px-4 py-2 text-xs font-black text-black hover:bg-[#ffd24a]"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}