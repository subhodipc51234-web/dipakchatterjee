// app/admin/(protected)/phases/PhaseList.tsx
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
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Phase } from "@/types/domain";
import { deletePhase, reorderPhases } from "./actions";

export default function PhaseList({ phases }: { phases: Phase[] }) {
  const [items, setItems] = useState(phases);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    startTransition(async () => {
      await reorderPhases(reordered.map((p) => p.id));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this phase and all its photos? This cannot be undone.")) return;
    setItems((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      await deletePhase(id);
    });
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line rounded-lg p-8 text-center text-sm text-ink-400">
        No phases yet. Add one to get started.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((phase) => (
            <SortablePhaseRow
              key={phase.id}
              phase={phase}
              disabled={isPending}
              onDelete={() => handleDelete(phase.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortablePhaseRow({
  phase,
  disabled,
  onDelete,
}: {
  phase: Phase;
  disabled: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: phase.id,
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
          <p className="font-semibold text-navy-900 truncate">{phase.title}</p>
          {phase.period && (
            <span className="shrink-0 text-[11px] font-medium text-ink-400 bg-paper-100 border border-line rounded px-2 py-0.5">
              {phase.period}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-600 truncate mt-0.5">{phase.summary}</p>
      </div>

      <Link
        href={`/admin/phases/${phase.id}`}
        aria-label="Edit phase"
        className="shrink-0 w-9 h-9 rounded-md border border-line flex items-center justify-center text-ink-600 hover:border-saffron hover:text-saffron-600"
      >
        <Pencil className="w-4 h-4" />
      </Link>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Delete phase"
        className="shrink-0 w-9 h-9 rounded-md border border-line flex items-center justify-center text-ink-600 hover:border-rust hover:text-rust disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
