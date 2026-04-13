"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "AI Race", enabled: true },
  { href: "/regimetracker", label: "US", enabled: true },
  { href: "/europe", label: "Europe", enabled: true },
  { href: "/china", label: "China", enabled: true },
  { href: "/world-order", label: "World Order", enabled: true },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-[#181818] px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-sm font-bold text-[#e0e0e0] tracking-wider hover:text-white">
          MACRO WORLD VIEW
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) =>
            l.enabled ? (
              <Link
                key={l.href}
                href={l.href}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  pathname === l.href
                    ? "text-[#e0e0e0] bg-[#222]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                {l.label}
              </Link>
            ) : (
              <span key={l.href} className="text-xs px-2 py-1 text-[#333] cursor-default" title="Coming soon">
                {l.label}
              </span>
            )
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-[#555] text-sm">
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-2 pb-2 space-y-1 max-w-5xl mx-auto">
          {links.map((l) =>
            l.enabled ? (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block text-xs px-2 py-2 rounded ${
                  pathname === l.href ? "text-[#e0e0e0] bg-[#222]" : "text-[#555]"
                }`}
              >
                {l.label}
              </Link>
            ) : (
              <span key={l.href} className="block text-xs px-2 py-2 text-[#333]">
                {l.label} <span className="text-[10px]">coming soon</span>
              </span>
            )
          )}
        </div>
      )}
    </nav>
  );
}
