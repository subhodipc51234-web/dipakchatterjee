// components/site/SiteHeader.tsx
//
// Sticky nav, adapted from the original static index.html header. Only the
// mobile menu toggle needs interactivity, so this is the one client
// component in the site shell.
//
// The inline "Submit a Complaint" button and the hamburger/drawer are
// mutually exclusive by breakpoint (`lg:inline-flex` vs `lg:hidden`) so
// exactly one "Submit a Complaint" affordance is ever visible at once —
// never both stacked in the header row on tablet-width screens.

"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#public-life", label: "Public Life" },
  { href: "#works", label: "Notable Works" },
  { href: "#contact", label: "Contact" },
];

const DEFAULT_NAME = "Dipak Chatterjee";
const DEFAULT_SUBTITLE = "Social Worker · Educationist";

export default function SiteHeader({
  avatarUrl,
  name,
  subtitle,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  subtitle?: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper-100/95 dark:bg-navy-900/95 backdrop-blur border-b border-line dark:border-white/10 transition-colors">
      <nav className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
        <a href="#top" className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden shrink-0 border border-line dark:border-white/15 bg-paper-100 dark:bg-navy-800 flex items-center justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-xs text-ink-400 dark:text-paper-100/50">DC</span>
            )}
          </span>

          <span className="leading-tight min-w-0">
            <span className="block font-display text-base md:text-lg text-navy-900 dark:text-white truncate">
              {name || DEFAULT_NAME}
            </span>
            <span className="block text-[11px] md:text-xs text-ink-400 dark:text-paper-100/50 tracking-wide truncate">
              {subtitle || DEFAULT_SUBTITLE}
            </span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8 text-sm text-ink-600 dark:text-paper-100/70 font-medium">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-navy-900 dark:hover:text-white">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />

          <a
            href="/complaints"
            className="hidden lg:inline-flex items-center gap-2 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
          >
            Submit a Complaint
          </a>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md border border-line dark:border-white/15 text-navy-900 dark:text-white touch-manipulation"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden relative z-10 border-t border-line dark:border-white/10 bg-paper-100 dark:bg-navy-900 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="px-5 py-4 flex flex-col gap-1 text-ink-600 dark:text-paper-100/70 font-medium">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 border-b border-line/70 dark:border-white/10 last:border-b-0 touch-manipulation"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/complaints"
              onClick={() => setMenuOpen(false)}
              className="mt-3 text-center bg-[var(--theme-primary)] text-white font-semibold px-4 py-3 rounded-md touch-manipulation"
            >
              Submit a Complaint
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
