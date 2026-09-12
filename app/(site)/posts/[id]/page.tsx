// app/(site)/posts/[id]/page.tsx
//
// Single post permalink. Async `params`, per the Next.js 15+ App Router
// convention already used across the admin edit pages in this project.
//
// Layout, in two parts:
//   - Upper section: headline/metadata/description on the LEFT, the
//     external embed (Facebook/YouTube/Instagram) on the RIGHT — a
//     two-column split on desktop, stacked (text then embed) on
//     mobile. Uploaded images never appear here, so they can't squeeze
//     the description.
//   - Lower "Media" section: full-width, styled with the site's
//     secondary theme color, holding only the post's uploaded
//     images/video (as a carousel using the post's own cycle interval
//     when there are multiple images).

import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { PostWithMedia } from "@/types/domain";
import MediaPlayer from "@/components/MediaPlayer";
import PostEmbed from "@/components/posts/PostEmbed";
import PostImageCarousel from "@/components/posts/PostImageCarousel";
import { getEmbedInfo } from "@/lib/embed";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, post_media(*)")
    .eq("id", id)
    .eq("is_published", true)
    .order("display_order", { foreignTable: "post_media", ascending: true })
    .single();

  if (!post) notFound();

  const typedPost = post as PostWithMedia;
  const embed = getEmbedInfo(typedPost.external_link);
  const images = typedPost.post_media.filter((m) => m.kind === "image");
  const videos = typedPost.post_media.filter((m) => m.kind === "video");
  const hasUploadedMedia = typedPost.post_media.length > 0;

  return (
    <main className="bg-paper-100 min-h-screen">
      <article className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Text/embed split only kicks in when there's an embed to put
            beside the text; a text-only or images-only post just gets
            the plain single (readable-width) column below. */}
        <div className={embed ? "grid lg:grid-cols-2 gap-8 lg:gap-12 items-start" : ""}>
          <div className={embed ? "" : "max-w-2xl"}>
            <p className="text-xs text-ink-400 font-medium">{formatDate(typedPost.published_at)}</p>
            <h1 className="font-display text-3xl md:text-4xl text-navy-900 leading-tight mt-2">
              {typedPost.title || "Update"}
            </h1>

            {typedPost.body && (
              <div className="mt-8 max-w-none text-ink-600 leading-relaxed [&_p]:leading-relaxed [&_p]:mb-4">
                <ReactMarkdown>{typedPost.body}</ReactMarkdown>
              </div>
            )}

            {typedPost.external_link && (
              <a
                href={typedPost.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80"
              >
                View original
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {embed && (
            <div>
              <PostEmbed embed={embed} />
            </div>
          )}
        </div>
      </article>

      {hasUploadedMedia && (
        <section className="border-y border-[var(--theme-secondary)]/15 bg-[var(--theme-secondary)]/[0.04] py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-secondary)] mb-6">
              Media
            </p>

            <div className="space-y-6">
              {images.length > 1 ? (
                <PostImageCarousel images={images} intervalMs={typedPost.image_interval_ms ?? undefined} />
              ) : (
                images.map((media) => (
                  <MediaPlayer key={media.id} kind={media.kind} src={media.public_url} />
                ))
              )}
              {videos.map((media) => (
                <MediaPlayer key={media.id} kind={media.kind} src={media.public_url} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
