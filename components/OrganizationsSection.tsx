// components/OrganizationsSection.tsx
//
// Standalone homepage section wrapping OrganizationLogos — previously
// rendered inline inside the hero (both mobile and desktop), now its
// own section so it can be independently shown/hidden and reordered
// via Settings -> Homepage Sections (see lib/homepage-layout.ts).

import OrganizationLogos from "@/components/OrganizationLogos";
import type { Organization } from "@/types/domain";

export default function OrganizationsSection({
  organizations,
  maxPerRow,
}: {
  organizations: Organization[];
  maxPerRow: number;
}) {
  if (organizations.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-paper-100 border-b border-line">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <OrganizationLogos organizations={organizations} maxPerRow={maxPerRow} />
      </div>
    </section>
  );
}
