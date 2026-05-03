import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export const metadata = {
  title: "For Businesses – RoseOut",
  description:
    "Get discovered by people actively planning outings. Claim your restaurant, activity, or venue on RoseOut.",
};

export default function BusinessPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      <section className="relative overflow-hidden px-6 pt-32 pb-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.22),transparent_42%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            For Businesses
          </p>

          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Get discovered when people are ready to go out.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/60">
            RoseOut helps restaurants, lounges, activities, and venues connect
            with users actively planning date nights, birthdays, dinners, and
            experiences.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-2xl bg-[#e1062a] px-8 py-4 text-sm font-black text-white shadow-2xl shadow-red-500/30 transition hover:bg-red-500"
            >
              Claim Your Listing →
            </Link>

            <Link
              href="#how-it-works"
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-black text-white/75 transition hover:bg-white hover:text-black"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
          <Stat value="High Intent" label="Users planning where to go" />
          <Stat value="QR Ready" label="Turn mailers into claims" />
          <Stat value="Trackable" label="Views, clicks, and interest" />
          <Stat value="Local First" label="Built for restaurants and venues" />
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-white/10 bg-[#070707] px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              Business tools
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              A better way to turn discovery into action.
            </h2>

            <p className="mt-5 text-lg leading-8 text-white/60">
              RoseOut is designed to help users find places that match their
              intent — and help businesses turn that attention into visits,
              bookings, and customer interest.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Feature
              number="01"
              title="Claim your listing"
              text="Verify your business so you can manage how your restaurant, activity, lounge, or venue appears on RoseOut."
            />

            <Feature
              number="02"
              title="Add your business"
              text="If you are not listed yet, submit your restaurant or activity so RoseOut can review it for inclusion."
            />

            <Feature
              number="03"
              title="Use QR codes"
              text="QR claim links can help businesses quickly access their profile and start the claim process."
            />

            <Feature
              number="04"
              title="Track interest"
              text="Understand how people discover your listing with view and click signals as your profile grows."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              Claim system
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Built for restaurants, venues, and activity owners.
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/60">
              RoseOut gives businesses a cleaner path from being discovered to
              being contacted. Users can view your details, visit your website,
              open booking links, and explore your listing when planning an
              outing.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7 shadow-2xl shadow-black/40">
            <h3 className="text-2xl font-black">What a claim can unlock</h3>

            <div className="mt-6 space-y-4">
              <Check text="Update business name, address, website, and booking links." />
              <Check text="Improve your profile with better photos, tags, and descriptions." />
              <Check text="Add details customers care about before choosing where to go." />
              <Check text="See customer interest through view and click activity." />
              <Check text="Create a stronger first impression for high-intent users." />
            </div>

            <Link
              href="/signup"
              className="mt-7 inline-flex rounded-2xl bg-[#e1062a] px-6 py-3 text-sm font-black text-white transition hover:bg-red-500"
            >
              Start Claim Process
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-black">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              Who should join
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              RoseOut is for experience-driven businesses.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <LightCard
              title="Restaurants"
              text="Dinner, brunch, rooftops, lounges, casual dining, and upscale experiences."
            />
            <LightCard
              title="Activities"
              text="Bowling, karaoke, comedy, games, museums, nightlife, and interactive experiences."
            />
            <LightCard
              title="Venues"
              text="Spaces that host birthdays, date nights, group outings, and memorable events."
            />
            <LightCard
              title="Local brands"
              text="Businesses that want to be found when people are actively planning where to go."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#070707] px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              QR code mailers
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Turn a physical QR scan into a digital claim.
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/60">
              RoseOut can support QR-based claim links so businesses can scan,
              review, and begin the process of managing their listing.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black p-8">
            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-[2rem] border border-white/10 bg-white p-5">
              <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-2">
                {Array.from({ length: 25 }).map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-sm ${
                      [0, 1, 2, 5, 10, 12, 14, 18, 20, 21, 22, 24].includes(
                        index
                      )
                        ? "bg-black"
                        : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-sm font-bold text-white/50">
              Example QR claim experience
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e1062a]">
              FAQ
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Business questions
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            <FAQ
              q="How does a business get listed on RoseOut?"
              a="Businesses can be discovered through RoseOut’s database or added through future submission and review flows. Claimed listings may receive access to profile management tools."
            />

            <FAQ
              q="Can I claim my restaurant or activity?"
              a="Yes. RoseOut is being built with claim workflows so authorized business owners or managers can verify and manage listing details."
            />

            <FAQ
              q="What can I update after claiming?"
              a="Claimed businesses may be able to update key profile details such as name, description, website, booking links, photos, tags, and customer-facing information."
            />

            <FAQ
              q="Will RoseOut replace my reservation system?"
              a="No. RoseOut helps customers discover and decide. Booking can still happen through your website, reservation link, or third-party reservation platform."
            />

            <FAQ
              q="Can I track views and clicks?"
              a="RoseOut is designed to support analytics signals like profile views and outbound clicks so businesses can understand interest."
            />

            <FAQ
              q="Do you reveal how RoseOut ranks businesses?"
              a="No. RoseOut does not publicly disclose its full recommendation or ranking system. The goal is to surface useful, relevant options for users while protecting platform quality."
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,42,0.18),transparent_38%)]" />

        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            Grow with RoseOut
          </p>

          <h2 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Be found when people are planning.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/55">
            Claim your listing, strengthen your profile, and turn discovery into
            action.
          </p>

          <Link
            href="/signup"
            className="mt-10 inline-flex rounded-2xl bg-[#e1062a] px-10 py-5 text-lg font-black text-white shadow-2xl shadow-red-500/30 transition hover:bg-red-500"
          >
            Claim Your Listing →
          </Link>
        </div>
      </section>

      <LuxuryFooter />
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-6 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm font-semibold text-white/45">{label}</p>
    </div>
  );
}

function Feature({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black p-7">
      <p className="text-sm font-black text-[#e1062a]">{number}</p>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/50">{text}</p>
    </div>
  );
}

function Check({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-semibold leading-6 text-white/60">✓ {text}</p>
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
              href="/business"
              className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
            >
              For Businesses
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
          title="Business"
          links={[
            { label: "For Businesses", href: "/business" },
            { label: "Create Account", href: "/signup" },
            { label: "Sign In", href: "/login" },
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