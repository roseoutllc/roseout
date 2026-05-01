"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/app/admin/components/AdminTopBar";
import { createClient } from "@/lib/supabase-browser";

type ImportLog = {
  id: string;
  job_name: string | null;
  run_date: string | null;
  created_at: string | null;
};

export default function ImportHistoryPage() {
  const supabase = createClient();

  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLogs = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("import_logs")
      .select("*")
      .order("created_at", { ascending: false });

    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const runImport = async () => {
    setImporting(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-import-secret":
            process.env.NEXT_PUBLIC_IMPORT_SECRET || "",
        },
        body: JSON.stringify({
          query: "restaurants in Queens NY",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setMessage(`Imported ${data.imported} places`);
      await loadLogs();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setImporting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const lastRunToday = logs.some((log) => log.run_date === today);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* HEADER */}
        <div className="mb-8 flex justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
              RoseOut Admin
            </p>
            <h1 className="text-4xl font-black">Import History</h1>
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              onClick={runImport}
              disabled={importing}
              className="rounded-2xl bg-yellow-500 px-6 py-4 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              {importing ? "Running..." : "Run Google Import"}
            </button>

            <div
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                lastRunToday
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {lastRunToday ? "✅ Last Run Today" : "⚠️ Not Run Today"}
            </div>
          </div>
        </div>

        {/* STATUS */}
        {message && (
          <div className="mb-4 rounded-xl bg-green-100 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="rounded-2xl bg-white text-black">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No logs yet
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Run Date</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-3 font-bold">
                      {log.job_name || "Import"}
                    </td>
                    <td className="px-4 py-3">{log.run_date}</td>
                    <td className="px-4 py-3">
                      {new Date(log.created_at || "").toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}