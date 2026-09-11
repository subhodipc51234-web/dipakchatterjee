// components/site/ThemeToggle.tsx
//
// Reads/writes the data-theme attribute the blocking script in
// app/layout.tsx already sets before paint. Starts rendered as "light" to
// match the server-rendered HTML exactly (avoiding a hydration mismatch),
// then corrects itself from the real attribute right after mount.

"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark") setTheme("dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private browsing / storage disabled — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="relative z-10 w-10 h-10 flex items-center justify-center rounded-md border border-line dark:border-white/15 text-navy-900 dark:text-paper-100 hover:bg-navy-900/5 dark:hover:bg-white/10 transition-colors touch-manipulation"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
