// components/OrganizationLogos.tsx
//
// Horizontal row of affiliated-organization logos, shown beneath the hero
// CTA. Grayscale/dimmed by default, full color on hover for a subtle,
// professional feel rather than a busy row of colored badges.

import type { Organization } from "@/types/domain";

function Logo({ org }: { org: Organization }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={org.logo_url}
      alt={org.name}
      title={org.name}
      className="h-11 md:h-14 w-auto max-w-[160px] object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
    />
  );

  if (org.external_url) {
    return (
      <a href={org.external_url} target="_blank" rel="noopener noreferrer" aria-label={org.name}>
        {img}
      </a>
    );
  }

  return img;
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
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {organizations.map((org) => (
          <Logo key={org.id} org={org} />
        ))}
      </div>
    </div>
  );
}
