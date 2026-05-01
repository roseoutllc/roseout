"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/app/admin/components/AdminTopBar";
import { createClient } from "@/lib/supabase-browser";

type ImportRun = {
  id: string;
  source: string;
  query: string;
  imported_count: number;
  status: string;
  error_message?: string | null;
  created_at: string;
};

export default function ImportHistoryPage() {
  const supabase = createClient();

  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState("");

  const loadHistory = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/import-history", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      setRuns(data.imports || data.runs || []);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const lastRunToday = runs.some((run) => {
    const runDate = new Date(run.created_at).toDateString();
    const today = new Date().toDateString();
    return runDate === today && run.status === "success";
  });

  const runImport = async () => {
    setImporting(true);
    setResult("");

    try {
      // 🔐 GET USER TOKEN
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setResult("Not authenticated");
        setImporting(false);
        return;
      }

      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: "restaurants in Queens NY",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(data.error || "Import failed.");
        return;
      }

      setResult(`Imported ${data.imported ?? 0} places.`);

      await loadHistory();
    } catch {
      setResult("Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f5b700]">
              RoseOut Admin
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Google Import History
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Review recent Google imports, monitor run status, and manually run
              a new Google Places import.
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={runImport}
              disabled={importing}
              className="rounded-2xl bg-[#f5b700] px-6 py-4 text-sm font-black text-black transition hover:bg-[#ffd24a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? "Running Import..." : "Run Google Import"}
            </button>

            {result && <p className="text-xs text-zinc-400">{result}</p>}

            <div
              className={`rounded-2xl border px-5 py-3 text-sm font-bold ${
                lastRunToday
                  ? "border-green-400/30 bg-green-500/10 text-green-300"
                  : "border-red-400/30 bg-red-500/10 text-red-300"
              }`}
            >
              {lastRunToday ? "✅ Last Run Today" : "⚠️ Not Run Today"}
            </div>
          </div>
        </div>

        {/* STATS */}
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <p className="text-sm text-zinc-400">Total Runs</p>
            <p className="mt-2 text-3xl font-black text-[#f5b700]">
              {runs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <p className="text-sm text-zinc-400">Successful Runs</p>
            <p className="mt-2 text-3xl font-black text-[#f5b700]">
              {runs.filter((run) => run.status === "success").length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <p className="text-sm text-zinc-400">Imported Places</p>
            <p className="mt-2 text-3xl font-black text-[#f5b700]">
              {runs.reduce(
                (total, run) => total + Number(run.imported_count || 0),
                0
              )}
            </p>
          </div>
        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#181818] shadow-2xl">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-black">Recent Imports</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Latest Google import activity.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#101010] text-xs uppercase tracking-[0.18em] text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Query</th>
                  <th className="px-6 py-4">Imported</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Message</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-zinc-400">
                      Loading import history...
                    </td>
                  </tr>
                ) : runs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-zinc-400">
                      No import history found.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="hover:bg-white/[0.03]">
                      <td className="px-6 py-4 text-zinc-400">
                        {new Date(run.created_at).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 font-bold text-white">
                        {run.source || "Google"}
                      </td>

                      <td className="px-6 py-4 text-zinc-300">
                        {run.query || "—"}
                      </td>

                      <td className="px-6 py-4 font-black text-[#f5b700]">
                        {run.imported_count ?? 0}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            run.status === "success"
                              ? "border-green-400/30 bg-green-500/10 text-green-300"
                              : run.status === "running"
                              ? "border-[#f5b700]/30 bg-[#f5b700]/10 text-[#f5b700]"
                              : "border-red-400/30 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-zinc-500">
                        {run.error_message || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}