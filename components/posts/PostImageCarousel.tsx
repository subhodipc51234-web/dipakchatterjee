// components/posts/PostImageCarousel.tsx
//
// Auto-advancing slideshow for a post with multiple images attached.
// Only ever rendered when there are 2+ images (the caller decides) — a
// single image just renders through MediaPlayer as before. Deliberately
// simpler than PublicLifeGallery (no drag/swipe): this is a supporting
// slideshow inside an article, not the site's primary hero carousel.

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PostMedia } from "@/types/domain";

const DEFAULT_INTERVAL_MS = 3000;

export default function PostImageCarousel({
  images,
  intervalMs = DEFAULT_INTERVAL_MS,
}: {
  images: PostMedia[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, images.length, intervalMs]);

  if (images.length === 0) return null;

  function goTo(i: number) {
    setIndex(((i % images.length) + images.length) % images.length);
  }

  return (
    <div
      className="group relative w-full aspect-video rounded-lg overflow-hidden border border-line bg-navy-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Post images"
    >
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.public_url}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-navy-900/60 hover:bg-navy-900/80 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-navy-900/60 hover:bg-navy-900/80 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 touch-manipulation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
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
