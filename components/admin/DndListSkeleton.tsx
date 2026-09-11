// components/admin/DndListSkeleton.tsx
//
// Pre-mount stand-in for a dnd-kit sortable list. @dnd-kit assigns each
// <DndContext> an internal aria-describedby id from a counter that lives
// in module scope — on the server that counter is shared across
// concurrent requests, so the value baked into the SSR HTML can differ
// from what a fresh client render starts at, producing a hydration
// mismatch on the drag-handle button's aria-describedby attribute. An
// explicit `id` on every <DndContext> makes that attribute deterministic
// (the real fix); rendering this identical, inert skeleton on both the
// server and the client's first paint — swapping in the real
// DndContext-powered list only after mount — closes off any other way
// that subtree could diverge.

export default function DndListSkeleton({ count, rowHeight = 52 }: { count: number; rowHeight?: number }) {
  if (count === 0) return null;

  return (
    <ul className="space-y-2 mb-5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          style={{ height: rowHeight }}
          className="rounded-md border border-line bg-paper-100 animate-pulse"
        />
      ))}
    </ul>
  );
}
