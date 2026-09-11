// components/RevealOnScroll.tsx
//
// Fades + slides a section in the first time it enters the viewport.
// Wraps Server Component children (they're just passed through as
// `children`, so this doesn't force anything inside it to become client
// code). Respects prefers-reduced-motion by skipping the animated state
// entirely.
//
// Defensive by design: content must NEVER be stuck invisible. If
// IntersectionObserver is unavailable (some in-app/WebView browsers — a
// real concern here, since most traffic to this site arrives via
// Facebook's in-app browser) or simply doesn't fire for any reason, a
// fallback timer forces the section visible regardless.

"use client";

import { useEffect, useRef, useState } from "react";

const FALLBACK_REVEAL_MS = 1200;

export default function RevealOnScroll({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) {
      setVisible(true);
      return;
    }

    let settled = false;
    const reveal = () => {
      if (settled) return;
      settled = true;
      setVisible(true);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    try {
      observer.observe(node);
    } catch {
      reveal();
    }

    // Safety net: whatever the reason (observer never fires, an odd
    // browser quirk, a race with layout), content is guaranteed visible
    // shortly after mount either way.
    const fallback = window.setTimeout(reveal, FALLBACK_REVEAL_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}
