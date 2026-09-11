// components/site/AnchorAwareLink.tsx
//
// Drop-in replacement for a plain <a href="/#section"> anywhere a link
// might point at a homepage section (footer quick links, hero CTA
// buttons). Two jobs:
//
//   1. On the homepage itself, clicking one of these should smoothly
//      scroll to the section instead of doing a full client-side
//      navigation to the same route (which would otherwise jump
//      instantly, ignoring the site's smooth-scroll feel).
//   2. On any other page, it's a normal next/link navigation to
//      "/#section" — Next.js scrolls to the matching element once the
//      homepage has rendered, so this "just works" with no extra code.
//
// Only intercepts hrefs that actually contain a "#" and whose path
// portion is the homepage ("" or "/") — anything else (external links,
// mailto:, other internal routes) passes through untouched.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

type LinkProps = ComponentProps<typeof Link>;

export default function AnchorAwareLink({ href, onClick, ...rest }: LinkProps) {
  const pathname = usePathname();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);

    if (typeof href !== "string") return;
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    const id = href.slice(hashIndex + 1);
    const targetPath = href.slice(0, hashIndex) || "/";
    if (pathname !== "/" || targetPath !== "/") return;

    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
