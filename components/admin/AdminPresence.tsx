// components/admin/AdminPresence.tsx
//
// Real-time "who else is in the dashboard right now" indicator using
// Supabase Realtime Presence — a single shared channel ("admin-presence")
// that every signed-in admin's browser joins and tracks itself on. No
// database table is involved: presence state lives only in Supabase's
// Realtime service for as long as a socket is connected, and
// automatically drops a peer the moment their tab closes/disconnects
// (no stale "online" state to clean up).
//
// Presence is keyed by userId, so multiple tabs from the same admin
// collapse into one entry rather than inflating the count.

"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type PresenceEntry = {
  userId: string;
  email: string;
  name: string | null;
  onlineAt: string;
};

function relativeOnlineSince(iso: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function AdminPresence({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name: string | null;
}) {
  const [peers, setPeers] = useState<PresenceEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("admin-presence", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceEntry>();
        // One entry per userId (dedupes multiple tabs from the same
        // admin) — pick the earliest onlineAt seen for that key so the
        // displayed "online since" reflects when they first arrived,
        // not the most recently opened tab.
        const byUser = new Map<string, PresenceEntry>();
        for (const entries of Object.values(state)) {
          for (const entry of entries) {
            const existing = byUser.get(entry.userId);
            if (!existing || new Date(entry.onlineAt) < new Date(existing.onlineAt)) {
              byUser.set(entry.userId, entry);
            }
          }
        }
        setPeers(Array.from(byUser.values()));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const payload: PresenceEntry = { userId, email, name, onlineAt: new Date().toISOString() };
          await channel.track(payload);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, email, name]);

  // Refreshes the relative "Xm ago" labels in the dropdown while it's open.
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const others = peers.filter((p) => p.userId !== userId);
  const totalOnline = others.length + 1;
  const label = totalOnline <= 1 ? "Active (You)" : `${totalOnline} Admins Online`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-forest/30 text-forest bg-forest-100 hover:bg-forest-100/70 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-forest" />
        </span>
        <Users className="w-3.5 h-3.5" />
        {label}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-md border border-line bg-white shadow-lg z-20 py-2">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Online now
          </p>
          <ul className="max-h-64 overflow-y-auto">
            <li className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
              <span className="text-navy-900 font-medium truncate">{name || email} (you)</span>
            </li>
            {others.map((peer) => (
              <li key={peer.userId} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
                <span className="text-ink-600 truncate">{peer.name || peer.email}</span>
                <span className="shrink-0 text-[11px] text-ink-400">{relativeOnlineSince(peer.onlineAt, now)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
