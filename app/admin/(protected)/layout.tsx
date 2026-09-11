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
import {
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  MessageSquareWarning,
  Rss,
} from "lucide-react";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-navy-900 text-paper-100 flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-display text-lg text-white">Dipak Chatterjee</p>
          <p className="text-xs text-paper-100/60 mt-1">Admin Dashboard</p>
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

      <main className="flex-1 bg-paper-100 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
