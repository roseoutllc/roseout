"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Slot = {
  time: string;
  label: string;
  remaining: number;
};

type Item = {
  id: string;
  item_name: string;
  capacity_min: number;
  capacity_max: number;
  available_slots?: Slot[];
};

export default function ReserveLocationPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const locationId = String(params.id || "");
  const locationType = searchParams.get("type") || "restaurant";

  const prefillDate = searchParams.get("date") || "";
  const prefillPartySize = searchParams.get("partySize") || "";
  const prefillItem = searchParams.get("item") || "";

  const [location, setLocation] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [partySize, setPartySize] = useState(
    Number(prefillPartySize || 2)
  );
  const [date, setDate] = useState(
    prefillDate || new Date().toISOString().slice(0, 10)
  );

  const [selectedItem, setSelectedItem] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        locationId,
        type: locationType,
        reservationDate: date,
        partySize: String(partySize),
      });

      const res = await fetch(`/api/reserve/location?${query}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setLocation(data.location);
      setItems(data.items || []);

      const first =
        data.items?.find((i: Item) => i.id === prefillItem) ||
        data.items?.[0];

      if (first) {
        setSelectedItem(first.id);
        setSelectedTime(first.available_slots?.[0]?.time || "");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (locationId) loadData();
  }, [locationId, date, partySize]);

  async function submit(e: any) {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      const res = await fetch("/api/reserve/location", {
        method: "POST",
        body: JSON.stringify({
          location_id: locationId,
          location_type: locationType,
          bookable_item_id: selectedItem,
          reservation_date: date,
          reservation_time: selectedTime,
          party_size: partySize,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSuccess("Reservation created successfully");
    } catch (err: any) {
      setError(err.message);
    }
  }

  const currentItem = items.find((i) => i.id === selectedItem);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">
        {location?.name || "Reservation"}
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={submit} className="space-y-4 max-w-lg">
          {error && <p className="text-red-400">{error}</p>}
          {success && <p className="text-green-400">{success}</p>}

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-black border"
          />

          <input
            type="number"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full p-3 bg-black border"
          />

          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full p-3 bg-black border"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            {currentItem?.available_slots?.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setSelectedTime(slot.time)}
                className={`p-2 border ${
                  selectedTime === slot.time ? "bg-red-600" : ""
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>

          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-black border"
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-black border"
          />

          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 bg-black border"
          />

          <button className="w-full bg-red-600 p-3 font-bold">
            Reserve
          </button>
        </form>
      )}
    </main>
  );
}