"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminUsersPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addAdminUser = async () => {
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }

    setLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        setError("This user is already an admin.");
        return;
      }

      const { error: insertError } = await supabase.from("admin_users").insert({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim() || null,
        role: "admin",
      });

      if (insertError) throw insertError;

      setMessage("Admin user added successfully.");
      setEmail("");
      setFullName("");
    } catch (err: any) {
      setError(err.message || "Could not add admin user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <AdminTopBar />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-500">
          RoseOut Admin
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Add Admin User
        </h1>

        <p className="mt-3 text-neutral-400">
          Add team members who should have access to the RoseOut admin portal.
        </p>

        <div className="mt-8 rounded-[2rem] bg-white p-6 text-black shadow-2xl">
          {message && (
            <div className="mb-5 rounded-2xl bg-green-100 p-4 text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}

          <label className="text-sm font-bold">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Example: Jane Smith"
            className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
          />

          <label className="mt-5 block text-sm font-bold">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
          />

          <button
            onClick={addAdminUser}
            disabled={loading}
            className="mt-6 w-full rounded-full bg-yellow-500 px-6 py-4 font-extrabold text-black disabled:opacity-50"
          >
            {loading ? "Adding Admin..." : "Add Admin User"}
          </button>
        </div>
      </div>
    </main>
  );
}