"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export default function RestaurantApplyPage() {
  const addressRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    restaurant_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    email: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const initAutocomplete = () => {
      if (!addressRef.current || !window.google) return;

      const autocomplete = new window.google.maps.places.Autocomplete(
        addressRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "us" },
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let zip = "";

        place.address_components?.forEach((component: any) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          }

          if (types.includes("route")) {
            route = component.long_name;
          }

          if (types.includes("locality")) {
            city = component.long_name;
          }

          if (types.includes("sublocality")) {
            city = city || component.long_name;
          }

          if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }

          if (types.includes("postal_code")) {
            zip = component.long_name;
          }
        });

        setForm((prev) => ({
          ...prev,
          address: `${streetNumber} ${route}`.trim(),
          city,
          state,
          zip_code: zip,
        }));
      });
    };

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }

    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", initAutocomplete);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initAutocomplete;

    document.head.appendChild(script);
  }, []);

  const submit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/restaurants/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Submission failed.");
        return;
      }

      setMessage(
        "Success! Your restaurant was submitted. Check your email for your login link."
      );

      setForm({
        restaurant_name: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        email: "",
        description: "",
      });
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl font-bold">
          List Your Restaurant on RoseOut
        </h1>

        <p className="mt-3 text-neutral-400">
          Get discovered in AI-powered date and outing plans.
        </p>

        <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-black">
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Restaurant Name"
            value={form.restaurant_name}
            onChange={(e) => update("restaurant_name", e.target.value)}
          />

          <input
            ref={addressRef}
            type="text"
            autoComplete="street-address"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Start typing restaurant address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />

          <input
            type="text"
            autoComplete="address-level2"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="City"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />

          <input
            type="text"
            autoComplete="address-level1"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="State"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
          />

          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Zip Code"
            value={form.zip_code}
            onChange={(e) => update("zip_code", e.target.value)}
          />

          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />

          <textarea
            className="min-h-28 w-full rounded-xl border px-4 py-3"
            placeholder="Describe your restaurant (vibe, cuisine, atmosphere)"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />

          <button
            onClick={submit}
            disabled={
              loading ||
              !form.restaurant_name.trim() ||
              !form.email.trim()
            }
            className="w-full rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Restaurant"}
          </button>

          {message && (
            <p className="text-center font-semibold">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}