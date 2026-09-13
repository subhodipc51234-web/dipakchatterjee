// components/admin/MobileSidebarContext.tsx
//
// Shares mobile-drawer open/closed state between the hamburger button
// in the header (SidebarToggleButton) and the drawer itself
// (AdminSidebar), which are siblings elsewhere in the admin layout
// tree and have no other way to talk to each other.

"use client";

import { createContext, useContext, useMemo, useState } from "react";

type MobileSidebarContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
    }),
    [isOpen]
  );

  return <MobileSidebarContext.Provider value={value}>{children}</MobileSidebarContext.Provider>;
}

export function useMobileSidebar() {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) {
    throw new Error("useMobileSidebar must be used within a MobileSidebarProvider");
  }
  return ctx;
}
