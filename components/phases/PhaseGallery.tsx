// components/phases/PhaseGallery.tsx
//
// Right-column gallery for a Phase: a neat grid of thumbnails that opens
// a full-resolution lightbox (prev/next, caption, Escape/backdrop to
// close) on click — "Carousel/slideshow or neat grid... with full-
// resolution expand/lightbox inspection" per the Phases layout spec.
//
// slideshowInterval (whole seconds, 0-10) is the phase's own
// slideshow_interval, converted to ms by the caller — 0 (or omitted)
// disables auto-advance entirely, leaving only the manual controls.
// Auto-advance only runs once the lightbox is open (the thumbnail grid
// itself never moves on its own), restarting whenever the index changes
// so manual navigation doesn't fight the timer.

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { PhasePhoto } from "@/types/domain";

export default function PhaseGallery({
  photos,
  slideshowIntervalMs = 0,
}: {
  photos: PhasePhoto[];
  slideshowIntervalMs?: number;
}) {
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

  useEffect(() => {
    if (lightboxIndex === null || photos.length <= 1 || !slideshowIntervalMs) return;
    const timer = setInterval(() => {
      setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
    }, slideshowIntervalMs);
    return () => clearInterval(timer);
  }, [lightboxIndex, photos.length, slideshowIntervalMs]);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white aspect-video flex items-center justify-center text-sm text-ink-400">
        No photos yet
      </div>
    );
  }

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
