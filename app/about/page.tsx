import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export const metadata = {
  title: "About RoseOut – AI Outing & Date Night Planner",
  description:
    "RoseOut helps people plan date nights, birthdays, restaurants, activities, and outings faster with AI-powered recommendations.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-28 pb-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.22),transparent_42%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            About RoseOut
          </p>

          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Plan better outings.
            <br />
            <span className="text-[#e1062a]">Without endless scrolling.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/60">
            RoseOut is an AI-powered outing planner built to help you discover
            restaurants, activities, and experiences that match your vibe,
            location, budget, and mood.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/create"
              className="rounded-2xl bg-[#e1062a] px-8 py-4 text-sm font-black text-white shadow-2xl shadow-red-500/30 transition hover:bg-red-500"
            >
              Plan My Outing →
            </Link>

            <Link
              href="#faq"
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-black text-white/75 transition hover:bg-white hover:text-black"
            >
              Read FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT IT DOES */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              What RoseOut does
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              One sentence in.
              <br />
              A better plan out.
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/60">
              Instead of searching across multiple apps, RoseOut lets you
              describe what you want in plain English. We turn that request into
              a curated outing with restaurants, activities, and useful details.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoCard
              title="Restaurants"
              text="Find dinner, brunch, rooftops, lounges, casual spots, or upscale experiences."
            />
            <InfoCard
              title="Activities"
              text="Pair your meal with karaoke, bowling, comedy, nightlife, museums, games, and more."
            />
            <InfoCard
              title="Vibe Matching"
              text="Search by romantic, fun, luxury, chill, birthday, budget-friendly, or nearby."
            />
            <InfoCard
              title="Faster Decisions"
              text="Get a focused set of options instead of hundreds of random listings."
            />
          </div>
        </div>
      </section>

      {/* WHY EXISTS */}
      <section className="border-y border-white/10 bg-[#070707] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
            Why we built it
          </p>

          <h2 className="mt-4 text-4xl font-black md:text-5xl">
            Planning should feel exciting, not exhausting.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/60">
            A night out can start with a simple idea — but quickly turn into
            checking reviews, maps, menus, distance, price, and availability.
            RoseOut was built to reduce that friction and help people choose
            with confidence.
          </p>
        </div>
      </section>

      {/* HOW TO USE */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              How to use RoseOut
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Simple enough for quick plans. Smart enough for real outings.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Step
              number="01"
              title="Describe the outing"
              text="Type what you want naturally, like “steak dinner and karaoke in Manhattan” or “romantic birthday dinner in Queens.”"
            />

            <Step
              number="02"
              title="Review your matches"
              text="RoseOut shows restaurants and activities that fit your request, including details, links, ratings, and location context."
            />

            <Step
              number="03"
              title="Choose and go"
              text="Select your favorites, view more details, visit the business website, or use reservation links when available."
            />
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-white px-6 py-20 text-black">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              Who RoseOut is for
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Built for everyday plans and special moments.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <LightCard
              title="Date Nights"
              text="Find restaurants and activities that feel intentional, not random."
            />
            <LightCard
              title="Birthdays"
              text="Plan something memorable without spending hours comparing options."
            />
            <LightCard
              title="Friends & Groups"
              text="Find fun outings that work for more than one person’s vibe."
            />
            <LightCard
              title="Quick Plans"
              text="Need something fast? Type the vibe and get options in seconds."
            />
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              Designed for trust
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              RoseOut helps you decide. Businesses still control the details.
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/60">
              RoseOut does not replace restaurants, venues, or reservation
              platforms. We help you discover and compare options faster, then
              direct you to the business or booking source when you’re ready.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7">
            <TrustPoint text="Always confirm hours, availability, pricing, and policies directly with the business." />
            <TrustPoint text="Reservation and booking links may lead to third-party platforms." />
            <TrustPoint text="Recommendations are designed to guide discovery, not guarantee availability." />
            <TrustPoint text="RoseOut is starting with NYC-area experiences and expanding over time." />
          </div>
        </div>
      </section>

      {/* FOR RESTAURANTS */}
      <section className="border-y border-white/10 bg-[#070707] px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              For restaurants & venues
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Own a restaurant, lounge, or activity venue?
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/60">
              RoseOut helps people discover where to go. Businesses can benefit
              from stronger visibility, better listing details, and a clearer
              path from discovery to action.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black p-7">
            <h3 className="text-2xl font-black">Business visibility</h3>
            <p className="mt-3 text-sm leading-7 text-white/55">
              If your business appears on RoseOut, users may discover your
              location while planning outings. Future business tools may include
              listing claims, profile updates, performance insights, and
              promotional options.
            </p>

            <Link
              href="/signup"
              className="mt-6 inline-flex rounded-2xl bg-[#e1062a] px-6 py-3 text-sm font-black text-white transition hover:bg-red-500"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              FAQ
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              How RoseOut works
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            <FAQ
              q="How do I use RoseOut?"
              a="Type what you want in plain English. For example, “romantic dinner in Brooklyn,” “birthday dinner and bowling in Queens,” or “karaoke in Manhattan.” RoseOut will return matching restaurants, activities, or both."
            />

            <FAQ
              q="Can RoseOut plan both food and activities?"
              a="Yes. RoseOut is designed to help combine restaurants and activities into one outing when your request includes both."
            />

            <FAQ
              q="Do I book through RoseOut?"
              a="RoseOut may show reservation, website, or booking links when available. Final booking, availability, cancellation policies, and pricing are handled by the business or third-party platform."
            />

            <FAQ
              q="Is RoseOut free to use?"
              a="You can use RoseOut to search and plan outings. Some future features may require an account, subscription, or business plan."
            />

            <FAQ
              q="Does RoseOut use my location?"
              a="Only if you choose to allow location access. Location helps RoseOut prioritize nearby options. You can also search by borough, neighborhood, city, or zip code."
            />

            <FAQ
              q="Why did RoseOut recommend a certain place?"
              a="RoseOut considers your request, location, category, vibe, and available listing details. We keep the matching system private, but the goal is simple: better-fit recommendations with less effort."
            />

            <FAQ
              q="What if a listing is wrong?"
              a="Business details can change. Always confirm directly with the business. RoseOut may allow owners or authorized representatives to claim and update listings."
            />

            <FAQ
              q="Where is RoseOut available?"
              a="RoseOut is focused on NYC-area outings first, with plans to expand into more cities and categories over time."
            />

            <FAQ
              q="Can restaurants or venues be featured?"
              a="RoseOut may offer business tools in the future, including claimed profiles, enhanced listings, analytics, and promotional placements."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.18),transparent_38%)]" />

        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            Start now
          </p>

          <h2 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Your next outing starts with one sentence.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/55">
            Tell RoseOut what you want and get a focused plan faster.
          </p>

          <Link
            href="/create"
            className="mt-10 inline-flex rounded-2xl bg-[#e1062a] px-10 py-5 text-lg font-black text-white shadow-2xl shadow-red-500/30 transition hover:bg-red-500"
          >
            Plan My Outing →
          </Link>
        </div>
      </section>

      <LuxuryFooter />
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-6">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/50">{text}</p>
    </div>
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
    <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7">
      <p className="text-sm font-black text-[#e1062a]">{number}</p>
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/50">{text}</p>
    </div>
  );
}

function LightCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-black/60">{text}</p>
    </div>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <div className="border-b border-white/10 py-4 last:border-b-0">
      <p className="text-sm font-semibold leading-7 text-white/60">✓ {text}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#0d0d0d] p-6">
      <h3 className="text-base font-black text-white">{q}</h3>
      <p className="mt-3 text-sm leading-7 text-white/55">{a}</p>
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
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e1062a] text-lg font-black text-white shadow-lg shadow-red-500/20">
              R
            </span>
            <span className="text-2xl font-black tracking-tight">RoseOut</span>
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/45">
            AI-powered planning for date nights, birthdays, restaurants,
            activities, and unforgettable outings.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex w-fit rounded-2xl bg-[#e1062a] px-6 py-3 text-sm font-black text-white transition hover:bg-red-500"
            >
              Plan My Outing
            </Link>

            <Link
              href="/about"
              className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
            >
              About RoseOut
            </Link>
          </div>
        </div>

        <FooterColumn
          title="Explore"
          links={[
            { label: "Home", href: "/" },
            { label: "Plan Outing", href: "/create" },
            { label: "About", href: "/about" },
          ]}
        />

        <FooterColumn
          title="Account"
          links={[
            { label: "Create Account", href: "/signup" },
            { label: "Sign In", href: "/login" },
            { label: "Saved Plan", href: "/plan" },
          ]}
        />

        <FooterColumn
          title="Legal"
          links={[
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "Contact", href: "mailto:hello@roseout.com" },
          ]}
        />
      </div>

      <div className="relative mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} RoseOut. All rights reserved.</p>

        <p className="max-w-xl leading-6 md:text-right">
          Recommendations may include third-party listings, websites, and
          reservation links. Always confirm details directly with the business.
        </p>
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
        {links.map((link) =>
          link.href.startsWith("mailto:") ? (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-white/45 transition hover:text-white"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-white/45 transition hover:text-white"
            >
              {link.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}