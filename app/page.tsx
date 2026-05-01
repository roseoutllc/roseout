"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050305] text-white">
      {/* HERO */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.25),transparent_40%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.2),transparent_40%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-rose-300">
            RoseOut
          </p>

          <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl">
            Plan Perfect Nights
            <br />
            <span className="text-rose-400">In One Sentence</span>
          </h1>

          <p className="mt-6 text-lg text-white/60">
            Tell RoseOut what you want. We’ll build the perfect date, dinner, or
            outing instantly — curated, styled, and ready to book.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/create")}
              className="rounded-full bg-rose-500 px-8 py-4 text-sm font-black text-white shadow-xl shadow-rose-500/30 transition hover:bg-rose-400"
            >
              Start Planning →
            </button>

            <button
              onClick={() => router.push("/explore")}
              className="rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white/70 hover:bg-white hover:text-black"
            >
              Explore Locations
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-4xl font-black">
          How RoseOut Works
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <StepCard
            step="1"
            title="Tell Us What You Want"
            desc="Describe your vibe, budget, location, and preferences in one sentence."
          />
          <StepCard
            step="2"
            title="AI Builds Your Plan"
            desc="We match you with the best restaurants and activities instantly."
          />
          <StepCard
            step="3"
            title="Go & Enjoy"
            desc="Book, explore, and experience your perfect outing."
          />
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="bg-white text-black">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-black">
                Smarter Than Search
              </h2>

              <p className="mt-5 text-lg text-black/70">
                RoseOut doesn’t just list places — it understands intent.
                Whether it’s a romantic dinner, birthday vibe, or casual night
                out, we match you instantly.
              </p>
            </div>

            <div className="grid gap-4">
              <FeatureCard text="AI-powered recommendations" />
              <FeatureCard text="Real-time availability & booking" />
              <FeatureCard text="Curated experiences, not lists" />
              <FeatureCard text="Personalized to your vibe" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="text-5xl font-black">
          Ready to Plan Your Next Night?
        </h2>

        <p className="mt-6 text-lg text-white/60">
          Stop scrolling. Start experiencing.
        </p>

        <button
          onClick={() => router.push("/create")}
          className="mt-10 rounded-full bg-rose-500 px-10 py-5 text-lg font-black text-white shadow-2xl shadow-rose-500/30 transition hover:bg-rose-400"
        >
          Start Your Plan →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/40">
        © {new Date().getFullYear()} RoseOut. All rights reserved.
      </footer>
    </main>
  );
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-xl">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-lg font-black">
        {step}
      </div>

      <h3 className="mt-5 text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm text-white/60">{desc}</p>
    </div>
  );
}

function FeatureCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm font-bold shadow">
      {text}
    </div>
  );
}