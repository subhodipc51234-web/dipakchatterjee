// app/admin/(protected)/phases/page.tsx
//
// Phases management is unified into the single "Modular sections" list
// at /admin/features (see that page's SectionList) — this standalone
// listing no longer exists as its own surface, but the route redirects
// rather than 404ing in case it's bookmarked.
import { redirect } from "next/navigation";

export default function PhasesPage() {
  redirect("/admin/features");
}
