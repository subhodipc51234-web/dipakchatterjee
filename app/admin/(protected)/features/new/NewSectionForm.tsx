// app/admin/(protected)/features/new/NewSectionForm.tsx
//
// The unified "New Section" entry point: a Section Type selector that
// swaps between the two forms Modular Sections now support — "Image
// Gallery" (creates a `features` row) and "Phases" (creates a `phases`
// row). Each still saves first, then adds its photo gallery on its own
// edit page (features/[id] or phases/[id]) — creating the row first is
// what gives MediaManager/PhasePhotosManager a real id to upload
// against.
"use client";

import { useState } from "react";
import FeatureForm from "../FeatureForm";
import PhaseForm from "../../phases/PhaseForm";
import { createFeature } from "../actions";
import { createPhase } from "../../phases/actions";

type SectionType = "public_life_gallery" | "phases";

export default function NewSectionForm() {
  const [type, setType] = useState<SectionType>("public_life_gallery");

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <div className="mb-6">
        <label htmlFor="section-type" className="block text-sm font-medium text-navy-900 mb-1.5">
          Section type
        </label>
        <select
          id="section-type"
          value={type}
          onChange={(e) => setType(e.target.value as SectionType)}
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        >
          <option value="public_life_gallery">Image Gallery</option>
          <option value="phases">Phases</option>
        </select>
        <p className="text-xs text-ink-400 mt-1.5">
          {type === "public_life_gallery"
            ? "A photo/video carousel with a title and subtitle."
            : "A chronological life chapter (e.g. “Teaching Career”) with its own story and photo gallery."}
        </p>
      </div>

      {type === "public_life_gallery" ? (
        <FeatureForm onSubmit={createFeature} />
      ) : (
        <PhaseForm onSubmit={createPhase} />
      )}

      <p className="text-xs text-ink-400 mt-5">
        Save first, then add photos for this section on the next screen.
      </p>
    </div>
  );
}
