import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export const metadata = {
  title: "For Businesses – RoseOut",
  description:
    "Claim or add your restaurant, activity, lounge, venue, or experience on RoseOut.",
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
            RoseOut helps restaurants, activities, lounges, venues, and
            experience-based locations connect with users actively planning date
            nights, birthdays, dinners, and outings.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/locations/apply"
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
          <Stat value="QR Ready" label="Turn scans into claims" />
          <Stat value="Trackable" label="Views, clicks, and interest" />
          <Stat value="Location First" label="Restaurants, activities, venues" />
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
              A cleaner path from discovery to action.
            </h2>

            <p className="mt-5 text-lg leading-8 text-white/60">
              RoseOut is designed to help users find locations that match their
              intent — and help businesses turn that attention into visits,
              bookings, and customer interest.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Feature
              number="01"
              title="Claim your listing"
              text="Verify your location so you can manage how your business appears on RoseOut."
            />

            <Feature
              number="02"
              title="Add your location"
              text="If your location is not listed yet, submit it for review."
            />

            <Feature
              number="03"
              title="Use QR codes"
              text="QR claim links help owners quickly find and claim their RoseOut listing."
            />

            <Feature
              number="04"
              title="Track interest"
              text="View and click signals help show how users engage with your listing."
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
              Built for restaurants, venues, activities, and experiences.
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/60">
              RoseOut gives locations a cleaner path from being discovered to
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
              <Check text="Add customer-facing details that help people decide faster." />
              <Check text="Track customer interest through views and clicks." />
              <Check text="Create a stronger first impression for high-intent users." />
            </div>

            <Link
              href="/locations/apply"
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
              RoseOut is for experience-driven locations.
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
              text="Locations that want to be found when people are actively planning where to go."
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
            href="/locations/apply"
            className="mt-10 inline-flex rounded-2xl bg-[#e1062a] px-10 py-5 text-lg font-black text-white shadow-2xl shadow-red-500/30 transition hover:bg-red-500"
          >
            Claim Your Listing →
          </Link>
        </div>
      </section>

    
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
