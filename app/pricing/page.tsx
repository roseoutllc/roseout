"use client";

import Link from "next/link";
import { Check, X, Sparkles, Crown, QrCode, CalendarCheck, BarChart3, Bot } from "lucide-react";

const freeFeatures = [
  "Basic RoseOut listing",
  "1 restaurant photo",
  "Appears in search results",
  "Limited AI discovery",
  "Basic view analytics",
  "Claim your business",
];

const proFeatures = [
  "Everything in Free",
  "RoseOut Reserve bookings",
  "Priority AI discovery",
  "Boosted search placement",
  "Advanced analytics dashboard",
  "Up to 10 photos",
  "Menu, website, phone & socials",
  "QR Growth Tools",
];

const comparison = [
  ["AI Discovery", "Limited", "Priority Boost"],
  ["Search Ranking", "Standard", "Boosted"],
  ["RoseOut Reserve", "No", "Yes"],
  ["Photos", "1 Photo", "Up to 10"],
  ["Analytics", "Views Only", "Views, Clicks & Bookings"],
  ["QR Tools", "No", "Yes"],
  ["Listing Control", "Basic", "Full Customization"],
];

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-rose-700/25 blur-[120px]" />
        <div className="absolute bottom-[-160px] right-[-100px] h-[420px] w-[420px] rounded-full bg-red-900/20 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        {/* HERO */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
            <Sparkles className="h-4 w-4" />
            Built for restaurants ready to be discovered
          </div>

          <h1 className="animate-fade-up text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl">
            Get Discovered.
            <span className="block bg-gradient-to-r from-rose-300 via-rose-500 to-red-500 bg-clip-text text-transparent">
              Get Booked.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
            RoseOut helps restaurants appear inside AI-powered outing plans, drive bookings,
            and turn customer attention into real reservations.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/restaurants/apply"
              className="rounded-full bg-rose-600 px-7 py-4 text-sm font-bold text-white shadow-[0_0_35px_rgba(225,29,72,0.35)] transition duration-300 hover:-translate-y-1 hover:bg-rose-500"
            >
              Get Started Free
            </Link>

            <Link
              href="/restaurants/dashboard"
              className="rounded-full border border-white/10 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {/* FREE */}
          <div className="group rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur transition duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[0.05]">
            <div className="mb-8">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
                Starter Listing
              </p>
              <h2 className="text-3xl font-black">Free</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-black">$0</span>
                <span className="pb-2 text-zinc-500">/ month</span>
              </div>
              <p className="mt-5 text-zinc-400">
                Perfect for getting listed and appearing in RoseOut discovery.
              </p>
            </div>

            <Link
              href="/restaurants/apply"
              className="block rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-bold transition hover:bg-white/10"
            >
              Start Free
            </Link>

            <ul className="mt-8 space-y-4">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                  {feature}
                </li>
              ))}

              {["Priority ranking", "Reservations", "Advanced analytics", "QR Growth Tools"].map(
                (feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-600">
                    <X className="mt-0.5 h-5 w-5 shrink-0" />
                    {feature}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* PRO */}
          <div className="relative rounded-[2rem] border border-rose-500/50 bg-gradient-to-b from-rose-950/35 to-white/[0.03] p-8 shadow-[0_0_70px_rgba(225,29,72,0.22)] backdrop-blur transition duration-500 hover:-translate-y-2">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-rose-600 px-5 py-2 text-xs font-black uppercase tracking-[0.22em] shadow-[0_0_35px_rgba(225,29,72,0.55)]">
              Most Popular
            </div>

            <div className="mb-8">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-rose-300">
                <Crown className="h-4 w-4" />
                Growth Plan
              </p>
              <h2 className="text-3xl font-black">RoseOut Pro</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-black">$99</span>
                <span className="pb-2 text-zinc-400">/ month</span>
              </div>
              <p className="mt-5 text-zinc-300">
                For restaurants that want more visibility, bookings, and customer insights.
              </p>
            </div>

            <Link
              href="/restaurants/dashboard"
              className="block rounded-2xl bg-rose-600 px-5 py-4 text-center text-sm font-black text-white shadow-[0_0_35px_rgba(225,29,72,0.35)] transition hover:bg-rose-500"
            >
              Upgrade to Pro
            </Link>

            <ul className="mt-8 space-y-4">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-100">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* VALUE CARDS */}
        <div className="mt-24 grid gap-5 md:grid-cols-4">
          {[
            {
              icon: Bot,
              title: "AI Discovery",
              text: "Appear inside real customer plans for dates, birthdays, brunch, nightlife, and more.",
            },
            {
              icon: CalendarCheck,
              title: "RoseOut Reserve",
              text: "Let guests book directly through RoseOut with a clean reservation experience.",
            },
            {
              icon: BarChart3,
              title: "Analytics",
              text: "Track views, clicks, interest, and booking behavior from your dashboard.",
            },
            {
              icon: QrCode,
              title: "QR Growth Tools",
              text: "Use custom QR codes to turn in-person guests into repeat bookings.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:bg-white/[0.06]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
              </div>
            );
          })}
        </div>

        {/* COMPARISON */}
        <div className="mt-24 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black">See the Difference</h2>
            <p className="mt-3 text-zinc-400">
              Free helps you get discovered. Pro helps you get chosen.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-300">
                <tr>
                  <th className="px-4 py-4">Feature</th>
                  <th className="px-4 py-4">Free</th>
                  <th className="px-4 py-4 text-rose-300">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([feature, free, pro]) => (
                  <tr key={feature} className="border-t border-white/10">
                    <td className="px-4 py-4 font-semibold text-white">{feature}</td>
                    <td className="px-4 py-4 text-zinc-500">{free}</td>
                    <td className="px-4 py-4 font-semibold text-rose-200">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-center text-3xl font-black">Questions Restaurants Ask</h2>

          <div className="mt-8 space-y-4">
            {[
              {
                q: "Is the Free plan really free?",
                a: "Yes. Restaurants can claim a basic listing and appear in limited AI discovery at no monthly cost.",
              },
              {
                q: "What is RoseOut Reserve?",
                a: "RoseOut Reserve is your built-in booking system that lets customers reserve directly from your RoseOut listing.",
              },
              {
                q: "What does AI discovery mean?",
                a: "RoseOut recommends your restaurant inside customer plans based on intent, vibe, location, cuisine, and occasion.",
              },
              {
                q: "Can restaurants cancel Pro anytime?",
                a: "Yes. The Pro plan is monthly and designed to be simple, flexible, and restaurant-friendly.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
              >
                <summary className="cursor-pointer list-none font-bold">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="mt-24 rounded-[2rem] border border-rose-500/30 bg-gradient-to-r from-rose-950/60 via-[#111] to-red-950/40 p-10 text-center shadow-[0_0_70px_rgba(225,29,72,0.18)]">
          <h2 className="text-3xl font-black sm:text-4xl">
            Ready to turn views into customers?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
            Start free today, then upgrade when you’re ready to unlock bookings,
            boosted AI discovery, and premium growth tools.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/restaurants/apply"
              className="rounded-full bg-white px-7 py-4 text-sm font-black text-black transition hover:-translate-y-1 hover:bg-zinc-200"
            >
              Get Started Free
            </Link>

            <Link
              href="/restaurants/dashboard"
              className="rounded-full bg-rose-600 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-rose-500"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-up {
          animation: fade-up 0.8s ease-out both;
        }

        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </main>
  );
}