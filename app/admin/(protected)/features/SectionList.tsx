// app/admin/(protected)/features/SectionList.tsx
//
// The unified "Modular sections" list: Image Gallery features and
// Phases, interleaved in one shared order and reorderable together —
// by drag (the `::` handle) or, as a non-drag fallback, the Move
// Up/Down buttons on each row. Both paths call reorderSections() with
// the *entire* merged list, which writes one shared 0..n-1 index across
// both features.display_order and phases.sort_order so the public site
// renders them in this exact interleaved order (see
// lib/homepage-layout.ts's computeHomepageOrder).
//
// Publish/unpublish only applies to Image Gallery features — a phase
// has no is_published flag (it's always shown once created, matching
// ../phases/actions.ts's existing design), so phase rows simply don't
// get that toggle button.
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
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Feature, Phase } from "@/types/domain";
import { deleteFeature, reorderSections, toggleFeaturePublished, type SectionRef } from "./actions";
import { deletePhase } from "../phases/actions";

export type SectionItem =
  | { kind: "feature"; data: Feature }
  | { kind: "phase"; data: Phase };

function toRefs(items: SectionItem[]): SectionRef[] {
  return items.map((it) => ({ kind: it.kind, id: it.data.id }));
}

export default function SectionList({ items: initialItems }: { items: SectionItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function persist(next: SectionItem[]) {
    setItems(next);
    startTransition(async () => {
      await reorderSections(toRefs(next));
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((it) => it.data.id === active.id);
    const newIndex = items.findIndex((it) => it.data.id === over.id);
    persist(arrayMove(items, oldIndex, newIndex));
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    persist(arrayMove(items, index, target));
  }

  function handleTogglePublished(id: string, next: boolean) {
    setItems((prev) =>
      prev.map((it) => (it.kind === "feature" && it.data.id === id ? { ...it, data: { ...it.data, is_published: next } } : it))
    );
    startTransition(async () => {
      await toggleFeaturePublished(id, next);
    });
  }

  function handleDelete(item: SectionItem) {
    const label = item.kind === "feature" ? "feature" : "phase";
    if (!confirm(`Delete this ${label} and all its media? This cannot be undone.`)) return;
    setItems((prev) => prev.filter((it) => it.data.id !== item.data.id));
    startTransition(async () => {
      await (item.kind === "feature" ? deleteFeature(item.data.id) : deletePhase(item.data.id));
    });
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line rounded-lg p-10 text-center text-sm text-ink-400">
        No sections yet. Add one to get started.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((it) => it.data.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <SortableSectionRow
              key={item.data.id}
              item={item}
              disabled={isPending}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onMoveUp={() => handleMove(index, -1)}
              onMoveDown={() => handleMove(index, 1)}
              onTogglePublished={
                item.kind === "feature" ? () => handleTogglePublished(item.data.id, !item.data.is_published) : undefined
              }
              onDelete={() => handleDelete(item)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableSectionRow({
  item,
  disabled,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onTogglePublished,
  onDelete,
}: {
  item: SectionItem;
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTogglePublished?: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.data.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const title = item.kind === "feature" ? item.data.title : item.data.title;
  const subtitle = item.kind === "feature" ? item.data.subtitle : item.data.period;
  const typeBadge = item.kind === "feature" ? "Image Gallery" : "Phases";
  const editHref = item.kind === "feature" ? `/admin/features/${item.data.id}` : `/admin/phases/${item.data.id}`;

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

      <div className="flex flex-col shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={disabled || isFirst}
          aria-label="Move up"
          className="text-ink-400 hover:text-navy-900 disabled:opacity-30 disabled:hover:text-ink-400"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={disabled || isLast}
          aria-label="Move down"
          className="text-ink-400 hover:text-navy-900 disabled:opacity-30 disabled:hover:text-ink-400"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-navy-900 truncate">{title}</p>
          <span className="shrink-0 text-[11px] font-medium text-ink-400 bg-paper-100 border border-line rounded px-2 py-0.5">
            [{typeBadge}]
          </span>
        </div>
        {subtitle && <p className="text-sm text-ink-600 truncate mt-0.5">{subtitle}</p>}
      </div>

      {onTogglePublished && (
        <button
          type="button"
          onClick={onTogglePublished}
          disabled={disabled}
          className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border disabled:opacity-60 ${
            item.kind === "feature" && item.data.is_published
              ? "border-forest text-forest bg-forest-100"
              : "border-line text-ink-400 bg-paper-100"
          }`}
        >
          {item.kind === "feature" && item.data.is_published ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          {item.kind === "feature" && item.data.is_published ? "Published" : "Draft"}
        </button>
      )}

      <Link
        href={editHref}
        aria-label={`Edit ${item.kind}`}
        className="shrink-0 w-9 h-9 rounded-md border border-line flex items-center justify-center text-ink-600 hover:border-saffron hover:text-saffron-600"
      >
        <Pencil className="w-4 h-4" />
      </Link>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label={`Delete ${item.kind}`}
        className="shrink-0 w-9 h-9 rounded-md border border-line flex items-center justify-center text-ink-600 hover:border-rust hover:text-rust disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
