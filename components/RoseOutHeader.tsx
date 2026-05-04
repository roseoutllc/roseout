"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoseOutHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/95 text-white backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "shadow-lg shadow-black/40" : ""
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-[#e1062a] font-black text-white transition-all duration-300 ${
              scrolled ? "h-9 w-9 text-sm" : "h-11 w-11 text-lg"
            }`}
          >
            R
          </span>

          <span className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
            RoseOut
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href="/" label="Home" active={isActive("/")} />
          <NavLink href="/about" label="About" active={isActive("/about")} />
          <NavLink
            href="/business"
            label="For Businesses"
            active={isActive("/business")}
          />
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className={`text-sm font-bold transition ${
              isActive("/login")
                ? "text-white"
                : "text-white/45 hover:text-white"
            }`}
          >
            Sign In
          </Link>

          <Link
            href="/create"
            className="rounded-full bg-[#e1062a] px-6 py-3 text-sm font-black text-white transition hover:bg-red-500"
          >
            Plan My Outing
          </Link>
        </div>
      </div>

      <nav className="flex h-11 items-center justify-around border-t border-white/10 bg-black px-2 md:hidden">
        <MobileLink href="/" label="Home" active={isActive("/")} />
        <MobileLink href="/create" label="Plan" active={isActive("/create")} />
        <MobileLink
          href="/business"
          label="Business"
          active={isActive("/business")}
        />
        <MobileLink href="/login" label="Sign In" active={isActive("/login")} />
      </nav>
    </header>
  );
}

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
      className={`relative text-sm font-black transition ${
        active ? "text-white" : "text-white/45 hover:text-white"
      }`}
    >
      {label}

      <span
        className={`absolute -bottom-1 left-0 h-[2px] bg-[#e1062a] transition-all duration-300 ${
          active ? "w-full" : "w-0"
        }`}
      />
    </Link>
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
      className={`flex min-w-0 flex-1 items-center justify-center rounded-full px-1 py-2 text-center text-xs font-black transition ${
        active ? "text-[#e1062a]" : "text-white/45 hover:text-white"
      }`}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}