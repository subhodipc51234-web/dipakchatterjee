// app/admin/(protected)/features/new/page.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NewSectionForm from "./NewSectionForm";

export default function NewSectionPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/features"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-navy-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Features
      </Link>

      <p className="text-sm font-semibold text-saffron-600 mb-2">New Section</p>
      <h1 className="font-display text-3xl text-navy-900 mb-8">Add a modular section</h1>

      <NewSectionForm />
    </div>
  );
}
