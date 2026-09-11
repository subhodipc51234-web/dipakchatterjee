// lib/reference.ts
//
// Shared with the public complaint form's success view so the citizen's
// copy and the admin dashboard's copy of a complaint's reference number
// are always derived the same way, from the same source of truth (the
// row's id) — no separate reference_number column to keep in sync.

export function formatReferenceNumber(id: string) {
  return `REF-${id.slice(0, 8).toUpperCase()}`;
}
