"use client";

import { useState } from "react";

export default function RunGoogleImportButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

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
        setResult(data.error || "Import failed.");
        return;
      }

      setResult(`Imported ${data.imported ?? 0} places.`);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setResult("Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={runImport}
        disabled={loading}
        className="rounded-2xl bg-yellow-500 px-5 py-4 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Running Import..." : "Run Google Import"}
      </button>

      {result && <p className="text-xs text-neutral-400">{result}</p>}
    </div>
  );
}