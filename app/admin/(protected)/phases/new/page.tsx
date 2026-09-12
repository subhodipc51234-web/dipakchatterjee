// app/admin/(protected)/phases/new/page.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PhaseForm from "../PhaseForm";
import { createPhase } from "../actions";

export default function NewPhasePage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/phases"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-navy-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Phases
      </Link>

      <p className="text-sm font-semibold text-saffron-600 mb-2">New Phase</p>
      <h1 className="font-display text-3xl text-navy-900 mb-8">Add a life phase</h1>

      <div className="bg-white border border-line rounded-xl p-6 md:p-8">
        <PhaseForm onSubmit={createPhase} />
        <p className="text-xs text-ink-400 mt-5">
          Save first, then add photos and captions for this phase on the next screen.
        </p>
      </div>
    </div>
  );
}
