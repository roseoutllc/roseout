import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const steps = [
  { number: 1, title: "Profile", description: "Confirm your business name, category, address, hours, photos, and contact details.", href: "/locations/dashboard/profile", action: "Finish profile" },
  { number: 2, title: "Reservations", description: "Turn on reservations, set availability, and confirm how guests can book.", href: "/locations/dashboard/reservations", action: "Set up reservations" },
  { number: 3, title: "Events & Experiences", description: "Add anything guests can attend, book, or buy beyond a standard reservation.", href: "/locations/dashboard/events-experiences", action: "Add offerings" },
  { number: 4, title: "Ready for customers", description: "Review your public presence and make sure guests can discover, choose, and contact you.", href: "/locations/dashboard", action: "Go to dashboard" },
];

export default async function BusinessSetupHubPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const withQuery = (href: string) => query.size ? `${href}?${query.toString()}` : href;

  return (
    <main className="min-h-screen bg-[#060708] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff5f7a]">Business setup</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Get ready for customers.</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/50">Complete the essentials in order. Advanced tools stay out of the way until you need them.</p>
          </div>
          <Link href={withQuery("/locations/dashboard")} className="rounded-full border border-white/10 px-4 py-2.5 text-xs font-black text-white/65">Back to dashboard</Link>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.number} className="flex flex-col rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e1062a] text-sm font-black">{step.number}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">Essential</span>
              </div>
              <h2 className="mt-4 text-lg font-black">{step.title}</h2>
              <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-white/45">{step.description}</p>
              <Link href={withQuery(step.href)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white/[0.06] px-4 text-xs font-black text-white/80 transition hover:bg-white/[0.1]">{step.action} →</Link>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[#e1062a]/25 bg-[#e1062a]/[0.055] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff7188]">Starting a new business?</p>
              <h2 className="mt-1 text-xl font-black">Claim an existing location or add a new one first.</h2>
              <p className="mt-1 text-sm font-semibold text-white/45">The setup path begins after TheOutHaven knows which location you manage.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/locations/signup" className="rounded-full bg-[#e1062a] px-5 py-3 text-xs font-black uppercase tracking-[0.08em]">Claim or add location</Link>
              <Link href="/locations/apply" className="rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-white/70">Business application</Link>
            </div>
          </div>
        </section>

        <details className="mt-8 rounded-[1.35rem] border border-white/10 bg-white/[0.02] p-5">
          <summary className="cursor-pointer list-none text-sm font-black text-white/70">Advanced business tools <span className="float-right text-white/30">+</span></summary>
          <p className="mt-2 text-sm font-semibold text-white/40">Use these after the essentials are complete.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href={withQuery("/locations/dashboard/branding")} className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="font-black">Branding</p><p className="mt-1 text-xs font-semibold text-white/40">Logo, imagery, and visual identity.</p></Link>
            <Link href={withQuery("/locations/dashboard/domains")} className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="font-black">Domain</p><p className="mt-1 text-xs font-semibold text-white/40">Connect or manage your website domain.</p></Link>
            <Link href={withQuery("/locations/dashboard/qr-codes")} className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="font-black">QR Codes</p><p className="mt-1 text-xs font-semibold text-white/40">Create QR codes for menus, bookings, events, and reviews.</p></Link>
          </div>
        </details>
      </div>
    </main>
  );
}
