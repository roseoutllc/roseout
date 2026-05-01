"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { createClient } from "@/lib/supabase-browser";

declare global {
  interface Window {
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
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export default function SignupPage() {
  const supabase = createClient();

  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = password.length >= 6;

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    isPasswordValid &&
    passwordsMatch &&
    captchaToken &&
    !loading;

  const renderTurnstile = () => {
    if (!turnstileRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      setErrorMessage("Missing Turnstile site key.");
      return;
    }

    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
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
    renderTurnstile();
  }, []);

  const resetCaptcha = () => {
    setCaptchaToken(null);

    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");
    setMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Please complete the verification.");
      return;
    }

    setLoading(true);

    const captchaResponse = await fetch("/api/verify-captcha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
        data: {
          full_name: fullName.trim(),
          role: "user",
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
    resetCaptcha();
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-8 text-white">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
        onLoad={renderTurnstile}
      />

      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight">
            RoseOut
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white"
          >
            Log in
          </Link>
        </header>

        <section className="grid min-h-[calc(100vh-120px)] items-center gap-10 lg:grid-cols-[1fr_460px]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-rose-200">
              RoseOut AI
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Find the perfect outing faster.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Create your RoseOut account to save curated restaurants,
              activities, and full plans in one clean dashboard.
            </p>

            <div className="mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
              {[
                ["01", "Tell RoseOut what kind of night you want."],
                ["02", "Get restaurants and activities that match."],
                ["03", "Save your plan and come back anytime."],
              ].map(([num, text]) => (
                <div
                  key={num}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-2xl font-black text-white">{num}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl">
            <div className="border-b border-white/10 px-7 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-300">
                Create Account
              </p>
              <h2 className="mt-2 text-3xl font-black">Join RoseOut</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Start building better outings today.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5 p-7">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Full name"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm password"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none placeholder:text-zinc-600 focus:border-rose-400"
              />

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs">
                <p className={isPasswordValid ? "text-emerald-300" : "text-zinc-500"}>
                  ✓ Password must be at least 6 characters
                </p>
                <p className={passwordsMatch ? "mt-1 text-emerald-300" : "mt-1 text-zinc-500"}>
                  ✓ Passwords must match
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div ref={turnstileRef} />
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p className="text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-rose-300 hover:text-rose-200">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}