// components/phases/PhaseSlideshow.tsx
//
// Auto-advancing crossfade slideshow for a Phase with a slideshow
// interval set (PhaseGallery renders this instead of the static grid
// whenever slideshow_interval > 0 — see that file). Deliberately mirrors
// components/posts/PostImageCarousel's simple crossfade approach (no
// drag/swipe) rather than PublicLifeGallery's transform-track carousel,
// since this is a supporting gallery beside narrative text, not the
// site's primary hero carousel.

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PhasePhoto } from "@/types/domain";

export default function PhaseSlideshow({
  photos,
  intervalMs,
}: {
  photos: PhasePhoto[];
  intervalMs: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || photos.length <= 1 || !intervalMs) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, photos.length, intervalMs]);

  if (photos.length === 0) return null;

  function goTo(i: number) {
    setIndex(((i % photos.length) + photos.length) % photos.length);
  }

  return (
    <div
      className="group relative w-full aspect-video rounded-lg overflow-hidden border border-line bg-navy-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Phase photos"
    >
      {photos.map((photo, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.path || photo.url}
          src={photo.url}
          alt={photo.caption || ""}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
        />
      ))}

      {photos[index]?.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-10 pb-3">
          <p className="text-sm text-white/90">{photos[index].caption}</p>
        </div>
      )}

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-navy-900/60 hover:bg-navy-900/80 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-navy-900/60 hover:bg-navy-900/80 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 touch-manipulation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute top-3 inset-x-0 flex items-center justify-center gap-1.5">
            {photos.map((photo, i) => (
              <button
                key={photo.path || photo.url}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 touch-manipulation ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
