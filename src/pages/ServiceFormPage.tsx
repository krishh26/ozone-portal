import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createClinicService,
  getClinicService,
  updateClinicService,
  uploadServiceImage,
  type ServiceCategory,
} from "../api/client";
import { IconButton } from "../components/IconButton";
import { ArrowLeftIcon, SaveIcon } from "../components/icons";
import { ApiError } from "../lib/api";

const EMPTY = {
  name: "",
  slug: "",
  category: "skin" as ServiceCategory,
  shortDesc: "",
  fullDesc: "",
  howItWorks: "",
  benefits: "",
  sessions: "",
  recovery: "",
  duration: "",
  startingPrice: "",
  image: "",
  detailSections: "",
  published: true,
};

export function ServiceFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getClinicService(id)
      .then((service) => {
        if (cancelled) return;
        setForm({
          name: service.name,
          slug: service.slug,
          category: service.category,
          shortDesc: service.shortDesc,
          fullDesc: service.fullDesc,
          howItWorks: service.howItWorks,
          benefits: (service.benefits || []).join("\n"),
          sessions: service.sessions,
          recovery: service.recovery,
          duration: service.duration,
          startingPrice: service.startingPrice,
          image: service.image,
          detailSections: service.detailSections?.length
            ? JSON.stringify(service.detailSections, null, 2)
            : "",
          published: service.published,
        });
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load service.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  function update<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug,
      category: form.category,
      shortDesc: form.shortDesc,
      fullDesc: form.fullDesc,
      howItWorks: form.howItWorks,
      sessions: form.sessions,
      recovery: form.recovery,
      duration: form.duration,
      startingPrice: form.startingPrice,
      image: form.image,
      published: form.published,
      benefits: form.benefits,
      detailSections: form.detailSections.trim() || [],
    };
    try {
      if (isNew) {
        await createClinicService(payload);
      } else if (id) {
        await updateClinicService(id, payload);
      }
      navigate("/services");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save service.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading service…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {isNew ? "Create a treatment for the clinic website." : "Update this treatment on the website."}
        </p>
        <IconButton
          to="/services"
          variant="outline"
          showLabel
          icon={<ArrowLeftIcon />}
          label="Back to list"
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid grid-cols-12 items-start gap-6">
        <div className="col-span-12 space-y-4 lg:col-span-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Slug (URL)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="auto-from-name"
              />
            </label>
            <label className="block text-sm font-medium">
              Category
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.category}
                onChange={(e) => update("category", e.target.value as ServiceCategory)}
              >
                <option value="skin">skin</option>
                <option value="laser">laser</option>
                <option value="hair">hair</option>
                <option value="body">body</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Starting price
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.startingPrice}
                onChange={(e) => update("startingPrice", e.target.value)}
                placeholder="₹4,999"
              />
            </label>
            <label className="block text-sm font-medium">
              Duration
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Sessions
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.sessions}
                onChange={(e) => update("sessions", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Recovery
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.recovery}
                onChange={(e) => update("recovery", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Cover image
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploading(true);
                  setError("");
                  try {
                    update("image", await uploadServiceImage(file));
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : "Could not upload image.");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading ? <span className="mt-1 block text-xs text-slate-500">Uploading…</span> : null}
              {form.image ? (
                <img src={form.image} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />
              ) : null}
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
            />
            Published on website
          </label>
          <IconButton
            type="submit"
            variant="primary"
            icon={<SaveIcon />}
            label={saving ? "Saving…" : isNew ? "Create service" : "Save changes"}
            disabled={saving}
          />
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-6">
          <label className="block text-sm font-medium">
            Short description
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={3}
              value={form.shortDesc}
              onChange={(e) => update("shortDesc", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Full description
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={5}
              value={form.fullDesc}
              onChange={(e) => update("fullDesc", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            How it works
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={4}
              value={form.howItWorks}
              onChange={(e) => update("howItWorks", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Benefits (one per line)
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={5}
              value={form.benefits}
              onChange={(e) => update("benefits", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Detail sections (JSON, optional)
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
              rows={8}
              value={form.detailSections}
              onChange={(e) => update("detailSections", e.target.value)}
              placeholder='[{"type":"list","title":"Who it is for","items":["…"]}]'
            />
          </label>
        </div>
      </div>
    </form>
  );
}
