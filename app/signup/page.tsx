"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please complete all fields.");
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
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      setMessage("Account created. Please check your email to confirm.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
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

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_440px]">
        <div className="hidden min-h-[650px] flex-col justify-center border-r border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(225,6,42,0.22),transparent_35%),#080808] p-10 lg:flex">
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
            selections, and continue your experience anytime.
          </p>
        </div>

        <form onSubmit={handleSignup} className="p-6 sm:p-8">
          <Link
            href="/"
            className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/55 transition hover:bg-white hover:text-black"
          >
            ← Home
          </Link>

          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
            RoseOut
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Create Account
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/55">
            Sign up to start planning better experiences.
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

          <label className="mt-6 block text-sm font-black text-white/80">
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
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-red-600 px-6 py-4 font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-5 text-center text-sm font-bold text-white/45">
            Already have an account?{" "}
            <Link href="/login" className="text-red-300 transition hover:text-white">
              Log in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}