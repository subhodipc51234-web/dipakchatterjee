// app/admin/(protected)/features/FeatureList.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import { FEATURE_TYPE_LABELS, type Feature } from "@/types/domain";
import { deleteFeature, reorderFeatures, toggleFeaturePublished } from "./actions";

export default function FeatureList({ features }: { features: Feature[] }) {
  const [items, setItems] = useState(features);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((f) => f.id === active.id);
    const newIndex = items.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    startTransition(async () => {
      await reorderFeatures(reordered.map((f) => f.id));
    });
  }

  function handleTogglePublished(id: string, next: boolean) {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, is_published: next } : f)));
    startTransition(async () => {
      await toggleFeaturePublished(id, next);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this feature and all its media? This cannot be undone.")) return;
    setItems((prev) => prev.filter((f) => f.id !== id));
    startTransition(async () => {
      await deleteFeature(id);
    });
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line rounded-lg p-10 text-center text-sm text-ink-400">
        No features yet. Add one to get started.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((feature) => (
            <SortableFeatureRow
              key={feature.id}
              feature={feature}
              disabled={isPending}
              onTogglePublished={() => handleTogglePublished(feature.id, !feature.is_published)}
              onDelete={() => handleDelete(feature.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableFeatureRow({
  feature,
  disabled,
  onTogglePublished,
  onDelete,
}: {
  feature: Feature;
  disabled: boolean;
  onTogglePublished: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white border border-line rounded-lg p-4 ${
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-navy-900 truncate">{feature.title}</p>
          <span className="shrink-0 text-[11px] font-medium text-ink-400 bg-paper-100 border border-line rounded px-2 py-0.5">
            {FEATURE_TYPE_LABELS[feature.type]}
          </span>
        </div>
        {feature.subtitle && (
          <p className="text-sm text-ink-600 truncate mt-0.5">{feature.subtitle}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onTogglePublished}
        disabled={disabled}
        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border disabled:opacity-60 ${
          feature.is_published
            ? "border-forest text-forest bg-forest-100"
            : "border-line text-ink-400 bg-paper-100"
        }`}
      >
        {feature.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {feature.is_published ? "Published" : "Draft"}
      </button>

      <Link
        href={`/admin/features/${feature.id}`}
        aria-label="Edit feature"
        className="shrink-0 w-9 h-9 rounded-md border border-line flex items-center justify-center text-ink-600 hover:border-saffron hover:text-saffron-600"
      >
        <Pencil className="w-4 h-4" />
      </Link>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Delete feature"
        className="shrink-0 w-9 h-9 rounded-md border border-line flex items-center justify-center text-ink-600 hover:border-rust hover:text-rust disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
