"use client";

export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="w-fit rounded-full bg-white/15 px-5 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25"
    >
      ← Back
    </button>
  );
}