// app/admin/(protected)/settings/HeaderNavigationManager.tsx
//
// Single dashboard card grouping the two things that make up the site
// header: the primary nav row (NavLinksManager) and the action
// buttons/links beside it (HeaderActionsManager) — previously two
// separate cards, now "Section A" / "Section B" of one "Header
// Navigation & Actions" management area since they're really one
// feature (the header) from an editor's point of view.

import type { HeaderAction, NavLink } from "@/types/domain";
import NavLinksManager from "./NavLinksManager";
import HeaderActionsManager from "./HeaderActionsManager";

export default function HeaderNavigationManager({
  navLinks,
  headerActions,
  themePrimary,
}: {
  navLinks: NavLink[];
  headerActions: HeaderAction[];
  themePrimary: string;
}) {
  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Header Navigation &amp; Actions</p>
      <p className="text-xs text-ink-400 mb-6">
        Everything shown in the site header: the main menu row and the action buttons/links beside
        it (e.g. &ldquo;Submit a Complaint&rdquo;, a Facebook follow button).
      </p>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-3">
          Section A &mdash; Navigation Links
        </p>
        <NavLinksManager links={navLinks} />
      </div>

      <div className="mt-8 pt-8 border-t border-line">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-3">
          Section B &mdash; Header Actions &amp; Buttons
        </p>
        <HeaderActionsManager actions={headerActions} themePrimary={themePrimary} />
      </div>
    </div>
  );
}
