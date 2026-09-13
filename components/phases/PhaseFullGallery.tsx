// components/phases/PhaseFullGallery.tsx
//
// The complete photo gallery on a Phase's own "Read More" page
// (app/(site)/phases/[id]/page.tsx) — every photo (never capped to
// max_display_images, unlike the homepage's PhaseGallery), each shown
// alongside its caption and optional fact/detail, since this page is
// exactly the place for that extra depth the homepage card doesn't have
// room for.

import type { PhasePhoto } from "@/types/domain";

export default function PhaseFullGallery({ photos }: { photos: PhasePhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {photos.map((photo) => (
        <figure key={photo.path || photo.url} className="bg-white border border-line rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.caption || ""} className="w-full aspect-[4/3] object-cover" />
          {(photo.caption || photo.fact) && (
            <figcaption className="p-4 space-y-1.5">
              {photo.caption && <p className="text-sm font-medium text-navy-900">{photo.caption}</p>}
              {photo.fact && <p className="text-sm text-ink-600 leading-relaxed">{photo.fact}</p>}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
