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
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.28),transparent_38%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_38%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050305] to-transparent" />

        <div className="absolute left-0 right-0 top-0 z-20 px-6 py-6">
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
        </div>

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

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/create"
              className="rounded-full bg-rose-500 px-8 py-4 text-sm font-black text-white shadow-xl shadow-rose-500/30 transition hover:bg-rose-400"
            >
              Start Planning →
            </Link>

            <Link
              href="/signup"
              className="rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section id="trending" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
              Live Ranking Engine
            </p>
            <h2 className="mt-2 text-4xl font-black">Trending Now</h2>
          </div>

          <Link
            href="/create"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
          >
            Build My Outing
          </Link>
        </div>

        <RestaurantGrid restaurants={trendingRestaurants || []} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
            Best of RoseOut
          </p>
          <h2 className="mt-2 text-4xl font-black">Top 10% Restaurants</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Restaurants earning the strongest RoseOut score based on ranking
            signals, user clicks, and conversion behavior.
          </p>
        </div>

        <RestaurantGrid restaurants={topRestaurants || []} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
            High Intent Picks
          </p>
          <h2 className="mt-2 text-4xl font-black">
            Places People Are Ready to Book
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Powered by reservation clicks, direction clicks, and user engagement
            signals from RoseOut activity.
          </p>
        </div>

        <RestaurantGrid restaurants={highIntentPicks || []} />
      </section>

      <section className="bg-white text-black">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-600">
                Why It Works
              </p>

              <h2 className="mt-3 text-4xl font-black">Smarter Than Search</h2>

              <p className="mt-5 text-lg leading-8 text-black/70">
                RoseOut ranks places by real behavior — what users view, click,
                save, reserve, and return to. That means better matches and less
                scrolling.
              </p>
            </div>

            <div className="grid gap-4">
              <FeatureCard text="AI-powered outing recommendations" />
              <FeatureCard text="Real-time ranking signals" />
              <FeatureCard text="Top 10% and Trending badges" />
              <FeatureCard text="Personalized restaurant and activity plans" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="text-5xl font-black">Ready to Plan Your Next Outing?</h2>

        <p className="mt-6 text-lg text-white/60">
          Stop scrolling. Start experiencing.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/create"
            className="rounded-full bg-rose-500 px-10 py-5 text-lg font-black text-white shadow-2xl shadow-rose-500/30 transition hover:bg-rose-400"
          >
            Start Your Outing →
          </Link>

          <Link
            href="/signup"
            className="rounded-full border border-white/20 px-10 py-5 text-lg font-black text-white/70 transition hover:bg-white hover:text-black"
          >
            Create Account
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/40">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          <span>© {new Date().getFullYear()} RoseOut. All rights reserved.</span>

          <Link href="/terms" className="hover:text-white">
            Terms of Service
          </Link>

          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
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

function RestaurantGrid({ restaurants }: { restaurants: any[] }) {
  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-10 text-center">
        <h3 className="text-2xl font-black">No ranked restaurants yet</h3>
        <p className="mt-2 text-sm text-white/45">
          Run the Ranking Engine after collecting activity events.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant) => {
        const name =
          restaurant.restaurant_name || restaurant.name || "Restaurant";

        const imageUrl = restaurant.image_url || restaurant.photo_url || null;

        return (
          <Link
            key={restaurant.id}
            href={`/locations/restaurants/${restaurant.id}`}
            className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-rose-400/40 hover:bg-rose-500/10"
          >
            <div className="relative h-56 bg-white/5">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500/20 to-fuchsia-500/10 text-5xl">
                  🍽️
                </div>
              )}

              <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
                {restaurant.ranking_badge || "RoseOut Pick"}
              </div>

              {restaurant.roseout_score ? (
                <div className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white">
                  {Math.round(restaurant.roseout_score)}
                </div>
              ) : null}
            </div>

            <div className="p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">
                {restaurant.cuisine || "Restaurant"}
              </p>

              <h3 className="mt-2 line-clamp-1 text-2xl font-black">
                {name}
              </h3>

              <p className="mt-2 text-sm text-white/45">
                {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <MiniMetric
                  label="Trend"
                  value={Math.round(restaurant.trend_score || 0)}
                />
                <MiniMetric
                  label="Intent"
                  value={Math.round(restaurant.conversion_score || 0)}
                />
                <MiniMetric
                  label="Score"
                  value={Math.round(restaurant.roseout_score || 0)}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-black/30 p-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-wide text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function FeatureCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm font-black shadow-lg shadow-black/5">
      {text}
    </div>
  );
}