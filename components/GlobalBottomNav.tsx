"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GlobalBottomNav() {
  const pathname = usePathname();

  const active = (path: string) =>
    pathname === path
      ? "text-[#e1062a]"
      : "text-white/45 hover:text-white";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 text-white shadow-2xl shadow-black backdrop-blur-2xl">
      <div className="mx-auto max-w-6xl px-4 pt-2">
        <div className="mb-1 flex items-center justify-center gap-3 text-[10px] font-bold text-white/30">
          <Link href="/terms" className="transition hover:text-white">
            Terms
          </Link>
          <span>•</span>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/about" className="transition hover:text-white">
            About
          </Link>
        </div>

        <div className="grid grid-cols-5 items-end gap-2 pb-3">
          <NavItem href="/" label="Home" icon="🏠" activeClass={active("/")} />

          <NavItem
            href="/about"
            label="About"
            icon="🌹"
            activeClass={active("/about")}
          />

          <Link href="/create" className="flex flex-col items-center">
            <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-[#e1062a] text-2xl shadow-2xl shadow-red-500/40 transition hover:scale-105">
              ✨
            </div>
            <span className="mt-1 text-xs font-black text-white">Plan</span>
          </Link>

          <NavItem
            href="/signup"
            label="Join"
            icon="👤"
            activeClass={active("/signup")}
          />

          <NavItem
            href="/login"
            label="Sign In"
            icon="🔐"
            activeClass={active("/login")}
          />
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  activeClass,
}: {
  href: string;
  label: string;
  icon: string;
  activeClass: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 text-xs font-black transition ${activeClass}`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}