// components/MediaPlayer.tsx
//
// Renders a single Post/Feature media attachment (image or video) with:
//   - right-click / long-press context menu disabled
//   - for video: controlsList="nodownload", PiP and remote-playback
//     casting disabled, so the native browser download/cast affordances
//     don't show up
//   - an "View original on Facebook" button when an external link is
//     supplied
//
// Honest caveat, worth knowing: none of this stops a determined person
// from saving the file (browser dev tools, screen recording, or just
// viewing the network tab will always work — that's true of any file
// served over the open web). What this component actually achieves is
// removing the *casual, one-click* download/save affordances so a normal
// visitor doesn't right-click-save or hit a native download button.
// If Dipak needs stronger protection later (e.g. watermarking or signed,
// expiring URLs), that's a separate, bigger conversation — happy to get
// into it when you're ready.

"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

type MediaPlayerProps = {
  kind: "image" | "video";
  src: string;
  posterUrl?: string;
  caption?: string;
  externalLink?: string;
  externalLinkLabel?: string;
  className?: string;
};

export default function MediaPlayer({
  kind,
  src,
  posterUrl,
  caption,
  externalLink,
  externalLinkLabel = "View original on Facebook",
  className = "",
}: MediaPlayerProps) {
  const [imgError, setImgError] = useState(false);

  function preventContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <figure className={`w-full ${className}`}>
      <div
        className="relative rounded-lg overflow-hidden border border-line bg-navy-900"
        onContextMenu={preventContextMenu}
      >
        {kind === "video" ? (
          <video
            src={src}
            poster={posterUrl}
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            disableRemotePlayback
            playsInline
            className="w-full max-h-[520px] bg-black"
            onContextMenu={preventContextMenu}
          >
            Your browser does not support embedded video.
          </video>
        ) : imgError ? (
          <div className="w-full aspect-video flex items-center justify-center text-paper-100/60 text-sm">
            Image unavailable
          </div>
        ) : (
          // Plain <img>, not next/image: we deliberately want full control
          // over draggable/context-menu behavior here.
          <img
            src={src}
            alt={caption ?? "Media attachment"}
            draggable={false}
            onError={() => setImgError(true)}
            onContextMenu={preventContextMenu}
            className="w-full max-h-[520px] object-contain select-none"
          />
        )}
      </div>

      {(caption || externalLink) && (
        <figcaption className="mt-3 flex items-start justify-between gap-4">
          {caption && (
            <span className="text-sm text-ink-600 dark:text-paper-100/70 leading-relaxed">
              {caption}
            </span>
          )}

          {externalLink && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 whitespace-nowrap"
            >
              {externalLinkLabel}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </figcaption>
      )}
    </figure>
  );
}
