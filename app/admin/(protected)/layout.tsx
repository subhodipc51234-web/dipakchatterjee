// app/admin/(protected)/layout.tsx
//
// Lives inside the (protected) route group, so it ONLY wraps routes also
// inside that group — /admin, /admin/features, /admin/posts, etc. The
// parentheses mean "(protected)" adds no URL segment: this still serves
// at /admin, not /admin/protected.
//
// Critically, app/admin/login/page.tsx sits OUTSIDE this group (as a
// sibling folder), so it is never wrapped by this layout and can never
// be caught in a redirect loop with it.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";
import SessionTimer from "@/components/admin/SessionTimer";
import AdminPresence from "@/components/admin/AdminPresence";
import {
  ExternalLink,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  MessageSquareWarning,
  Rss,
} from "lucide-react";

const DEFAULT_BRAND_NAME = "Dipak Chatterjee";
const DEFAULT_BRAND_SUBTITLE = "Admin Dashboard";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Both queries below are wrapped rather than left to reject
  // naturally: this layout wraps every /admin/* page, so an unhandled
  // rejection here (a transient auth/network drop, not a real "you're
  // not logged in") would surface as Next's generic error page instead
  // of the graceful "please sign in again" redirect this already has a
  // path for. Any failure is treated the same as "no session" —
  // fail-closed, never fail-open into showing the dashboard.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch (err) {
    console.error("[AdminProtectedLayout] auth.getUser() failed:", err);
  }

  if (!user) {
    redirect("/admin/login");
  }

  let profile: { is_admin: boolean; full_name: string | null } | null = null;
  let settings: { header_name: string | null; header_subtitle: string | null } | null = null;
  try {
    const [{ data: profileData }, { data: settingsData }] = await Promise.all([
      supabase.from("profiles").select("is_admin, full_name").eq("id", user.id).single(),
      supabase.from("site_settings").select("header_name, header_subtitle").eq("id", "default").single(),
    ]);
    profile = profileData;
    settings = settingsData;
  } catch (err) {
    console.error("[AdminProtectedLayout] profile/settings fetch failed:", err);
  }

  // Any recognized profile (ADMIN or USER) may view the dashboard shell
  // — privileged mutations are gated separately, per-action, by
  // requireAdmin()/requireOwner() (see lib/admin-guard.ts). A row
  // missing entirely means this Supabase user has no profile at all
  // (or the fetch above failed), which shouldn't happen for a real,
  // reachable account.
  if (!profile) {
    redirect("/admin/login");
  }

  const brandName = settings?.header_name || DEFAULT_BRAND_NAME;
  const brandSubtitle = settings?.header_subtitle || DEFAULT_BRAND_SUBTITLE;

  return (
    <div className="min-h-screen flex">
      {/* app/globals.css hides Next.js's dev-mode floating indicator
          site-wide; this re-enables it, but only for as long as this
          admin layout is mounted (a plain <style> tag's rules apply to
          the whole document regardless of where the tag itself sits in
          the tree, so this has no effect on public pages). */}
      <style>{"nextjs-portal, [data-nextjs-toast] { display: block !important; }"}</style>

      <aside className="w-64 shrink-0 bg-navy-900 text-paper-100 flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-display text-lg text-white">{brandName}</p>
          <p className="text-xs text-paper-100/60 mt-1">{brandSubtitle}</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-paper-100/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>

          <Link
            href="/admin/features"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-paper-100/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Layers className="w-4 h-4" />
            Features
          </Link>

          <Link
            href="/admin/posts"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-paper-100/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Rss className="w-4 h-4" />
            Posts
          </Link>

          <Link
            href="/admin/complaints"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-paper-100/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <MessageSquareWarning className="w-4 h-4" />
            Complaints
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-paper-100/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Settings
          </Link>

          <Link
            href="/admin/logs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-paper-100/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <History className="w-4 h-4" />
            Activity Logs
          </Link>
        </nav>

        <div className="px-3 py-5 border-t border-white/10 space-y-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-saffron hover:bg-white/10 hover:text-saffron/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Live Site
          </a>

          <div>
            <p className="px-3 text-xs text-paper-100/50 mb-2 truncate">
              {profile.full_name ?? user.email}
            </p>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-paper-100 min-h-screen flex flex-col">
        <header className="h-14 shrink-0 border-b border-line bg-white flex items-center justify-between px-6">
          <AdminPresence userId={user.id} email={user.email ?? profile.full_name ?? "Unknown"} name={profile.full_name} />
          <SessionTimer />
        </header>
        <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
