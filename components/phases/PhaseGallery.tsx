// components/phases/PhaseGallery.tsx
//
// Right-column media block for a Phase, with two mutually exclusive
// modes decided by whether a slideshow interval is set:
//
//   - Case A (slideshowIntervalMs > 0, 2+ photos): renders
//     PhaseSlideshow — the images auto-advance in place instead of
//     showing as a grid.
//   - Case B (no interval, or a single photo): renders a neat grid of
//     thumbnails, capped to `maxDisplayImages`, that opens a full-
//     resolution lightbox (prev/next, caption, Escape/backdrop to
//     close) on click.
//
// The full, uncapped gallery (every photo, with its caption and fact)
// only ever renders on the phase's own Read More page — see
// app/(site)/phases/[id]/page.tsx.

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { PhasePhoto } from "@/types/domain";
import PhaseSlideshow from "./PhaseSlideshow";

export default function PhaseGallery({
  photos,
  slideshowIntervalMs = 0,
  maxDisplayImages = 4,
}: {
  photos: PhasePhoto[];
  slideshowIntervalMs?: number;
  maxDisplayImages?: number;
}) {
  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white aspect-video flex items-center justify-center text-sm text-ink-400">
        No photos yet
      </div>
    );
  }

  if (slideshowIntervalMs > 0 && photos.length > 1) {
    return <PhaseSlideshow photos={photos} intervalMs={slideshowIntervalMs} />;
  }

  return <PhaseGrid photos={photos.slice(0, maxDisplayImages)} />;
}

function PhaseGrid({ photos }: { photos: PhasePhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null || photos.length === 0) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      else if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      else if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, photos.length]);

  const active = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className={`grid gap-3 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {photos.map((photo, i) => (
          <button
            key={photo.path || photo.url}
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label={photo.caption ? `Expand photo: ${photo.caption}` : "Expand photo"}
            className={`group relative rounded-lg overflow-hidden border border-line bg-navy-900 ${
              photos.length === 1 ? "aspect-video" : "aspect-square"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption || ""}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-navy-900/0 group-hover:bg-navy-900/30 transition-colors flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-7 h-7" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <figure
            className="max-w-4xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption || ""}
              className="max-w-full max-h-[75vh] object-contain rounded"
            />
            {active.caption && (
              <figcaption className="mt-3 text-sm text-white/80 text-center max-w-xl">{active.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
