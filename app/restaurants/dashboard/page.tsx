"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function RestaurantDashboardPage() {
  const supabase = createClient();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadRestaurant = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/restaurants/login";
        return;
      }

      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_user_id", userData.user.id)
        .single();

      if (error) {
        setMessage("No restaurant listing found for this account.");
        return;
      }

      setRestaurant(data);
    };

    loadRestaurant();
  }, []);

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <p>{message || "Loading..."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Restaurant Dashboard</h1>

        <div className="mt-8 rounded-3xl bg-white p-6 text-black">
          <h2 className="text-2xl font-bold">{restaurant.restaurant_name}</h2>

          <p className="mt-2 text-neutral-600">
            Status: {restaurant.status}
          </p>

          <p className="mt-2">
            {restaurant.address}, {restaurant.city}, {restaurant.state}{" "}
            {restaurant.zip_code}
          </p>

          <p className="mt-4">{restaurant.description}</p>

          {restaurant.qr_code_data_url && (
            <div className="mt-6 text-center">
              <img
                src={restaurant.qr_code_data_url}
                alt="Restaurant QR Code"
                className="mx-auto h-48 w-48"
              />

              <a
                href={restaurant.qr_code_data_url}
                download={`${restaurant.restaurant_name}-roseout-qr.png`}
              >
                <button className="mt-4 rounded-xl bg-black px-6 py-3 font-semibold text-white">
                  Download QR Code
                </button>
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}