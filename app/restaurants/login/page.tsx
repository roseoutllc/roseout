"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function RestaurantLoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const login = async () => {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/restaurants/dashboard";
  };

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-4xl font-bold">Restaurant Login</h1>

        <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-black">
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black"
          >
            Login
          </button>

          {message && <p className="text-center font-semibold">{message}</p>}
        </div>
      </div>
    </main>
  );
}