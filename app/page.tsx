import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

export default async function HomePage() {
  const supabase = adminSupabase();

  const { data: topRestaurants } = await supabase
    .from("restaurants")
    .select(
      "id,restaurant_name,name,cuisine,city,state,image_url,photo_url,roseout_score,ranking_badge,trend_score,conversion_score"
    )
    .eq("ranking_badge", "Top 10%")
    .order("roseout_score", { ascending: false })
    .limit(6);

  const { data: trendingRestaurants } = await supabase
    .from("restaurants")
    .select(
      "id,restaurant_name,name,cuisine,city,state,image_url,photo_url,roseout_score,ranking_badge,trend_score,conversion_score"
    )
    .order("trend_score", { ascending: false })
    .limit(6);

  const { data: highIntentPicks } = await supabase
    .from("restaurants")
    .select(
      "id,restaurant_name,name,cuisine,city,state,image_url,photo_url,roseout_score,ranking_badge,trend_score,conversion_score"
    )
    .order("conversion_score", { ascending: false })
    .limit(6);

  return (
    <main className="min-h-screen bg-[#050305] text-white">
      {/* NAV */}
      <section className="absolute left-0 right-0 top-0 z-20 px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-xl font-black">
            RoseOut
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="rounded-full bg-rose-500 px-5 py-2 text-sm font-black text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-400"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.28),transparent_38%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_38%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050305] to-transparent" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-rose-300">
            RoseOut
          </p>

          <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl">
            Plan Perfect Outings
            <br />
            <span className="text-rose-400">In One Sentence</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
            Tell RoseOut your vibe, budget, borough, and mood. We’ll build the
            perfect restaurant, activity, or full outing instantly.
          </p>

          {/* ONLY ONE BUTTON NOW */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/create"
              className="rounded-full bg-rose-500 px-10 py-5 text-lg font-black text-white shadow-2xl shadow-rose-500/30 transition hover:bg-rose-400"
            >
              Start Planning →
            </Link>
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section id="trending" className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeader
          title="Trending Now"
          subtitle="Live Ranking Engine"
        />
        <RestaurantGrid restaurants={trendingRestaurants || []} />
      </section>

      {/* TOP 10% */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeader
          title="Top 10% Restaurants"
          subtitle="Best of RoseOut"
        />
        <RestaurantGrid restaurants={topRestaurants || []} />
      </section>

      {/* HIGH INTENT */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeader
          title="Ready to Book"
          subtitle="High Intent Picks"
        />
        <RestaurantGrid restaurants={highIntentPicks || []} />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="text-5xl font-black">
          Ready to Plan Your Next Outing?
        </h2>

        <p className="mt-6 text-lg text-white/60">
          Stop scrolling. Start experiencing.
        </p>

        <Link
          href="/create"
          className="mt-10 inline-flex rounded-full bg-rose-500 px-10 py-5 text-lg font-black text-white shadow-2xl shadow-rose-500/30 transition hover:bg-rose-400"
        >
          Start Your Outing →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/40">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} RoseOut</span>

          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>

          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>

          <Link href="/signup" className="hover:text-white">
            Create Account
          </Link>

          <Link href="/login" className="hover:text-white">
            Sign In
          </Link>
        </div>
      </footer>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
        {subtitle}
      </p>
      <h2 className="mt-2 text-4xl font-black">{title}</h2>
    </div>
  );
}

function RestaurantGrid({ restaurants }: { restaurants: any[] }) {
  if (!restaurants?.length) {
    return (
      <div className="text-center text-white/40">
        No ranked locations yet
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((r) => {
        const name = r.restaurant_name || r.name;
        const image = r.image_url || r.photo_url;

        return (
          <Link
            key={r.id}
            href={`/locations/restaurants/${r.id}`}
            className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05]"
          >
            <div className="relative h-56">
              {image ? (
                <img
                  src={image}
                  className="h-full w-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  🍽️
                </div>
              )}

              <div className="absolute left-4 top-4 bg-black/70 px-3 py-1 text-xs rounded-full">
                {r.ranking_badge || "RoseOut"}
              </div>

              <div className="absolute right-4 top-4 bg-rose-500 px-3 py-1 text-xs rounded-full">
                {Math.round(r.roseout_score || 0)}
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-xl font-black">{name}</h3>
              <p className="text-sm text-white/40">
                {[r.city, r.state].filter(Boolean).join(", ")}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}