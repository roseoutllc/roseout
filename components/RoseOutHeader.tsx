"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RoseOutHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href ? "text-white" : "text-white/45 hover:text-white";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1062a] text-sm font-black text-white">
            R
          </span>

          <span className="text-xl font-black tracking-tight text-white">
            RoseOut
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className={`text-sm font-bold transition ${isActive("/")}`}
          >
            Home
          </Link>

          <Link
            href="/about"
            className={`text-sm font-bold transition ${isActive("/about")}`}
          >
            About
          </Link>

          <Link
            href="/terms"
            className={`text-sm font-bold transition ${isActive("/terms")}`}
          >
            Terms
          </Link>

          <Link
            href="/privacy"
            className={`text-sm font-bold transition ${isActive("/privacy")}`}
          >
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-bold text-white/45 transition hover:text-white sm:inline-flex"
          >
            Sign In
          </Link>

          <Link
            href="/create"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-[#e1062a] hover:text-white"
          >
            Plan
          </Link>
        </div>
      </div>

      <div className="flex border-t border-white/5 md:hidden">
        <MobileLink href="/" label="Home" active={pathname === "/"} />
        <MobileLink href="/create" label="Plan" active={pathname === "/create"} />
        <MobileLink href="/about" label="About" active={pathname === "/about"} />
        <MobileLink href="/login" label="Sign In" active={pathname === "/login"} />
      </div>
    </header>
  );
}

function MobileLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex-1 py-3 text-center text-xs font-black transition ${
        active ? "text-white" : "text-white/40 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}