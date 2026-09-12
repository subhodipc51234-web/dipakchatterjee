// app/admin/(protected)/phases/new/page.tsx
//
// Creating a phase is now done from the unified "New Section" form at
// /admin/features/new (pick "Phases" as the Section type) — this route
// redirects rather than 404ing in case it's bookmarked.
import { redirect } from "next/navigation";

export default function NewPhasePage() {
  redirect("/admin/features/new");
}
