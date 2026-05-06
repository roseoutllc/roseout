import Link from "next/link";
import { requireAdminRole } from "@/lib/admin-auth";
import AdminMessagingCenter from "./AdminMessagingCenter";

export const dynamic = "force-dynamic";

export default async function AdminMessagingPage() {
  await requireAdminRole(["superuser", "admin", "editor"]);

  return (
    <main className="min-h-screen bg-[#090706] px-4 pb-12 pt-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.24),transparent_34%),linear-gradient(135deg,#170b0b,#090706_58%,#14100c)] p-5 shadow-2xl sm:p-7">
          <div className="absolute right-[-60px] top-[-60px] h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute bottom-[-70px] left-24 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-rose-300">
                Admin Messaging
              </p>

              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                Email + Text Center
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                Search RoseOut users and locations, choose preselected copy,
                or enter a manual contact to send one-off email and SMS outreach.
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="inline-flex rounded-full border border-white/10 bg-white/[0.07] px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

        <AdminMessagingCenter />
      </div>
    </main>
  );
}
