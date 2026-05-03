import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      {/* HERO */}
      <section className="relative px-6 pt-28 pb-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.18),transparent_40%)]" />

        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            About RoseOut
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Go out better.
            <br />
            Not longer.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
            RoseOut helps you find the perfect restaurant, activity, and
            experience — without spending hours searching.
          </p>
        </div>
      </section>

      {/* WHY */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl font-black">Why RoseOut exists</h2>

          <p className="mt-6 text-lg leading-8 text-white/60">
            Planning a night out today means jumping between apps, reading
            reviews, checking menus, and still not being sure if it’s the right
            choice.
          </p>

          <p className="mt-4 text-lg leading-8 text-white/60">
            RoseOut removes that friction. Instead of overwhelming you with
            options, we guide you to the right ones — based on your vibe,
            location, and intent.
          </p>
        </div>
      </section>

      {/* WHAT MAKES US DIFFERENT */}
      <section className="border-y border-white/10 bg-[#070707] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3">
          <Feature
            title="Intent-based recommendations"
            text="We focus on what you're actually trying to do — date night, birthday, quick outing — not just random listings."
          />

          <Feature
            title="Full outing planning"
            text="Restaurants and activities are combined into one seamless experience."
          />

          <Feature
            title="Quality over quantity"
            text="You get curated matches, not endless scrolling."
          />
        </div>
      </section>

      {/* USE CASES */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-black text-center">
            Built for real life
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <UseCase
              title="Date nights"
              text="Find a restaurant and activity that actually work together."
            />
            <UseCase
              title="Birthdays"
              text="Plan something memorable without the stress."
            />
            <UseCase
              title="Quick nights out"
              text="No overthinking — just go."
            />
            <UseCase
              title="Luxury experiences"
              text="Discover high-end spots that match your vibe."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-black text-center">FAQ</h2>

          <div className="mt-12 space-y-6">
            <FAQ
              q="How do I use RoseOut?"
              a="Just type what you're looking for — like 'romantic dinner in Manhattan with something fun after.' RoseOut will generate a curated plan instantly."
            />

            <FAQ
              q="Do I need to book through RoseOut?"
              a="No. We provide direct links so you can book through the restaurant or venue."
            />

            <FAQ
              q="Is RoseOut free?"
              a="Yes. You can explore and plan outings without any cost."
            />

            <FAQ
              q="How are recommendations chosen?"
              a="We consider multiple factors like vibe, location, and real-world signals to find the best matches."
            />

            <FAQ
              q="Can I plan both food and activities?"
              a="Yes. RoseOut is designed to combine restaurants and experiences into one outing."
            />

            <FAQ
              q="Does RoseOut work in all cities?"
              a="We are expanding, starting with major cities and growing continuously."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-black md:text-5xl">
            Your next outing is one sentence away
          </h2>

          <p className="mt-5 text-lg text-white/55">
            Stop searching. Start experiencing.
          </p>

          <Link
            href="/create"
            className="mt-8 inline-flex rounded-2xl bg-[#e1062a] px-10 py-5 text-lg font-black text-white shadow-2xl shadow-red-500/30 transition hover:bg-red-500"
          >
            Plan My Outing →
          </Link>
        </div>
      </section>

      <LuxuryFooter />
    </main>
  );
}

/* COMPONENTS */

function Feature({ title, text }: any) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm text-white/50">{text}</p>
    </div>
  );
}

function UseCase({ title, text }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm text-white/50">{text}</p>
    </div>
  );
}

function FAQ({ q, a }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
      <p className="text-sm font-black">{q}</p>
      <p className="mt-2 text-sm text-white/50">{a}</p>
    </div>
  );
}

function LuxuryFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-10 text-sm text-white/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <p>© {new Date().getFullYear()} RoseOut</p>

        <div className="flex gap-5">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}