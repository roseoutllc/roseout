import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export const metadata = {
  title: "About RoseOut – AI Outing & Date Planner",
  description:
    "Learn how RoseOut uses AI to plan perfect outings, date nights, and experiences based on your vibe, location, and budget.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-28 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(225,6,42,0.25),transparent_35%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            About RoseOut
          </p>

          <h1 className="mt-6 text-5xl font-black leading-tight md:text-6xl">
            Smarter outings.
            <br />
            <span className="text-[#e1062a]">Better experiences.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            RoseOut is an AI-powered outing planner designed to eliminate
            decision fatigue and help you discover the perfect place to go —
            instantly.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black">Our Mission</h2>

          <p className="mt-5 text-lg leading-8 text-white/65">
            Planning a night out shouldn’t take hours of scrolling, comparing,
            and second-guessing. RoseOut was built to simplify that process.
          </p>

          <p className="mt-5 text-lg leading-8 text-white/65">
            Our mission is to help people quickly find the right restaurant,
            activity, or experience based on how they feel, what they want,
            and where they are — without the noise.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#0d0d0d] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
            How it works
          </p>

          <h2 className="mt-4 text-4xl font-black">
            Built for real decisions, not endless lists
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Step
              number="01"
              title="Tell RoseOut what you want"
              text="Describe your perfect outing in plain English — vibe, budget, location, or mood."
            />

            <Step
              number="02"
              title="AI finds the best match"
              text="We analyze real signals like ratings, popularity, and experience quality."
            />

            <Step
              number="03"
              title="Go out, stress-free"
              text="Get direct links, details, and options — no more endless scrolling."
            />
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-black">
              Why RoseOut is different
            </h2>

            <p className="mt-6 text-lg text-white/65">
              Most platforms show you lists. RoseOut gives you decisions.
            </p>

            <p className="mt-4 text-lg text-white/65">
              Instead of overwhelming you with hundreds of options, we focus on
              delivering a curated experience that fits exactly what you’re
              looking for.
            </p>
          </div>

          <div className="grid gap-4">
            <Feature text="AI-powered recommendations" />
            <Feature text="Restaurant + activity pairing" />
            <Feature text="Live ranking signals" />
            <Feature text="Personalized to your vibe" />
            <Feature text="Fast, clean, decision-first UI" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.2),transparent_40%)]" />

        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-4xl font-black">
            Your next outing starts here
          </h2>

          <p className="mt-4 text-lg text-white/60">
            Stop searching. Start experiencing.
          </p>

          <Link
            href="/create"
            className="mt-8 inline-flex rounded-2xl bg-[#e1062a] px-8 py-4 text-sm font-black text-white shadow-xl shadow-red-500/30 transition hover:bg-red-500"
          >
            Plan My Outing →
          </Link>
        </div>
      </section>
    </main>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black p-6">
      <p className="text-sm font-black text-[#e1062a]">{number}</p>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm text-white/50">{text}</p>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4 text-sm font-semibold text-white/70">
      {text}
    </div>
  );
}