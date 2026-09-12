// components/posts/PostEmbed.tsx
//
// Responsive iframe wrapper for a recognized YouTube/Instagram/Facebook
// embed (see lib/embed.ts). YouTube and Facebook-video embeds are fixed
// 16:9; Facebook posts and Instagram embeds size to their own content,
// so those get a taller, non-locked-aspect container instead of being
// letterboxed.

import type { EmbedInfo } from "@/lib/embed";

const ASPECT_LOCKED: Record<EmbedInfo["provider"], boolean> = {
  youtube: true,
  facebook: false,
  instagram: false,
};

export default function PostEmbed({ embed }: { embed: EmbedInfo }) {
  const locked = ASPECT_LOCKED[embed.provider];

  return (
    <div
      className={`w-full rounded-lg overflow-hidden border border-line bg-navy-900 ${
        locked ? "aspect-video" : "min-h-[560px]"
      }`}
    >
      <iframe
        src={embed.embedUrl}
        title={`${embed.provider} embed`}
        className="w-full h-full"
        style={locked ? undefined : { minHeight: 560 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
