import { useCallback, useEffect, useState } from "react";
import { deleteBlogPost, listBlogPosts, type BlogPost } from "../api/client";
import { ConfirmModal } from "../components/ConfirmModal";
import { IconButton } from "../components/IconButton";
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "../components/icons";
import { ApiError } from "../lib/api";

export function BlogListPage() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listBlogPosts());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load blog posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteBlogPost(pendingDelete.id);
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete post.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = items.filter((post) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      post.title.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Posts published here appear on the clinic website blog.
        </p>
        <IconButton to="/blog/new" variant="primary" icon={<PlusIcon />} label="New post" />
      </div>

      <input
        className="mb-4 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2"
        placeholder="Search title, category, slug…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    Loading posts…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    No blog posts yet.
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-slate-400">/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3">{post.category || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{post.date || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          post.published
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {post.published ? "published" : "draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end">
                        <IconButton
                          icon={<EyeIcon />}
                          label="View details"
                          onClick={() => setSelected(post)}
                        />
                        <IconButton to={`/blog/${post.id}`} icon={<PencilIcon />} label="Edit" />
                        <IconButton
                          variant="danger"
                          icon={<TrashIcon />}
                          label="Delete"
                          onClick={() => setPendingDelete(post)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingDelete ? (
        <ConfirmModal
          title="Delete blog post"
          description={`Delete “${pendingDelete.title}”? This removes it from the website.`}
          loading={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            if (!deleting) setPendingDelete(null);
          }}
        />
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <p className="text-sm text-slate-500">/{selected.slug}</p>
              </div>
              <IconButton icon={<XIcon />} label="Close" onClick={() => setSelected(null)} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Category</dt>
                <dd>{selected.category || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Date</dt>
                <dd>{selected.date || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Author</dt>
                <dd>{selected.author || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd>{selected.published ? "published" : "draft"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Excerpt</dt>
                <dd>{selected.excerpt || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
