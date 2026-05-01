import Link from "next/link";

export default function RoseOutHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-xl">
            🌹
          </div>

          <span className="text-2xl font-black tracking-tight">
            Rose<span className="text-[#e1062a]">Out</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-bold text-white/65 md:flex">
          <Link href="/" className="text-[#e1062a]">
            Home
          </Link>
          <Link href="/create" className="hover:text-white">
            Plan
          </Link>
          <Link href="/user/saved" className="hover:text-white">
            Saved
          </Link>
          <Link href="/user/dashboard" className="hover:text-white">
            Profile
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/create" className="rose-btn px-5 py-2 text-sm">
            Plan My Outing
          </Link>

          <button className="text-2xl text-white/70 md:hidden">☰</button>
        </div>
      </div>
    </header>
  );
}