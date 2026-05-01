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

      {/* COMPACT RANKING ROW */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          <CompactRankingSection
            title="Trending Now"
            subtitle="Live Ranking Engine"
            restaurants={trendingRestaurants || []}
          />

          <CompactRankingSection
            title="Top 10%"
            subtitle="Best of RoseOut"
            restaurants={topRestaurants || []}
          />

          <CompactRankingSection
            title="Ready to Book"
            subtitle="High Intent Picks"
            restaurants={highIntentPicks || []}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
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

function CompactRankingSection({
  title,
  subtitle,
  restaurants,
}: {
  title: string;
  subtitle: string;
  restaurants: any[];
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-300">
        {subtitle}
      </p>

      <h2 className="mt-2 text-2xl font-black">{title}</h2>

      <div className="mt-5 space-y-3">
        {restaurants?.length ? (
          restaurants.slice(0, 3).map((restaurant) => {
            const name =
              restaurant.restaurant_name || restaurant.name || "Restaurant";

            const image = restaurant.image_url || restaurant.photo_url;

            return (
              <Link
                key={restaurant.id}
                href={`/locations/restaurants/${restaurant.id}`}
                className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 transition hover:border-rose-400/40 hover:bg-rose-500/10"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🍽️
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-black">{name}</h3>

                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                      {Math.round(restaurant.roseout_score || 0)}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-white/40">
                    {restaurant.cuisine || "Restaurant"}
                  </p>

                  <p className="mt-1 truncate text-xs text-white/35">
                    {[restaurant.city, restaurant.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  {restaurant.ranking_badge && (
                    <span className="mt-2 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50">
                      {restaurant.ranking_badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center">
            <p className="text-sm font-bold text-white/40">
              No ranked locations yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}