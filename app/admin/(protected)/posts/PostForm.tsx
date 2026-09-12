// app/admin/(protected)/posts/PostForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import type { Post } from "@/types/domain";
import type { PostFormInput } from "./actions";

const postSchema = z.object({
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().max(20000).optional(),
  published_at: z.string().optional(),
  external_link: z
    .string()
    .trim()
    .url("Enter a valid URL, e.g. https://facebook.com/...")
    .optional()
    .or(z.literal("")),
  is_published: z.boolean(),
  image_interval_seconds: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number(v) >= 1 && Number(v) <= 60), {
      message: "Enter a number between 1 and 60, or leave blank.",
    })
    .optional()
    .or(z.literal("")),
});

type PostFormValues = z.infer<typeof postSchema>;

/** "YYYY-MM-DDTHH:mm" in the browser's local time, for a datetime-local input's value/default. */
function toLocalDatetimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function PostForm({
  post,
  onSubmit,
}: {
  post?: Post;
  onSubmit: (input: PostFormInput) => Promise<void>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title ?? "",
      body: post?.body ?? "",
      published_at: toLocalDatetimeInputValue(post ? new Date(post.published_at) : new Date()),
      external_link: post?.external_link ?? "",
      is_published: post?.is_published ?? false,
      image_interval_seconds: post?.image_interval_ms
        ? String(Math.round((post.image_interval_ms / 1000) * 10) / 10)
        : "",
    },
  });

  function submit(values: PostFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await onSubmit({
          title: values.title ?? "",
          body: values.body ?? "",
          published_at: values.published_at ?? "",
          external_link: values.external_link ?? "",
          is_published: values.is_published,
          image_interval_seconds: values.image_interval_seconds
            ? Number(values.image_interval_seconds)
            : null,
        });
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-navy-900 mb-1.5">
          Title
        </label>
        <input
          id="title"
          {...register("title")}
          placeholder="Optional headline"
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        {errors.title && <p className="text-xs text-rust mt-1.5">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="published_at" className="block text-sm font-medium text-navy-900 mb-1.5">
          Publication date &amp; time
        </label>
        <input
          id="published_at"
          type="datetime-local"
          {...register("published_at")}
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <p className="text-xs text-ink-400 mt-1.5">
          Backdate this to publish a historical update. Defaults to now if left blank.
        </p>
        {errors.published_at && (
          <p className="text-xs text-rust mt-1.5">{errors.published_at.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="external_link" className="block text-sm font-medium text-navy-900 mb-1.5">
          External link (YouTube, Instagram, or Facebook URL)
        </label>
        <input
          id="external_link"
          type="url"
          {...register("external_link")}
          placeholder="https://youtube.com/watch?v=... or facebook.com/... or instagram.com/p/..."
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <p className="text-xs text-ink-400 mt-1.5">
          A recognized YouTube, Instagram, or Facebook URL renders as a live embed next to the
          post text on the &ldquo;Read More&rdquo; page. Any other URL shows as a plain
          &ldquo;View original&rdquo; link instead.
        </p>
        {errors.external_link && (
          <p className="text-xs text-rust mt-1.5">{errors.external_link.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-navy-900 mb-1.5">
          Description
        </label>
        <textarea
          id="body"
          rows={6}
          {...register("body")}
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
        />
        {errors.body && <p className="text-xs text-rust mt-1.5">{errors.body.message}</p>}
      </div>

      <div>
        <label htmlFor="image_interval_seconds" className="block text-sm font-medium text-navy-900 mb-1.5">
          Slideshow interval (seconds)
        </label>
        <input
          id="image_interval_seconds"
          type="number"
          min={1}
          max={60}
          step={0.1}
          placeholder="Default"
          {...register("image_interval_seconds")}
          className="w-32 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <p className="text-xs text-ink-400 mt-1.5">
          How long each image shows before advancing, when this post has multiple images. Decimal
          values are allowed (e.g. 2.5). Leave blank to use the default speed.
        </p>
        {errors.image_interval_seconds && (
          <p className="text-xs text-rust mt-1.5">{errors.image_interval_seconds.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2.5 text-sm text-navy-900 font-medium">
        <input
          type="checkbox"
          {...register("is_published")}
          className="w-4 h-4 rounded border-line text-saffron focus:ring-saffron"
        />
        Published (visible on the public site)
      </label>

      {serverError && (
        <p className="text-sm text-rust" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-md transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
