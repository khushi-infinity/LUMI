"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/tutor", label: "Tutor" },
  { href: "/live", label: "Live" },
  { href: "/scan", label: "Scan" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
] as const;

export function NavBar({ streak }: { streak: number }) {
  const pathname = usePathname();
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-8">
      <nav className="flex items-center gap-3 sm:gap-6">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-white drop-shadow-sm"
        >
          LUMI<span className="text-coral">.</span>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors ${
                pathname === l.href
                  ? "bg-white/25 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <span
            title={`${streak}-day learning streak`}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/25 text-sm font-black text-white ring-1 ring-white/40 backdrop-blur"
          >
            <Flame className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div
            aria-label="Profile"
            className="grid h-10 w-10 place-items-center rounded-full bg-coral text-sm font-black text-white ring-2 ring-white/60"
          >
            K
          </div>
        </div>
      </nav>
      {/* Mobile: compact scrollable row */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] ${
              pathname === l.href
                ? "bg-white/25 text-white"
                : "bg-white/10 text-white/75"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
