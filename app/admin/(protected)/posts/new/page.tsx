// app/admin/(protected)/posts/new/page.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PostForm from "../PostForm";
import { createPost } from "../actions";

export default function NewPostPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/posts"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-navy-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Posts
      </Link>

      <p className="text-sm font-semibold text-saffron-600 mb-2">New Post</p>
      <h1 className="font-display text-3xl text-navy-900 mb-8">Add a feed update</h1>

      <div className="bg-white border border-line rounded-xl p-6 md:p-8">
        <PostForm onSubmit={createPost} />
        <p className="text-xs text-ink-400 mt-5">
          Save first, then add photos or video for this post on the next screen.
        </p>
      </div>
    </div>
  );
}
