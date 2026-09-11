// app/admin/(protected)/settings/SocialLinksManager.tsx
//
// Manages the social links shown in the public footer's Follow block.
// Drag to reorder, pick a platform (for its icon), optionally override
// the display label, and set the profile URL.

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
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import DndListSkeleton from "@/components/admin/DndListSkeleton";
import SocialIcon from "@/components/SocialIcon";
import { SOCIAL_PLATFORM_LABELS, type SocialLink } from "@/types/domain";
import {
  createSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
  updateSocialLink,
} from "./footer-actions";

const PLATFORMS = Object.keys(SOCIAL_PLATFORM_LABELS);

export default function SocialLinksManager({ links }: { links: SocialLink[] }) {
  const [items, setItems] = useState(links);
  const [isPending, startTransition] = useTransition();

  // @dnd-kit assigns each DndContext's aria-describedby id from a
  // module-scoped counter shared across concurrent server requests, so
  // the SSR HTML can bake in a different value than a fresh client
  // render starts at. An explicit `id` below makes that deterministic;
  // gating the DndContext behind `mounted` (rendering an identical inert
  // skeleton until then) additionally guarantees the very first client
  // render can never diverge from the server's, however it's counted.
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

    startTransition(async () => {
      await reorderSocialLinks(reordered.map((l) => l.id));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this social link?")) return;
    setItems((prev) => prev.filter((l) => l.id !== id));
    startTransition(async () => {
      await deleteSocialLink(id);
    });
  }

  function handleAdded(link: SocialLink) {
    setItems((prev) => [...prev, link]);
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Social media &amp; Follow</p>
      <p className="text-xs text-ink-400 mb-5">
        Shown in the footer&rsquo;s Follow block. Drag to reorder.
      </p>

      {items.length > 0 && !mounted && <DndListSkeleton count={items.length} />}

      {items.length > 0 && mounted && (
        <DndContext
          id="social-links-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2 mb-5">
              {items.map((link) => (
                <SortableSocialRow
                  key={link.id}
                  link={link}
                  disabled={isPending}
                  onDelete={() => handleDelete(link.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <AddSocialLinkForm onAdded={handleAdded} />
    </div>
  );
}

function SortableSocialRow({
  link,
  disabled,
  onDelete,
}: {
  link: SocialLink;
  disabled: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });
  const [platform, setPlatform] = useState(link.platform);
  const [label, setLabel] = useState(link.label ?? "");
  const [url, setUrl] = useState(link.url);

  const style = { transform: CSS.Transform.toString(transform), transition };

  function save(patch: { platform?: string; label?: string; url?: string }) {
    updateSocialLink(link.id, patch).catch((err) =>
      alert(err instanceof Error ? err.message : "Failed to save.")
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-2.5 rounded-md border border-line bg-white p-2.5 ${
        isDragging ? "opacity-60" : ""
      }`}
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

      <span className="shrink-0 w-8 h-8 rounded bg-paper-100 border border-line flex items-center justify-center text-navy-900">
        <SocialIcon platform={platform} className="w-4 h-4" />
      </span>

      <select
        value={platform}
        onChange={(e) => {
          setPlatform(e.target.value);
          save({ platform: e.target.value });
        }}
        className="shrink-0 rounded border border-line bg-white px-2 py-1.5 text-xs text-ink focus:border-saffron focus:outline-none"
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {SOCIAL_PLATFORM_LABELS[p]}
          </option>
        ))}
      </select>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => save({ label })}
        placeholder="Custom label (optional)"
        className="w-36 rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink-600 focus:border-saffron focus:outline-none"
      />

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => save({ url })}
        placeholder="https://..."
        className="flex-1 min-w-[10rem] rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink-600 focus:border-saffron focus:outline-none"
      />

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Delete social link"
        className="shrink-0 text-ink-400 hover:text-rust disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

function AddSocialLinkForm({ onAdded }: { onAdded: (link: SocialLink) => void }) {
  const [platform, setPlatform] = useState("facebook");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!url.trim()) {
      setError("Add a profile URL before saving.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createSocialLink({ platform, label: label.trim(), url: url.trim() });
      onAdded(created);
      setLabel("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add social link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-line pt-5">
      <p className="text-xs font-semibold text-navy-900 mb-3">Add social link</p>

      <div className="flex flex-wrap gap-2.5">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-saffron focus:outline-none"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {SOCIAL_PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Custom label (optional)"
          className="w-40 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-saffron focus:outline-none"
        />

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1 min-w-[12rem] rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-saffron focus:outline-none"
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={!url.trim() || saving}
          className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {saving ? "Adding…" : "Add"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-rust mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
