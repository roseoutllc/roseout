import Link from "next/link";
import RoseOutHeader from "@/components/RoseOutHeader";

export const metadata = {
  title: "Claim or Add Your Location – RoseOut",
  description:
    "Claim or add your restaurant, activity, lounge, venue, or experience on RoseOut.",
};

export default function LocationApplyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <RoseOutHeader />

      <section className="relative overflow-hidden px-6 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(225,6,42,0.2),transparent_35%),linear-gradient(180deg,#050505,#000)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e1062a]">
              Claim or Add Location
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-6xl">
              Manage how your location appears on RoseOut.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
              This page is for restaurants, activities, lounges, venues, and
              experience-based businesses that want to claim or submit a
              location on RoseOut.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoBox title="Claim" text="Already listed? Start the claim process." />
              <InfoBox title="Submit" text="Not listed yet? Submit your location." />
              <InfoBox title="Improve" text="Update details, links, photos, and tags." />
              <InfoBox title="Track" text="Understand views, clicks, and user interest." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-2xl font-black">Location request</h2>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Use this form as your front-end request page. Connect it to
              Supabase when ready.
            </p>

            <form className="mt-6 space-y-4">
              <Field label="Business / Location Name" placeholder="Example: Rose Lounge" />

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                  Location Type
                </span>
                <select className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm font-bold text-white outline-none focus:border-[#e1062a]">
                  <option>Restaurant</option>
                  <option>Activity</option>
                  <option>Lounge / Nightlife</option>
                  <option>Venue</option>
                  <option>Other Experience</option>
                </select>
              </label>

              <Field label="Business Website" placeholder="https://example.com" />
              <Field label="Address" placeholder="Street address" />
              <Field label="City" placeholder="New York" />
              <Field label="Owner / Manager Name" placeholder="Full name" />
              <Field label="Email" placeholder="name@example.com" />
              <Field label="Phone" placeholder="Phone number" />

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                  Request Type
                </span>
                <select className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm font-bold text-white outline-none focus:border-[#e1062a]">
                  <option>Claim existing listing</option>
                  <option>Add new location</option>
                  <option>Update listing details</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                  Notes
                </span>
                <textarea
                  rows={4}
                  placeholder="Tell us anything helpful about this location."
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#e1062a]"
                />
              </label>

              <button
                type="button"
                className="w-full rounded-2xl bg-[#e1062a] px-6 py-4 text-sm font-black text-white shadow-2xl shadow-red-500/25 transition hover:bg-red-500"
              >
                Submit Request
              </button>

              <p className="text-center text-xs leading-5 text-white/35">
                Submissions may be reviewed before approval. This form does not
                guarantee immediate listing access.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#070707] px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-black">Already received a QR code?</h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/50">
            Scan the QR code from your RoseOut mailer to open your unique claim
            link. If you do not have a QR code, submit the request form above.
          </p>

          <Link
            href="/business"
            className="mt-7 inline-flex rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white hover:text-black"
          >
            Back to For Businesses
          </Link>
        </div>
      </section>

      <LuxuryFooter />
    </main>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      <input
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#e1062a]"
      />
    </label>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/45">{text}</p>
    </div>
  );
}

function LuxuryFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-white/35">
          © {new Date().getFullYear()} RoseOut. All rights reserved.
        </p>

        <div className="flex flex-wrap gap-5 text-sm font-semibold text-white/45">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/business" className="hover:text-white">
            For Businesses
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}