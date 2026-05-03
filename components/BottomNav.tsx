"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path ? "text-white" : "text-white/40";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 text-xs font-semibold tracking-wide">
        
        <NavItem href="/" label="Home" active={isActive("/")} />

        <NavItem href="/create" label="Plan" active={isActive("/create")} />

        <NavItem href="/about" label="About" active={isActive("/about")} />

        <NavItem href="/login" label="Sign In" active={isActive("/login")} />

        <NavItem href="/signup" label="Join" active={isActive("/signup")} />
      </div>

      {/* subtle divider row for legal */}
      <div className="border-t border-white/5 py-2 text-center text-[10px] text-white/30">
        <Link href="/terms" className="px-2 hover:text-white">
          Terms
        </Link>
        •
        <Link href="/privacy" className="px-2 hover:text-white">
          Privacy
        </Link>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: string;
}) {
  return (
    <Link
      href={href}
      className={`transition hover:text-white ${active}`}
    >
      {label}
    </Link>
  );
}