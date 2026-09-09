import Link from "next/link";

export const dynamic = "force-dynamic";

const primaryActions = [
  {
    title: "Review new locations",
    description: "Approve strong Google-discovered locations, keep weak candidates hidden, and resolve review blockers.",
    href: "/admin/dashboard/settings/location-tools/google-discovery",
    action: "Open review queue",
  },
  {
    title: "Resolve duplicates",
    description: "Review possible duplicates before they can reach public search or consume more enrichment work.",
    href: "/admin/dashboard/settings/location-tools/duplicates",
    action: "Review duplicates",
  },
  {
    title: "Repair incomplete data",
    description: "Fill missing photos, websites, hours, categories, and other fields that keep locations from being ready.",
    href: "/admin/dashboard/settings/location-tools/enrichment",
    action: "Open enrichment",
  },
  {
    title: "Review hidden inventory",
    description: "See locations currently kept out of public search and decide what can be repaired or should stay hidden.",
    href: "/admin/dashboard/settings/location-tools/hidden-locations",
    action: "Review hidden locations",
  },
];

const advancedTools = [
  ["Publishing rules", "/admin/dashboard/settings/location-tools/publishing"],
  ["Photos", "/admin/dashboard/settings/location-tools/photos"],
  ["Import", "/admin/dashboard/settings/location-tools/import"],
  ["Markets", "/admin/dashboard/settings/location-tools/markets"],
  ["Search profiles", "/admin/dashboard/settings/location-tools/search-profiles"],
  ["Claim URLs", "/admin/dashboard/settings/location-tools/claim-urls"],
  ["Logs", "/admin/dashboard/settings/location-tools/logs"],
] as const;

export default function Page() {
  return (
    <main className="min-h-screen bg-[#07090c] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff6b86]">Location quality</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">What needs a decision?</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/50">Start with the queues that affect whether a location can safely appear in customer search. Technical tools stay secondary.</p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {primaryActions.map((item) => (
            <article key={item.href} className="flex flex-col rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-5">
              <span className="w-fit rounded-full bg-[#e1062a]/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#ff7188]">Decision queue</span>
              <h2 className="mt-4 text-lg font-black">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-white/45">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#e1062a] px-4 text-xs font-black uppercase tracking-[0.08em] transition hover:bg-[#ff1744]">{item.action} →</Link>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[1.35rem] border border-emerald-400/15 bg-emerald-400/[0.045] p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Quality standard</p>
          <h2 className="mt-1 text-xl font-black">Public search should only see locations that are ready.</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/50">Possible duplicates, hidden inventory, and incomplete records should be resolved before publication. Use the queues above for decisions; use the tools below only when deeper operational work is needed.</p>
        </section>

        <details className="mt-8 rounded-[1.35rem] border border-white/10 bg-white/[0.02] p-5">
          <summary className="cursor-pointer list-none text-sm font-black text-white/70">Advanced location operations <span className="float-right text-white/30">+</span></summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {advancedTools.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-black text-white/65 transition hover:border-white/20 hover:text-white">{label} →</Link>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}
