"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-sm font-semibold text-yellow-500"
    >
      ← Back to RoseOut
    </button>
  );
}