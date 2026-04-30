"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") || "/create";

  return (
    <button
      type="button"
      onClick={() => router.push(from)}
      className="w-full rounded-full bg-white/20 px-5 py-3 text-left text-sm font-bold text-white backdrop-blur transition hover:bg-white/30"
    >
      ← Back to results
    </button>
  );
}