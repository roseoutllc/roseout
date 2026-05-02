"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Step = 1 | 2;

export default function SignupPage() {
  const supabase = createClient();
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [step, setStep] = useState<Step>(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [smsConsent, setSmsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function nextStep() {
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your password.");
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
  }

  async function handleSignup(e: React.FormEvent) {
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

    if (!turnstileToken) {
      setError("Please complete the verification before creating your account.");
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
              "I agree to receive SMS messages from RoseOut about my account, recommendations, booking updates, reminders, and customer support. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help.",
            sms_consent_timestamp: smsConsent ? new Date().toISOString() : null,
            turnstile_completed: true,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        turnstileRef.current?.reset();
        setTurnstileToken("");
        return;
      }

      setMessage("Account created. Please check your email to confirm.");
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setSmsConsent(false);
      setMarketingConsent(false);
      setTermsConsent(false);
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setStep(1);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(225,6,42,0.32),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(127,29,29,0.28),transparent_32%),linear-gradient(180deg,#050505,#000)]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/55 transition hover:bg-white hover:text-black"
          >
            ← Home
          </Link>

          <div className="mt-10 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="RoseOut"
              width={44}
              height={44}
              className="object-contain drop-shadow-[0_0_14px_rgba(225,6,42,0.55)]"
              priority
            />

            <span className="text-sm font-black uppercase tracking-[0.28em] text-red-200">
              RoseOut
            </span>
          </div>

          <h1 className="mt-8 max-w-xl text-6xl font-black leading-[0.92] tracking-tight xl:text-7xl">
            Find the right
            <br />
            <span className="text-red-500">night out.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
            Create your RoseOut account to plan better outings, save your
            selections, and continue your experience anytime.
          </p>

          <div className="mt-8 flex gap-3">
            <StepPill active={step === 1} label="Account" />
            <StepPill active={step === 2} label="Consent" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0b]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-red-950/50 via-black to-black px-6 py-5 sm:px-8">
            <Link
              href="/"
              className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/55 transition hover:bg-white hover:text-black lg:hidden"
            >
              ← Home
            </Link>

            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="RoseOut"
                width={36}
                height={36}
                className="object-contain drop-shadow-[0_0_12px_rgba(225,6,42,0.55)]"
                priority
              />

              <span className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                RoseOut
              </span>
            </div>

            <p className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-red-400">
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
          </div>

          <form onSubmit={handleSignup} className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
                {message}
              </div>
            )}

            {step === 1 && (
              <>
                <Field
                  label="Full Name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your name"
                />

                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                />

                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Create password"
                />

                <Field
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm password"
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
                <Field
                  label="Mobile Number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Example: 516-555-1234"
                />

                <ConsentBox
                  checked={smsConsent}
                  onChange={setSmsConsent}
                  required={!!phone.trim()}
                >
                  I agree to receive SMS messages from RoseOut about my account,
                  recommendations, booking updates, reminders, and customer
                  support. Message frequency varies. Message and data rates may
                  apply. Reply STOP to opt out and HELP for help.
                </ConsentBox>

                <ConsentBox
                  checked={marketingConsent}
                  onChange={setMarketingConsent}
                >
                  I also agree to receive occasional RoseOut promotional texts,
                  offers, and featured outing ideas. This is optional.
                </ConsentBox>

                <ConsentBox checked={termsConsent} onChange={setTermsConsent}>
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
                </ConsentBox>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/45 p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/35">
                    Verification
                  </p>

                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      options={{
                        theme: "dark",
                        size: "normal",
                      }}
                      onSuccess={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken("")}
                      onError={() => {
                        setTurnstileToken("");
                        setError("Verification failed. Please try again.");
                      }}
                    />
                  ) : (
                    <p className="text-sm font-bold text-red-200">
                      Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY.
                    </p>
                  )}
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
                    disabled={loading || !turnstileToken}
                    className="rounded-full bg-red-600 px-6 py-4 font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </>
            )}

            <p className="mt-6 text-center text-sm font-bold text-white/45">
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
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="mt-5">
      <label className="block text-sm font-black text-white/80">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
      />
    </div>
  );
}

function ConsentBox({
  checked,
  onChange,
  children,
  required = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4">
      <label className="flex gap-3 text-sm leading-6 text-white/70">
        <input
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-red-600"
        />
        <span>{children}</span>
      </label>
    </div>
  );
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${
        active
          ? "bg-red-600 text-white shadow-lg shadow-red-950/40"
          : "border border-white/10 bg-white/[0.04] text-white/35"
      }`}
    >
      {label}
    </div>
  );
}