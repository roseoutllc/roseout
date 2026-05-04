"use client";

import { useEffect, useState } from "react";

type ImportLog = {
  id: string;
  job_name: string;
  run_date: string;
  meta: any;
  error: string | null;
};

export default function ImportHistoryPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/import-logs", {
        cache: "no-store",
      });

      const data = await res.json();

      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch import logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunImport = async () => {
    try {
      setRunning(true);

      const res = await fetch("/api/admin/run-google-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "both",
          limit: 10,
          batch: "fun",
          areas: "Queens",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Google import failed");
        return;
      }

      alert(
        `Imported: ${data.imported || 0}\nSkipped: ${
          data.skipped || 0
        }\nFailed: ${data.failed || 0}`
      );

      await fetchLogs();
    } catch (err) {
      console.error("Run import failed:", err);
      alert("Google import failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090506] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
              RoseOut Admin
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Google Import History
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Run a balanced Google import for restaurants and activities, then
              review recent import logs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunImport}
            disabled={running}
            className="rounded-full bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
          >
            {running ? "Running Import..." : "Run Google Import"}
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              Last Run
            </p>
            <p className="mt-2 text-lg font-semibold">
              {logs[0]?.run_date || "No runs yet"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              Last Imported
            </p>
            <p className="mt-2 text-lg font-semibold">
              {logs[0]?.meta?.imported ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              Status
            </p>
            <p
              className={`mt-2 text-lg font-semibold ${
                logs[0]?.error ? "text-red-300" : "text-emerald-300"
              }`}
            >
              {logs.length === 0
                ? "Waiting"
                : logs[0]?.error
                  ? "Error"
                  : "Success"}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Import Logs</h2>

            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-rose-400 hover:text-white disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading && logs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-sm text-zinc-400">
              Loading import logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-sm text-zinc-400">
              No import history yet.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {log.job_name || "Google Import"}
                      </p>
                      <p className="text-sm text-zinc-500">{log.run_date}</p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        log.error
                          ? "bg-red-500/10 text-red-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {log.error ? "Error" : "Success"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-xs text-zinc-500">Imported</p>
                      <p className="mt-1 text-lg font-bold">
                        {log.meta?.imported ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-xs text-zinc-500">Skipped</p>
                      <p className="mt-1 text-lg font-bold">
                        {log.meta?.skipped ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-xs text-zinc-500">Failed</p>
                      <p className="mt-1 text-lg font-bold">
                        {log.meta?.failed ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-xs text-zinc-500">Found</p>
                      <p className="mt-1 text-lg font-bold">
                        {log.meta?.total_found_from_google ??
                          log.meta?.restaurant?.total_found_from_google ??
                          0}
                      </p>
                    </div>
                  </div>

                  {log.error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                      {log.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}