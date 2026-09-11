// app/admin/(protected)/settings/HeaderActionsManager.tsx
//
// Admin controls for the header's action buttons/links (e.g. "Submit a
// Complaint", a Facebook follow button). Each item has an icon
// (optional), a style (solid/outline/text-link), and a position
// (left/right of the header nav) — see components/site/SiteHeader.tsx
// for how these are rendered.

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
import SocialIcon from "@/components/SocialIcon";
import {
  HEADER_ACTION_ICON_LABELS,
  HEADER_ACTION_STYLE_LABELS,
  type HeaderAction,
  type HeaderActionIcon,
  type HeaderActionPosition,
  type HeaderActionStyle,
} from "@/types/domain";
import {
  createHeaderAction,
  deleteHeaderAction,
  type HeaderActionPatch,
  reorderHeaderActions,
  updateHeaderAction,
} from "./header-actions";

const ICON_OPTIONS = Object.keys(HEADER_ACTION_ICON_LABELS) as HeaderActionIcon[];
const STYLE_OPTIONS = Object.keys(HEADER_ACTION_STYLE_LABELS) as HeaderActionStyle[];

export default function HeaderActionsManager({ actions }: { actions: HeaderAction[] }) {
  const [items, setItems] = useState(actions);
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
    const oldIndex = items.findIndex((a) => a.id === active.id);
    const newIndex = items.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setError(null);
    startTransition(async () => {
      try {
        await reorderHeaderActions(reordered.map((a) => a.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save the new order.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this header action?")) return;
    const prev = items;
    setItems((cur) => cur.filter((a) => a.id !== id));
    setError(null);
    startTransition(async () => {
      try {
        await deleteHeaderAction(id);
      } catch (err) {
        setItems(prev);
        setError(err instanceof Error ? err.message : "Failed to delete.");
      }
    });
  }

  function handleUpdated(id: string, patch: Partial<HeaderAction>) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createHeaderAction({ label: "New Action", url: "#" });
      setItems((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add header action.");
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-navy-900">Header Actions</p>
        <button
          type="button"
          onClick={() => startTransition(handleAdd)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" />
          Add action
        </button>
      </div>
      <p className="text-xs text-ink-400 mb-5">
        Buttons and links shown in the header, alongside &ldquo;Submit a Complaint&rdquo;. Leave
        the label blank on an icon action for an icon-only button (e.g. &ldquo;Follow on
        Facebook&rdquo;).
      </p>

      {error && (
        <p className="text-xs text-rust mb-3" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-6 text-center text-sm text-ink-400">
          No header actions yet.
        </div>
      ) : !mounted ? (
        <DndListSkeleton count={items.length} />
      ) : (
        <DndContext
          id="header-actions-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((action) => (
                <SortableActionRow
                  key={action.id}
                  action={action}
                  disabled={isPending}
                  onDelete={() => handleDelete(action.id)}
                  onUpdated={(patch) => handleUpdated(action.id, patch)}
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

function SortableActionRow({
  action,
  disabled,
  onDelete,
  onUpdated,
  onError,
}: {
  action: HeaderAction;
  disabled: boolean;
  onDelete: () => void;
  onUpdated: (patch: Partial<HeaderAction>) => void;
  onError: (message: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action.id,
  });
  const [label, setLabel] = useState(action.label);
  const [url, setUrl] = useState(action.url);
  const [bgColor, setBgColor] = useState(action.bg_color ?? "");
  const [textColor, setTextColor] = useState(action.text_color ?? "");

  const style = { transform: CSS.Transform.toString(transform), transition };

  function save(patch: HeaderActionPatch) {
    onError(null);
    onUpdated(patch);
    updateHeaderAction(action.id, patch).catch((err) =>
      onError(err instanceof Error ? err.message : "Failed to save.")
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-md border border-line bg-white p-3 ${isDragging ? "opacity-60" : ""} ${
        action.is_visible === false ? "opacity-50" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="shrink-0 text-ink-400 hover:text-ink cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => save({ is_visible: !(action.is_visible ?? true) })}
          aria-label={action.is_visible === false ? "Show action" : "Hide action"}
          aria-pressed={action.is_visible !== false}
          title={action.is_visible === false ? "Hidden — click to show" : "Visible — click to hide"}
          className="shrink-0 text-ink-400 hover:text-navy-900"
        >
          {action.is_visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {action.icon !== "none" && (
          <span className="shrink-0 w-7 h-7 rounded-full border border-line flex items-center justify-center text-ink-600">
            <SocialIcon platform={action.icon} className="w-3.5 h-3.5" />
          </span>
        )}

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => label !== action.label && save({ label })}
          placeholder="Label (blank = icon only)"
          className="flex-1 min-w-[140px] rounded border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-saffron focus:outline-none"
        />

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => url !== action.url && save({ url })}
          placeholder="https:// or /path"
          className="flex-[2] min-w-[160px] rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink-600 focus:border-saffron focus:outline-none"
        />

        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label="Delete action"
          className="shrink-0 text-ink-400 hover:text-rust disabled:opacity-60"
        >
          {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-2.5 pl-7">
        <label className="flex items-center gap-1.5 text-xs text-ink-600">
          Icon
          <select
            value={action.icon}
            onChange={(e) => save({ icon: e.target.value as HeaderActionIcon })}
            className="rounded border border-line bg-white px-2 py-1 text-xs text-ink focus:border-saffron focus:outline-none"
          >
            {ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>
                {HEADER_ACTION_ICON_LABELS[icon]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-600">
          Style
          <select
            value={action.style}
            onChange={(e) => save({ style: e.target.value as HeaderActionStyle })}
            className="rounded border border-line bg-white px-2 py-1 text-xs text-ink focus:border-saffron focus:outline-none"
          >
            {STYLE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {HEADER_ACTION_STYLE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-600">
          Position
          <select
            value={action.position}
            onChange={(e) => save({ position: e.target.value as HeaderActionPosition })}
            className="rounded border border-line bg-white px-2 py-1 text-xs text-ink focus:border-saffron focus:outline-none"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-600">
          Background
          <input
            type="color"
            value={bgColor || "#ffffff"}
            onChange={(e) => {
              setBgColor(e.target.value);
              save({ bg_color: e.target.value });
            }}
            className="w-7 h-7 rounded border border-line cursor-pointer p-0.5"
          />
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-600">
          Text
          <input
            type="color"
            value={textColor || "#000000"}
            onChange={(e) => {
              setTextColor(e.target.value);
              save({ text_color: e.target.value });
            }}
            className="w-7 h-7 rounded border border-line cursor-pointer p-0.5"
          />
        </label>

        {(bgColor || textColor) && (
          <button
            type="button"
            onClick={() => {
              setBgColor("");
              setTextColor("");
              save({ bg_color: null, text_color: null });
            }}
            className="text-xs text-ink-400 hover:text-rust underline"
          >
            Reset colors
          </button>
        )}
      </div>
    </li>
  );
}
