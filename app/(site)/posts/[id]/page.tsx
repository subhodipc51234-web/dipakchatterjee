// app/(site)/posts/[id]/page.tsx
//
// Single post permalink. Async `params`, per the Next.js 15+ App Router
// convention already used across the admin edit pages in this project.

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

  const header = (
    <>
      <p className="text-xs text-ink-400 font-medium">
        {formatDate(typedPost.published_at)}
      </p>
      <h1 className="font-display text-3xl md:text-4xl text-navy-900 leading-tight mt-2">
        {typedPost.title || "Update"}
      </h1>
    </>
  );

  const bodyContent = typedPost.body && (
    <div className="max-w-none text-ink-600 leading-relaxed [&_p]:leading-relaxed [&_p]:mb-4">
      <ReactMarkdown>{typedPost.body}</ReactMarkdown>
    </div>
  );

  const attachedMedia = typedPost.post_media.length > 0 && (
    <div className="space-y-6">
      {images.length > 1 ? (
        <PostImageCarousel images={images} intervalMs={typedPost.image_interval_ms ?? undefined} />
      ) : (
        images.map((media, i) => (
          <MediaPlayer
            key={media.id}
            kind={media.kind}
            src={media.public_url}
            externalLink={!embed && i === 0 ? (typedPost.external_link ?? undefined) : undefined}
          />
        ))
      )}
      {videos.map((media, i) => (
        <MediaPlayer
          key={media.id}
          kind={media.kind}
          src={media.public_url}
          externalLink={!embed && images.length === 0 && i === 0 ? (typedPost.external_link ?? undefined) : undefined}
        />
      ))}
    </div>
  );

  const hasUploadedMedia = typedPost.post_media.length > 0;

  // Strict two-column split — LEFT: text + any uploaded images/video,
  // RIGHT: the external embed — only kicks in once there's an embed to
  // anchor the right column. A post with only uploaded media (no
  // embed) instead gets a single wide column: images have nowhere
  // "strict" to go without an embed on the other side, so they simply
  // follow the text in reading order.
  if (embed) {
    return (
      <main className="bg-paper-100 min-h-screen transition-colors">
        <article className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {header}

          <div className="mt-8 grid lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-12 items-start">
            <div className="space-y-6">
              {bodyContent}
              {attachedMedia}
              {typedPost.external_link && (
                <a
                  href={typedPost.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80"
                >
                  View original
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div>
              <PostEmbed embed={embed} />
            </div>
          </div>
        </article>
      </main>
    );
  }

  if (hasUploadedMedia) {
    return (
      <main className="bg-paper-100 min-h-screen transition-colors">
        <article className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {header}

          {bodyContent && <div className="mt-8">{bodyContent}</div>}

          <div className="mt-8">{attachedMedia}</div>

          {typedPost.external_link && (
            <a
              href={typedPost.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80"
            >
              View original
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </article>
      </main>
    );
  }

  return (
    <main className="bg-paper-100 min-h-screen transition-colors">
      <article className="max-w-2xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {header}

        {bodyContent && <div className="mt-8">{bodyContent}</div>}

        {typedPost.external_link && (
          <a
            href={typedPost.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80"
          >
            View original
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </article>
    </main>
  );
}
