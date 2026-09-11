// app/admin/(protected)/settings/OrganizationsManager.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { SITE_BUCKET, type Organization } from "@/types/domain";
import DropzoneUpload from "@/components/admin/DropzoneUpload";
import DndListSkeleton from "@/components/admin/DndListSkeleton";
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
import { GripVertical, Loader2, Trash2, UploadCloud } from "lucide-react";
import {
  createOrganization,
  deleteOrganization,
  reorderOrganizations,
  replaceOrganizationLogo,
  updateOrganization,
} from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
}

export default function OrganizationsManager({
  organizations,
}: {
  organizations: Organization[];
}) {
  const [items, setItems] = useState(organizations);
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

    const oldIndex = items.findIndex((o) => o.id === active.id);
    const newIndex = items.findIndex((o) => o.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    startTransition(async () => {
      await reorderOrganizations(reordered.map((o) => o.id));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this organization's logo from the homepage?")) return;
    setItems((prev) => prev.filter((o) => o.id !== id));
    startTransition(async () => {
      await deleteOrganization(id);
    });
  }

  function handleAdded(org: Organization) {
    setItems((prev) => [...prev, org]);
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Affiliated Organizations</p>
      <p className="text-xs text-ink-400 mb-5">
        Logos shown in a row beneath the hero CTA button. Drag to reorder.
      </p>

      {items.length > 0 && !mounted && <DndListSkeleton count={items.length} rowHeight={64} />}

      {items.length > 0 && mounted && (
        <DndContext id="organizations-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2 mb-5">
              {items.map((org) => (
                <SortableOrgRow
                  key={org.id}
                  org={org}
                  disabled={isPending}
                  onDelete={() => handleDelete(org.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <AddOrganizationForm onAdded={handleAdded} />
    </div>
  );
}

function SortableOrgRow({
  org,
  disabled,
  onDelete,
}: {
  org: Organization;
  disabled: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: org.id,
  });
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(org.name);
  const [url, setUrl] = useState(org.external_url ?? "");
  const [logoUrl, setLogoUrl] = useState(org.logo_url);
  const [replacing, setReplacing] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition };

  async function handleReplaceLogo(file: File) {
    if (!file.type.startsWith("image/")) return;
    setReplacing(true);
    const path = `logos/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(SITE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      alert(uploadError.message);
      setReplacing(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(SITE_BUCKET).getPublicUrl(path);

    try {
      await replaceOrganizationLogo(org.id, { logo_url: publicUrl, logo_path: path });
      setLogoUrl(publicUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save logo.");
      await supabase.storage.from(SITE_BUCKET).remove([path]);
    } finally {
      setReplacing(false);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-md border border-line bg-white p-2.5 ${
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

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={replacing}
        aria-label="Replace logo"
        className="shrink-0 w-12 h-12 rounded bg-paper-100 border border-line flex items-center justify-center overflow-hidden relative group"
      >
        {replacing ? (
          <Loader2 className="w-4 h-4 animate-spin text-saffron-600" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
            <span className="absolute inset-0 bg-navy-900/0 group-hover:bg-navy-900/50 transition-colors flex items-center justify-center">
              <UploadCloud className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100" />
            </span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleReplaceLogo(file);
        }}
      />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name !== org.name && startTransition(() => updateOrganization(org.id, { name }))}
        placeholder="Organization name"
        className="flex-1 min-w-0 rounded border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-saffron focus:outline-none"
      />

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() =>
          url !== (org.external_url ?? "") &&
          startTransition(() => updateOrganization(org.id, { external_url: url }))
        }
        placeholder="https:// (optional link)"
        className="flex-1 min-w-0 rounded border border-line bg-white px-2.5 py-1.5 text-xs text-ink-600 focus:border-saffron focus:outline-none"
      />

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Delete organization"
        className="shrink-0 text-ink-400 hover:text-rust disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );

  function startTransition(fn: () => Promise<void>) {
    fn().catch((err) => alert(err instanceof Error ? err.message : "Failed to save."));
  }
}

function AddOrganizationForm({ onAdded }: { onAdded: (org: Organization) => void }) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [pendingLogo, setPendingLogo] = useState<{
    file: File;
    previewUrl: string;
    publicUrl: string;
    path: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File is too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).`);
      return;
    }

    setError(null);
    setUploading(true);
    const previewUrl = URL.createObjectURL(file);
    const path = `logos/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(SITE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      URL.revokeObjectURL(previewUrl);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(SITE_BUCKET).getPublicUrl(path);

    setPendingLogo({ file, previewUrl, publicUrl, path });
    setUploading(false);
  }

  async function handleAdd() {
    if (!pendingLogo || !name.trim()) {
      setError("Add a logo and a name before saving.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createOrganization({
        name: name.trim(),
        logo_url: pendingLogo.publicUrl,
        logo_path: pendingLogo.path,
        external_url: externalUrl.trim(),
      });
      onAdded({
        id: created.id,
        name: name.trim(),
        logo_url: pendingLogo.publicUrl,
        logo_path: pendingLogo.path,
        external_url: externalUrl.trim() || null,
        display_order: created.display_order,
        created_at: created.created_at,
      });
      URL.revokeObjectURL(pendingLogo.previewUrl);
      setPendingLogo(null);
      setName("");
      setExternalUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add organization.");
      await supabase.storage.from(SITE_BUCKET).remove([pendingLogo.path]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-line pt-5">
      <p className="text-xs font-semibold text-navy-900 mb-3">Add organization</p>

      <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
        {pendingLogo ? (
          <div className="w-16 h-16 rounded border border-line bg-paper-100 flex items-center justify-center overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingLogo.previewUrl} alt="" className="w-full h-full object-contain p-1.5" />
          </div>
        ) : (
          <div className="w-40 sm:w-32">
            <DropzoneUpload
              accept="image/*"
              disabled={uploading}
              label={uploading ? "Uploading…" : "Logo"}
              onFiles={handleFiles}
            />
          </div>
        )}

        <div className="space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-saffron focus:outline-none"
          />
          <input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https:// (optional link)"
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-saffron focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!pendingLogo || !name.trim() || saving}
            className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Adding…" : "Add organization"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rust mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
