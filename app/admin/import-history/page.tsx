import { supabase } from "@/lib/supabase";
import { requireAdminRole } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

type ImportLog = {
  id: string;
  job_name: string | null;
  run_date: string | null;
  created_at: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
  }>;
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

async function runGoogleImport() {
  "use server";

  try {
    await requireAdminRole(["superuser", "admin"]);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const importSecret = process.env.IMPORT_SECRET;

    if (!baseUrl) {
      redirect("/admin/import-history?error=Missing NEXT_PUBLIC_SITE_URL");
    }

    if (!importSecret) {
      redirect("/admin/import-history?error=Missing IMPORT_SECRET");
    }

    const res = await fetch(`${baseUrl}/api/google/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-import-secret": importSecret,
      },
      body: JSON.stringify({
        query: "restaurants in Queens NY",
        type: "restaurant",
      }),
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      redirect(
        `/admin/import-history?error=${encodeURIComponent(
          `Import failed: ${text}`
        )}`
      );
    }

    revalidatePath("/admin/import-history");
    redirect("/admin/import-history?message=Google import started successfully");
  } catch (error: any) {
    redirect(
      `/admin/import-history?error=${encodeURIComponent(
        error?.message || "Import failed"
      )}`
    );
  }
}

export default async function ImportHistoryPage({ searchParams }: PageProps) {
  await requireAdminRole(["superuser", "admin", "viewer"]);

  const params = await searchParams;
  const message = params?.message;
  const pageError = params?.error;

  const today = getTodayDate();

  const { data: logs, error } = await supabase
    .from("import_logs")
    .select("id, job_name, run_date, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const lastRunToday = logs?.some((log) => log.run_date === today);
  const latestRun = logs?.[0];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
              RoseOut Admin
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight">
              Import History
            </h1>

            <p className="mt-3 text-neutral-400">
              View when your Google import cron job last ran.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <form action={runGoogleImport}>
              <button
                type="submit"
                className="rounded-2xl bg-yellow-500 px-5 py-4 text-sm font-bold text-black transition hover:bg-yellow-400"
              >
                Run Google Import
              </button>
            </form>

            <div
              className={`rounded-2xl px-5 py-4 text-sm font-bold ${
                lastRunToday
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {lastRunToday ? "✅ Last Run Today" : "⚠️ Not Run Today"}
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl bg-green-100 p-4 text-green-700">
            {message}
          </div>
        )}

        {pageError && (
          <div className="mb-6 rounded-2xl bg-red-100 p-4 text-red-700">
            {pageError}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-100 p-4 text-red-700">
            {error.message}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              Today Status
            </p>
            <p
              className={`mt-2 text-2xl font-extrabold ${
                lastRunToday ? "text-green-400" : "text-red-400"
              }`}
            >
              {lastRunToday ? "Completed" : "Pending"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              Latest Run Date
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              {latestRun?.run_date || "N/A"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              Total Logs
            </p>
            <p className="mt-2 text-2xl font-extrabold">{logs?.length || 0}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white text-black shadow-2xl">
          <div className="border-b border-neutral-200 p-5">
            <h2 className="text-xl font-bold">Recent Import Runs</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Showing the latest 100 import logs.
            </p>
          </div>

          {!logs?.length ? (
            <div className="p-8 text-center text-neutral-500">
              No import history found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-5 py-4">Job Name</th>
                    <th className="px-5 py-4">Run Date</th>
                    <th className="px-5 py-4">Ran At</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {(logs as ImportLog[]).map((log) => {
                    const isToday = log.run_date === today;

                    return (
                      <tr
                        key={log.id}
                        className="border-t border-neutral-200 hover:bg-neutral-50"
                      >
                        <td className="px-5 py-4 font-bold">
                          {log.job_name || "Unknown Job"}
                        </td>

                        <td className="px-5 py-4">{log.run_date || "N/A"}</td>

                        <td className="px-5 py-4">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString()
                            : "N/A"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                              isToday
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {isToday ? "Today" : "Completed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}