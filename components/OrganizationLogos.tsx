// components/OrganizationLogos.tsx
//
// Static, always-visible grid of affiliated organizations — no hover
// expansion or collapsed state. Each card shows only the full-color
// logo, enlarged, with the organization name directly beneath it
// (role/designation is intentionally not shown here, even though the
// field still exists on the row for internal/admin reference).
//
// On mobile, cards are a plain flex-wrap row: however many fit at each
// card's own width wrap naturally. On desktop (md+), the container
// switches to a CSS grid with exactly `min(count, maxPerRow)` columns
// sized to content (Settings -> Affiliated Organizations controls
// maxPerRow) — that strictly fills one row up to the threshold before
// the grid's own auto-wrapping starts a new row, rather than wrapping
// whenever the viewport happens to run out of width.

import type { Organization } from "@/types/domain";

function OrgCard({ org }: { org: Organization }) {
  const content = (
    <div className="w-28 md:w-32 flex flex-col items-center text-center gap-3 p-4 rounded-lg border border-line dark:border-white/10 bg-white dark:bg-navy-800">
      <span className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden shrink-0 bg-white flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain p-2" />
      </span>

      <p className="text-sm font-bold text-navy-900 dark:text-white leading-tight">{org.name}</p>
    </div>
  );

  if (org.external_url) {
    return (
      <a
        href={org.external_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={org.name}
        className="shrink-0 hover:border-[var(--theme-primary)]/50 hover:shadow-md rounded-lg transition-colors"
      >
        {content}
      </a>
    );
  }

  return <div className="shrink-0">{content}</div>;
}

export default function OrganizationLogos({
  organizations,
  maxPerRow = 6,
  labelClassName = "text-ink-400 dark:text-paper-100/50",
}: {
  organizations: Organization[];
  /** Max cards kept on one row on desktop before wrapping — Settings -> Affiliated Organizations. */
  maxPerRow?: number;
  /** Override when embedded somewhere that's always on a dark background (e.g. the mobile hero photo overlay), independent of the site's light/dark toggle. */
  labelClassName?: string;
}) {
  if (organizations.length === 0) return null;

  const columns = Math.max(1, Math.min(organizations.length, maxPerRow));

  return (
    <div className="mt-10">
      <p className={`text-xs font-medium mb-4 ${labelClassName}`}>Organizations Worked With</p>
      <div
        className="flex flex-row flex-wrap items-center justify-center gap-6 md:grid md:gap-10"
        style={{ gridTemplateColumns: `repeat(${columns}, max-content)` }}
      >
        {organizations.map((org) => (
          <OrgCard key={org.id} org={org} />
        ))}
      </div>
    </div>
  );
}
