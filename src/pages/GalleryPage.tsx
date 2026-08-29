import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createGalleryItem,
  deleteGalleryItem,
  listGallery,
  updateGalleryItem,
  uploadGalleryImage,
  type GalleryItem,
} from "../api/client";
import { ConfirmModal } from "../components/ConfirmModal";
import { IconButton } from "../components/IconButton";
import { CheckIcon, EyeIcon, EyeOffIcon, PlusIcon, TrashIcon, XIcon } from "../components/icons";
import { ApiError } from "../lib/api";

const CATEGORIES = ["skin", "laser", "hair", "events"] as const;

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("skin");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<GalleryItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listGallery());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setImage(await uploadGalleryImage(file));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!image) {
      setError("Please upload an image.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createGalleryItem({
        title: title.trim() || "Gallery image",
        category,
        image,
        published: true,
      });
      setItems((current) => [created, ...current]);
      setTitle("");
      setImage("");
      setCategory("skin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add image.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: GalleryItem) {
    try {
      const updated = await updateGalleryItem(item.id, { published: !item.published });
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update image.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteGalleryItem(pendingDelete.id);
      setItems((current) => current.filter((row) => row.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete image.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Images added here appear on the clinic website gallery.
      </p>

      <form
        onSubmit={handleAdd}
        className="mb-6 grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:grid-cols-2"
      >
        <label className="block text-sm font-medium">
          Title
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Category
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
          >
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium md:col-span-2">
          Image
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void handleUpload(file);
            }}
          />
          {uploading ? <span className="mt-1 block text-xs text-slate-500">Uploading…</span> : null}
          {image ? (
            <img src={image} alt="" className="mt-2 h-32 rounded-lg object-cover" />
          ) : null}
        </label>
        <IconButton
          type="submit"
          variant="primary"
          icon={<PlusIcon />}
          label={saving ? "Adding…" : "Add to gallery"}
          disabled={saving || uploading}
          className="md:col-span-2"
        />
      </form>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-slate-500">Loading gallery…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
            >
              <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
              <div className="space-y-2 p-3 text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="capitalize text-slate-500">{item.category}</p>
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs ${
                    item.published
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.published ? "published" : "hidden"}
                </span>
                <div className="flex items-center gap-1 pt-1">
                  <IconButton
                    icon={<EyeIcon />}
                    label="View details"
                    onClick={() => setPreview(item)}
                  />
                  <IconButton
                    icon={item.published ? <EyeOffIcon /> : <CheckIcon />}
                    label={item.published ? "Hide" : "Publish"}
                    onClick={() => void togglePublished(item)}
                  />
                  <IconButton
                    variant="danger"
                    icon={<TrashIcon />}
                    label="Delete"
                    onClick={() => setPendingDelete(item)}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pendingDelete ? (
        <ConfirmModal
          title="Remove gallery image"
          description={`Remove “${pendingDelete.title}” from the gallery?`}
          confirmLabel="Remove"
          loading={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            if (!deleting) setPendingDelete(null);
          }}
        />
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={() => setPreview(null)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-4">
              <div>
                <h2 className="text-lg font-semibold">{preview.title}</h2>
                <p className="text-sm capitalize text-slate-500">{preview.category}</p>
              </div>
              <IconButton icon={<XIcon />} label="Close" onClick={() => setPreview(null)} />
            </div>
            <img src={preview.image} alt={preview.title} className="max-h-[70vh] w-full object-contain bg-slate-50" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
