import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-28 pb-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.18),transparent_40%)]" />

        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            About RoseOut
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Built for real outings,
            <br />
            not endless scrolling.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
            RoseOut is an AI-powered outing planner that helps you find the
            perfect restaurant, activity, and experience — all in one place.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl font-black">Why RoseOut exists</h2>

          <p className="mt-6 text-lg leading-8 text-white/60">
            Planning a night out shouldn’t take 45 minutes of scrolling,
            switching apps, and second-guessing decisions.
          </p>

          <p className="mt-4 text-lg leading-8 text-white/60">
            RoseOut was created to eliminate that friction. Instead of showing
            endless lists, we give you curated, high-quality recommendations
            based on what actually works — vibe, location, behavior, and real
            user signals.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-white/10 bg-[#070707] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3">
          <FeatureBlock
            number="01"
            title="Tell us what you want"
            text="Type naturally — dinner, birthday, rooftop, fun, luxury, or budget. RoseOut understands."
          />

          <FeatureBlock
            number="02"
            title="Get curated matches"
            text="We combine restaurants + activities into one complete outing — no guesswork."
          />

          <FeatureBlock
            number="03"
            title="Go out with confidence"
            text="Every recommendation is optimized for quality, vibe, and real-world success."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-black md:text-5xl">
            Ready to plan your next outing?
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

function FeatureBlock({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7">
      <p className="text-sm font-black text-[#e1062a]">{number}</p>
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/50">{text}</p>
    </div>
  );
}

function LuxuryFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-6 py-14 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(225,6,42,0.16),transparent_28%),linear-gradient(180deg,#050505,#000)]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e1062a] text-lg font-black text-white">
              R
            </span>
            <span className="text-2xl font-black">RoseOut</span>
          </Link>

          <p className="mt-5 max-w-md text-sm text-white/45">
            AI-powered planning for restaurants, activities, and unforgettable
            outings.
          </p>

          <Link
            href="/create"
            className="mt-6 inline-flex rounded-2xl bg-[#e1062a] px-6 py-3 text-sm font-black text-white hover:bg-red-500"
          >
            Plan My Outing
          </Link>
        </div>

        <FooterColumn
          title="Explore"
          links={[
            { label: "Home", href: "/" },
            { label: "Plan", href: "/create" },
            { label: "About", href: "/about" },
          ]}
        />

        <FooterColumn
          title="Account"
          links={[
            { label: "Sign In", href: "/login" },
            { label: "Join", href: "/signup" },
          ]}
        />

        <FooterColumn
          title="Legal"
          links={[
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
          ]}
        />
      </div>

      <div className="relative mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/35 flex justify-between">
        <p>© {new Date().getFullYear()} RoseOut</p>
        <p>All rights reserved</p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e1062a]">
        {title}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-white/45 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}