// app/admin/(protected)/settings/NavLinksManager.tsx
//
// Admin controls for the header's primary nav row ("About", "Public
// Life", "Notable Works", "Contact" by default — see
// components/site/SiteHeader.tsx for how these render). Root-relative
// "/#section" URLs keep working from any page (SiteHeader's
// handleAnchorClick smooth-scrolls on the homepage and lets a normal
// navigation land + auto-scroll everywhere else) regardless of what an
// admin types here, since that behavior only inspects the URL's shape.

"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import DndListSkeleton from "@/components/admin/DndListSkeleton";
import type { NavLink } from "@/types/domain";
import { createNavLink, deleteNavLink, reorderNavLinks, updateNavLink } from "./nav-links-actions";

export default function NavLinksManager({ links }: { links: NavLink[] }) {
  const [items, setItems] = useState(links);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // See SocialLinksManager for why both an explicit DndContext `id` and
  // a mount-gate are used together to fully eliminate the
  // aria-describedby hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((l) => l.id === active.id);
    const newIndex = items.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setError(null);
    startTransition(async () => {
      try {
        await reorderNavLinks(reordered.map((l) => l.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save the new order.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this nav link?")) return;
    const prev = items;
    setItems((cur) => cur.filter((l) => l.id !== id));
    setError(null);
    startTransition(async () => {
      try {
        await deleteNavLink(id);
      } catch (err) {
        setItems(prev);
        setError(err instanceof Error ? err.message : "Failed to delete.");
      }
    });
  }

  function handleUpdated(id: string, patch: Partial<NavLink>) {
    setItems((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createNavLink({ label: "New Link", url: "/#" });
      setItems((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add nav link.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-navy-900">Navigation Links</p>
        <button
          type="button"
          onClick={() => startTransition(handleAdd)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" />
          Add link
        </button>
      </div>
      <p className="text-xs text-ink-400 mb-5">
        The main menu row (&ldquo;About&rdquo;, &ldquo;Public Life&rdquo;, &hellip;). Use a
        root-relative anchor like <code>/#about</code> to smooth-scroll on the homepage and still
        land correctly from any other page. Hide a link instead of deleting it to keep its
        position for later.
      </p>

      {error && (
        <p className="text-xs text-rust mb-3" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-6 text-center text-sm text-ink-400">
          No nav links yet.
        </div>
      ) : !mounted ? (
        <DndListSkeleton count={items.length} />
      ) : (
        <DndContext id="nav-links-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((link) => (
                <SortableNavLinkRow
                  key={link.id}
                  link={link}
                  disabled={isPending}
                  onDelete={() => handleDelete(link.id)}
                  onUpdated={(patch) => handleUpdated(link.id, patch)}
                  onError={setError}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableNavLinkRow({
  link,
  disabled,
  onDelete,
  onUpdated,
  onError,
}: {
  link: NavLink;
  disabled: boolean;
  onDelete: () => void;
  onUpdated: (patch: Partial<NavLink>) => void;
  onError: (message: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });
  const [label, setLabel] = useState(link.label);
  const [url, setUrl] = useState(link.url);

  const style = { transform: CSS.Transform.toString(transform), transition };

  function save(patch: { label?: string; url?: string; is_visible?: boolean }) {
    onError(null);
    onUpdated(patch);
    updateNavLink(link.id, patch).catch((err) =>
      onError(err instanceof Error ? err.message : "Failed to save.")
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-3 rounded-md border border-line bg-white p-3 ${
        isDragging ? "opacity-60" : ""
      } ${!link.is_visible ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="shrink-0 text-ink-400 hover:text-ink cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== link.label && save({ label })}
        placeholder="Label"
        className="flex-1 min-w-[120px] rounded border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-saffron focus:outline-none"
      />

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => url !== link.url && save({ url })}
        placeholder="/#section or https://..."
        className="flex-[2] min-w-[160px] rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink-600 focus:border-saffron focus:outline-none"
      />

      <button
        type="button"
        onClick={() => save({ is_visible: !link.is_visible })}
        aria-label={link.is_visible ? "Hide link" : "Show link"}
        aria-pressed={link.is_visible}
        title={link.is_visible ? "Visible — click to hide" : "Hidden — click to show"}
        className="shrink-0 text-ink-400 hover:text-navy-900"
      >
        {link.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Delete nav link"
        className="shrink-0 text-ink-400 hover:text-rust disabled:opacity-60"
      >
        {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </li>
  );
}
