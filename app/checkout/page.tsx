"use client";

import { ArrowLeft, Building2, Mail, Phone, User, MapPin } from "lucide-react";
import Link from "next/link";

export default function CheckoutInfoPage() {
  return (
    <main className="min-h-screen bg-[#070707] px-5 py-12 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-rose-700/25 blur-[120px]" />
      </div>

      <section className="relative mx-auto max-w-3xl">
        <Link
          href="/pricing"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pricing
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
              <Building2 className="h-7 w-7" />
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-300">
              RoseOut Pro
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-5xl">
              Business Information
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              Enter your business details before continuing to secure checkout.
              Your RoseOut Pro plan is $99/month.
            </p>
          </div>

          <form action="/api/checkout" method="POST" className="space-y-5">
            <input type="hidden" name="plan" value="pro" />

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Restaurant / Business Name
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <Building2 className="h-5 w-5 text-rose-300" />
                <input
                  name="businessName"
                  required
                  placeholder="Example: Rose Bistro"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Owner / Contact Name
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <User className="h-5 w-5 text-rose-300" />
                <input
                  name="contactName"
                  required
                  placeholder="Full name"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Email
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Mail className="h-5 w-5 text-rose-300" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="owner@restaurant.com"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Phone
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Phone className="h-5 w-5 text-rose-300" />
                  <input
                    name="phone"
                    required
                    placeholder="(555) 555-5555"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Business Address
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <MapPin className="h-5 w-5 text-rose-300" />
                <input
                  name="address"
                  required
                  placeholder="Street address, city, state"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-rose-600 px-6 py-4 text-sm font-black text-white shadow-[0_0_35px_rgba(225,29,72,0.35)] transition hover:-translate-y-1 hover:bg-rose-500"
            >
              Continue to Secure Checkout
            </button>

            <p className="text-center text-xs text-zinc-500">
              You’ll be redirected to Stripe to complete your $99/month RoseOut Pro subscription.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}