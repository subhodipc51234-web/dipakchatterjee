// app/admin/(protected)/settings/FooterBlocksManager.tsx
//
// Modular footer builder: an ordered list of blocks, each a Custom
// Content block (title + free-form body — address, hours, notices,
// anything), a Quick Links block (admin-defined nav links), or a Follow
// block (places the social links managed in SocialLinksManager). Drag
// the block list to reorder; links inside a Quick Links block reorder
// with up/down buttons to avoid nested drag contexts.

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
import { ArrowDown, ArrowUp, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import DndListSkeleton from "@/components/admin/DndListSkeleton";
import {
  FOOTER_BLOCK_TYPE_LABELS,
  type FooterBlockType,
  type FooterBlockWithLinks,
  type FooterLink,
} from "@/types/domain";
import {
  createFooterBlock,
  createFooterLink,
  deleteFooterBlock,
  deleteFooterLink,
  reorderFooterBlocks,
  reorderFooterLinks,
  updateFooterBlock,
  updateFooterLink,
} from "./footer-actions";

const BLOCK_TYPES = Object.keys(FOOTER_BLOCK_TYPE_LABELS) as FooterBlockType[];

const DEFAULT_TITLES: Record<FooterBlockType, string> = {
  custom_content: "New Section",
  quick_links: "Quick Links",
  follow: "Follow",
};

export default function FooterBlocksManager({ blocks }: { blocks: FooterBlockWithLinks[] }) {
  const [items, setItems] = useState(blocks);
  const [isPending, startTransition] = useTransition();
  const [newType, setNewType] = useState<FooterBlockType>("custom_content");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const oldIndex = items.findIndex((b) => b.id === active.id);
    const newIndex = items.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setError(null);
    startTransition(async () => {
      try {
        await reorderFooterBlocks(reordered.map((b) => b.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save the new order.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this footer block?")) return;
    const prev = items;
    setItems((cur) => cur.filter((b) => b.id !== id));
    setError(null);
    startTransition(async () => {
      try {
        await deleteFooterBlock(id);
      } catch (err) {
        setItems(prev);
        setError(err instanceof Error ? err.message : "Failed to delete.");
      }
    });
  }

  function handleUpdated(id: string, patch: Partial<FooterBlockWithLinks>) {
    setItems((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function handleAdd() {
    setAdding(true);
    try {
      const created = await createFooterBlock({ type: newType, title: DEFAULT_TITLES[newType] });
      setItems((prev) => [...prev, { ...created, footer_links: [] }]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add block.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Footer builder</p>
      <p className="text-xs text-ink-400 mb-5">
        These columns render to the right of the brand block in the public footer, in order.
        Drag to reorder. Changes apply immediately, on desktop and mobile.
      </p>

      {error && (
        <p className="text-xs text-rust mb-3" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-6 text-center text-sm text-ink-400 mb-5">
          No footer blocks yet — the footer will show just the brand block until you add one.
        </div>
      ) : !mounted ? (
        <DndListSkeleton count={items.length} rowHeight={96} />
      ) : (
        <DndContext id="footer-blocks-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3 mb-5">
              {items.map((block) => (
                <SortableFooterBlockRow
                  key={block.id}
                  block={block}
                  disabled={isPending}
                  onDelete={() => handleDelete(block.id)}
                  onUpdated={(patch) => handleUpdated(block.id, patch)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="border-t border-line pt-5 flex items-center gap-2.5">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as FooterBlockType)}
          className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-saffron focus:outline-none"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>
              {FOOTER_BLOCK_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {adding ? "Adding…" : "Add block"}
        </button>
      </div>
    </div>
  );
}

function SortableFooterBlockRow({
  block,
  disabled,
  onDelete,
  onUpdated,
}: {
  block: FooterBlockWithLinks;
  disabled: boolean;
  onDelete: () => void;
  onUpdated: (patch: Partial<FooterBlockWithLinks>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const [title, setTitle] = useState(block.title ?? "");
  const [body, setBody] = useState(block.body ?? "");

  const style = { transform: CSS.Transform.toString(transform), transition };

  function saveTitle() {
    if (title === (block.title ?? "")) return;
    updateFooterBlock(block.id, { title }).catch((err) =>
      alert(err instanceof Error ? err.message : "Failed to save.")
    );
    onUpdated({ title });
  }

  function saveBody() {
    if (body === (block.body ?? "")) return;
    updateFooterBlock(block.id, { body }).catch((err) =>
      alert(err instanceof Error ? err.message : "Failed to save.")
    );
    onUpdated({ body });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-line bg-white p-4 ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="shrink-0 text-ink-400 hover:text-ink cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded border border-saffron text-saffron-600 bg-saffron-100">
          {FOOTER_BLOCK_TYPE_LABELS[block.type as FooterBlockType]}
        </span>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          placeholder="Block title"
          className="flex-1 min-w-[120px] rounded border border-line bg-white px-2.5 py-1.5 text-sm font-medium text-ink focus:border-saffron focus:outline-none"
        />

        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label="Delete block"
          className="shrink-0 text-ink-400 hover:text-rust disabled:opacity-60"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {block.type === "custom_content" && (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={saveBody}
          rows={4}
          placeholder="Add body copy... (address, hours, notices, disclosures, anything)"
          className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
        />
      )}

      {block.type === "quick_links" && (
        <FooterLinksEditor blockId={block.id} links={block.footer_links} onUpdated={onUpdated} />
      )}

      {block.type === "follow" && (
        <p className="text-xs text-ink-400">
          Shows the social links managed in &ldquo;Social media &amp; Follow&rdquo; below.
        </p>
      )}
    </li>
  );
}

function FooterLinksEditor({
  blockId,
  links,
  onUpdated,
}: {
  blockId: string;
  links: FooterLink[];
  onUpdated: (patch: { footer_links: FooterLink[] }) => void;
}) {
  const [items, setItems] = useState(links);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);

  function sync(next: FooterLink[]) {
    setItems(next);
    onUpdated({ footer_links: next });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    sync(next);
    reorderFooterLinks(next.map((l) => l.id)).catch((err) =>
      alert(err instanceof Error ? err.message : "Failed to reorder.")
    );
  }

  function saveLink(id: string, patch: { label?: string; url?: string }) {
    updateFooterLink(id, patch).catch((err) =>
      alert(err instanceof Error ? err.message : "Failed to save.")
    );
  }

  function removeLink(id: string) {
    sync(items.filter((l) => l.id !== id));
    deleteFooterLink(id).catch((err) => alert(err instanceof Error ? err.message : "Failed to delete."));
  }

  async function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    setAdding(true);
    try {
      const created = await createFooterLink(blockId, { label: newLabel.trim(), url: newUrl.trim() });
      sync([...items, created]);
      setNewLabel("");
      setNewUrl("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add link.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-2">
      {items.map((link, i) => (
        <FooterLinkRow
          key={link.id}
          link={link}
          isFirst={i === 0}
          isLast={i === items.length - 1}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          onSave={(patch) => saveLink(link.id, patch)}
          onRemove={() => removeLink(link.id)}
        />
      ))}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label"
          className="flex-1 min-w-[100px] rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink focus:border-saffron focus:outline-none"
        />
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL or #anchor"
          className="flex-1 min-w-[140px] rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink-600 focus:border-saffron focus:outline-none"
        />
        <button
          type="button"
          onClick={addLink}
          disabled={!newLabel.trim() || !newUrl.trim() || adding}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" />
          Add link
        </button>
      </div>
    </div>
  );
}

function FooterLinkRow({
  link,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onSave,
  onRemove,
}: {
  link: FooterLink;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (patch: { label?: string; url?: string }) => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = useState(link.label);
  const [url, setUrl] = useState(link.url);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-line bg-paper-100 px-2.5 py-1.5">
      <div className="flex flex-col shrink-0 -my-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Move up"
          className="text-ink-400 hover:text-ink disabled:opacity-30"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Move down"
          className="text-ink-400 hover:text-ink disabled:opacity-30"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== link.label && onSave({ label })}
        placeholder="Label"
        className="flex-1 min-w-[100px] rounded border border-line bg-white px-2 py-1 text-xs text-ink focus:border-saffron focus:outline-none"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => url !== link.url && onSave({ url })}
        placeholder="URL or #anchor"
        className="flex-1 min-w-[140px] rounded border border-line bg-white px-2 py-1 text-xs text-ink-600 focus:border-saffron focus:outline-none"
      />

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove link"
        className="shrink-0 text-ink-400 hover:text-rust"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
