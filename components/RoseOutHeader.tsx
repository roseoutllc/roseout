"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoseOutHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "h-16 border-b border-white/10 bg-black/90 backdrop-blur-xl"
          : "h-20 border-b border-white/5 bg-black/70 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-6">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1062a] text-sm font-black text-white">
            R
          </span>

          <span className="text-xl font-black tracking-tight text-white">
            RoseOut
          </span>
        </Link>

        {/* DESKTOP NAV */}
<nav className="hidden items-center gap-8 md:flex">
  <NavLink href="/" label="Home" active={isActive("/")} />
  <NavLink href="/about" label="About" active={isActive("/about")} />
  <NavLink href="/business" label="For Businesses" active={isActive("/business")} />
</nav>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-bold text-white/45 transition hover:text-white sm:inline-flex"
          >
            Sign In
          </Link>

          {/* DESKTOP CTA */}
          <Link
            href="/create"
            className="hidden rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-[#e1062a] hover:text-white md:inline-flex"
          >
            Plan My Outing
          </Link>
        </div>
      </div>

      {/* MOBILE NAV */}
<div className="flex border-t border-white/5 md:hidden">
  <MobileLink href="/" label="Home" active={isActive("/")} />
  <MobileLink href="/create" label="Plan" active={isActive("/create")} />
  <MobileLink href="/business" label="Business" active={isActive("/business")} />
  <MobileLink href="/login" label="Sign In" active={isActive("/login")} />
</div>
    </header>
  );
}

/* ---------- DESKTOP NAV LINK ---------- */

function NavLink({
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
      className={`relative text-sm font-bold transition ${
        active ? "text-white" : "text-white/45 hover:text-white"
      }`}
    >
      {label}

      {/* underline animation */}
      <span
        className={`absolute -bottom-1 left-0 h-[2px] bg-[#e1062a] transition-all duration-300 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

/* ---------- MOBILE NAV LINK ---------- */

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