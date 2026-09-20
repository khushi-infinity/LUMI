"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/tutor", label: "Tutor" },
  { href: "/live", label: "Live Tutor" },
  { href: "/scan", label: "Scan" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
] as const;

export function NavBar({ streak }: { streak: number }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/25 bg-sky-electric/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="mr-2 text-2xl font-extrabold tracking-tight text-navy">
          LUMI<span className="text-coral">.</span>
        </Link>
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                pathname === l.href
                  ? "bg-navy text-white"
                  : "text-navy/80 hover:bg-white/60"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-sm font-extrabold text-coral-deep">
            <Flame className="h-4 w-4" aria-hidden /> {streak}
          </span>
          <div
            aria-label="Profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-extrabold text-white"
          >
            K
          </div>
        </div>
      </nav>
      {/* Mobile: compact row */}
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
              pathname === l.href ? "bg-navy text-white" : "bg-white/60 text-navy"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
