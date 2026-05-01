"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/app/admin/components/AdminTopBar";

export default function ImportHistoryPage() {
  const [lastRunToday, setLastRunToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    // keep your existing logic here if you already had one
    // this just keeps structure intact
  }, []);

  const runImport = async () => {
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "restaurants in Queens NY",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(data.error || "Import failed");
        return;
      }

      setResult(`Imported ${data.imported ?? 0} places`);
      setLastRunToday(true);

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setResult("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-[#030303] text-white">
      <AdminTopBar />

      <div className="mx-auto flex h-[calc(100vh-73px)] max-w-7xl flex-col px-6 py-5">
        {/* HEADER */}
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f5b700]">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-black">
            Import History
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Run and monitor Google imports
          </p>
        </div>

        {/* TOP ACTION ROW */}
        <div className="mb-6 flex items-start justify-between">
          {/* LEFT SIDE (leave your existing content here if any) */}
          <div />

          {/* RIGHT SIDE (NEW BUTTON + STATUS) */}
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={runImport}
              disabled={loading}
              className="rounded-2xl bg-[#f5b700] px-5 py-4 text-sm font-black text-black transition hover:bg-[#ffd24a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Running Import..." : "Run Google Import"}
            </button>

            {result && (
              <p className="text-xs text-zinc-400">{result}</p>
            )}

            <div
              className={`rounded-2xl px-5 py-4 text-sm font-bold ${
                lastRunToday
                  ? "bg-green-500/10 text-green-400 border border-green-400/30"
                  : "bg-red-500/10 text-red-400 border border-red-400/30"
              }`}
            >
              {lastRunToday
                ? "✅ Last Run Today"
                : "⚠️ Not Run Today"}
            </div>
          </div>
        </div>

        {/* EXISTING CONTENT BELOW (UNCHANGED) */}
        <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#181818] p-6">
          <p className="text-sm text-zinc-400">
            Your import history will display here.
          </p>
        </div>
      </div>
    </main>
  );
}