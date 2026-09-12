// app/admin/(protected)/settings/HomepageLayoutManager.tsx
//
// "Homepage Sections / Layout Builder": drag to reorder every section
// that renders on the public homepage after the hero, and toggle each
// one's visibility. Organizations and the Notable Works posts feed are
// "fixed" sections (their own site_settings booleans); every Feature
// row reuses its existing is_published flag (Admin -> Features) as its
// visibility switch, so there's a single source of truth rather than a
// second, competing on/off flag.
//
// The Hero & Bio section is always shown first and isn't part of this
// list — it's core content, not something an admin should be able to
// accidentally hide entirely.

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
import { Eye, EyeOff, GripVertical } from "lucide-react";
import DndListSkeleton from "@/components/admin/DndListSkeleton";
import { FEATURE_TYPE_LABELS, type Feature } from "@/types/domain";
import { ORGANIZATIONS_SECTION_KEY, POSTS_SECTION_KEY, featureIdFromKey } from "@/lib/homepage-layout";
import { updateHomepageLayout, updateHomepageSectionVisibility } from "./actions";
import { toggleFeaturePublished } from "../features/actions";

const FIXED_SECTION_KEYS = [ORGANIZATIONS_SECTION_KEY, POSTS_SECTION_KEY];

function sectionLabel(key: string, featureMap: Map<string, Feature>) {
  if (key === ORGANIZATIONS_SECTION_KEY) return "Organizations Worked With";
  if (key === POSTS_SECTION_KEY) return "Notable Works (Posts Feed)";
  const featureId = featureIdFromKey(key);
  const feature = featureId ? featureMap.get(featureId) : undefined;
  if (!feature) return "(deleted section)";
  return feature.title || FEATURE_TYPE_LABELS[feature.type];
}

function sectionTypeLabel(key: string, featureMap: Map<string, Feature>) {
  if (FIXED_SECTION_KEYS.includes(key)) return "Built-in";
  const featureId = featureIdFromKey(key);
  const feature = featureId ? featureMap.get(featureId) : undefined;
  return feature ? FEATURE_TYPE_LABELS[feature.type] : "";
}

export default function HomepageLayoutManager({
  initialOrder,
  features,
  organizationsVisible: initialOrganizationsVisible,
  postsVisible: initialPostsVisible,
}: {
  initialOrder: string[];
  features: Feature[];
  organizationsVisible: boolean;
  postsVisible: boolean;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [organizationsVisible, setOrganizationsVisible] = useState(initialOrganizationsVisible);
  const [postsVisible, setPostsVisible] = useState(initialPostsVisible);
  const [featureVisibility, setFeatureVisibility] = useState<Record<string, boolean>>(
    () => Object.fromEntries(features.map((f) => [f.id, f.is_published]))
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const featureMap = new Map(features.map((f) => [f.id, f]));

  // See SocialLinksManager for why both an explicit DndContext `id` and
  // a mount-gate are used together to fully eliminate the
  // aria-describedby hydration mismatch.
  const mounted = useHydrated();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const previous = order;
    const oldIndex = order.findIndex((k) => k === active.id);
    const newIndex = order.findIndex((k) => k === over.id);
    const reordered = arrayMove(order, oldIndex, newIndex);
    setOrder(reordered);
    setError(null);

    startTransition(async () => {
      try {
        await updateHomepageLayout(reordered);
      } catch (err) {
        setOrder(previous);
        setError(err instanceof Error ? err.message : "Failed to save the new order.");
      }
    });
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

  function handleToggleFeature(featureId: string) {
    const next = !featureVisibility[featureId];
    setFeatureVisibility((prev) => ({ ...prev, [featureId]: next }));
    setError(null);

    startTransition(async () => {
      try {
        await toggleFeaturePublished(featureId, next);
      } catch (err) {
        setFeatureVisibility((prev) => ({ ...prev, [featureId]: !next }));
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  function isVisible(key: string) {
    if (key === ORGANIZATIONS_SECTION_KEY) return organizationsVisible;
    if (key === POSTS_SECTION_KEY) return postsVisible;
    const featureId = featureIdFromKey(key);
    return featureId ? (featureVisibility[featureId] ?? false) : false;
  }

  function handleToggle(key: string) {
    if (key === ORGANIZATIONS_SECTION_KEY || key === POSTS_SECTION_KEY) {
      handleToggleFixed(key);
      return;
    }
    const featureId = featureIdFromKey(key);
    if (featureId) handleToggleFeature(featureId);
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Homepage Sections</p>
      <p className="text-xs text-ink-400 mb-5">
        Drag to set the exact order sections render in on the public homepage, and toggle any
        section on or off. New sections (e.g. a feature you just created) default to off until you
        turn them on here or from Admin -&gt; Features.
      </p>

      <div className="flex items-center gap-3 rounded-md border border-line bg-paper-100 p-3 mb-3 opacity-80">
        <span className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-sm font-medium text-navy-900">Hero &amp; Bio</span>
        <span className="text-[11px] font-medium text-ink-400 bg-white border border-line rounded px-2 py-0.5">
          Always shown first
        </span>
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
          id="homepage-layout-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {order.map((key) => (
                <SortableSectionRow
                  key={key}
                  id={key}
                  label={sectionLabel(key, featureMap)}
                  typeLabel={sectionTypeLabel(key, featureMap)}
                  visible={isVisible(key)}
                  disabled={isPending}
                  onToggle={() => handleToggle(key)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableSectionRow({
  id,
  label,
  typeLabel,
  visible,
  disabled,
  onToggle,
}: {
  id: string;
  label: string;
  typeLabel: string;
  visible: boolean;
  disabled: boolean;
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
