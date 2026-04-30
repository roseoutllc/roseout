"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/create");
        }
      }}
      className="w-fit rounded-full bg-white/15 px-5 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
    >
      ← Back to results
    </button>
  );
}