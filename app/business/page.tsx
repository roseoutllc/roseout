import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export default function BusinessPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      <section className="px-6 pt-32 pb-20 text-center">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
          For Businesses
        </p>

        <h1 className="mt-4 text-5xl font-black md:text-6xl">
          Get discovered on RoseOut
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
          Reach customers who are actively planning where to go. RoseOut connects
          users with restaurants and experiences that match their intent.
        </p>

        <Link
          href="/signup"
          className="mt-8 inline-flex rounded-2xl bg-[#e1062a] px-8 py-4 text-sm font-black text-white hover:bg-red-500"
        >
          Get Started →
        </Link>
      </section>
    </main>
  );
}