"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Step = 1 | 2;

export default function SignupPage() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const nextStep = () => {
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please complete all account fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!termsConsent) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    if (phone.trim() && !smsConsent) {
      setError("Please check the SMS consent box if you enter a phone number.");
      return;
    }

    setLoading(true);

    try {
      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            sms_consent: smsConsent,
            marketing_consent: marketingConsent,
            sms_consent_language:
              "By checking this box, I agree to receive SMS messages from RoseOut about my account, bookings, recommendations, reminders, and updates. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help.",
            sms_consent_timestamp: new Date().toISOString(),
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      setMessage("Account created. Please check your email to confirm.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setSmsConsent(false);
      setMarketingConsent(false);
      setTermsConsent(false);
      setStep(1);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(225,6,42,0.32),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(127,29,29,0.32),transparent_30%),linear-gradient(180deg,#050505,#000)]" />
      <div className="absolute left-1/2 top-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_460px]">
        <div className="hidden min-h-[700px] flex-col justify-center border-r border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(225,6,42,0.22),transparent_35%),#080808] p-10 lg:flex">
          <div className="inline-flex w-fit rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-red-200">
            RoseOut
          </div>

          <h1 className="mt-10 text-6xl font-black leading-[0.95] tracking-tight">
            Start your
            <br />
            <span className="text-red-500">next night.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
            Create your RoseOut account to plan better outings, save your
            selections, and receive helpful account updates.
          </p>

          <div className="mt-8 flex gap-2">
            <StepDot active={step === 1} label="Account" />
            <StepDot active={step === 2} label="SMS Consent" />
          </div>
        </div>

        <form onSubmit={handleSignup} className="p-6 sm:p-8">
          <Link
            href="/"
            className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/55 transition hover:bg-white hover:text-black"
          >
            ← Home
          </Link>

          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
            Step {step} of 2
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight">
            {step === 1 ? "Create Account" : "SMS Consent"}
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/55">
            {step === 1
              ? "Set up your RoseOut login details."
              : "Choose how RoseOut can contact you by text message."}
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
              {message}
            </div>
          )}

          {step === 1 && (
            <>
              <label className="mt-6 block text-sm font-black text-white/80">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
              />

              <label className="mt-5 block text-sm font-black text-white/80">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
              />

              <label className="mt-5 block text-sm font-black text-white/80">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
              />

              <label className="mt-5 block text-sm font-black text-white/80">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
              />

              <button
                type="button"
                onClick={nextStep}
                className="mt-6 w-full rounded-full bg-red-600 px-6 py-4 font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <label className="mt-6 block text-sm font-black text-white/80">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Example: 516-555-1234"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
              />

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/45 p-4">
                <label className="flex gap-3 text-sm leading-6 text-white/70">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-red-600"
                  />
                  <span>
                    I agree to receive SMS messages from RoseOut about my
                    account, recommendations, booking updates, reminders, and
                    customer support. Message frequency varies. Message and data
                    rates may apply. Reply STOP to opt out and HELP for help.
                  </span>
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4">
                <label className="flex gap-3 text-sm leading-6 text-white/70">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-red-600"
                  />
                  <span>
                    I also agree to receive occasional RoseOut promotional texts,
                    offers, and featured outing ideas. This is optional.
                  </span>
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4">
                <label className="flex gap-3 text-sm leading-6 text-white/70">
                  <input
                    type="checkbox"
                    checked={termsConsent}
                    onChange={(e) => setTermsConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-red-600"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-bold text-red-300 hover:text-white"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-red-300 hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <p className="mt-4 text-xs leading-6 text-white/40">
                Consent is not a condition of purchase. You can opt out at any
                time by replying STOP. For help, reply HELP or contact RoseOut
                support.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full border border-white/15 px-6 py-4 font-black text-white transition hover:bg-white hover:text-black"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-red-600 px-6 py-4 font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </>
          )}

          <p className="mt-5 text-center text-sm font-bold text-white/45">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-red-300 transition hover:text-white"
            >
              Log in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${
        active
          ? "bg-red-600 text-white"
          : "border border-white/10 bg-white/[0.04] text-white/35"
      }`}
    >
      {label}
    </div>
  );
}