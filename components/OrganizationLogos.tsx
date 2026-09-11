// components/OrganizationLogos.tsx
//
// Horizontal row of affiliated-organization badges, shown beneath the
// hero CTA. Each badge is just the full-color logo at rest; hovering it
// smoothly expands an inline label (name + role/designation) to its
// right. The label's own width transition is what pushes later badges
// in the row aside — a normal flex reflow, not a separate animation.

import type { Organization } from "@/types/domain";

function Badge({ org }: { org: Organization }) {
  const content = (
    <div className="group flex items-center rounded-full border border-line dark:border-white/15 bg-white dark:bg-navy-800 p-1 hover:border-[var(--theme-primary)]/50 hover:shadow-md transition-all duration-300 ease-in-out">
      <span className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain p-1" />
      </span>

      <span className="max-w-0 opacity-0 overflow-hidden group-hover:max-w-[220px] group-hover:opacity-100 group-hover:pl-3 group-hover:pr-4 transition-all duration-300 ease-in-out">
        <span className="block text-sm font-semibold text-navy-900 dark:text-white whitespace-nowrap">
          {org.name}
        </span>
        {org.designation && (
          <span className="block text-xs text-ink-400 dark:text-paper-100/50 whitespace-nowrap">
            {org.designation}
          </span>
        )}
      </span>
    </div>
  );

  if (org.external_url) {
    return (
      <a href={org.external_url} target="_blank" rel="noopener noreferrer" aria-label={org.name}>
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
      <p className={`text-xs font-medium mb-4 ${labelClassName}`}>Affiliated With</p>
      <div className="flex flex-wrap items-center gap-3">
        {organizations.map((org) => (
          <Badge key={org.id} org={org} />
        ))}
      </div>
    </div>
  );
}
