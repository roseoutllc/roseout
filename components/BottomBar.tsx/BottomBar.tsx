"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomBar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path ? "text-[#e1062a]" : "text-white/50";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center text-xs font-black ${isActive("/")}`}
        >
          <span className="text-lg">🏠</span>
          Home
        </Link>

        {/* Search / Create */}
        <Link
          href="/create"
          className="flex flex-col items-center text-xs font-black text-white"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e1062a] text-xl shadow-2xl shadow-red-500/30 -mt-8">
            ✨
          </div>
          Plan
        </Link>

        {/* About */}
        <Link
          href="/about"
          className={`flex flex-col items-center text-xs font-black ${isActive("/about")}`}
        >
          <span className="text-lg">ℹ️</span>
          About
        </Link>
      </div>
    </div>
  );
}