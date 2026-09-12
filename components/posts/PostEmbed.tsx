// components/posts/PostEmbed.tsx
//
// Responsive iframe wrapper for a recognized YouTube/Instagram/Facebook
// embed (see lib/embed.ts). Vertical formats (Shorts/Reels) get a
// centered 9:16 portrait frame instead of being forced into a
// letterboxed 16:9 box; regular horizontal video keeps a locked 16:9
// frame; everything else (a plain Instagram post, a Facebook link/post
// embed) sizes to its own natural height since that isn't reliably one
// aspect ratio or the other.

import type { EmbedInfo } from "@/lib/embed";

const CONTAINER_CLASS: Record<EmbedInfo["orientation"], string> = {
  horizontal: "w-full aspect-video",
  vertical: "w-full max-w-[360px] aspect-[9/16] mx-auto",
  auto: "w-full min-h-[560px]",
};

export default function PostEmbed({ embed }: { embed: EmbedInfo }) {
  return (
    <div
      className={`rounded-lg overflow-hidden border border-line bg-navy-900 ${CONTAINER_CLASS[embed.orientation]}`}
    >
      <iframe
        src={embed.embedUrl}
        title={`${embed.provider} embed`}
        className="w-full h-full"
        style={embed.orientation === "auto" ? { minHeight: 560 } : undefined}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
