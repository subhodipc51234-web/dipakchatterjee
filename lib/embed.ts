// lib/embed.ts
//
// Turns a post's `external_link` into a responsive iframe embed when it
// recognizably points at YouTube, Instagram, or Facebook. Falls back to
// null (an ordinary "View original" link, handled by the caller) for
// anything else — this is a best-effort URL-pattern match, not a full
// oEmbed integration, so it deliberately fails closed rather than
// guessing at surprising URL shapes.
//
// The Facebook/Instagram/YouTube iframe endpoints below are all public,
// no-JS-SDK, no-API-key plugin URLs (Meta's plugins/post.php and
// plugins/video.php, Instagram's /embed suffix, YouTube's /embed/
// path) — see proxy.ts's CSP frame-src for the matching allowlist.

export type EmbedProvider = "youtube" | "facebook" | "instagram";

export type EmbedInfo = {
  provider: EmbedProvider;
  embedUrl: string;
};

function extractYouTubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1);
    return id || null;
  }
  if (url.hostname.endsWith("youtube.com")) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/);
    if (shortsMatch) return shortsMatch[1];
    const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/);
    if (embedMatch) return embedMatch[1];
  }
  return null;
}

function extractInstagramShortcode(url: URL): string | null {
  const match = url.pathname.match(/^\/(?:p|reel|tv)\/([^/]+)/);
  return match ? match[1] : null;
}

export function getEmbedInfo(rawUrl: string | null | undefined): EmbedInfo | null {
  if (!rawUrl) return null;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  if (host === "instagram.com") {
    const shortcode = extractInstagramShortcode(url);
    if (!shortcode) return null;
    return { provider: "instagram", embedUrl: `https://www.instagram.com/p/${shortcode}/embed` };
  }

  if (host === "facebook.com" || host === "fb.watch") {
    const isVideo = /\/videos\/|\/reel\/|\/watch\/?\?/.test(url.pathname + url.search) || host === "fb.watch";
    const plugin = isVideo ? "video" : "post";
    const href = encodeURIComponent(rawUrl);
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/${plugin}.php?href=${href}&show_text=false`,
    };
  }

  return null;
}
