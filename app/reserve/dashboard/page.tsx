import Link from "next/link";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString();
}

export default async function ReserveDashboardPage() {
  await requireAdminRole(["superuser", "admin", "editor", "viewer"]);

  // 🔥 Fetch stats
  const { count: totalReservations } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true });

  const { count: upcomingReservations } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .gte("reservation_time", new Date().toISOString());

  const { count: pastReservations } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .lt("reservation_time", new Date().toISOString());

  const { data: latestReservations } = await supabase
    .from("reservations")
    .select("id, name, party_size, reservation_time, status")
    .order("reservation_time", { ascending: true })
    .limit(5);

  return (
    <main className="min-h-screen bg-[#090706] px-4 pb-10 pt-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">

        {/* 🔥 HEADER */}
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,#160b0b,#090706_60%,#140f0a)] p-6 shadow-2xl">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-rose-300">
                RoseOut Reserve
              </p>

              <h1 className="text-3xl font-black sm:text-4xl">
                Reservations Dashboard
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Manage bookings, track activity, and monitor your reservation flow.
              </p>
            </div>

            <Link
              href="/reserve/dashboard/reservations"
              className="rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-6 py-3 text-sm font-black text-white shadow-lg hover:scale-[1.03] transition"
            >
              View All Reservations
            </Link>
          </div>
        </section>

        {/* 🔥 STATS */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-wide text-white/50">
              Total Reservations
            </p>
            <p className="mt-2 text-3xl font-black">
              {formatNumber(totalReservations)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-wide text-white/50">
              Upcoming
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              {formatNumber(upcomingReservations)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-wide text-white/50">
              Past
            </p>
            <p className="mt-2 text-3xl font-black text-white/70">
              {formatNumber(pastReservations)}
            </p>
          </div>
        </section>

        {/* 🔥 QUICK ACTIONS */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link
            href="/reserve/dashboard/reservations"
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 hover:bg-white/[0.08] transition"
          >
            <p className="text-sm font-black">View Reservations</p>
            <p className="text-xs text-white/50 mt-1">
              Manage all bookings
            </p>
          </Link>

          <Link
            href="/reserve/dashboard/reservations?filter=upcoming"
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 hover:bg-white/[0.08] transition"
          >
            <p className="text-sm font-black">Upcoming Bookings</p>
            <p className="text-xs text-white/50 mt-1">
              See upcoming guests
            </p>
          </Link>

          <Link
            href="/reserve/dashboard/reservations?filter=today"
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 hover:bg-white/[0.08] transition"
          >
            <p className="text-sm font-black">Today’s Reservations</p>
            <p className="text-xs text-white/50 mt-1">
              Live service view
            </p>
          </Link>
        </section>

        {/* 🔥 RECENT TABLE */}
        <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-[#f8f3ef] text-black shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-black/10">
            <h2 className="font-black">Latest Reservations</h2>

            <Link
              href="/reserve/dashboard/reservations"
              className="text-xs font-black text-rose-600"
            >
              View all →
            </Link>
          </div>

          {!latestReservations?.length ? (
            <div className="p-10 text-center text-sm text-black/50">
              No reservations yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#efe7df] text-xs uppercase text-black/50">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Party</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {latestReservations.map((r) => (
                  <tr key={r.id} className="border-t border-black/10">
                    <td className="px-4 py-3 font-bold">{r.name}</td>
                    <td className="px-4 py-3">{r.party_size}</td>
                    <td className="px-4 py-3">
                      {new Date(r.reservation_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-bold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

      </div>
    </main>
  );
}