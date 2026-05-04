"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReserveLiveRefresh() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(15);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSeconds((current) => (current <= 1 ? 15 : current - 1));
    }, 1000);

    const refresh = setInterval(() => {
      router.refresh();
    }, 15000);

    return () => {
      clearInterval(countdown);
      clearInterval(refresh);
    };
  }, [router]);

  return (
    <div className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black text-white/60">
      Live refresh in {seconds}s
    </div>
  );
}