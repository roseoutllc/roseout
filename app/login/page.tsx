"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (!data.user?.email) {
        setError("Login failed. Please try again.");
        return;
      }

      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("id, role")
        .eq("email", data.user.email.toLowerCase())
        .maybeSingle();

      if (adminError) {
        setError(adminError.message);
        return;
      }

      if (!adminUser) {
        await supabase.auth.signOut();
        setError("You are not authorized for the admin dashboard.");
        return;
      }

      setMessage("Login successful. Redirecting...");

      router.replace("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-[2rem] bg-white p-8 text-black shadow-2xl"
      >
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-600">
          RoseOut Admin
        </p>

        <h1 className="text-3xl font-extrabold">Admin Login</h1>

        <p className="mt-2 text-sm text-neutral-500">
          Sign in to access your dashboard.
        </p>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-100 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl bg-green-100 p-4 text-sm font-semibold text-green-700">
            {message}
          </div>
        )}

        <label className="mt-6 block text-sm font-bold">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
        />

        <label className="mt-5 block text-sm font-bold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}