// app/admin/(protected)/arrangement/ArrangementManager.tsx
//
// Dedicated "Arrangement" page: reorder/show/hide everything that renders
// between the site header+hero and the footer on the public homepage.
// Header, Hero, and Footer are rendered as locked reference cards (no
// drag handle, no move buttons) so it's visually obvious those bookends
// are fixed by app/(site)/layout.tsx + app/(site)/page.tsx and can never
// be reordered from here — only the movable zone between them
// (Organizations, the Notable Works posts feed, and every Feature/Phase)
// is backed by site_settings.homepage_layout (see lib/homepage-layout.ts).
//
// Adapted from the former Settings -> Homepage Sections tab
// (HomepageLayoutManager, now removed): same drag-and-drop, plus
// Move Up/Move Down buttons for non-pointer reordering, per the
// dedicated Arrangement page spec.

"use client";

import { useState, useTransition } from "react";
import { useHydrated } from "@/lib/hooks/useHydrated";
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
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Lock } from "lucide-react";
import DndListSkeleton from "@/components/admin/DndListSkeleton";
import { FEATURE_TYPE_LABELS, type Feature, type Phase } from "@/types/domain";
import {
  ORGANIZATIONS_SECTION_KEY,
  POSTS_SECTION_KEY,
  featureIdFromKey,
  phaseIdFromKey,
} from "@/lib/homepage-layout";
import { updateHomepageSectionVisibility } from "../settings/actions";
import { toggleFeaturePublished } from "../features/actions";
import { togglePhasePublished } from "../phases/actions";
import { updateArrangementOrder } from "./actions";

const FIXED_SECTION_KEYS = [ORGANIZATIONS_SECTION_KEY, POSTS_SECTION_KEY];

function sectionLabel(key: string, featureMap: Map<string, Feature>, phaseMap: Map<string, Phase>) {
  if (key === ORGANIZATIONS_SECTION_KEY) return "Organizations Worked With";
  if (key === POSTS_SECTION_KEY) return "Posts / Notable Works";
  const featureId = featureIdFromKey(key);
  if (featureId) {
    const feature = featureMap.get(featureId);
    return feature ? feature.title || FEATURE_TYPE_LABELS[feature.type] : "(deleted section)";
  }
  const phaseId = phaseIdFromKey(key);
  const phase = phaseId ? phaseMap.get(phaseId) : undefined;
  return phase ? phase.title : "(deleted section)";
}

function sectionTypeLabel(key: string, featureMap: Map<string, Feature>) {
  if (FIXED_SECTION_KEYS.includes(key)) return "Built-in";
  const featureId = featureIdFromKey(key);
  if (featureId) {
    const feature = featureMap.get(featureId);
    return feature ? FEATURE_TYPE_LABELS[feature.type] : "";
  }
  if (phaseIdFromKey(key)) return "Phases";
  return "";
}

function LockedCard({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-paper-100 p-3 opacity-80">
      <Lock className="w-4 h-4 shrink-0 text-ink-400" />
      <span className="flex-1 text-sm font-medium text-navy-900">{label}</span>
      <span className="text-[11px] font-medium text-ink-400 bg-white border border-line rounded px-2 py-0.5">
        {note}
      </span>
    </div>
  );
}

