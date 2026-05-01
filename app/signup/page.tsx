"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = password.length >= 6;

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");
    setMessage("");

    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Please complete the verification.");
      return;
    }

    setLoading(true);

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
      setLoading(false);
      return;
    }

    setMessage("Account created. Check your email to confirm.");
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCaptchaToken(null);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      {/* Turnstile Script */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />

      <section className="relative min-h-screen overflow-hidden px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.92))]" />

        {/* Top Bar */}
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            RoseOut
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white/85 hover:bg-white/10"
          >
            Log in
          </Link>
        </div>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-10 py-12 lg:grid-cols-2">
          
          {/* LEFT SIDE */}
          <div>
            <h1 className="text-5xl font-black md:text-7xl">
              Plan better nights out.
            </h1>

            <p className="mt-6 text-white/70">
              Create your account to unlock curated restaurant and activity
              plans with a luxury experience.
            </p>
          </div>

          {/* FORM */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-white/10 bg-[#111]/90 p-7 shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold">Create account</h2>

              <form onSubmit={handleSignup} className="space-y-5">
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                />

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                />

                {/* VALIDATION UI */}
                <div className="text-xs space-y-1">
                  <p className={isPasswordValid ? "text-green-400" : "text-white/40"}>
                    • At least 6 characters
                  </p>
                  <p className={passwordsMatch ? "text-green-400" : "text-white/40"}>
                    • Passwords match
                  </p>
                </div>

                {/* CAPTCHA */}
                <div
                  className="cf-turnstile"
                  data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  data-callback={(token: string) => setCaptchaToken(token)}
                />

                {errorMessage && (
                  <div className="text-red-400 text-sm">{errorMessage}</div>
                )}

                {message && (
                  <div className="text-green-400 text-sm">{message}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white py-3 font-bold text-black"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              </form>

              <p className="mt-4 text-sm text-white/50">
                Already have an account?{" "}
                <Link href="/login" className="text-rose-300">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}