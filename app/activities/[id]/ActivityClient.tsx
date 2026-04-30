"use client";

import { useEffect } from "react";

export default function ActivityClient({ activity }: any) {
  // ✅ TRACK VIEW
  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: activity.id,
        type: "activity",
        event: "view",
      }),
    });
  }, [activity.id]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-extrabold">
        {activity.activity_name}
      </h1>

      <p className="mt-2 text-neutral-400">
        {activity.city}
      </p>

      <img
        src={activity.image_url}
        className="mt-6 w-full rounded-2xl"
      />

      <p className="mt-6 text-lg">{activity.description}</p>

      <div className="mt-6">
        <a
          href={activity.booking_link}
          target="_blank"
          onClick={() => {
            // ✅ TRACK CLICK
            fetch("/api/analytics", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: activity.id,
                type: "activity",
                event: "click",
              }),
            });
          }}
          className="inline-block rounded-full bg-yellow-500 px-6 py-3 font-bold text-black"
        >
          Book Now
        </a>
      </div>
    </div>
  );
}