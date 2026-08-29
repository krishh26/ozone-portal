import { useCallback, useEffect, useState } from "react";
import {
  listInquiries,
  updateInquiryStatus,
  type Inquiry,
  type InquiryStatus,
} from "../api/client";
import { IconButton } from "../components/IconButton";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, XIcon } from "../components/icons";
import { ApiError } from "../lib/api";

const STATUS_OPTIONS: InquiryStatus[] = ["new", "read", "contacted", "closed"];

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: InquiryStatus) {
  switch (status) {
    case "new":
      return "bg-amber-100 text-amber-900";
    case "read":
      return "bg-sky-100 text-sky-900";
    case "contacted":
      return "bg-emerald-100 text-emerald-900";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("inquiry");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listInquiries({
        page,
        q: query.trim() || undefined,
        status: status || undefined,
        type: type || undefined,
      });
      setItems(result.items);
      setPages(result.pages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load inquiries.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function changeStatus(inquiry: Inquiry, next: InquiryStatus) {
    try {
      const updated = await updateInquiryStatus(inquiry.id, next);
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setSelected((current) => (current?.id === updated.id ? updated : current));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status.");
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Website contact form submissions.
      </p>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_180px]">
          <input
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            placeholder="Search name, phone, email, service…"
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
          />
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
          >
            <option value="">All types</option>
            <option value="inquiry">Contact form</option>
            <option value="appointment">Appointments</option>
          </select>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                      Loading inquiries…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                      No inquiries yet. Submit the clinic contact form to see them here.
                    </td>
                  </tr>
                ) : (
                  items.map((inquiry) => (
                    <tr
                      key={inquiry.id}
                      className="cursor-pointer border-t border-slate-100 hover:bg-amber-50/40"
                      onClick={() => setSelected(inquiry)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(inquiry.createdAt)}</td>
                      <td className="px-4 py-3 font-medium">{inquiry.name}</td>
                      <td className="px-4 py-3">
                        <a className="text-amber-800" href={`tel:${inquiry.phone}`}>
                          {inquiry.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3">{inquiry.service || "—"}</td>
                      <td className="px-4 py-3 capitalize">{inquiry.type}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          icon={<EyeIcon />}
                          label="View details"
                          onClick={() => setSelected(inquiry)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>{total} total</span>
            <div className="flex items-center gap-2">
              <IconButton
                variant="outline"
                icon={<ChevronLeftIcon />}
                label="Previous"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              />
              <span>
                {page} / {pages}
              </span>
              <IconButton
                variant="outline"
                icon={<ChevronRightIcon />}
                label="Next"
                disabled={page >= pages}
                onClick={() => setPage((current) => current + 1)}
              />
            </div>
          </div>
        </div>

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-slate-500">{formatDate(selected.createdAt)}</p>
              </div>
              <IconButton icon={<XIcon />} label="Close" onClick={() => setSelected(null)} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd>
                  <a className="text-amber-800" href={`tel:${selected.phone}`}>
                    {selected.phone}
                  </a>
                </dd>
              </div>
              {selected.email ? (
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd>
                    <a className="text-amber-800" href={`mailto:${selected.email}`}>
                      {selected.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Service</dt>
                <dd>{selected.service || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Preferred date / time</dt>
                <dd>
                  {selected.preferredDate || "—"}
                  {selected.time ? ` · ${selected.time}` : ""}
                </dd>
              </div>
              {selected.doctorName ? (
                <div>
                  <dt className="text-slate-500">Doctor</dt>
                  <dd>{selected.doctorName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Message</dt>
                <dd className="whitespace-pre-wrap">{selected.message || "—"}</dd>
              </div>
            </dl>
            <label className="mt-5 block text-sm font-medium text-slate-700">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={selected.status}
                onChange={(e) => void changeStatus(selected, e.target.value as InquiryStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