export default function ArrangementManager({
  initialOrder,
  features,
  phases,
  organizationsVisible: initialOrganizationsVisible,
  postsVisible: initialPostsVisible,
}: {
  initialOrder: string[];
  features: Feature[];
  phases: Phase[];
  organizationsVisible: boolean;
  postsVisible: boolean;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [organizationsVisible, setOrganizationsVisible] = useState(initialOrganizationsVisible);
  const [postsVisible, setPostsVisible] = useState(initialPostsVisible);
  // Keyed by section id (feature or phase — separate uuid keyspaces, so
  // no collision risk) rather than split into two maps, since both kinds
  // toggle the exact same way now that phases has its own is_published.
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries([...features.map((f) => [f.id, f.is_published]), ...phases.map((p) => [p.id, p.is_published])])
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const featureMap = new Map(features.map((f) => [f.id, f]));
  const phaseMap = new Map(phases.map((p) => [p.id, p]));

  // See SocialLinksManager for why both an explicit DndContext `id` and
  // a mount-gate are used together to fully eliminate the
  // aria-describedby hydration mismatch.
  const mounted = useHydrated();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function saveOrder(reordered: string[]) {
    const previous = order;
    setOrder(reordered);
    setError(null);

    startTransition(async () => {
      try {
        await updateArrangementOrder(reordered);
      } catch (err) {
        setOrder(previous);
        setError(err instanceof Error ? err.message : "Failed to save the new order.");
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.findIndex((k) => k === active.id);
    const newIndex = order.findIndex((k) => k === over.id);
    saveOrder(arrayMove(order, oldIndex, newIndex));
  }

  function handleMove(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;
    saveOrder(arrayMove(order, index, newIndex));
  }

  function handleToggleFixed(key: "organizations" | "posts") {
    const current = key === "organizations" ? organizationsVisible : postsVisible;
    const next = !current;
    const setVisible = key === "organizations" ? setOrganizationsVisible : setPostsVisible;
    setVisible(next);
    setError(null);

    startTransition(async () => {
      try {
        await updateHomepageSectionVisibility(key, next);
      } catch (err) {
        setVisible(!next);
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  function handleToggleSection(id: string, kind: "feature" | "phase") {
    const next = !sectionVisibility[id];
    setSectionVisibility((prev) => ({ ...prev, [id]: next }));
    setError(null);

    startTransition(async () => {
      try {
        await (kind === "feature" ? toggleFeaturePublished(id, next) : togglePhasePublished(id, next));
      } catch (err) {
        setSectionVisibility((prev) => ({ ...prev, [id]: !next }));
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  function isVisible(key: string) {
    if (key === ORGANIZATIONS_SECTION_KEY) return organizationsVisible;
    if (key === POSTS_SECTION_KEY) return postsVisible;
    const featureId = featureIdFromKey(key);
    if (featureId) return sectionVisibility[featureId] ?? false;
    const phaseId = phaseIdFromKey(key);
    if (phaseId) return sectionVisibility[phaseId] ?? false;
    return true;
  }

  function handleToggle(key: string) {
    if (key === ORGANIZATIONS_SECTION_KEY || key === POSTS_SECTION_KEY) {
      handleToggleFixed(key);
      return;
    }
    const featureId = featureIdFromKey(key);
    if (featureId) return handleToggleSection(featureId, "feature");
    const phaseId = phaseIdFromKey(key);
    if (phaseId) return handleToggleSection(phaseId, "phase");
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Homepage Arrangement</p>
      <p className="text-xs text-ink-400 mb-5">
        Drag to set the exact order sections render in between the hero and the footer, and toggle
        any section on or off. Header, Hero, and Footer are fixed and cannot be reordered or moved.
      </p>

      <div className="space-y-2 mb-3">
        <LockedCard label="Header" note="Locked — fixed at top" />
        <LockedCard label="Hero" note="Locked — fixed at top" />
      </div>

      {error && (
        <p className="text-xs text-rust mb-3" role="alert">
          {error}
        </p>
      )}

      {!mounted ? (
        <DndListSkeleton count={order.length} />
      ) : (
        <DndContext
          id="arrangement-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {order.map((key, index) => (
                <SortableSectionRow
                  key={key}
                  id={key}
                  label={sectionLabel(key, featureMap, phaseMap)}
                  typeLabel={sectionTypeLabel(key, featureMap)}
                  visible={isVisible(key)}
                  disabled={isPending}
                  canMoveUp={index > 0}
                  canMoveDown={index < order.length - 1}
                  onMoveUp={() => handleMove(index, -1)}
                  onMoveDown={() => handleMove(index, 1)}
                  onToggle={() => handleToggle(key)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-3">
        <LockedCard label="Footer" note="Locked — fixed at bottom" />
      </div>
    </div>
  );
}

function SortableSectionRow({
  id,
  label,
  typeLabel,
  visible,
  disabled,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggle,
}: {
  id: string;
  label: string;
  typeLabel: string;
  visible: boolean;
  disabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-md border border-line bg-white p-3 ${
        isDragging ? "opacity-60" : ""
      } ${!visible ? "opacity-50" : ""}`}
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

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-medium text-navy-900 truncate">{label}</span>
        {typeLabel && (
          <span className="shrink-0 text-[11px] font-medium text-ink-400 bg-paper-100 border border-line rounded px-2 py-0.5">
            {typeLabel}
          </span>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-0.5 border border-line rounded-md p-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={disabled || !canMoveUp}
          aria-label="Move up"
          title="Move up"
          className="p-1 rounded text-ink-400 hover:text-navy-900 hover:bg-paper-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={disabled || !canMoveDown}
          aria-label="Move down"
          title="Move down"
          className="p-1 rounded text-ink-400 hover:text-navy-900 hover:bg-paper-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={visible}
        title={visible ? "Visible — click to hide" : "Hidden — click to show"}
        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border disabled:opacity-60 ${
          visible ? "border-forest text-forest bg-forest-100" : "border-line text-ink-400 bg-paper-100"
        }`}
      >
        {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {visible ? "Shown" : "Hidden"}
      </button>
    </li>
  );
}
