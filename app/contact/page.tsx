import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export const metadata = {
  title: "Contact RoseOut – AI Outing Planner",
  description:
    "Contact RoseOut for support, business listings, partnerships, and general questions.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      <section className="relative overflow-hidden px-6 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(225,6,42,0.2),transparent_35%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
            Contact RoseOut
          </p>

          <h1 className="mt-5 text-5xl font-black leading-tight md:text-6xl">
            Need help or want to work with us?
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
            Reach out for support, business listings, partnerships, corrections,
            or general questions about RoseOut.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <ContactCard
              title="General Support"
              text="Questions about using RoseOut, planning outings, or account help."
              href="mailto:hello@roseout.com"
              label="hello@roseout.com"
            />

            <ContactCard
              title="Business Listings"
              text="Claim, add, or update a restaurant, activity, lounge, venue, or experience."
              href="/locations/apply"
              label="Claim or Add Location"
            />

            <ContactCard
              title="Partnerships"
              text="Interested in working with RoseOut or exploring business opportunities?"
              href="mailto:hello@roseout.com"
              label="Contact Partnerships"
            />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-2xl font-black">Send us a message</h2>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Use the details below to contact RoseOut. For business listing
              requests, use the claim form so we can collect the correct
              information.
            </p>

            <div className="mt-8 space-y-4">
              <InfoRow label="Email" value="hello@roseout.com" />
              <InfoRow label="Website" value="roseout.com" />
              <InfoRow label="Business Claims" value="/locations/apply" />
              <InfoRow label="Support Hours" value="Monday–Friday" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:hello@roseout.com"
                className="rounded-2xl bg-[#e1062a] px-6 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
              >
                Email RoseOut
              </a>

              <Link
                href="/locations/apply"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-center text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
              >
                Claim Your Listing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LuxuryFooter />
    </main>
  );
}

function ContactCard({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  const isMail = href.startsWith("mailto:");

  const className =
    "block rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition hover:border-red-500/40 hover:bg-red-500/10";

  const content = (
    <>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-white/50">{text}</p>
      <p className="mt-5 text-sm font-black text-[#e1062a]">{label} →</p>
    </>
  );

  return isMail ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-white/70">{value}</p>
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
            { label: "Claim Listing", href: "/locations/apply" },
            { label: "Sign In", href: "/login" },
          ]}
        />

        <FooterColumn
          title="Legal"
          links={[
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "Contact", href: "/contact" },
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
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-semibold text-white/45 transition hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}