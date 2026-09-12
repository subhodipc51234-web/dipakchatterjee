// app/admin/(protected)/phases/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { Phase, PhasePhoto } from "@/types/domain";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import PhaseForm from "../PhaseForm";
import PhasePhotosManager from "../PhasePhotosManager";
import { deletePhase, updatePhase } from "../actions";

export default async function EditPhasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: phase } = await supabase.from("phases").select("*").eq("id", id).single();

  if (!phase) notFound();

  const typedPhase = phase as Phase;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/phases"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-navy-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Phases
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-saffron-600 mb-2">Edit Phase</p>
          <h1 className="font-display text-3xl text-navy-900">{typedPhase.title}</h1>
        </div>

        <DeleteEntityButton
          label="Delete phase"
          confirmMessage="Delete this phase and all its photos? This cannot be undone."
          redirectTo="/admin/phases"
          onDelete={deletePhase.bind(null, id)}
        />
      </div>

      <div className="bg-white border border-line rounded-xl p-6 md:p-8 mb-6">
        <PhaseForm phase={typedPhase} onSubmit={updatePhase.bind(null, id)} />
      </div>

      <div className="bg-white border border-line rounded-xl p-6 md:p-8">
        <PhasePhotosManager phaseId={id} photos={(typedPhase.photos as unknown as PhasePhoto[]) ?? []} />
      </div>
    </div>
  );
}
