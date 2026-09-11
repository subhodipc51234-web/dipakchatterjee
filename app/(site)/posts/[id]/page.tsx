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

  return (
    <main className="bg-paper-100 dark:bg-navy-900 min-h-screen transition-colors">
      <article className="max-w-2xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <p className="text-xs text-ink-400 dark:text-paper-100/50 font-medium">
          {formatDate(typedPost.published_at)}
        </p>

        <h1 className="font-display text-3xl md:text-4xl text-navy-900 dark:text-white leading-tight mt-2">
          {typedPost.title || "Update"}
        </h1>

        {typedPost.post_media.length > 0 && (
          <div className="mt-8 space-y-6">
            {typedPost.post_media.map((media, i) => (
              <MediaPlayer
                key={media.id}
                kind={media.kind}
                src={media.public_url}
                externalLink={i === 0 ? (typedPost.external_link ?? undefined) : undefined}
              />
            ))}
          </div>
        )}

        {typedPost.body && (
          <div className="max-w-none mt-8 text-ink-600 dark:text-paper-100/70 leading-relaxed [&_p]:leading-relaxed [&_p]:mb-4">
            <ReactMarkdown>{typedPost.body}</ReactMarkdown>
          </div>
        )}

        {typedPost.external_link && typedPost.post_media.length === 0 && (
          <a
            href={typedPost.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80"
          >
            View original on Facebook
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </article>
    </main>
  );
}
