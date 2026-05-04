```tsx
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

  // 🔥 FETCH IMPORT LOGS
  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/import-logs");
      const data = await res.json();

      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 🚀 RUN IMPORT
  const handleRunImport = async () => {
    setRunning(true);

    try {
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

      console.log("Import result:", data);

      alert(
         Imported: ${data.imported}\n⏭ Skipped: ${data.skipped}\n❌ Failed: ${data.failed}`
      );

      fetchLogs(); // refresh logs after run
    } catch (err) {
      console.error(err);
      alert("Import failed");
    }

    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Google Import Dashboard</h1>

        <button
          onClick={handleRunImport}
          disabled={running}
          className={`px-6 py-3 rounded-xl font-semibold transition ${
            running
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {running ? "Running..." : "Run Google Import"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center text-gray-400">Loading logs...</div>
      )}

      {/* EMPTY STATE */}
      {!loading && logs.length === 0 && (
        <div className="text-center text-gray-500">
          No import history yet.
        </div>
      )}

      {/* LOG TABLE */}
      <div className="grid gap-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-400">
                {log.job_name} — {log.run_date}
              </div>

              {log.error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                <span className="text-green-400 text-xs">Success</span>
              )}
            </div>

            {/* META */}
            {log.meta && (
              <div className="text-sm text-gray-300 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>Imported: {log.meta.imported ?? 0}</div>
                <div>Skipped: {log.meta.skipped ?? 0}</div>
                <div>Failed: {log.meta.failed ?? 0}</div>
                <div>Found: {log.meta.total_found_from_google ?? 0}</div>
              </div>
            )}

            {/* ERROR */}
            {log.error && (
              <div className="mt-2 text-xs text-red-400">
                {log.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```
