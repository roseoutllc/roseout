"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { createClient } from "@/lib/supabase-browser";

type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }
    ) => string | undefined;
    reset: (widgetId?: string) => void;
  };
};

export default function SignupPage() {
  const supabase = createClient();

  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null | undefined>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [planningFor, setPlanningFor] = useState("");
  const [city, setCity] = useState("");
  const [preferredVibe, setPreferredVibe] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isPasswordValid =
    hasMinLength && hasUppercase && hasNumber && hasSymbol;

  const canGoStep2 =
    fullName.trim() &&
    email.trim() &&
    isPasswordValid &&
    passwordsMatch &&
    acceptedTerms;

  const canSubmit = canGoStep2 && captchaToken && !loading;

  const renderTurnstile = () => {
    const turnstile = (window as TurnstileWindow).turnstile;

    if (!turnstileRef.current || !turnstile || widgetIdRef.current) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      setErrorMessage("Missing Turnstile site key.");
      return;
    }

    widgetIdRef.current = turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token: string) => {
        setCaptchaToken(token);
        setErrorMessage("");
      },
      "expired-callback": () => setCaptchaToken(null),
      "error-callback": () => {
        setCaptchaToken(null);
        setErrorMessage("Verification failed. Please try again.");
      },
    });
  };

  useEffect(() => {
    if (step === 2) {
      setTimeout(renderTurnstile, 100);
    }
  }, [step]);

  const resetCaptcha = () => {
    const turnstile = (window as TurnstileWindow).turnstile;
    setCaptchaToken(null);

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }
  };

  const handleNextStep = () => {
    setErrorMessage("");
    setMessage("");

    if (!fullName.trim()) return setErrorMessage("Please enter your full name.");
    if (!email.trim()) return setErrorMessage("Please enter your email address.");

    if (!isPasswordValid) {
      return setErrorMessage(
        "Password must be at least 8 characters and include an uppercase letter, number, and symbol."
      );
    }

    if (!passwordsMatch) return setErrorMessage("Passwords do not match.");

    if (!acceptedTerms) {
      return setErrorMessage("Please agree to the Terms and Privacy Policy.");
    }

    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");
    setMessage("");

    if (!canGoStep2) {
      setStep(1);
      setErrorMessage("Please complete your account details first.");
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Please complete the verification.");
      return;
    }

    setLoading(true);

    try {
      const captchaResponse = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken }),
      });

      const captchaResult = await captchaResponse.json();

      if (!captchaResponse.ok || !captchaResult.success) {
        setErrorMessage(
          captchaResult.error || "Captcha verification failed. Please try again."
        );
        resetCaptcha();
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${
            process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
          }/dashboard`,
          data: {
            full_name: fullName.trim(),
            role: "user",
            planning_for: planningFor || null,
            city: city.trim() || null,
            preferred_vibe: preferredVibe || null,
            budget_range: budgetRange || null,
            marketing_opt_in: marketingOptIn,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        resetCaptcha();
        setLoading(false);
        return;
      }

      setMessage("Account created. Please check your email to confirm.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPlanningFor("");
      setCity("");
      setPreferredVibe("");
      setBudgetRange("");
      setAcceptedTerms(false);
      setMarketingOptIn(false);
      resetCaptcha();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-[#0b0b0f] px-6 py-5 text-white">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
        onLoad={() => {
          if (step === 2) renderTurnstile();
        }}
      />

      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <header className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight">
            RoseOut
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white"
          >
            Log in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 overflow-hidden lg:grid-cols-[1fr_500px]">
          <div className="hidden lg:block">
            <div className="mb-4 inline-flex rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-rose-200">
              RoseOut AI
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight xl:text-6xl">
              Build your perfect night out.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
              Create your account, personalize your outing style, and let
              RoseOut recommend restaurants, activities, and full plans that
              match your vibe.
            </p>

            <div className="mt-6 grid max-w-3xl gap-3 md:grid-cols-3">
              {[
                ["01", "Create your RoseOut account."],
                ["02", "Tell us your outing preferences."],
                ["03", "Get better AI-powered plans."],
              ].map(([num, text]) => (
                <div
                  key={num}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-xl font-black text-white">{num}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-h-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-2xl">
            <div className="border-b border-white/10 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-300">
                Step {step} of 2
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {step === 1 ? "Create account" : "Personalize RoseOut"}
              </h2>

              <div className="mt-4 flex gap-2">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    step >= 1 ? "bg-rose-400" : "bg-white/10"
                  }`}
                />
                <div
                  className={`h-2 flex-1 rounded-full ${
                    step >= 2 ? "bg-rose-400" : "bg-white/10"
                  }`}
                />
              </div>
            </div>

            {step === 1 ? (
              <div className="space-y-3 p-6">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
                />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
                />

                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-xs">
                  <p className={hasMinLength ? "text-emerald-300" : "text-zinc-500"}>
                    ✓ At least 8 characters
                  </p>
                  <p className={hasUppercase ? "text-emerald-300" : "text-zinc-500"}>
                    ✓ One uppercase letter
                  </p>
                  <p className={hasNumber ? "text-emerald-300" : "text-zinc-500"}>
                    ✓ One number
                  </p>
                  <p className={hasSymbol ? "text-emerald-300" : "text-zinc-500"}>
                    ✓ One symbol
                  </p>
                  <p className={passwordsMatch ? "text-emerald-300" : "text-zinc-500"}>
                    ✓ Passwords match
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" className="font-bold text-rose-300">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-bold text-rose-300">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                {errorMessage && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black hover:bg-rose-100"
                >
                  Continue
                </button>

                <p className="text-center text-xs text-zinc-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-rose-300 hover:text-rose-200"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3 p-6">
                <select
                  value={planningFor}
                  onChange={(e) => setPlanningFor(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-rose-400"
                >
                  <option value="">What are you using RoseOut for?</option>
                  <option value="date_nights">Date nights</option>
                  <option value="friends">Going out with friends</option>
                  <option value="solo">Solo outings</option>
                  <option value="family">Family outings</option>
                  <option value="events">Events & experiences</option>
                </select>

                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City or borough, example: Queens"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
                />

                <select
                  value={preferredVibe}
                  onChange={(e) => setPreferredVibe(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-rose-400"
                >
                  <option value="">Preferred vibe</option>
                  <option value="romantic">Romantic</option>
                  <option value="upscale">Upscale</option>
                  <option value="fun">Fun & energetic</option>
                  <option value="cozy">Cozy</option>
                  <option value="quiet">Quiet</option>
                  <option value="trendy">Trendy</option>
                </select>

                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-rose-400"
                >
                  <option value="">Budget range</option>
                  <option value="budget">$</option>
                  <option value="moderate">$$</option>
                  <option value="premium">$$$</option>
                  <option value="luxury">$$$$</option>
                </select>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    Send me RoseOut updates, recommendations, and offers by email.
                  </span>
                </label>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div ref={turnstileRef} />
                </div>

                {errorMessage && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                {message && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                    {message}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-white/10"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-2/3 rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}