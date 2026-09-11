// app/admin/(protected)/settings/CtaButtonsManager.tsx
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
import { GripVertical, Plus, RotateCcw, Trash2 } from "lucide-react";
import DndListSkeleton from "@/components/admin/DndListSkeleton";
import type { CtaButton } from "@/types/domain";
import { createCtaButton, deleteCtaButton, reorderCtaButtons, updateCtaButton } from "./actions";

export default function CtaButtonsManager({
  buttons,
  themePrimary,
}: {
  buttons: CtaButton[];
  themePrimary: string;
}) {
  const [items, setItems] = useState(buttons);
  const [isPending, startTransition] = useTransition();

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
    const oldIndex = items.findIndex((b) => b.id === active.id);
    const newIndex = items.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    startTransition(async () => {
      await reorderCtaButtons(reordered.map((b) => b.id));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this CTA button from the homepage?")) return;
    setItems((prev) => prev.filter((b) => b.id !== id));
    startTransition(async () => {
      await deleteCtaButton(id);
    });
  }

  function handleUpdated(id: string, patch: Partial<CtaButton>) {
    setItems((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function handleAdd() {
    const created = await createCtaButton({ label: "New Button", url: "#" });
    setItems((prev) => [...prev, created]);
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-navy-900">CTA Buttons</p>
        <button
          type="button"
          onClick={() => startTransition(handleAdd)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" />
          Add button
        </button>
      </div>
      <p className="text-xs text-ink-400 mb-5">
        Shown in the hero, in order. Each defaults to Main Theme Color unless overridden.
      </p>

      {items.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-6 text-center text-sm text-ink-400">
          No CTA buttons yet.
        </div>
      ) : !mounted ? (
        <DndListSkeleton count={items.length} />
      ) : (
        <DndContext id="cta-buttons-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((btn) => (
                <SortableCtaRow
                  key={btn.id}
                  button={btn}
                  themePrimary={themePrimary}
                  disabled={isPending}
                  onDelete={() => handleDelete(btn.id)}
                  onUpdated={(patch) => handleUpdated(btn.id, patch)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableCtaRow({
  button,
  themePrimary,
  disabled,
  onDelete,
  onUpdated,
}: {
  button: CtaButton;
  themePrimary: string;
  disabled: boolean;
  onDelete: () => void;
  onUpdated: (patch: Partial<CtaButton>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: button.id,
  });
  const [label, setLabel] = useState(button.label);
  const [url, setUrl] = useState(button.url);

  const style = { transform: CSS.Transform.toString(transform), transition };

  function save(patch: { label?: string; url?: string; color?: string | null }) {
    updateCtaButton(button.id, patch).catch((err) =>
      alert(err instanceof Error ? err.message : "Failed to save.")
    );
    onUpdated(patch);
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-3 rounded-md border border-line bg-white p-3 ${
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

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== button.label && save({ label })}
        placeholder="Label"
        className="flex-1 min-w-[140px] rounded border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-saffron focus:outline-none"
      />

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => url !== button.url && save({ url })}
        placeholder="https:// or #anchor"
        className="flex-[2] min-w-[160px] rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink-600 focus:border-saffron focus:outline-none"
      />

      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="color"
          value={button.color || themePrimary}
          onChange={(e) => save({ color: e.target.value })}
          title="Button color"
          className="w-8 h-8 rounded border border-line cursor-pointer"
        />
        {button.color && (
          <button
            type="button"
            onClick={() => save({ color: null })}
            aria-label="Reset to theme color"
            title="Reset to theme color"
            className="text-ink-400 hover:text-saffron-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Delete button"
        className="shrink-0 text-ink-400 hover:text-rust disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
