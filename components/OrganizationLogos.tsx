// components/OrganizationLogos.tsx
//
// Two entirely different layouts by breakpoint, not just restyled at
// different sizes:
//
//   - Mobile: a vertical stacked list, one row per organization — logo
//     on the LEFT (circular avatar, `object-cover`), Designation/role
//     and Organization name stacked on the RIGHT. Designation is the
//     prominent top line; the org name is the smaller line below it.
//     Text wraps freely — never truncated/ellipsized/line-clamped.
//   - Desktop (sm+): the original wrapped card grid, logo above text,
//     with the same Designation-then-Name hierarchy inside each card.
//
// Neither layout draws a border around the card/row itself — width and
// spacing stay fixed and uniform for grid/list alignment, but height is
// intentionally NOT fixed: text wraps and the container grows to fit it
// rather than clamping or cutting anything off.
//
// Both Designation and Organization name are mandatory at the data
// layer (Settings -> Affiliated Organizations), so every row always
// has both lines; only External Link is ever optional.

import type { Organization } from "@/types/domain";

function OrgLink({
  org,
  children,
  className = "",
}: {
  org: Organization;
  children: React.ReactNode;
  className?: string;
}) {
  if (!org.external_url) return <div className={className}>{children}</div>;

  return (
    <a
      href={org.external_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={org.name}
      className={className}
    >
      {children}
    </a>
  );
}

function MobileOrgRow({ org }: { org: Organization }) {
  return (
    <OrgLink
      org={org}
      className="flex flex-row items-center gap-4 p-3 rounded-lg hover:bg-white transition-colors"
    >
      <span className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-bold text-navy-900 leading-snug">
          {org.designation || org.name}
        </span>
        {/* Designation is mandatory going forward — this only omits a
            duplicate second line for pre-existing rows saved before
            that rule, when designation is still null. */}
        {org.designation && (
          <span className="block text-xs text-ink-400 leading-snug mt-0.5">{org.name}</span>
        )}
      </span>
    </OrgLink>
  );
}

function DesktopOrgCard({ org }: { org: Organization }) {
  return (
    <OrgLink
      org={org}
      className="w-32 flex flex-col items-center text-center gap-3 p-4 rounded-lg hover:bg-white transition-colors"
    >
      <span className="w-24 h-24 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
      </span>

      {/* No line-clamp/fixed height — the card's width stays fixed for
          grid alignment, but its height grows to fit however many
          lines the designation/name actually wrap to. */}
      <span>
        <span className="block text-sm font-bold text-navy-900 leading-tight">
          {org.designation || org.name}
        </span>
        {org.designation && (
          <span className="block text-xs text-ink-400 leading-tight mt-1">{org.name}</span>
        )}
      </span>
    </OrgLink>
  );
}

export default function OrganizationLogos({
  organizations,
  maxPerRow = 6,
  labelClassName = "text-ink-400",
}: {
  organizations: Organization[];
  /** Max cards kept on one row on desktop before wrapping — Settings -> Affiliated Organizations. */
  maxPerRow?: number;
  /** Override when embedded somewhere that's always on a dark background (e.g. the mobile hero photo overlay). */
  labelClassName?: string;
}) {
  if (organizations.length === 0) return null;

  const columns = Math.max(1, Math.min(organizations.length, maxPerRow));

  return (
    <div>
      <p className={`text-xs font-medium mb-4 ${labelClassName}`}>Organizations Worked With</p>

      {/* Mobile: stacked list, logo left / text right. */}
      <div className="sm:hidden flex flex-col gap-3">
        {organizations.map((org) => (
          <MobileOrgRow key={org.id} org={org} />
        ))}
      </div>

      {/* Desktop: wrapped card grid, logo above text. */}
      <div
        className="hidden sm:flex flex-row flex-wrap items-start justify-center gap-6 sm:grid sm:gap-10"
        style={{ gridTemplateColumns: `repeat(${columns}, max-content)` }}
      >
        {organizations.map((org) => (
          <DesktopOrgCard key={org.id} org={org} />
        ))}
      </div>
    </div>
  );
}
