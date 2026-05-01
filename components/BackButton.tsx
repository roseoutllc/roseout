"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallback?: string;
};

export default function BackButton({ fallback = "/" }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className="mb-4 text-sm font-medium text-neutral-400 hover:text-white transition"
    >
      ← Back
    </button>
  );
}