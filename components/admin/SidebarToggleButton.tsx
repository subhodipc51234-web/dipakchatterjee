// components/admin/SidebarToggleButton.tsx
//
// Hamburger button shown in the header on mobile/narrow viewports.
// Desktop keeps the persistent sidebar, so this is hidden at md+.

"use client";

import { Menu } from "lucide-react";
import { useMobileSidebar } from "@/components/admin/MobileSidebarContext";

export default function SidebarToggleButton() {
  const { open } = useMobileSidebar();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open navigation menu"
      className="md:hidden -ml-1 mr-2 p-2 rounded-md text-navy-900 hover:bg-navy-900/10 transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
