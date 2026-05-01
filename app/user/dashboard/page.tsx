import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function UserDashboardPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: savedPlans } = await supabase
    .from("saved_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <main className="min-h-screen bg-[#0b0507] text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-rose-300">
              RoseOut Portal
            </p>
            <h1 className="mt-2 text-4xl font-bold md:text-5xl">
              Welcome back
            </h1>
            <p className="mt-3 max-w-2xl text-white/60">
              Manage your saved outings, subscription, and personalized date
              night history.
            </p>
          </div>

          <Link
            href="/create"
            className="rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400"
          >
            Create New Outing
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm text-white/50">Saved Plans</p>
            <h2 className="mt-2 text-3xl font-bold">
              {savedPlans?.length || 0}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm text-white/50">Account Status</p>
            <h2 className="mt-2 text-3xl font-bold">
              {profile?.stripe_subscription_id ? "Active" : "Free"}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm text-white/50">Email</p>
            <h2 className="mt-2 break-all text-lg font-semibold">
              {user.email}
            </h2>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recent Saved Plans</h2>
              <p className="mt-1 text-sm text-white/50">
                Your most recent RoseOut searches.
              </p>
            </div>

            <Link
              href="/user/saved"
              className="text-sm font-semibold text-rose-300 hover:text-rose-200"
            >
              View All
            </Link>
          </div>

          {!savedPlans || savedPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
              <h3 className="text-xl font-bold">No saved plans yet</h3>
              <p className="mt-2 text-white/50">
                Create your first outing and save it here.
              </p>
              <Link
                href="/create"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
              >
                Start Planning
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {savedPlans.map((plan: any) => (
                <div
                  key={plan.id}
                  className="rounded-3xl border border-white/10 bg-black/30 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-rose-300">
                    Saved Outing
                  </p>
                  <h3 className="mt-3 line-clamp-2 text-xl font-bold">
                    {plan.title || "RoseOut Plan"}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm text-white/55">
                    {plan.summary || "Your saved date night plan."}
                  </p>

                  <Link
                    href={`/user/saved/${plan.id}`}
                    className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
                  >
                    View Plan
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}