import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBlogPost,
  getBlogPost,
  updateBlogPost,
  uploadBlogImage,
  type BlogPost,
} from "../api/client";
import { IconButton } from "../components/IconButton";
import { ArrowLeftIcon, SaveIcon } from "../components/icons";
import { RichTextEditor } from "../components/RichTextEditor";
import { ApiError } from "../lib/api";

const EMPTY = {
  title: "",
  slug: "",
  category: "",
  author: "",
  date: new Date().toISOString().slice(0, 10),
  readTime: "",
  excerpt: "",
  thumbnail: "",
  tags: "",
  content: "",
  published: true,
};

export function BlogFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getBlogPost(id)
      .then((post: BlogPost) => {
        if (cancelled) return;
        setForm({
          title: post.title,
          slug: post.slug,
          category: post.category,
          author: post.author,
          date: post.date,
          readTime: post.readTime,
          excerpt: post.excerpt,
          thumbnail: post.thumbnail,
          tags: (post.tags || []).join(", "),
          content: post.content,
          published: post.published,
        });
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load post.");
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
      title: form.title,
      slug: form.slug,
      category: form.category,
      author: form.author,
      date: form.date,
      readTime: form.readTime,
      excerpt: form.excerpt,
      thumbnail: form.thumbnail,
      content: form.content,
      published: form.published,
      tags: form.tags,
    };
    try {
      if (isNew) {
        await createBlogPost(payload);
      } else if (id) {
        await updateBlogPost(id, payload);
      }
      navigate("/blog");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save post.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading post…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {isNew ? "Create a post for the clinic website." : "Update this post on the website."}
        </p>
        <IconButton
          to="/blog"
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
              Title
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Slug (URL)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="auto-from-title"
              />
            </label>
            <label className="block text-sm font-medium">
              Category
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Author
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.author}
                onChange={(e) => update("author", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Read time
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.readTime}
                onChange={(e) => update("readTime", e.target.value)}
                placeholder="4 min read"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Blog image
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                disabled={uploadingThumb}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploadingThumb(true);
                  setError("");
                  try {
                    const url = await uploadBlogImage(file);
                    update("thumbnail", url);
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : "Could not upload image.");
                  } finally {
                    setUploadingThumb(false);
                  }
                }}
              />
              {uploadingThumb ? (
                <span className="mt-1 block text-xs text-slate-500">Uploading…</span>
              ) : null}
              {form.thumbnail ? (
                <img
                  src={form.thumbnail}
                  alt="Blog thumbnail"
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                />
              ) : null}
            </label>
            <label className="block text-sm font-medium">
              Tags (comma separated)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Excerpt
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={4}
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
            />
          </label>
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
            label={saving ? "Saving…" : isNew ? "Create post" : "Save changes"}
            disabled={saving}
          />
        </div>

        <div className="col-span-12 min-w-0 text-sm font-medium lg:col-span-6">
          Content
          <RichTextEditor
            key={id ?? "new"}
            value={form.content}
            onChange={(html) => update("content", html)}
          />
        </div>
      </div>
    </form>
  );
}
