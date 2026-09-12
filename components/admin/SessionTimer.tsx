// components/admin/SessionTimer.tsx
//
// Top-right dashboard countdown for the 15-minute inactivity timeout.
// The visible countdown is purely a client-side clock derived from
// "time since last activity" — the actual access control is the OTP
// session cookie's own expiry (lib/otp-session.ts), checked by
// proxy.ts on every request. This component's job is to (a) show the
// admin how much time is left, (b) slide the cookie's expiry forward
// via a throttled heartbeat while they're active, and (c) proactively
// sign out and redirect the moment it hits zero, rather than waiting
// for the admin to click something and get redirected by the gate.

"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { logoutAdmin } from "@/app/admin/session-actions";

const SESSION_SECONDS = 15 * 60;
const HEARTBEAT_MIN_INTERVAL_MS = 30 * 1000;
const LOW_TIME_THRESHOLD_SECONDS = 60;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function SessionTimer() {
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(Date.now());
  const expiredRef = useRef(false);

  useEffect(() => {
    function handleActivity() {
      lastActivityRef.current = Date.now();

      const now = Date.now();
      if (now - lastHeartbeatRef.current >= HEARTBEAT_MIN_INTERVAL_MS) {
        lastHeartbeatRef.current = now;
        // Best-effort: a dropped heartbeat doesn't matter on its own —
        // the visible countdown keeps tracking client-side activity
        // regardless, and proxy.ts's own expiry check is what actually
        // gates access either way.
        fetch("/api/admin/heartbeat", { method: "POST" }).catch(() => {});
      }
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = SESSION_SECONDS - Math.floor((Date.now() - lastActivityRef.current) / 1000);
      setSecondsLeft(Math.max(0, remaining));

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        void handleExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function handleExpire() {
    await logoutAdmin().catch(() => {});
    alert("Session expired due to inactivity.");
    window.location.assign("/admin/login");
  }

  const isLow = secondsLeft <= LOW_TIME_THRESHOLD_SECONDS;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border tabular-nums ${
        isLow ? "border-rust/40 text-rust bg-rust/5" : "border-line text-ink-400 bg-paper-100"
      }`}
      title="Time remaining before automatic sign-out due to inactivity"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      Session: {formatTime(secondsLeft)}
    </div>
  );
}
