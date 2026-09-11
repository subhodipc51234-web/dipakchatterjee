// components/OrganizationLogos.tsx
//
// Static, always-visible grid of affiliated organizations — no hover
// expansion or collapsed state. Each card shows only the full-color
// logo, enlarged, with the organization name directly beneath it
// (role/designation is intentionally not shown here, even though the
// field still exists on the row for internal/admin reference).

import type { Organization } from "@/types/domain";

function OrgCard({ org }: { org: Organization }) {
  const content = (
    <div className="flex flex-col items-center text-center gap-3 p-4 rounded-lg border border-line dark:border-white/10 bg-white dark:bg-navy-800 h-full">
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
        className="hover:border-[var(--theme-primary)]/50 hover:shadow-md rounded-lg transition-colors"
      >
        {content}
      </a>
    );
  }

  return content;
}

export default function OrganizationLogos({
  organizations,
  labelClassName = "text-ink-400 dark:text-paper-100/50",
}: {
  organizations: Organization[];
  /** Override when embedded somewhere that's always on a dark background (e.g. the mobile hero photo overlay), independent of the site's light/dark toggle. */
  labelClassName?: string;
}) {
  if (organizations.length === 0) return null;

  return (
    <div className="mt-10">
      <p className={`text-xs font-medium mb-4 ${labelClassName}`}>Organizations Worked With</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <OrgCard key={org.id} org={org} />
        ))}
      </div>
    </div>
  );
}
